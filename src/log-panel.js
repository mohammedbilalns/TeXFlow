/**
 * Compiler Diagnostics and Raw Output Log Panel.
 * Displays parsed clickable LaTeX/TeX errors and warnings with direct navigation
 * to the offending lines, plus complete raw compiler log output.
 */

import Gtk from 'gi://Gtk?version=4.0';
import Pango from 'gi://Pango';

export class LogPanel {
    constructor(onNavigateLine) {
        this.onNavigateLine = onNavigateLine;

        this.container = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            vexpand: false,
            css_classes: ['log-panel']
        });

        this._setupHeader();
        this._setupStack();
    }

    _setupHeader() {
        const header = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 8,
            margin_start: 10,
            margin_end: 10,
            margin_top: 6,
            margin_bottom: 6
        });

        this.titleLabel = new Gtk.Label({
            label: '<b>Diagnostics</b>',
            use_markup: true,
            xalign: 0
        });

        // Switcher between Issues list and Raw Log
        this.stackSwitcher = new Gtk.StackSwitcher();

        this.errorBadge = new Gtk.Label({
            label: '0 errors',
            css_classes: ['caption', 'dim-label']
        });

        header.append(this.titleLabel);
        header.append(this.errorBadge);
        header.append(new Gtk.Box({ hexpand: true })); // spacer
        header.append(this.stackSwitcher);

        this.container.append(header);
    }

    _setupStack() {
        this.stack = new Gtk.Stack({
            transition_type: Gtk.StackTransitionType.CROSSFADE,
            vexpand: false,
            height_request: 180
        });
        this.stackSwitcher.set_stack(this.stack);

        // --- Tab 1: Issues List ---
        const issuesScrolled = new Gtk.ScrolledWindow({
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            vscrollbar_policy: Gtk.PolicyType.AUTOMATIC
        });

        this.issuesList = new Gtk.ListBox({
            selection_mode: Gtk.SelectionMode.SINGLE,
            css_classes: ['rich-list']
        });
        this.issuesList.connect('row-activated', (list, row) => {
            if (row._lineNum && this.onNavigateLine) {
                this.onNavigateLine(row._lineNum);
            }
        });

        this.emptyIssuesLabel = new Gtk.Label({
            label: 'No compilation issues detected.',
            margin_top: 30,
            margin_bottom: 30,
            css_classes: ['dim-label']
        });

        issuesScrolled.set_child(this.issuesList);
        this.stack.add_titled(issuesScrolled, 'issues', 'Issues');

        // --- Tab 2: Raw Log ---
        const logScrolled = new Gtk.ScrolledWindow({
            hscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
            vscrollbar_policy: Gtk.PolicyType.AUTOMATIC
        });

        this.rawLogBuffer = new Gtk.TextBuffer();
        this.rawLogView = new Gtk.TextView({
            buffer: this.rawLogBuffer,
            editable: false,
            monospace: true,
            wrap_mode: Gtk.WrapMode.NONE,
            top_margin: 6,
            bottom_margin: 6,
            left_margin: 10,
            right_margin: 10
        });

        logScrolled.set_child(this.rawLogView);
        this.stack.add_titled(logScrolled, 'raw', 'Raw Log');

        this.container.append(this.stack);
    }

    updateDiagnostics(result) {
        const { errors = [], warnings = [], rawLog = '' } = result;

        // Clear previous rows
        let child = this.issuesList.get_first_child();
        while (child) {
            const next = child.get_next_sibling();
            this.issuesList.remove(child);
            child = next;
        }

        const totalIssues = errors.length + warnings.length;
        if (errors.length > 0) {
            this.errorBadge.set_label(`${errors.length} ${errors.length === 1 ? 'error' : 'errors'}`);
            this.errorBadge.set_css_classes(['caption', 'badge-error']);
        } else if (warnings.length > 0) {
            this.errorBadge.set_label(`${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}`);
            this.errorBadge.set_css_classes(['caption', 'badge-warning']);
        } else {
            this.errorBadge.set_label('✓ Clean');
            this.errorBadge.set_css_classes(['caption', 'badge-clean']);
        }

        if (totalIssues === 0) {
            const row = new Gtk.ListBoxRow({ selectable: false, activatable: false });
            row.set_child(new Gtk.Label({
                label: '✓ No compilation issues detected.',
                margin_top: 24,
                margin_bottom: 24,
                css_classes: ['dim-label']
            }));
            this.issuesList.append(row);
        } else {
            // Add Errors
            for (const err of errors) {
                this._addIssueRow(err.message, err.line, 'error');
            }
            // Add Warnings
            for (const warn of warnings) {
                this._addIssueRow(warn.message, warn.line, 'warning');
            }
        }

        // Update raw log
        this.rawLogBuffer.set_text(rawLog, -1);
    }

    _addIssueRow(message, lineNum, severity) {
        const row = new Gtk.ListBoxRow({
            activatable: !!lineNum,
            selectable: true
        });
        row._lineNum = lineNum;

        const box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 8,
            margin_start: 8,
            margin_end: 8,
            margin_top: 6,
            margin_bottom: 6
        });

        // Icon
        const iconName = severity === 'error' ? 'dialog-error-symbolic' : 'dialog-warning-symbolic';
        const icon = new Gtk.Image({
            icon_name: iconName,
            valign: Gtk.Align.CENTER,
            css_classes: [severity === 'error' ? 'error-icon' : 'warning-icon']
        });
        box.append(icon);

        // Line badge
        if (lineNum) {
            const lineBadge = new Gtk.Label({
                label: `Line ${lineNum}`,
                css_classes: ['line-badge']
            });
            box.append(lineBadge);
        }

        // Message
        const msgLabel = new Gtk.Label({
            label: message,
            xalign: 0,
            hexpand: true,
            ellipsize: Pango.EllipsizeMode.END,
            css_classes: [severity === 'error' ? 'error-text' : 'warning-text']
        });
        box.append(msgLabel);

        // Jump arrow if clickable
        if (lineNum) {
            const jumpIcon = new Gtk.Image({
                icon_name: 'go-next-symbolic',
                valign: Gtk.Align.CENTER,
                css_classes: ['dim-label']
            });
            box.append(jumpIcon);
        }

        row.set_child(box);
        this.issuesList.append(row);
    }
}
