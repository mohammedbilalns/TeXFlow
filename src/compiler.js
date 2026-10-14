/**
 * Asynchronous LaTeX and TeX compiler pipeline with multi-engine support
 * (pdflatex, pdftex, xelatex, lualatex) and debounced live compilation.
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

/**
 * Check if the LaTeX source has obvious unclosed syntax constructs
 * (e.g. unclosed braces, environments, math delimiters, or trailing backslash)
 * so we avoid firing premature broken compilations while the user is actively typing.
 */
export function isLatexIncomplete(text) {
    if (!text) return false;
    const trimmed = text.trim();

    // 1. Trailing unfinished backslash or command: e.g. "\", "\sub", "\begin"
    if (/\\[a-zA-Z]*$/.test(trimmed)) {
        return true;
    }

    // 2. Unclosed curly braces: '{' vs '}' (excluding \{ and \})
    let openBraces = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '{' && (i === 0 || text[i - 1] !== '\\')) {
            openBraces++;
        } else if (text[i] === '}' && (i === 0 || text[i - 1] !== '\\')) {
            openBraces--;
        }
    }
    if (openBraces > 0) return true;

    // 3. Unclosed inline math $ (excluding \$, $$, etc.)
    let dollarCount = 0;
    let i = 0;
    while (i < text.length) {
        if (text[i] === '$' && (i === 0 || text[i - 1] !== '\\')) {
            if (i + 1 < text.length && text[i + 1] === '$') {
                i += 2;
                continue;
            }
            dollarCount++;
        }
        i++;
    }
    if (dollarCount % 2 !== 0) return true;

    // 4. Unclosed environments: \begin{env} vs \end{env}
    const beginMatches = text.match(/\\begin\{[^}]+\}/g);
    const endMatches = text.match(/\\end\{[^}]+\}/g);
    const begins = beginMatches ? beginMatches.length : 0;
    const ends = endMatches ? endMatches.length : 0;
    if (begins > ends) return true;

    return false;
}

export class LatexCompiler {
    constructor(options = {}) {
        this.engine = options.engine || 'pdflatex';
        this.liveCompile = options.liveCompile !== undefined ? options.liveCompile : true;
        this.debounceDelay = options.debounceDelay || 1200; // ms idle threshold
        this.maxIncompleteWait = 3500; // ms to wait if syntax is incomplete

        this._isCompiling = false;
        this._debounceSourceId = null;
        this._pendingSource = null;
        this._lastEditTime = 0;
        this._docDir = null;

        // Create dedicated temporary build directory
        const uid = Math.random().toString(36).substring(2, 9);
        this.buildDir = GLib.build_filenamev([GLib.get_tmp_dir(), `texflow-build-${uid}`]);
        GLib.mkdir_with_parents(this.buildDir, 0o700);

        this.texPath = GLib.build_filenamev([this.buildDir, 'main.tex']);
        this.pdfPath = GLib.build_filenamev([this.buildDir, 'main.pdf']);
    }

    setEngine(engine) {
        if (['pdflatex', 'pdftex', 'xelatex', 'lualatex'].includes(engine)) {
            this.engine = engine;
        }
    }

    setDocDir(docDir) {
        this._docDir = docDir;
    }

    setLiveCompile(enabled) {
        this.liveCompile = enabled;
        if (!enabled && this._debounceSourceId) {
            GLib.source_remove(this._debounceSourceId);
            this._debounceSourceId = null;
        }
    }

    /**
     * Trigger compilation after user completes typing (idle debounce)
     */
    triggerLiveCompile(sourceText, onStart, onComplete) {
        if (!this.liveCompile) return;

        this._lastEditTime = GLib.get_monotonic_time();
        this._pendingSource = { sourceText, onStart, onComplete };

        this._scheduleDebounceCheck();
    }

