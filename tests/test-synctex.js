/**
 * Test: Bidirectional SyncTeX Navigation (Code <-> PDF)
 */

import { syncPdfToCode, syncCodeToPdf } from '../src/synctex.js';
import { LatexCompiler } from '../src/compiler.js';
import { TEMPLATES } from '../src/templates.js';

export function runSyncTexTest(pdfPath, texPath) {
    return new Promise((resolve, reject) => {
        console.log('[SyncTeX] Testing bidirectional navigation (PDF <-> Code)...');

        const executeTest = async (testPdf, testTex, cleanup) => {
            try {
                // 1. Forward Sync: Line 25 (\section{Introduction}) -> PDF page & coordinates
                const fwd = await syncCodeToPdf(testPdf, testTex, 25, 1);
                if (!fwd || !fwd.page || fwd.page < 1) {
                    throw new Error(`SyncTeX forward sync failed on line 25: ${JSON.stringify(fwd)}`);
                }
                console.log(`  ✓ Forward Sync: Line 25 -> Page ${fwd.page} at (${Math.round(fwd.x)}pt, ${Math.round(fwd.y)}pt).`);

                // 2. Backward Sync: Coordinates -> Code source line
                const bwd = await syncPdfToCode(testPdf, fwd.page, fwd.x + 10, fwd.y + 10);
                if (!bwd || !bwd.line || bwd.line < 1) {
                    throw new Error(`SyncTeX backward sync failed: ${JSON.stringify(bwd)}`);
                }
                console.log(`  ✓ Backward Sync: Page ${fwd.page} (${Math.round(fwd.x + 10)}, ${Math.round(fwd.y + 10)}) -> Line ${bwd.line}.`);

                if (cleanup) cleanup();
                resolve(true);
            } catch (err) {
                if (cleanup) cleanup();
                reject(err);
            }
        };

        if (pdfPath && texPath) {
            executeTest(pdfPath, texPath, null);
        } else {
            const compiler = new LatexCompiler({ engine: 'pdflatex' });
            compiler.compile(TEMPLATES.article.content, null, (res) => {
                executeTest(res.pdfPath, compiler.texPath, () => compiler.cleanup());
            });
        }
    });
}
