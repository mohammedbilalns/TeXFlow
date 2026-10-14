/**
 * Test: LaTeX Symbol & Snippet Database Validation
 */

import { LATEX_SYMBOLS } from '../src/data/latex-symbols.js';

export function runSymbolsTest() {
    console.log(`[Symbols] Validating symbol database (${LATEX_SYMBOLS.length} items)...`);
    if (!LATEX_SYMBOLS || LATEX_SYMBOLS.length < 50) {
        throw new Error(`Symbol database too small or missing: ${LATEX_SYMBOLS?.length}`);
    }

    const types = new Set();
    for (const sym of LATEX_SYMBOLS) {
        if (!sym.name || typeof sym.name !== 'string') {
            throw new Error(`Invalid symbol name: ${JSON.stringify(sym)}`);
        }
        if (!sym.insertText || typeof sym.insertText !== 'string') {
            throw new Error(`Invalid symbol insertText: ${JSON.stringify(sym)}`);
        }
        if (!sym.type || typeof sym.type !== 'string') {
            throw new Error(`Invalid symbol type: ${JSON.stringify(sym)}`);
        }
        types.add(sym.type);
    }

    console.log(`  ✓ Checked ${LATEX_SYMBOLS.length} symbols across categories: ${Array.from(types).join(', ')}.`);
    return true;
}