    _scheduleDebounceCheck() {
        if (this._debounceSourceId) {
            GLib.source_remove(this._debounceSourceId);
            this._debounceSourceId = null;
        }

        this._debounceSourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
            this._debounceSourceId = null;

            if (!this._pendingSource) {
                return GLib.SOURCE_REMOVE;
            }

            const now = GLib.get_monotonic_time();
            const idleMs = Math.round((now - this._lastEditTime) / 1000);

            // Wait until user has paused typing for at least debounceDelay
            if (idleMs < this.debounceDelay) {
                this._scheduleDebounceCheck();
                return GLib.SOURCE_REMOVE;
            }

            // If user is in the middle of typing an open syntax construct, give extra time to complete it
            const incomplete = isLatexIncomplete(this._pendingSource.sourceText);
            if (incomplete && idleMs < this.maxIncompleteWait) {
                this._scheduleDebounceCheck();
                return GLib.SOURCE_REMOVE;
            }

            // If a compilation pass is already running, wait until it finishes
            if (this._isCompiling) {
                this._scheduleDebounceCheck();
                return GLib.SOURCE_REMOVE;
            }

            // User has completed typing! Run compilation pass
            const { sourceText, onStart, onComplete } = this._pendingSource;
            this._pendingSource = null;
            this.compile(sourceText, onStart, onComplete);

            return GLib.SOURCE_REMOVE;
        });
    }

    /**
     * Run immediate compilation
     */
    compile(sourceText, onStart, onComplete) {
        if (this._debounceSourceId) {
            GLib.source_remove(this._debounceSourceId);
            this._debounceSourceId = null;
        }

        if (this._isCompiling) {
            // Queue latest pending source so it will compile after current run completes
            this._pendingSource = { sourceText, onStart, onComplete };
            return;
        }

        this._pendingSource = null;
        this._isCompiling = true;
        if (onStart) onStart();

        try {
            // Save current editor buffer to main.tex
            GLib.file_set_contents(this.texPath, sourceText);

            const launcher = new Gio.SubprocessLauncher({
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            });

            // Set CWD and TEXINPUTS so includes/graphics/bibtex resolve properly
            if (this._docDir && GLib.file_test(this._docDir, GLib.FileTest.IS_DIR)) {
                launcher.set_cwd(this._docDir);
                const envTexInputs = GLib.getenv('TEXINPUTS') || '';
                launcher.setenv('TEXINPUTS', `.:${this._docDir}:${envTexInputs}:`, true);
            } else {
                launcher.set_cwd(this.buildDir);
            }

            const args = [
                this.engine,
                '-interaction=nonstopmode',
                '-file-line-error',
                '-synctex=1',
                `-output-directory=${this.buildDir}`,
                this.texPath
            ];

            const startTime = GLib.get_monotonic_time();
            const proc = launcher.spawnv(args);

            proc.communicate_utf8_async(null, null, (source, res) => {
                let stdout = '';
                let stderr = '';
                let errorCaught = null;

                try {
                    const [_, out, err] = source.communicate_utf8_finish(res);
                    stdout = out || '';
                    stderr = err || '';
                } catch (e) {
                    errorCaught = e;
                }

                const durationMs = Math.round((GLib.get_monotonic_time() - startTime) / 1000);
                this._isCompiling = false;

                const { errors, warnings } = this._parseDiagnostics(stdout, stderr);
                const pdfFile = Gio.File.new_for_path(this.pdfPath);
                const pdfExists = pdfFile.query_exists(null);

                const result = {
                    success: pdfExists && errors.length === 0,
                    pdfExists,
                    pdfPath: this.pdfPath,
                    errors,
                    warnings,
                    rawLog: stdout + (stderr ? '\n--- STDERR ---\n' + stderr : ''),
                    durationMs,
                    engine: this.engine,
                    error: errorCaught
                };

                if (onComplete) {
                    onComplete(result);
                }

                // If user made edits while compiling, schedule debounce check
                // so we wait until they finish typing before recompiling
                if (this._pendingSource) {
                    this._scheduleDebounceCheck();
                }
            });
        } catch (err) {
            this._isCompiling = false;
            if (onComplete) {
                onComplete({
                    success: false,
                    pdfExists: false,
                    pdfPath: null,
                    errors: [{ line: null, message: `Failed to launch ${this.engine}: ${err.message}`, type: 'error' }],
                    warnings: [],
                    rawLog: String(err),
                    durationMs: 0,
                    engine: this.engine,
                    error: err
                });
            }
        }
    }

    _parseDiagnostics(stdout, stderr) {
        const errors = [];
        const warnings = [];
        const lines = (stdout + '\n' + stderr).split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Match -file-line-error format: main.tex:14: Undefined control sequence.
            const fileLineMatch = line.match(/^.*main\.tex:(\d+):\s*(.*)$/);
            if (fileLineMatch) {
                errors.push({
                    line: parseInt(fileLineMatch[1], 10),
                    message: fileLineMatch[2].trim(),
                    type: 'error'
                });
                continue;
            }

            // Match traditional TeX error "! Something error"
            if (line.startsWith('! ')) {
                let lineNum = null;
                // Look ahead for "l.<number>"
                for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                    const lMatch = lines[j].match(/^l\.(\d+)/);
                    if (lMatch) {
                        lineNum = parseInt(lMatch[1], 10);
                        break;
                    }
                }

                const msg = line.substring(2).trim();
                // Filter out non-error exclamation points if any
                if (!errors.some(e => e.message === msg && e.line === lineNum)) {
                    errors.push({
                        line: lineNum,
                        message: msg,
                        type: 'error'
                    });
                }
                continue;
            }

            // Match LaTeX warnings: "LaTeX Warning: Reference `...' on page 1 undefined on input line 25."
            if (line.includes('Warning:')) {
                const warnLineMatch = line.match(/input line (\d+)/i) || line.match(/line (\d+)/i);
                warnings.push({
                    line: warnLineMatch ? parseInt(warnLineMatch[1], 10) : null,
                    message: line.trim(),
                    type: 'warning'
                });
            }
        }

        return { errors, warnings };
    }

    cleanup() {
        if (this._debounceSourceId) {
            GLib.source_remove(this._debounceSourceId);
            this._debounceSourceId = null;
        }

        try {
            const dir = Gio.File.new_for_path(this.buildDir);
            const enumerator = dir.enumerate_children('standard::name', Gio.FileQueryInfoFlags.NONE, null);
            let info;
            while ((info = enumerator.next_file(null)) !== null) {
                const child = dir.get_child(info.get_name());
                child.delete(null);
            }
            dir.delete(null);
        } catch (e) {
            // Silently ignore cleanup errors on exit
        }
    }
}
