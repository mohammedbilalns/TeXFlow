/**
 * LaTeX Quick Formatting Toolbar.
 * Provides one-click visual shortcuts for common formatting and environments.
 * Wrapped in a horizontal ScrolledWindow to allow flexible resizing without pushing content off-screen.
 */

import Gtk from 'gi://Gtk?version=4.0';

export class QuickToolbar {
    constructor(editor) {
        this.editor = editor;

        this.scroller = new Gtk.ScrolledWindow({
            hscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
            vscrollbar_policy: Gtk.PolicyType.NEVER,
            hexpand: true,
            vexpand: false,
            min_content_width: 80,
            css_classes: ['quick-toolbar-scroller']
        });

        this.toolbarBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 2,
            margin_start: 6,
            margin_end: 6,
            margin_top: 4,
            margin_bottom: 4,
            css_classes: ['quick-toolbar']
        });

        this.scroller.set_child(this.toolbarBox);
        this.container = this.scroller;

        this._buildItems();
    }

    _buildItems() {
        // --- Text Formatting ---
        this._addButton('format-text-bold-symbolic', 'Bold (Ctrl+B)', () => {
            this.editor.wrapSelection('\\textbf{', '}');
        });

        this._addButton('format-text-italic-symbolic', 'Italic (Ctrl+I)', () => {
            this.editor.wrapSelection('\\textit{', '}');
        });

        this._addButton('format-text-underline-symbolic', 'Underline', () => {
            this.editor.wrapSelection('\\underline{', '}');
        });

        this._addTextButton('tt', 'Monospace / Typewriter (\\texttt)', () => {
            this.editor.wrapSelection('\\texttt{', '}');
        });

        this._addSeparator();

        // --- Math Constructs ---
        this._addTextButton('$', 'Inline Math $...$ (Ctrl+M)', () => {
            this.editor.wrapSelection('$', '$');
        });

        this._addTextButton('$$', 'Equation Block (Ctrl+Shift+M)', () => {
            this.editor.wrapSelection('\\begin{equation}\n    ', '\n\\end{equation}');
        });

        this._addTextButton('a/b', 'Fraction (\\frac{num}{den})', () => {
            this.editor.wrapSelection('\\frac{', '}{den}');
        });

        this._addTextButton('√x', 'Square Root (\\sqrt{x})', () => {
            this.editor.wrapSelection('\\sqrt{', '}');
        });

        this._addTextButton('∑', 'Summation (\\sum)', () => {
            this.editor.insertText('\\sum_{i=1}^{n} ', 0);
        });

        this._addTextButton('∫', 'Integral (\\int)', () => {
            this.editor.insertText('\\int_{a}^{b} f(x)\\, dx', -10);
        });

        this._addSeparator();

        // --- Document Structures & Lists ---
        this._addTextButton('§ Sec', 'Insert \\section{}', () => {
            this.editor.wrapSelection('\\section{', '}');
        });

        this._addTextButton('§§ Sub', 'Insert \\subsection{}', () => {
            this.editor.wrapSelection('\\subsection{', '}');
        });

        this._addTextButton('• List', 'Bulleted List (itemize)', () => {
            this.editor.wrapSelection('\\begin{itemize}\n    \\item ', '\n\\end{itemize}');
        });

        this._addTextButton('1. Num', 'Numbered List (enumerate)', () => {
            this.editor.wrapSelection('\\begin{enumerate}\n    \\item ', '\n\\end{enumerate}');
        });

        this._addTextButton('[M]', 'Matrix (pmatrix)', () => {
            this.editor.insertText('\\begin{pmatrix}\n    a & b \\\\\n    c & d\n\\end{pmatrix}', -20);
        });
    }

    _addButton(iconName, tooltip, onClick) {
        const btn = new Gtk.Button({
            icon_name: iconName,
            tooltip_text: tooltip,
            css_classes: ['flat', 'circular']
        });
        btn.connect('clicked', onClick);
        this.toolbarBox.append(btn);
        return btn;
    }

    _addTextButton(label, tooltip, onClick) {
        const btn = new Gtk.Button({
            label: label,
            tooltip_text: tooltip,
            css_classes: ['flat']
        });
        btn.connect('clicked', onClick);
        this.toolbarBox.append(btn);
        return btn;
    }

    _addSeparator() {
        const sep = new Gtk.Separator({
            orientation: Gtk.Orientation.VERTICAL,
            margin_start: 4,
            margin_end: 4
        });
        this.toolbarBox.append(sep);
    }
}
