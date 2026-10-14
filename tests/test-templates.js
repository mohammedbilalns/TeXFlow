/**
 * Test: LaTeX & Plain TeX Starter Templates Validation
 */

import { TEMPLATES } from '../src/templates.js';

export function runTemplatesTest() {
    const keys = Object.keys(TEMPLATES);
    console.log(`[Templates] Validating starter templates (${keys.length} templates)...`);

    const requiredKeys = ['article', 'math', 'plain_tex', 'beamer', 'report'];
    for (const req of requiredKeys) {
        if (!TEMPLATES[req]) {
            throw new Error(`Missing expected template: ${req}`);
        }
    }

    for (const [key, tpl] of Object.entries(TEMPLATES)) {
        if (!tpl.name || typeof tpl.name !== 'string') {
            throw new Error(`Template ${key} is missing a valid name.`);
        }
        if (!tpl.content || typeof tpl.content !== 'string' || tpl.content.length < 20) {
            throw new Error(`Template ${key} has invalid content.`);
        }
        if (!tpl.engine || !['pdflatex', 'pdftex', 'xelatex', 'lualatex'].includes(tpl.engine)) {
            throw new Error(`Template ${key} has invalid engine: ${tpl.engine}`);
        }
    }

    console.log(`  ✓ All ${keys.length} templates validated: ${keys.join(', ')}.`);
    return true;
}
