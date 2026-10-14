/**
 * LaTeX Autosuggestions and Autocompletion Engine.
 * Provides interactive in-window overlay suggestions for LaTeX commands, environments,
 * math symbols, and Plain TeX primitives with seamless keyboard navigation.
 * Uses Gtk.Overlay + Gtk.Fixed to prevent Wayland xdg_popup grabs that block typing.
 */

import Gtk from 'gi://Gtk?version=4.0';
import Gdk from 'gi://Gdk?version=4.0';
import Graphene from 'gi://Graphene';
import Pango from 'gi://Pango';
import { LATEX_SYMBOLS } from './data/latex-symbols.js';

export class LatexAutoCompletion {
    constructor(editor) {
        this.editor = editor;
        this.view = editor.view || editor;
        this.buffer = this.view.get_buffer();
        this.overlay = editor.overlay || editor.container;

        this._matches = [];
        this._selectedIndex = 0;
        this._currentQuery = '';
        this._prefixStartOffset = 0;
        this._isCompleting = false;

        this._buildOverlay();
        this._setupKeyController();
        this._setupBufferSignals();
    }

    _buildOverlay() {
        this.fixed = new Gtk.Fixed();
        this.fixed.set_can_target(false);

        if (this.overlay && this.overlay.add_overlay) {
            this.overlay.add_overlay(this.fixed);
        }

        this.popupBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 4,
            width_request: 320,
            visible: false,
            can_target: true,
            css_classes: ['completion-overlay-card']
        });

        // Header info
        this.headerLabel = new Gtk.Label({
            label: 'LaTeX Suggestions',
            xalign: 0,
            margin_start: 8,
            margin_end: 8,
            margin_top: 4,
            margin_bottom: 2,
            css_classes: ['dim-label', 'caption']
        });
        this.popupBox.append(this.headerLabel);

        // Scrolled list of suggestions
        this.scrolledWindow = new Gtk.ScrolledWindow({
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
            max_content_height: 220,
            propagate_natural_height: true
        });

        this.listBox = new Gtk.ListBox({
            selection_mode: Gtk.SelectionMode.SINGLE,
            css_classes: ['navigation-sidebar']
        });

        this.listBox.connect('row-activated', (list, row) => {
            const index = row.get_index();
            this._applySuggestion(index);
        });

        this.scrolledWindow.set_child(this.listBox);
        this.popupBox.append(this.scrolledWindow);

        this.fixed.put(this.popupBox, 0, 0);

        // Alias for compatibility
        this.popover = {
            get_visible: () => this.popupBox.get_visible(),
            popup: () => this.popupBox.set_visible(true),
            popdown: () => this.hide(),
            hide: () => this.hide()
        };
    }

    _setupKeyController() {
        const keyController = new Gtk.EventControllerKey();
        keyController.connect('key-pressed', (controller, keyval, keycode, state) => {
            if (!this.popupBox.get_visible()) {
                // If user presses Ctrl+Space, explicitly trigger suggestions
                if ((state & Gdk.ModifierType.CONTROL_MASK) && keyval === Gdk.KEY_space) {
                    this._checkAndShowSuggestions(true);
                    return true;
                }
                return false;
            }

            // Keyboard navigation while overlay is active
            if (keyval === Gdk.KEY_Down) {
                this._selectNext();
                return true;
            } else if (keyval === Gdk.KEY_Up) {
                this._selectPrev();
                return true;
            } else if (keyval === Gdk.KEY_Return || keyval === Gdk.KEY_KP_Enter || keyval === Gdk.KEY_Tab) {
                this._applySuggestion(this._selectedIndex);
                return true;
            } else if (keyval === Gdk.KEY_Escape) {
                this.hide();
                return true;
            } else if (keyval === Gdk.KEY_Left || keyval === Gdk.KEY_Right) {
                this.hide();
                return false;
            }

            return false;
        });

        this.view.add_controller(keyController);
    }

    _setupBufferSignals() {
        this.buffer.connect('changed', () => {
            if (this._isCompleting) return;
            this._checkAndShowSuggestions(false);
        });

        this.buffer.connect('notify::cursor-position', () => {
            if (this._isCompleting) return;
            if (this.popupBox.get_visible()) {
                this._checkAndShowSuggestions(false);
            }
        });

        if (this.editor.scrolledWindow) {
            const vadj = this.editor.scrolledWindow.get_vadjustment();
            if (vadj) {
                vadj.connect('value-changed', () => this.hide());
            }
            const hadj = this.editor.scrolledWindow.get_hadjustment();
            if (hadj) {
                hadj.connect('value-changed', () => this.hide());
            }
        }
    }

    _checkAndShowSuggestions(force) {
        const cursorIter = this.buffer.get_iter_at_offset(this.buffer.cursor_position);
        const lineStartIter = cursorIter.copy();
        lineStartIter.set_line_offset(0);

        const lineText = this.buffer.get_text(lineStartIter, cursorIter, true);
        if (!lineText) {
            this.hide();
            return;
        }

        // Look for LaTeX trigger before cursor:
        // Case 1: Environment completion inside \begin{...}
        const beginMatch = lineText.match(/\\begin\{([a-zA-Z*]*)$/);
        // Case 2: Package completion inside \usepackage{...}
        const pkgMatch = lineText.match(/\\usepackage(?:\[.*?\])?\{([a-zA-Z0-9_-]*)$/);
        // Case 3: Standard \command or math symbol
        const cmdMatch = lineText.match(/\\([a-zA-Z*]+)$/);

        let query = '';
        let filterType = null;
        let prefixLength = 0;

        if (beginMatch) {
            query = beginMatch[1].toLowerCase();
            filterType = 'environment';
            prefixLength = beginMatch[1].length;
        } else if (pkgMatch) {
            query = pkgMatch[1].toLowerCase();
            filterType = 'package';
            prefixLength = pkgMatch[1].length;
        } else if (cmdMatch) {
            query = cmdMatch[1].toLowerCase();
            prefixLength = cmdMatch[1].length + 1; // include backslash
        } else if (lineText.endsWith('\\')) {
            query = '';
            prefixLength = 1; // single backslash
        } else if (force) {
            // Find current word
            const wordMatch = lineText.match(/([a-zA-Z*]+)$/);
            if (wordMatch) {
                query = wordMatch[1].toLowerCase();
                prefixLength = wordMatch[1].length;
            }
        } else {
            this.hide();
            return;
        }

        this._currentQuery = query;
        this._prefixStartOffset = cursorIter.get_offset() - prefixLength;

        // Filter suggestions
        this._matches = LATEX_SYMBOLS.filter(item => {
            if (filterType && item.type !== filterType) return false;

            const name = item.name.startsWith('\\') ? item.name.substring(1).toLowerCase() : item.name.toLowerCase();
            if (!query) return true;
            return name.startsWith(query) || item.name.toLowerCase().includes(query);
        }).slice(0, 15); // Show top 15 matches

        if (this._matches.length === 0) {
            this.hide();
            return;
        }

        this._populateList();
        this._positionAndShowOverlay(cursorIter);
    }

    _populateList() {
        // Clear previous rows
        let child = this.listBox.get_first_child();
        while (child) {
            const next = child.get_next_sibling();
            this.listBox.remove(child);
            child = next;
        }

        this._selectedIndex = 0;
        this.headerLabel.set_label(`${this._matches.length} LaTeX Suggestions:`);

        for (let i = 0; i < this._matches.length; i++) {
            const item = this._matches[i];
            const row = new Gtk.ListBoxRow({
                activatable: true,
                selectable: true
            });

            const rowBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 8,
                margin_top: 4,
                margin_bottom: 4,
                margin_start: 8,
                margin_end: 8
            });

            // Type badge
            const badge = new Gtk.Label({
                label: this._getBadgeLabel(item.type),
                css_classes: ['completion-badge', `badge-${item.type}`]
            });
            rowBox.append(badge);

            // Name
            const nameLabel = new Gtk.Label({
                label: item.name,
                xalign: 0,
                hexpand: true,
                ellipsize: Pango.EllipsizeMode.END,
                css_classes: ['completion-name']
            });
            rowBox.append(nameLabel);

            // Description
            if (item.description) {
                const descLabel = new Gtk.Label({
                    label: item.description,
                    xalign: 1,
                    ellipsize: Pango.EllipsizeMode.END,
                    max_width_chars: 24,
                    css_classes: ['dim-label', 'caption']
                });
                rowBox.append(descLabel);
            }

            row.set_child(rowBox);
            this.listBox.append(row);
        }

        const firstRow = this.listBox.get_row_at_index(0);
        if (firstRow) {
            this.listBox.select_row(firstRow);
        }
    }

    _getBadgeLabel(type) {
        switch (type) {
            case 'environment': return 'ENV';
            case 'math': return 'MATH';
            case 'package': return 'PKG';
            case 'pdftex': return 'TEX';
            default: return 'CMD';
        }
    }

    _positionAndShowOverlay(cursorIter) {
        const loc = this.view.get_iter_location(cursorIter);
        const [wx, wy] = this.view.buffer_to_window_coords(Gtk.TextWindowType.WIDGET, loc.x, loc.y);

        let posX = wx;
        let posY = wy + (loc.height || 18) + 4;

        if (this.overlay && this.overlay !== this.view) {
            const [ok, pt] = this.view.compute_point(this.overlay, new Graphene.Point({ x: wx, y: wy }));
            if (ok) {
                posX = pt.x;
                posY = pt.y + (loc.height || 18) + 4;
            }
        }

        // Overlay boundary clamping
        const overlayWidth = this.overlay.get_width() || 500;
        const overlayHeight = this.overlay.get_height() || 400;
        const boxWidth = 320;
        const boxHeight = Math.min(260, 36 + this._matches.length * 28);

        if (posX + boxWidth > overlayWidth - 16) {
            posX = Math.max(8, overlayWidth - boxWidth - 16);
        }
        if (posY + boxHeight > overlayHeight - 16 && posY > boxHeight + 20) {
            // Flip above cursor line if there isn't enough space below
            posY = posY - (loc.height || 18) - boxHeight - 8;
        }

        this.fixed.move(this.popupBox, Math.max(8, Math.round(posX)), Math.max(8, Math.round(posY)));
        this.popupBox.set_visible(true);
    }

    _selectNext() {
        if (this._matches.length === 0) return;
        this._selectedIndex = (this._selectedIndex + 1) % this._matches.length;
        const row = this.listBox.get_row_at_index(this._selectedIndex);
        if (row) {
            this.listBox.select_row(row);
            const vadj = this.scrolledWindow.get_vadjustment();
            if (vadj) {
                vadj.set_value(Math.max(0, this._selectedIndex * 28 - 56));
            }
        }
    }

    _selectPrev() {
        if (this._matches.length === 0) return;
        this._selectedIndex = (this._selectedIndex - 1 + this._matches.length) % this._matches.length;
        const row = this.listBox.get_row_at_index(this._selectedIndex);
        if (row) {
            this.listBox.select_row(row);
            const vadj = this.scrolledWindow.get_vadjustment();
            if (vadj) {
                vadj.set_value(Math.max(0, this._selectedIndex * 28 - 56));
            }
        }
    }

    hide() {
        if (this.popupBox && this.popupBox.get_visible()) {
            this.popupBox.set_visible(false);
        }
    }

    _applySuggestion(index) {
        if (index < 0 || index >= this._matches.length) return;
        const item = this._matches[index];

        this._isCompleting = true;
        this.hide();

        try {
            const cursorIter = this.buffer.get_iter_at_offset(this.buffer.cursor_position);
            const startIter = this.buffer.get_iter_at_offset(this._prefixStartOffset);

            // Parse snippet template: ${1:placeholder} -> placeholder
            let cleanInsert = item.insertText;
            let targetOffsetFromEnd = item.cursorOffset || 0;

            const phMatch = cleanInsert.match(/\$\{1(?::(.*?))?\}/);
            if (phMatch) {
                const phText = phMatch[1] || '';
                const beforeClean = cleanInsert.replace(/\$\{\d+(?::(.*?))?\}/g, '$1');
                const targetIdx = cleanInsert.indexOf(phMatch[0]);
                cleanInsert = beforeClean;
                targetOffsetFromEnd = targetIdx + phText.length - cleanInsert.length;
            }

            this.buffer.delete(startIter, cursorIter);
            const insertIter = this.buffer.get_iter_at_offset(this._prefixStartOffset);
            this.buffer.insert(insertIter, cleanInsert, -1);

            // Move cursor to target placeholder position
            const newPos = this.buffer.cursor_position + targetOffsetFromEnd;
            const finalIter = this.buffer.get_iter_at_offset(Math.max(0, newPos));
            this.buffer.place_cursor(finalIter);

            this.view.grab_focus();
        } finally {
            this._isCompleting = false;
        }
    }
}
