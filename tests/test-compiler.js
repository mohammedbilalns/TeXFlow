/**
 * Test: LaTeX Compiler (pdflatex & pdftex)
 */

import { LatexCompiler } from '../src/compiler.js';
import { TEMPLATES } from '../src/templates.js';

export function runCompilerTest() {
    return new Promise((resolve, reject) => {
        console.log('[Compiler] Testing pdflatex & pdftex asynchronous compilation...');

        const pdflatexCompiler = new LatexCompiler({ engine: 'pdflatex' });
        pdflatexCompiler.compile(TEMPLATES.article.content, null, (res) => {
            try {
                if (!res.pdfExists || res.errors.length > 0) {
                    throw new Error(`pdflatex failed: ${res.rawLog}`);
                }
                console.log(`  ✓ pdflatex compiled in ${res.durationMs}ms with 0 errors.`);

                const pdftexCompiler = new LatexCompiler({ engine: 'pdftex' });
                pdftexCompiler.compile(TEMPLATES.plain_tex.content, null, (ptRes) => {
                    try {
                        if (!ptRes.pdfExists || ptRes.errors.length > 0) {
                            throw new Error(`pdftex failed: ${ptRes.rawLog}`);
                        }
                        console.log(`  ✓ pdftex compiled in ${ptRes.durationMs}ms with 0 errors.`);

                        const pdfPath = res.pdfPath;
                        const texPath = pdflatexCompiler.texPath;

                        pdftexCompiler.cleanup();

                        resolve({
                            pdfPath,
                            texPath,
                            cleanup: () => pdflatexCompiler.cleanup()
                        });
                    } catch (err) {
                        pdflatexCompiler.cleanup();
                        pdftexCompiler.cleanup();
                        reject(err);
                    }
                });
            } catch (err) {
                pdflatexCompiler.cleanup();
                reject(err);
            }
        });
    });
}
