/**
 * Main Application Window for TeXFlow LaTeX & PDFTeX Studio.
 * Integrates headerbar, multi-engine selector, split editing view,
 * quick formatting toolbar, live preview, and diagnostics log drawer.
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';
import Gdk from 'gi://Gdk?version=4.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw?version=1';

import { LatexEditor } from './editor.js';
import { QuickToolbar } from './quick-toolbar.js';
import { PdfPreview } from './preview.js';
import { LogPanel } from './log-panel.js';
import { LatexCompiler } from './compiler.js';
import { TEMPLATES } from './templates.js';
import { syncPdfToCode, syncCodeToPdf } from './synctex.js';

export const MainWindow = GObject.registerClass({
    GTypeName: 'TexflowMainWindow'
}, class MainWindow extends Adw.ApplicationWindow {
    _init(params = {}) {
        super._init({
            title: 'TeXFlow',
            default_width: 1240,
            default_height: 840,
            ...params
        });

        this.currentFile = null;
        this.isModified = false;

        this.compiler = new LatexCompiler({
            engine: 'pdflatex',
            liveCompile: true,
            debounceDelay: 1200
        });

        this._setupLayout();
        this._setupKeyShortcuts();

        // Load default starter template
        this.loadTemplate('article');
    }

    _setupLayout() {
        const rootBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            hexpand: true,
            vexpand: true
        });

        // --- Header Bar ---
        this.headerBar = new Adw.HeaderBar();

        // 1. File Actions Menu
        const fileMenuBtn = this._createFileMenuButton();
        this.headerBar.pack_start(fileMenuBtn);

        // 2. Templates Menu
        const templatesMenuBtn = this._createTemplatesMenuButton();
        this.headerBar.pack_start(templatesMenuBtn);

        // 3. TeX Engine Selector Dropdown
        const engineBox = this._createEngineSelector();
        this.headerBar.pack_start(engineBox);

        // Center Title & Subtitle
        this.titleWidget = new Adw.WindowTitle({
            title: 'TeXFlow',
            subtitle: 'Untitled Document'
        });
        this.headerBar.set_title_widget(this.titleWidget);

        // End Section Widgets:
        // Main Menu
        const primaryMenuBtn = this._createPrimaryMenuButton();
        this.headerBar.pack_end(primaryMenuBtn);

        // Log Console Toggle Button
        this.logToggleBtn = new Gtk.ToggleButton({
            icon_name: 'utilities-terminal-symbolic',
            tooltip_text: 'Toggle Diagnostics Log (Ctrl+L)',
            css_classes: ['flat']
        });
        this.logToggleBtn.connect('toggled', () => {
            this.logRevealer.set_reveal_child(this.logToggleBtn.get_active());
        });
        this.headerBar.pack_end(this.logToggleBtn);

        // Compilation Spinner
        this.spinner = new Gtk.Spinner({
            margin_start: 4,
            margin_end: 4
        });
        this.headerBar.pack_end(this.spinner);

        // Live Preview Toggle Switch
        const liveBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            margin_end: 8
        });
        this.liveLabel = new Gtk.Label({ label: 'Live', css_classes: ['caption'] });
        this.liveSwitch = new Gtk.Switch({
            active: true,
            tooltip_text: 'Toggle real-time compilation on typing',
            valign: Gtk.Align.CENTER
        });
        this.liveSwitch.connect('notify::active', () => {
            const active = this.liveSwitch.get_active();
            this.compiler.setLiveCompile(active);
            if (active) {
                this.triggerCompile(true);
            }
        });
        liveBox.append(this.liveLabel);
        liveBox.append(this.liveSwitch);
        this.headerBar.pack_end(liveBox);

        // Compile Button
        this.compileBtn = new Gtk.Button({
            icon_name: 'media-playback-start-symbolic',
            label: 'Compile',
            tooltip_text: 'Compile Document (Ctrl+R / F5)',
            css_classes: ['suggested-action']
        });
        this.compileBtn.connect('clicked', () => this.triggerCompile(true));
        this.headerBar.pack_end(this.compileBtn);

        rootBox.append(this.headerBar);

        // --- Central Split View (Editor | Live Preview) ---
        this.paned = new Gtk.Paned({
            orientation: Gtk.Orientation.HORIZONTAL,
            hexpand: true,
            vexpand: true
        });

        // Left Pane: Quick Toolbar + LaTeX Code Editor
        const editorBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            hexpand: true,
            vexpand: true,
            width_request: 220
        });

        this.editor = new LatexEditor();
        this.quickToolbar = new QuickToolbar(this.editor);

        editorBox.append(this.quickToolbar.container);
        editorBox.append(this.editor.container);
        this.paned.set_start_child(editorBox);

        // Right Pane: High-DPI Live PDF Preview
        this.preview = new PdfPreview();
        this.paned.set_end_child(this.preview.container);

        this.paned.set_position(560);
        this.paned.set_resize_start_child(true);
        this.paned.set_resize_end_child(true);
        this.paned.set_shrink_start_child(false);
        this.paned.set_shrink_end_child(false);

        rootBox.append(this.paned);

        // --- Bottom Drawer: Diagnostics & Log Panel ---
        this.logRevealer = new Gtk.Revealer({
            transition_type: Gtk.RevealerTransitionType.SLIDE_UP,
            reveal_child: false,
            vexpand: false
        });

        this.logPanel = new LogPanel((lineNum) => {
            this.editor.scrollToLine(lineNum);
        });
        this.logRevealer.set_child(this.logPanel.container);
        rootBox.append(this.logRevealer);

        // Toast Overlay container for notifications
        this.toastOverlay = new Adw.ToastOverlay();
        this.toastOverlay.set_child(rootBox);
        this.set_content(this.toastOverlay);

        // Connect Editor changes to live compilation
        this.editor.buffer.connect('changed', () => {
            this.setModified(true);
            if (this.liveSwitch && this.liveSwitch.get_active() && this.liveLabel) {
                this.liveLabel.set_label('Typing…');
            }
            this.compiler.triggerLiveCompile(
                this.editor.getText(),
                () => this._onCompileStart(),
                (res) => this._onCompileComplete(res)
            );
        });

        // Register action for context menu "Move to PDF Position"
        this._registerAction('jump_to_pdf', () => this.syncCurrentLineToPdf());

        // Connect SyncTeX callbacks:
        // 1. Right-click / click on PDF -> Move to corresponding LaTeX code
        this.preview.onMoveToCode = (page, x, y) => this.syncFromPdfToCode(page, x, y);

        // 2. Right-click on Code -> Move to corresponding PDF position
        this.editor.onMoveToPdf = (line, col) => this.syncFromCodeToPdf(line, col);

        // 3. Ctrl+Click in Editor -> Move to corresponding PDF position
        this.editor.onCtrlClick = (line, col) => this.syncFromCodeToPdf(line, col);
    }

    _createFileMenuButton() {
        const menu = new Gio.Menu();
        menu.append('New Document', 'win.new');
        menu.append('Open Document...', 'win.open');
        menu.append('Save', 'win.save');
        menu.append('Save As...', 'win.save_as');
        menu.append('Export PDF...', 'win.export_pdf');

        const fileBtn = new Gtk.MenuButton({
            label: 'File',
            menu_model: menu,
            css_classes: ['flat']
        });

        this._registerAction('new', () => this.newDocument());
        this._registerAction('open', () => this.openDocument());
        this._registerAction('save', () => this.saveDocument(false));
        this._registerAction('save_as', () => this.saveDocument(true));
        this._registerAction('export_pdf', () => this.preview.exportPdf(this));

        return fileBtn;
    }

    _createTemplatesMenuButton() {
        const menu = new Gio.Menu();
        for (const [key, tpl] of Object.entries(TEMPLATES)) {
            menu.append(tpl.name, `win.tpl_${key}`);
            this._registerAction(`tpl_${key}`, () => this.loadTemplate(key));
        }

        return new Gtk.MenuButton({
            label: 'Templates',
            menu_model: menu,
            css_classes: ['flat']
        });
    }

    _createEngineSelector() {
        const box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 4,
            margin_start: 4
        });

        this.engineDropdown = Gtk.DropDown.new_from_strings([
            'pdflatex (LaTeX)',
            'pdftex (Plain TeX)',
            'xelatex (XeTeX)',
            'lualatex (LuaTeX)'
        ]);

        this.engineDropdown.connect('notify::selected', () => {
            const idx = this.engineDropdown.get_selected();
            const engines = ['pdflatex', 'pdftex', 'xelatex', 'lualatex'];
            const chosen = engines[idx] || 'pdflatex';
            this.compiler.setEngine(chosen);
            this.triggerCompile(true);
        });

        box.append(this.engineDropdown);
        return box;
    }

    _createPrimaryMenuButton() {
        const menu = new Gio.Menu();
        menu.append('Find in Document', 'win.find');
        menu.append('Keyboard Shortcuts', 'win.shortcuts');
        menu.append('About TeXFlow', 'win.about');

        this._registerAction('find', () => this.editor.toggleSearchBar());
        this._registerAction('shortcuts', () => this.showShortcutsDialog());
        this._registerAction('about', () => this.showAboutDialog());

        return new Gtk.MenuButton({
            icon_name: 'open-menu-symbolic',
            menu_model: menu,
            css_classes: ['flat']
        });
    }

    _registerAction(name, callback) {
        const action = new Gio.SimpleAction({ name });
        action.connect('activate', callback);
        this.add_action(action);
    }

    _setupKeyShortcuts() {
        const keyController = new Gtk.EventControllerKey();
        keyController.connect('key-pressed', (ctrl, keyval, keycode, state) => {
            const isCtrl = (state & Gdk.ModifierType.CONTROL_MASK) !== 0;
            const isShift = (state & Gdk.ModifierType.SHIFT_MASK) !== 0;

            if (isCtrl) {
                if (keyval === Gdk.KEY_s || keyval === Gdk.KEY_S) {
                    this.saveDocument(isShift);
                    return true;
                } else if (keyval === Gdk.KEY_o || keyval === Gdk.KEY_O) {
                    this.openDocument();
                    return true;
                } else if (keyval === Gdk.KEY_n || keyval === Gdk.KEY_N) {
                    this.newDocument();
                    return true;
                } else if (keyval === Gdk.KEY_r || keyval === Gdk.KEY_R || keyval === Gdk.KEY_Return) {
                    this.triggerCompile(true);
                    return true;
                } else if (keyval === Gdk.KEY_f || keyval === Gdk.KEY_F) {
                    this.editor.toggleSearchBar();
                    return true;
                } else if (keyval === Gdk.KEY_l || keyval === Gdk.KEY_L) {
                    this.logToggleBtn.set_active(!this.logToggleBtn.get_active());
                    return true;
                } else if (keyval === Gdk.KEY_e || keyval === Gdk.KEY_E) {
                    this.preview.exportPdf(this);
                    return true;
                } else if (keyval === Gdk.KEY_b || keyval === Gdk.KEY_B) {
                    this.editor.wrapSelection('\\textbf{', '}');
                    return true;
                } else if (keyval === Gdk.KEY_i || keyval === Gdk.KEY_I) {
                    this.editor.wrapSelection('\\textit{', '}');
                    return true;
                } else if (keyval === Gdk.KEY_m || keyval === Gdk.KEY_M) {
                    if (isShift) {
                        this.editor.wrapSelection('\\begin{equation}\n    ', '\n\\end{equation}');
                    } else {
                        this.editor.wrapSelection('$', '$');
                    }
                    return true;
                } else if (keyval === Gdk.KEY_plus || keyval === Gdk.KEY_equal) {
                    this.preview.zoomIn();
                    return true;
                } else if (keyval === Gdk.KEY_minus) {
                    this.preview.zoomOut();
                    return true;
                } else if (keyval === Gdk.KEY_0) {
                    this.preview.fitWidth();
                    return true;
                } else if (keyval === Gdk.KEY_j || keyval === Gdk.KEY_J) {
                    this.syncCurrentLineToPdf();
                    return true;
                }
            } else if (keyval === Gdk.KEY_F5) {
                this.triggerCompile(true);
                return true;
            }

            return false;
        });

        this.add_controller(keyController);
    }

    setModified(modified) {
        this.isModified = modified;
        const base = this.currentFile ? this.currentFile.get_basename() : 'Untitled';
        this.titleWidget.set_subtitle(modified ? `• ${base} (modified)` : base);
    }

    loadTemplate(templateKey) {
        const tpl = TEMPLATES[templateKey];
        if (!tpl) return;

        this.editor.setText(tpl.content);
        this.currentFile = null;
        this.setModified(false);

        // Switch engine dropdown if template requests pdftex
        if (tpl.engine === 'pdftex') {
            this.engineDropdown.set_selected(1);
            this.compiler.setEngine('pdftex');
        } else {
            this.engineDropdown.set_selected(0);
            this.compiler.setEngine('pdflatex');
        }

        this.triggerCompile(true);
        this.toastOverlay.add_toast(new Adw.Toast({ title: `Loaded ${tpl.name}` }));
    }

    newDocument() {
        this.editor.setText('');
        this.currentFile = null;
        this.setModified(false);
        this.titleWidget.set_subtitle('Untitled');
    }

    openDocument() {
        const fileDialog = new Gtk.FileDialog({
            title: 'Open TeX / LaTeX Document'
        });

        fileDialog.open(this, null, (dialog, res) => {
            try {
                const file = dialog.open_finish(res);
                if (file) {
                    const [success, contents] = file.load_contents(null);
                    if (success) {
                        const text = new TextDecoder().decode(contents);
                        this.editor.setText(text);
                        this.currentFile = file;
                        this.setModified(false);

                        // Set doc directory for relative includes
                        const parentDir = file.get_parent();
                        if (parentDir) {
                            this.compiler.setDocDir(parentDir.get_path());
                        }

                        // Smart engine detection
                        if (text.includes('\\bye') && !text.includes('\\documentclass')) {
                            this.engineDropdown.set_selected(1);
                            this.compiler.setEngine('pdftex');
                        }

                        this.triggerCompile(true);
                        this.toastOverlay.add_toast(new Adw.Toast({
                            title: `Opened ${file.get_basename()}`
                        }));
                    }
                }
            } catch (err) {
                if (!err.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                    this.toastOverlay.add_toast(new Adw.Toast({
                        title: `Failed to open: ${err.message}`
                    }));
                }
            }
        });
    }

    saveDocument(saveAs = false) {
        if (this.currentFile && !saveAs) {
            this._saveToFile(this.currentFile);
            return;
        }

        const fileDialog = new Gtk.FileDialog({
            title: 'Save TeX Document',
            initial_name: this.currentFile ? this.currentFile.get_basename() : 'document.tex'
        });

        fileDialog.save(this, null, (dialog, res) => {
            try {
                const targetFile = dialog.save_finish(res);
                if (targetFile) {
                    this._saveToFile(targetFile);
                }
            } catch (err) {
                if (!err.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                    this.toastOverlay.add_toast(new Adw.Toast({
                        title: `Save failed: ${err.message}`
                    }));
                }
            }
        });
    }

    _saveToFile(file) {
        try {
            const text = this.editor.getText();
            file.replace_contents(
                text,
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
            );
            this.currentFile = file;
            this.setModified(false);

            const parentDir = file.get_parent();
            if (parentDir) {
                this.compiler.setDocDir(parentDir.get_path());
            }

            this.toastOverlay.add_toast(new Adw.Toast({
                title: `Saved ${file.get_basename()}`
            }));
        } catch (e) {
            this.toastOverlay.add_toast(new Adw.Toast({
                title: `Save error: ${e.message}`
            }));
        }
    }

    triggerCompile(immediate = false) {
        const text = this.editor.getText();
        if (immediate) {
            this.compiler.compile(
                text,
                () => this._onCompileStart(),
                (res) => this._onCompileComplete(res)
            );
        } else {
            this.compiler.triggerLiveCompile(
                text,
                () => this._onCompileStart(),
                (res) => this._onCompileComplete(res)
            );
        }
    }

    _onCompileStart() {
        if (this.liveSwitch && this.liveSwitch.get_active() && this.liveLabel) {
            this.liveLabel.set_label('Compiling…');
        }
        this.spinner.start();
        this.compileBtn.set_sensitive(false);
    }

    _onCompileComplete(result) {
        if (this.liveSwitch && this.liveSwitch.get_active() && this.liveLabel) {
            this.liveLabel.set_label('Live');
        }
        this.spinner.stop();
        this.compileBtn.set_sensitive(true);

        const statusText = result.success
            ? `✓ ${result.engine} (${result.durationMs}ms)`
            : `⚠️ ${result.errors.length} ${result.errors.length === 1 ? 'Error' : 'Errors'}`;

        if (result.pdfExists) {
            this.preview.updatePdf(result.pdfPath, statusText);
        }

        this.logPanel.updateDiagnostics(result);

        // If compilation failed with errors and log drawer is closed, give subtle visual hint
        if (!result.success && result.errors.length > 0) {
            this.logToggleBtn.add_css_class('destructive-action');
        } else {
            this.logToggleBtn.remove_css_class('destructive-action');
        }
    }

    showToast(title, timeout = 2) {
        if (this.toastOverlay) {
            const toast = new Adw.Toast({ title, timeout });
            this.toastOverlay.add_toast(toast);
        }
    }

    /**
     * Trigger forward sync from editor cursor line to PDF position
     */
    syncCurrentLineToPdf() {
        let line, col;
        if (this.editor._lastRightClickPos) {
            line = this.editor._lastRightClickPos.line;
            col = this.editor._lastRightClickPos.col;
            this.editor._lastRightClickPos = null;
        } else {
            const iter = this.editor.buffer.get_iter_at_offset(this.editor.buffer.cursor_position);
            line = iter.get_line() + 1;
            col = iter.get_line_offset() + 1;
        }
        this.syncFromCodeToPdf(line, col);
    }

    /**
     * Forward SyncTeX: Map code line/col to PDF typeset position
     */
    async syncFromCodeToPdf(line, col = 1) {
        try {
            if (!this.preview.pdfPath || !GLib.file_test(this.preview.pdfPath, GLib.FileTest.EXISTS)) {
                this.showToast('Compile document first to navigate to PDF');
                return;
            }

            const res = await syncCodeToPdf(this.compiler.pdfPath, this.compiler.texPath, line, col);
            if (res && res.page) {
                this.preview.jumpToPosition(
                    res.page,
                    res.x,
                    res.y,
                    res.width,
                    res.height
                );
                this.showToast(`Moved to PDF page ${res.page}`);
            } else {
                this.showToast('No PDF output position found for this line (e.g. preamble)');
            }
        } catch (e) {
            console.error('Error in syncFromCodeToPdf:', e);
        }
    }

    /**
     * Backward SyncTeX: Map clicked PDF page coordinates to editor line
     */
    async syncFromPdfToCode(page, x, y) {
        try {
            if (!this.preview.pdfPath || !GLib.file_test(this.preview.pdfPath, GLib.FileTest.EXISTS)) {
                this.showToast('Compile document first to navigate to code');
                return;
            }

            const res = await syncPdfToCode(this.preview.pdfPath, page, x, y);
            if (res && res.line) {
                this.editor.scrollToLine(res.line, true);
                this.showToast(`Moved to line ${res.line} in LaTeX source`);
            } else {
                this.showToast('No LaTeX source mapping found for this location');
            }
        } catch (e) {
            console.error('Error in syncFromPdfToCode:', e);
        }
    }

    showShortcutsDialog() {
        const dialog = new Adw.PreferencesWindow({
            title: 'Keyboard Shortcuts',
            transient_for: this,
            modal: true
        });

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({ title: 'Standard Shortcuts' });

        const shortcuts = [
            ['Ctrl+R / F5', 'Compile Document Immediately'],
            ['Ctrl+S', 'Save Document'],
            ['Ctrl+Shift+S', 'Save As...'],
            ['Ctrl+O', 'Open File'],
            ['Ctrl+N', 'New File'],
            ['Ctrl+F', 'Find in Document'],
            ['Ctrl+L', 'Toggle Diagnostics / Log Drawer'],
            ['Ctrl+E', 'Export Compiled PDF'],
            ['Ctrl+B', 'Wrap Bold (\\textbf)'],
            ['Ctrl+I', 'Wrap Italic (\\textit)'],
            ['Ctrl+M', 'Wrap Inline Math ($)'],
            ['Ctrl+Shift+M', 'Insert Equation Block'],
            ['Ctrl+Space', 'Force Trigger Autosuggestions'],
            ['Ctrl + / Ctrl -', 'Zoom In / Out Preview'],
            ['Ctrl+0', 'Fit Preview to Width'],
            ['Ctrl+J', 'Jump from Code to PDF Position'],
            ['Right-Click on PDF', 'Move to Code (SyncTeX Backward)'],
            ['Right-Click on Code', 'Move to PDF Position (SyncTeX Forward)'],
            ['Ctrl + Click (PDF/Code)', 'Direct SyncTeX Jump']
        ];

        for (const [key, desc] of shortcuts) {
            const row = new Adw.ActionRow({
                title: desc,
                subtitle: key
            });
            group.add(row);
        }

        page.add(group);
        dialog.add(page);
        dialog.present();
    }

    showAboutDialog() {
        const about = new Adw.AboutWindow({
            transient_for: this,
            application_name: 'TeXFlow',
            application_icon: 'x-office-document-symbolic',
            developer_name: 'Google Deepmind Pair-Programming',
            version: '1.0.0',
            copyright: '© 2026 TeXFlow Contributors',
            comments: 'High-Performance GTK4 & GJS LaTeX and PDFTeX Studio with Autosuggestions and Live Preview.',
            website: 'https://github.com/latexapp/texflow',
            issue_url: 'https://github.com/latexapp/texflow/issues',
            license_type: Gtk.License.MIT_X11
        });
        about.present();
    }
});
