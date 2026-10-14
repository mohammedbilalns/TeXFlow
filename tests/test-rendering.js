/**
 * Test: Poppler & Cairo Live Preview Rendering
 */

import Gio from 'gi://Gio';
import Poppler from 'gi://Poppler';
import cairo from 'cairo';
import { LatexCompiler } from '../src/compiler.js';
import { TEMPLATES } from '../src/templates.js';

export function runRenderingTest(existingPdfPath) {
    return new Promise((resolve, reject) => {
        console.log('[Rendering] Testing Poppler PDF parsing & Cairo rendering...');

        const testWithPdf = (pdfPath, cleanup) => {
            try {
                const pdfFile = Gio.File.new_for_path(pdfPath);
                const doc = Poppler.Document.new_from_gfile(pdfFile, null, null);
                if (!doc) throw new Error('Failed to create Poppler document');

                const nPages = doc.get_n_pages();
                if (nPages < 1) throw new Error(`Document has 0 pages: ${nPages}`);
                console.log(`  ✓ Poppler parsed PDF (${nPages} pages).`);

                const page0 = doc.get_page(0);
                const [w, h] = page0.get_size();
                const surface = new cairo.ImageSurface(cairo.Format.ARGB32, Math.ceil(w), Math.ceil(h));
                const cr = new cairo.Context(surface);
                cr.setSourceRGB(1, 1, 1);
                cr.paint();
                page0.render(cr);
                console.log(`  ✓ Cairo rendered page (size: ${Math.round(w)}x${Math.round(h)}) successfully.`);

                if (cleanup) cleanup();
                resolve(true);
            } catch (err) {
                if (cleanup) cleanup();
                reject(err);
            }
        };

        if (existingPdfPath) {
            testWithPdf(existingPdfPath, null);
        } else {
            const compiler = new LatexCompiler({ engine: 'pdflatex' });
            compiler.compile(TEMPLATES.article.content, null, (res) => {
                testWithPdf(res.pdfPath, () => compiler.cleanup());
            });
        }
    });
}
