/**
 * LaTeX Source Code Editor Widget based on GtkSourceView-5.
 * Features syntax highlighting, line numbers, bracket matching,
 * theme auto-adaptation (dark/light), search bar, and status indicator.
 */

import Gtk from 'gi://Gtk?version=4.0';
import Gdk from 'gi://Gdk?version=4.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Graphene from 'gi://Graphene';
import GtkSource from 'gi://GtkSource?version=5';
import Adw from 'gi://Adw?version=1';
import { LatexAutoCompletion } from './autocompletion.js';

export class LatexEditor {
    constructor() {
        this.container = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            hexpand: true,
            vexpand: true
        });

        this.onMoveToPdf = null;

        this._setupBuffer();
        this._setupView();
        this._setupSearchBar();
        this._setupScrolledWindow();
        this._setupContextMenu();
        this._setupStatusBar();
        this._setupThemeSync();

        // Attach LaTeX autocompletion engine
        this.autocompletion = new LatexAutoCompletion(this);

        // Track stats on buffer change and cursor movement
        this.buffer.connect('notify::cursor-position', () => this._updateCursorStats());
        this.buffer.connect('changed', () => this._updateCursorStats());
        this._updateCursorStats();
    }

    _setupBuffer() {
        this.buffer = new GtkSource.Buffer();

        // Enable LaTeX syntax highlighting
        const lm = GtkSource.LanguageManager.get_default();
        const latexLang = lm.get_language('latex');
        if (latexLang) {
            this.buffer.set_language(latexLang);
            this.buffer.set_highlight_syntax(true);
        }

        // Enable bracket matching and undo manager
        this.buffer.set_highlight_matching_brackets(true);
    }

    _setupView() {
        this.view = new GtkSource.View({
            buffer: this.buffer,
            show_line_numbers: true,
            highlight_current_line: true,
            auto_indent: true,
            indent_on_tab: true,
            tab_width: 4,
            insert_spaces_instead_of_tabs: true,
            show_right_margin: false,
            monospace: true,
            wrap_mode: Gtk.WrapMode.WORD_CHAR,
            top_margin: 8,
            bottom_margin: 8,
            left_margin: 8,
            right_margin: 8
        });

        this.view.add_css_class('latex-code-view');

        // Extra context menu item: Jump to corresponding location in PDF preview
        const extraMenu = new Gio.Menu();
        extraMenu.append('Move to PDF Position', 'win.jump_to_pdf');
        this.view.set_extra_menu(extraMenu);

        this._lastRightClickPos = null;

        // Click gesture for cursor placement, dedicated context menu, and Ctrl+Click sync
        const clickGesture = new Gtk.GestureClick({ button: 0 });
        clickGesture.connect('pressed', (gesture, n, x, y) => {
            const button = gesture.get_current_button();
            const state = gesture.get_current_event_state();
            const isCtrl = (state & Gdk.ModifierType.CONTROL_MASK) !== 0;

            const [bx, by] = this.view.window_to_buffer_coords(Gtk.TextWindowType.WIDGET, x, y);
            const res = this.view.get_iter_at_position(bx, by);
            const iter = res && res[1] ? res[1] : null;

            if (iter) {
                const line = iter.get_line() + 1;
                const col = iter.get_line_offset() + 1;

                if (button === 3) {
                    // Right-click: place cursor so jump action targets the clicked line
                    const [hasSel, selStart, selEnd] = this.buffer.get_selection_bounds();
                    if (!hasSel || !iter.in_range(selStart, selEnd)) {
                        this.buffer.place_cursor(iter);
                    }
                    this._lastRightClickPos = { line, col };
                    if (this.autocompletion) this.autocompletion.hide();

                    // Show dedicated "Move to PDF Position" popover
                    this._showContextMenu(x, y, line, col);
                    gesture.set_state(Gtk.EventSequenceState.CLAIMED);
                } else if (button === 1) {
                    this._lastRightClickPos = { line, col };
                    if (this.contextPopover && this.contextPopover.get_visible()) {
                        this.contextPopover.popdown();
                    }
                    if (this.autocompletion) {
                        this.autocompletion.hide();
                    }
                    if (isCtrl && this.onCtrlClick) {
                        // Ctrl+Left-Click: instant forward sync
                        this.buffer.place_cursor(iter);
                        this.onCtrlClick(line, col);
                    }
                }
            }
        });
        this.view.add_controller(clickGesture);
    }

    _setupContextMenu() {
        this.contextPopover = new Gtk.Popover();
        this.contextPopover.set_parent(this.container);
        this.contextPopover.set_has_arrow(true);

        const menuBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 4,
            margin_top: 6,
            margin_bottom: 6,
            margin_start: 6,
            margin_end: 6
        });

        // Header showing clicked line and col
        const headerBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            margin_bottom: 4
        });
        const headerIcon = new Gtk.Image({
            icon_name: 'text-editor-symbolic',
            pixel_size: 16,
            valign: Gtk.Align.CENTER,
            css_classes: ['dim-label']
        });
        this.popoverTitleLabel = new Gtk.Label({
            label: 'LaTeX Code',
            css_classes: ['caption', 'dim-label'],
            xalign: 0,
            hexpand: true
        });
        headerBox.append(headerIcon);
        headerBox.append(this.popoverTitleLabel);
        menuBox.append(headerBox);

        const sep = new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL });
        menuBox.append(sep);

        // "Move to PDF Position" Action Button
        const jumpBtn = new Gtk.Button({
            css_classes: ['flat']
        });
        const jumpBtnBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            margin_top: 4,
            margin_bottom: 4,
            margin_start: 6,
            margin_end: 6
        });
        jumpBtnBox.append(new Gtk.Image({
            icon_name: 'x-office-document-symbolic',
            pixel_size: 16,
            valign: Gtk.Align.CENTER
        }));
        const jumpLabelBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 2 });
        const jumpMainLabel = new Gtk.Label({
            label: '<b>Move to PDF Position</b>',
            use_markup: true,
            xalign: 0
        });
        const jumpSubLabel = new Gtk.Label({
            label: 'Jump to typeset location in PDF preview (Ctrl+J)',
            css_classes: ['caption', 'dim-label'],
            xalign: 0
        });
        jumpLabelBox.append(jumpMainLabel);
        jumpLabelBox.append(jumpSubLabel);
        jumpBtnBox.append(jumpLabelBox);
        jumpBtn.set_child(jumpBtnBox);

        jumpBtn.connect('clicked', () => {
            this.contextPopover.popdown();
            if (this._lastRightClickPos && this.onMoveToPdf) {
                this.onMoveToPdf(this._lastRightClickPos.line, this._lastRightClickPos.col);
            }
        });
        menuBox.append(jumpBtn);

        this.contextPopover.set_child(menuBox);
    }

    _showContextMenu(x, y, line, col) {
        this.popoverTitleLabel.set_label(`Line ${line}, Column ${col}`);
        let px = x, py = y;
        if (this.container) {
            const [ok, pt] = this.view.compute_point(this.container, new Graphene.Point({ x, y }));
            if (ok) {
                px = pt.x;
                py = pt.y;
            }
        }
        this.contextPopover.set_pointing_to(new Gdk.Rectangle({
            x: Math.round(px),
            y: Math.round(py),
            width: 1,
            height: 1
        }));
        this.contextPopover.popup();
    }

    _setupSearchBar() {
        this.searchSettings = new GtkSource.SearchSettings({
            search_text: '',
            case_sensitive: false,
            wrap_around: true
        });

        this.searchContext = new GtkSource.SearchContext({
            buffer: this.buffer,
            settings: this.searchSettings
        });
        this.searchContext.set_highlight(true);

        this.searchBar = new Gtk.SearchBar({
            key_capture_widget: this.view
        });

        const box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            margin_top: 4,
            margin_bottom: 4,
            margin_start: 8,
            margin_end: 8
        });

        this.searchEntry = new Gtk.SearchEntry({
            placeholder_text: 'Find in document...',
            hexpand: true
        });
        this.searchEntry.connect('search-changed', () => {
            this.searchSettings.set_search_text(this.searchEntry.get_text());
        });
        this.searchEntry.connect('activate', () => {
            this.findNext();
        });

        const prevBtn = new Gtk.Button({
            icon_name: 'go-up-symbolic',
            tooltip_text: 'Previous match'
        });
        prevBtn.connect('clicked', () => this.findPrev());

        const nextBtn = new Gtk.Button({
            icon_name: 'go-down-symbolic',
            tooltip_text: 'Next match'
        });
        nextBtn.connect('clicked', () => this.findNext());

        box.append(this.searchEntry);
        box.append(prevBtn);
        box.append(nextBtn);

        this.searchBar.set_child(box);
        this.searchBar.connect_entry(this.searchEntry);
        this.container.append(this.searchBar);
    }

    _setupScrolledWindow() {
        this.overlay = new Gtk.Overlay({
            hexpand: true,
            vexpand: true
        });

        this.scrolledWindow = new Gtk.ScrolledWindow({
            hexpand: true,
            vexpand: true,
            hscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
            vscrollbar_policy: Gtk.PolicyType.AUTOMATIC
        });
        this.scrolledWindow.set_child(this.view);
        this.overlay.set_child(this.scrolledWindow);

        this.container.append(this.overlay);
    }

    _setupStatusBar() {
        const statusBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
            margin_start: 12,
            margin_end: 12,
            margin_top: 4,
            margin_bottom: 4,
            css_classes: ['editor-statusbar']
        });

        this.posLabel = new Gtk.Label({
            label: 'Ln 1, Col 1',
            css_classes: ['dim-label', 'caption']
        });

        this.statsLabel = new Gtk.Label({
            label: '0 words, 0 characters',
            css_classes: ['dim-label', 'caption']
        });

        const separator = new Gtk.Separator({
            orientation: Gtk.Orientation.VERTICAL
        });

        statusBox.append(this.posLabel);
        statusBox.append(separator);
        statusBox.append(this.statsLabel);

        this.container.append(statusBox);
    }

    _setupThemeSync() {
        const sm = GtkSource.StyleSchemeManager.get_default();
        const updateScheme = () => {
            const isDark = Adw.StyleManager.get_default().dark;
            const schemeName = isDark ? 'Adwaita-dark' : 'Adwaita';
            const scheme = sm.get_scheme(schemeName) || sm.get_scheme('solarized-dark') || sm.get_scheme('classic');
            if (scheme) {
                this.buffer.set_style_scheme(scheme);
            }
        };

        Adw.StyleManager.get_default().connect('notify::dark', updateScheme);
        updateScheme();
    }

    _updateCursorStats() {
        const iter = this.buffer.get_iter_at_offset(this.buffer.cursor_position);
        const line = iter.get_line() + 1;
        const col = iter.get_line_offset() + 1;
        this.posLabel.set_label(`Ln ${line}, Col ${col}`);

        const text = this.buffer.text || '';
        const charCount = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        this.statsLabel.set_label(`${words} words, ${charCount} chars`);
    }

    toggleSearchBar() {
        const active = this.searchBar.get_search_mode();
        this.searchBar.set_search_mode(!active);
        if (!active) {
            this.searchEntry.grab_focus();
        } else {
            this.view.grab_focus();
        }
    }

    findNext() {
        const cursorIter = this.buffer.get_iter_at_offset(this.buffer.cursor_position);
        const [found, matchStart, matchEnd] = this.searchContext.forward(cursorIter);
        if (found) {
            this.buffer.select_range(matchStart, matchEnd);
            this.view.scroll_to_iter(matchStart, 0.1, false, 0, 0);
        }
    }

    findPrev() {
        const cursorIter = this.buffer.get_iter_at_offset(this.buffer.cursor_position);
        const [found, matchStart, matchEnd] = this.searchContext.backward(cursorIter);
        if (found) {
            this.buffer.select_range(matchStart, matchEnd);
            this.view.scroll_to_iter(matchStart, 0.1, false, 0, 0);
        }
    }

    getText() {
        return this.buffer.text || '';
    }

    setText(text) {
        this.buffer.set_text(text, -1);
    }

    scrollToLine(lineNum, selectLine = false) {
        if (!lineNum || lineNum < 1) return;
        const totalLines = this.buffer.get_line_count();
        const targetLine = Math.min(Math.max(1, lineNum), totalLines);
        const [ok1, startIter] = this.buffer.get_iter_at_line(targetLine - 1);
        if (!ok1) return;

        if (selectLine) {
            const [ok2, endIter] = this.buffer.get_iter_at_line(targetLine - 1);
            if (ok2) {
                endIter.forward_to_line_end();
                this.buffer.select_range(startIter, endIter);
            } else {
                this.buffer.place_cursor(startIter);
            }
        } else {
            this.buffer.place_cursor(startIter);
        }

        // Reliably scroll editor viewport in GTK4
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            try {
                const mark = this.buffer.get_insert();
                if (mark) {
                    this.view.scroll_to_mark(mark, 0.1, true, 0.0, 0.35);
                }
                const [ok, lineIter] = this.buffer.get_iter_at_line(targetLine - 1);
                const iterToUse = ok ? lineIter : startIter;
                const loc = this.view.get_iter_location(iterToUse);
                const vadj = this.scrolledWindow ? this.scrolledWindow.get_vadjustment() : null;
                if (vadj && loc && loc.y > 0) {
                    const viewHeight = this.scrolledWindow.get_height() || 300;
                    const targetScroll = Math.max(0, loc.y - (viewHeight / 3));
                    const maxScroll = Math.max(0, vadj.get_upper() - vadj.get_page_size());
                    vadj.set_value(Math.min(targetScroll, maxScroll));
                }
            } catch (e) {
                console.error('Failed to scroll editor:', e);
            }
            return GLib.SOURCE_REMOVE;
        });

        this.view.grab_focus();
    }

    wrapSelection(prefix, suffix) {
        const [hasSelection, startIter, endIter] = this.buffer.get_selection_bounds();
        if (hasSelection) {
            const selectedText = this.buffer.get_text(startIter, endIter, true);
            this.buffer.delete(startIter, endIter);
            const insertIter = this.buffer.get_iter_at_offset(this.buffer.cursor_position);
            this.buffer.insert(insertIter, `${prefix}${selectedText}${suffix}`, -1);
        } else {
            const insertIter = this.buffer.get_iter_at_offset(this.buffer.cursor_position);
            this.buffer.insert(insertIter, `${prefix}${suffix}`, -1);
            // Move cursor inside prefix and suffix
            const newPos = this.buffer.cursor_position - suffix.length;
            this.buffer.place_cursor(this.buffer.get_iter_at_offset(newPos));
        }
        this.view.grab_focus();
    }

    insertText(text, cursorOffset = 0) {
        const insertIter = this.buffer.get_iter_at_offset(this.buffer.cursor_position);
        this.buffer.insert(insertIter, text, -1);
        if (cursorOffset !== 0) {
            const newPos = this.buffer.cursor_position + cursorOffset;
            this.buffer.place_cursor(this.buffer.get_iter_at_offset(Math.max(0, newPos)));
        }
        this.view.grab_focus();
    }
}
