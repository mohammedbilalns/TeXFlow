/**
 * SyncTeX Bidirectional Synchronization Service.
 * Maps between LaTeX source lines and PDF typeset page coordinates.
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

/**
 * Low-level backward sync query: Map PDF page and (x, y) coordinates to LaTeX source line.
 * @param {string} pdfPath - Absolute path to compiled PDF
 * @param {number} page - 1-based page number
 * @param {number} x - Big points (72 dpi) from page top-left
 * @param {number} y - Big points (72 dpi) from page top-left
 * @returns {Promise<{line: number, column: number, file: string}|null>}
 */
function queryPdfToCodeOnce(pdfPath, page, x, y) {
    return new Promise((resolve) => {
        if (!pdfPath || !GLib.file_test(pdfPath, GLib.FileTest.EXISTS)) {
            return resolve(null);
        }

        const synctexBin = GLib.find_program_in_path('synctex');
        if (!synctexBin) {
            console.warn('synctex binary not found in PATH');
            return resolve(null);
        }

        try {
            const pageInt = Math.max(1, Math.round(page));
            const xInt = Math.max(0, Math.round(x));
            const yInt = Math.max(0, Math.round(y));

            const proc = new Gio.Subprocess({
                argv: [
                    synctexBin, 'edit',
                    '-o', `${pageInt}:${xInt}:${yInt}:${pdfPath}`
                ],
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            });
            proc.init(null);

            proc.communicate_utf8_async(null, null, (source, res) => {
                try {
                    const [_, stdout] = source.communicate_utf8_finish(res);
                    if (!stdout) return resolve(null);

                    const lineMatch = stdout.match(/Line:(\d+)/);
                    const colMatch = stdout.match(/Column:(-?\d+)/);
                    const fileMatch = stdout.match(/Input:(.+)/);

                    if (lineMatch) {
                        resolve({
                            line: parseInt(lineMatch[1], 10),
                            column: colMatch ? Math.max(1, parseInt(colMatch[1], 10)) : 1,
                            file: fileMatch ? fileMatch[1].trim() : null
                        });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        } catch (e) {
            resolve(null);
        }
    });
}

/**
 * Backward sync with nearby fuzzy search if exact point is in margin/whitespace.
 */
export async function syncPdfToCode(pdfPath, page, x, y) {
    // 1. Direct hit at clicked coordinates
    const directHit = await queryPdfToCodeOnce(pdfPath, page, x, y);
    if (directHit && directHit.line) {
        return directHit;
    }

    // 2. Radial neighborhood search in case click was in line spacing or margin
    const offsets = [
        [0, -8], [0, 8],
        [-15, 0], [15, 0],
        [0, -18], [0, 18],
        [-30, 0], [30, 0],
        [-20, -15], [20, 15]
    ];

    for (const [dx, dy] of offsets) {
        const nx = Math.max(0, x + dx);
        const ny = Math.max(0, y + dy);
        const hit = await queryPdfToCodeOnce(pdfPath, page, nx, ny);
        if (hit && hit.line) {
            return hit;
        }
    }

    return null;
}

/**
 * Low-level forward sync query: Map LaTeX source line to PDF page and coordinates.
 * @param {string} pdfPath - Absolute path to compiled PDF
 * @param {string} texPath - Absolute path to source .tex file
 * @param {number} line - 1-based line number in source
 * @param {number} col - 1-based column number in source
 * @returns {Promise<{page: number, x: number, y: number, h: number, v: number, width: number, height: number}|null>}
 */
function queryCodeToPdfOnce(pdfPath, texPath, line, col = 1) {
    return new Promise((resolve) => {
        if (!pdfPath || !GLib.file_test(pdfPath, GLib.FileTest.EXISTS)) {
            return resolve(null);
        }
        if (!texPath || !GLib.file_test(texPath, GLib.FileTest.EXISTS)) {
            return resolve(null);
        }

        const synctexBin = GLib.find_program_in_path('synctex');
        if (!synctexBin) {
            console.warn('synctex binary not found in PATH');
            return resolve(null);
        }

        try {
            const lineInt = Math.max(1, Math.round(line));
            const colInt = Math.max(1, Math.round(col));

            const proc = new Gio.Subprocess({
                argv: [
                    synctexBin, 'view',
                    '-i', `${lineInt}:${colInt}:${texPath}`,
                    '-o', pdfPath
                ],
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            });
            proc.init(null);

            proc.communicate_utf8_async(null, null, (source, res) => {
                try {
                    const [_, stdout] = source.communicate_utf8_finish(res);
                    if (!stdout) return resolve(null);

                    // Parse first record block
                    const pageMatch = stdout.match(/Page:(\d+)/);
                    if (!pageMatch) return resolve(null);

                    const page = parseInt(pageMatch[1], 10);
                    // Match case-sensitively: lowercase h/v/x/y vs uppercase W/H
                    const xMatch = stdout.match(/\bx:([\d.]+)/);
                    const yMatch = stdout.match(/\by:([\d.]+)/);
                    const hMatch = stdout.match(/\bh:([\d.]+)/);
                    const vMatch = stdout.match(/\bv:([\d.]+)/);
                    const wMatch = stdout.match(/\bW:([\d.]+)/);
                    const hBoxMatch = stdout.match(/\bH:([\d.]+)/);

                    const rawW = wMatch ? parseFloat(wMatch[1]) : 0;
                    const rawH = hBoxMatch ? parseFloat(hBoxMatch[1]) : 0;

                    const width = rawW > 0 ? rawW : 400;
                    const height = rawH > 0 ? rawH : 14;

                    const x = xMatch ? parseFloat(xMatch[1]) : (hMatch ? parseFloat(hMatch[1]) : 72);
                    const h = hMatch ? parseFloat(hMatch[1]) : x;
                    const v = vMatch ? parseFloat(vMatch[1]) : 0;
                    const y = yMatch ? parseFloat(yMatch[1]) : (v > 0 ? v - height : 72);

                    resolve({
                        page,
                        x,
                        y,
                        h,
                        v,
                        width,
                        height
                    });
                } catch (e) {
                    resolve(null);
                }
            });
        } catch (e) {
            resolve(null);
        }
    });
}

/**
 * Forward sync with nearby line search if clicked line has no direct output
 * (e.g. comment lines, whitespace, preamble, or empty environments).
 */
export async function syncCodeToPdf(pdfPath, texPath, line, col = 1) {
    // 1. Exact line match
    const directHit = await queryCodeToPdfOnce(pdfPath, texPath, line, col);
    if (directHit && directHit.page) {
        return directHit;
    }

    // 2. Search nearby lines (forward and backward up to 15 lines)
    for (let delta = 1; delta <= 15; delta++) {
        // Try line forward first (natural reading flow)
        if (line + delta > 0) {
            const fwd = await queryCodeToPdfOnce(pdfPath, texPath, line + delta, 1);
            if (fwd && fwd.page) {
                return fwd;
            }
        }
        // Then try line backward
        if (line - delta > 0) {
            const bwd = await queryCodeToPdfOnce(pdfPath, texPath, line - delta, 1);
            if (bwd && bwd.page) {
                return bwd;
            }
        }
    }

    // 3. If line is in the preamble (e.g. lines 1..30) and nothing matched,
    // search from line 25 upwards to line 60 to jump to beginning of document
    if (line <= 30) {
        for (let l = 25; l <= 60; l++) {
            const hit = await queryCodeToPdfOnce(pdfPath, texPath, l, 1);
            if (hit && hit.page) {
                return hit;
            }
        }
    }

    return null;
}
