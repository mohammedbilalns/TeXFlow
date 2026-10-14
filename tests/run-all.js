/**
 * TeXFlow Master Test Suite Runner
 * Runs symbols, templates, compiler, rendering, synctex, and editor tests.
 */

import GLib from 'gi://GLib';
import system from 'system';
import { runSymbolsTest } from './test-symbols.js';
import { runTemplatesTest } from './test-templates.js';
import { runCompilerTest } from './test-compiler.js';
import { runRenderingTest } from './test-rendering.js';
import { runSyncTexTest } from './test-synctex.js';
import { runEditorInteractionTest } from './test-editor.js';

const loop = new GLib.MainLoop(null, false);

async function main() {
    console.log('========================================================');
    console.log('            TeXFlow Automated Test Suite                ');
    console.log('========================================================\n');

    const startTime = Date.now();
    let compilerCleanup = null;

    try {
        // 1. Symbol database
        runSymbolsTest();

        // 2. Templates
        runTemplatesTest();

        // 3. Compiler (pdflatex & pdftex)
        const compileRes = await runCompilerTest();
        compilerCleanup = compileRes.cleanup;

        // 4. Poppler & Cairo Rendering
        await runRenderingTest(compileRes.pdfPath);

        // 5. Bidirectional SyncTeX Navigation
        await runSyncTexTest(compileRes.pdfPath, compileRes.texPath);

        // Clean up compiler artifacts from tests 3-5
        if (compilerCleanup) compilerCleanup();

        // 6. Editor, Autocompletion & Resize Layout
        await runEditorInteractionTest();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('\n========================================================');
        console.log(`🎉 ALL 6 TEST SUITES PASSED SUCCESSFULLY in ${duration}s!`);
        console.log('========================================================\n');
        loop.quit();
        system.exit(0);
    } catch (err) {
        if (compilerCleanup) {
            try { compilerCleanup(); } catch (_) {}
        }
        console.error('\n❌ TEST SUITE FAILED:');
        console.error(err);
        loop.quit();
        system.exit(1);
    }
}

GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
    main();
    return GLib.SOURCE_REMOVE;
});

loop.run();
