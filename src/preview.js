/**
 * High-Performance Poppler + Cairo Live PDF Preview Widget.
 * Supports continuous page scrolling, High-DPI Cairo rendering,
 * zoom scaling, smooth scroll preservation across re-compilations,
 * and direct PDF export.
 */

import Gtk from 'gi://Gtk?version=4.0';
import Gdk from 'gi://Gdk?version=4.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Poppler from 'gi://Poppler';
import Adw from 'gi://Adw?version=1';
import Graphene from 'gi://Graphene';

export class PdfPreview {
    constructor() {
        this.doc = null;
        this.pdfPath = null;
        this.zoomFactor = 1.0;
        this._isFitWidth = true;
        this.pageCards = [];
        this._activeSyncPoint = null;
        this.onMoveToCode = null;

        this.container = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            hexpand: true,
            vexpand: true,
            css_classes: ['preview-container']
        });

        this._setupToolbar();
        this._setupScrolledWindow();
        this._setupContextMenu();
        this._setupEmptyState();
    }

    _setupToolbar() {
        this.toolbar = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            margin_start: 8,
            margin_end: 8,
            margin_top: 4,
            margin_bottom: 4,
            css_classes: ['preview-toolbar']
        });

        // Zoom Out
        const zoomOutBtn = new Gtk.Button({
            icon_name: 'zoom-out-symbolic',
            tooltip_text: 'Zoom Out (Ctrl+-)',
            css_classes: ['flat', 'circular']
        });
        zoomOutBtn.connect('clicked', () => this.zoomOut());

        // Zoom Level Label
        this.zoomLabel = new Gtk.Label({
            label: '100%',
            width_chars: 5,
            css_classes: ['caption', 'dim-label']
        });

        // Zoom In
        const zoomInBtn = new Gtk.Button({
            icon_name: 'zoom-in-symbolic',
            tooltip_text: 'Zoom In (Ctrl++)',
            css_classes: ['flat', 'circular']
        });
        zoomInBtn.connect('clicked', () => this.zoomIn());

        // Fit Width
        const fitWidthBtn = new Gtk.Button({
            icon_name: 'zoom-fit-best-symbolic',
            tooltip_text: 'Fit Width (Ctrl+0)',
            css_classes: ['flat']
        });
        fitWidthBtn.connect('clicked', () => this.fitWidth());

        // 100% Reset
        const originalBtn = new Gtk.Button({
            icon_name: 'zoom-original-symbolic',
            tooltip_text: '100% Size',
            css_classes: ['flat']
        });
        originalBtn.connect('clicked', () => this.setZoom(1.0));

        // Page Indicator
        this.pageIndicator = new Gtk.Label({
            label: 'No Document',
            margin_start: 8,
            hexpand: true,
            xalign: 0,
            css_classes: ['caption', 'dim-label']
        });

        // Status pill (e.g. "Compiled in 0.24s")
        this.statusPill = new Gtk.Label({
            label: '',
            visible: false,
            css_classes: ['status-pill']
        });

        this.toolbar.append(zoomOutBtn);
        this.toolbar.append(this.zoomLabel);
        this.toolbar.append(zoomInBtn);
        this.toolbar.append(fitWidthBtn);
        this.toolbar.append(originalBtn);
        this.toolbar.append(this.pageIndicator);
        this.toolbar.append(this.statusPill);

        this.container.append(this.toolbar);
    }

    _setupScrolledWindow() {
        this.scrolledWindow = new Gtk.ScrolledWindow({
            hexpand: true,
            vexpand: true,
            hscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
            vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
            kinetic_scrolling: true
        });

        this.pagesBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 20,
            halign: Gtk.Align.CENTER,
            margin_top: 20,
            margin_bottom: 24,
            margin_start: 12,
            margin_end: 12
        });

        this.scrolledWindow.set_child(this.pagesBox);
        this.container.append(this.scrolledWindow);

        // Auto-fit width when preview viewport is resized
        const hadj = this.scrolledWindow.get_hadjustment();
        if (hadj) {
            let resizeTimer = null;
            hadj.connect('notify::page-size', () => {
                if (!this._isFitWidth || !this.doc) return;
                if (resizeTimer) GLib.source_remove(resizeTimer);
                resizeTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 80, () => {
                    this.fitWidth();
                    resizeTimer = null;
                    return GLib.SOURCE_REMOVE;
                });
            });
        }
    }

    _setupEmptyState() {
        this.emptyPage = new Adw.StatusPage({
            icon_name: 'x-office-document-symbolic',
            title: 'No Document Preview',
            description: 'Compile your LaTeX code or activate Live Preview to render output.',
            vexpand: true,
            hexpand: true
        });
        this.pagesBox.append(this.emptyPage);
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

        // Header showing clicked coordinates and page
        const headerBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            margin_bottom: 4
        });
        const headerIcon = new Gtk.Image({
            icon_name: 'x-office-document-symbolic',
            pixel_size: 16,
            valign: Gtk.Align.CENTER,
            css_classes: ['dim-label']
        });
        this.popoverTitleLabel = new Gtk.Label({
            label: 'PDF Location',
            css_classes: ['caption', 'dim-label'],
            xalign: 0,
            hexpand: true
        });
        headerBox.append(headerIcon);
        headerBox.append(this.popoverTitleLabel);
        menuBox.append(headerBox);

        const sep = new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL });
        menuBox.append(sep);

        // "Move to Code" Action Button
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
            icon_name: 'text-editor-symbolic',
            pixel_size: 16,
            valign: Gtk.Align.CENTER
        }));
        const jumpLabelBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 2 });
        const jumpMainLabel = new Gtk.Label({
            label: '<b>Move to Code</b>',
            use_markup: true,
            xalign: 0
        });
        const jumpSubLabel = new Gtk.Label({
            label: 'Jump to corresponding line in LaTeX editor',
            css_classes: ['caption', 'dim-label'],
            xalign: 0
        });
        jumpLabelBox.append(jumpMainLabel);
        jumpLabelBox.append(jumpSubLabel);
        jumpBtnBox.append(jumpLabelBox);
        jumpBtn.set_child(jumpBtnBox);

        jumpBtn.connect('clicked', () => {
            this.contextPopover.popdown();
            if (this._activeSyncPoint && this.onMoveToCode) {
                this.onMoveToCode(
                    this._activeSyncPoint.page,
                    this._activeSyncPoint.x,
                    this._activeSyncPoint.y
                );
            }
        });
        menuBox.append(jumpBtn);

        this.contextPopover.set_child(menuBox);
    }

    _showContextMenu(da, x, y, pageNum, ptX, ptY) {
        this.popoverTitleLabel.set_label(`Page ${pageNum} • ${Math.round(ptX)}pt, ${Math.round(ptY)}pt`);
        let px = x, py = y;
        if (this.container) {
            const [ok, pt] = da.compute_point(this.container, new Graphene.Point({ x, y }));
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

    /**
     * Load new compiled PDF and render pages with smooth scroll preservation
     */
    updatePdf(pdfPath, statusText = '') {
        if (!pdfPath || !GLib.file_test(pdfPath, GLib.FileTest.EXISTS)) {
            return false;
        }

        try {
            const gfile = Gio.File.new_for_path(pdfPath);
            const newDoc = Poppler.Document.new_from_gfile(gfile, null, null);
            if (!newDoc) return false;

            const nPages = newDoc.get_n_pages();
            if (nPages === 0) return false;

            // Preserve current vertical scroll position
            const vadj = this.scrolledWindow.get_vadjustment();
            const prevScroll = vadj.get_value();

            this.doc = newDoc;
            this.pdfPath = pdfPath;

            // Update status pill & page indicator
            if (statusText) {
                this.statusPill.set_label(statusText);
                this.statusPill.set_visible(true);
            }
            this.pageIndicator.set_label(`${nPages} ${nPages === 1 ? 'Page' : 'Pages'}`);

            // Remove empty placeholder if still present
            if (this.emptyPage.get_parent() === this.pagesBox) {
                this.pagesBox.remove(this.emptyPage);
            }

            // If page count matches existing cards, update references without DOM thrashing
            if (this.pageCards.length === nPages) {
                for (let i = 0; i < nPages; i++) {
                    const card = this.pageCards[i];
                    card.page = this.doc.get_page(i);
                    this._updatePageSize(card);
                    card.drawingArea.queue_draw();
                }
            } else {
                // Rebuild page cards
                this._rebuildPageCards(nPages);
            }

            // Restore scroll position smoothly
            GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                vadj.set_value(Math.min(prevScroll, vadj.get_upper() - vadj.get_page_size()));
                if (this._isFitWidth) {
                    this.fitWidth();
                }
                return GLib.SOURCE_REMOVE;
            });

            return true;
        } catch (e) {
            console.error('Failed to load PDF preview:', e);
            return false;
        }
    }

    _rebuildPageCards(nPages) {
        // Clear existing
        let child = this.pagesBox.get_first_child();
        while (child) {
            const next = child.get_next_sibling();
            this.pagesBox.remove(child);
            child = next;
        }
        this.pageCards = [];

        for (let i = 0; i < nPages; i++) {
            const page = this.doc.get_page(i);
            const cardBox = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                halign: Gtk.Align.CENTER,
                css_classes: ['pdf-page-card']
            });

            const da = new Gtk.DrawingArea();
            const cardData = {
                index: i,
                page: page,
                drawingArea: da,
                container: cardBox
            };

            this._updatePageSize(cardData);

            da.set_draw_func((area, cr, width, height) => {
                // White paper background
                cr.setSourceRGB(1, 1, 1);
                cr.paint();

                // Scale Cairo to match current zoom level
                cr.scale(this.zoomFactor, this.zoomFactor);

                // Render Poppler page directly to Cairo context
                if (cardData.page) {
                    cardData.page.render(cr);
                }

                // Render forward sync highlight if present
                if (cardData.highlight) {
                    cr.save();
                    const hx = cardData.highlight.x;
                    const hy = cardData.highlight.y;
                    const hw = Math.max(50, cardData.highlight.width);
                    const hh = Math.max(14, cardData.highlight.height);

                    // Soft semi-transparent highlight rectangle
                    cr.setSourceRGBA(0.21, 0.52, 0.89, 0.28);
                    cr.rectangle(hx - 2, hy - 2, hw + 4, hh + 4);
                    cr.fill();

                    // Subtle border outline
                    cr.setSourceRGBA(0.14, 0.42, 0.82, 0.85);
                    cr.setLineWidth(1.5 / this.zoomFactor);
                    cr.rectangle(hx - 2, hy - 2, hw + 4, hh + 4);
                    cr.stroke();
                    cr.restore();
                }

                // Render click point indicator if present
                if (cardData.clickPoint) {
                    cr.save();
                    const cx = cardData.clickPoint.x;
                    const cy = cardData.clickPoint.y;

                    cr.setSourceRGBA(0.21, 0.52, 0.89, 0.25);
                    cr.arc(cx, cy, 9, 0, 2 * Math.PI);
                    cr.fill();

                    cr.setSourceRGBA(0.14, 0.42, 0.82, 0.8);
                    cr.setLineWidth(1.5 / this.zoomFactor);
                    cr.arc(cx, cy, 4, 0, 2 * Math.PI);
                    cr.stroke();
                    cr.restore();
                }
            });

            // Gesture click controller for SyncTeX navigation
            const clickGesture = new Gtk.GestureClick({ button: 0 });
            clickGesture.connect('pressed', (gesture, n, x, y) => {
                const button = gesture.get_current_button();
                const state = gesture.get_current_event_state();
                const isCtrl = (state & Gdk.ModifierType.CONTROL_MASK) !== 0;

                const ptX = x / this.zoomFactor;
                const ptY = y / this.zoomFactor;
                const pageNum = i + 1;

                this._activeSyncPoint = {
                    page: pageNum,
                    x: ptX,
                    y: ptY,
                    card: cardData
                };

                // Show subtle click indicator dot on the PDF page
                cardData.clickPoint = { x: ptX, y: ptY };
                da.queue_draw();

                if (cardData._clickDotTimeout) {
                    GLib.source_remove(cardData._clickDotTimeout);
                }
                cardData._clickDotTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
                    cardData.clickPoint = null;
                    cardData._clickDotTimeout = null;
                    da.queue_draw();
                    return GLib.SOURCE_REMOVE;
                });

                if (button === 3) {
                    // Right-click: open context menu pointing to the click location
                    this._showContextMenu(da, x, y, pageNum, ptX, ptY);
                    gesture.set_state(Gtk.EventSequenceState.CLAIMED);
                } else if (button === 1 && isCtrl) {
                    // Ctrl+Left-Click: instant backward sync to code
                    if (this.onMoveToCode) {
                        this.onMoveToCode(pageNum, ptX, ptY);
                    }
                }
            });
            da.add_controller(clickGesture);

            cardBox.append(da);

            // Page footer label
            const pageFooter = new Gtk.Label({
                label: `Page ${i + 1} of ${nPages}`,
                margin_top: 6,
                margin_bottom: 4,
                css_classes: ['caption', 'dim-label']
            });
            cardBox.append(pageFooter);

            this.pagesBox.append(cardBox);
            this.pageCards.push(cardData);
        }
    }

    _updatePageSize(card) {
        if (!card.page) return;
        const [pw, ph] = card.page.get_size();
        card.drawingArea.set_content_width(Math.round(pw * this.zoomFactor));
        card.drawingArea.set_content_height(Math.round(ph * this.zoomFactor));
    }

    setZoom(factor, keepFitMode = false) {
        if (!keepFitMode) {
            this._isFitWidth = false;
        }
        const clamped = Math.max(0.25, Math.min(3.0, factor));
        this.zoomFactor = clamped;
        this.zoomLabel.set_label(`${Math.round(clamped * 100)}%`);

        for (const card of this.pageCards) {
            this._updatePageSize(card);
            card.drawingArea.queue_draw();
        }
    }

    zoomIn() {
        this.setZoom(this.zoomFactor * 1.2);
    }

    zoomOut() {
        this.setZoom(this.zoomFactor / 1.2);
    }

    fitWidth() {
        if (this.pageCards.length === 0 || !this.doc) return;
        const firstPage = this.doc.get_page(0);
        const [pw] = firstPage.get_size();

        // Calculate available width inside scrolled window
        const allocWidth = this.scrolledWindow.get_width();
        const available = Math.max(160, allocWidth - 48);
        const factor = available / pw;
        this.setZoom(factor, true);
        this._isFitWidth = true;
    }

    exportPdf(parentWindow) {
        if (!this.pdfPath || !GLib.file_test(this.pdfPath, GLib.FileTest.EXISTS)) {
            const toast = new Adw.Toast({ title: 'No compiled PDF available to export.' });
            parentWindow.add_toast(toast);
            return;
        }

        const fileDialog = new Gtk.FileDialog({
            title: 'Export Compiled PDF',
            initial_name: 'document.pdf'
        });

        fileDialog.save(parentWindow, null, (dialog, res) => {
            try {
                const targetFile = dialog.save_finish(res);
                if (targetFile) {
                    const src = Gio.File.new_for_path(this.pdfPath);
                    src.copy(targetFile, Gio.FileCopyFlags.OVERWRITE, null, null);
                    if (parentWindow.showToast) {
                        parentWindow.showToast(`Exported to ${targetFile.get_basename()}`);
                    }
                }
            } catch (err) {
                if (!err.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                    if (parentWindow.showToast) {
                        parentWindow.showToast(`Export failed: ${err.message}`);
                    }
                }
            }
        });
    }

    /**
     * Jump and highlight a specific location on a PDF page (Forward Sync)
     */
    jumpToPosition(pageNumber, x, y, width, height) {
        if (!this.pageCards || this.pageCards.length === 0) return;
        const cardIndex = Math.max(0, Math.min(pageNumber - 1, this.pageCards.length - 1));
        const card = this.pageCards[cardIndex];
        if (!card) return;

        // Set visual highlight box
        card.highlight = {
            x: x || 72,
            y: y || 72,
            width: width || 400,
            height: height || 20
        };
        card.drawingArea.queue_draw();

        // Auto-remove highlight after 3.5s
        if (card._highlightTimeout) {
            GLib.source_remove(card._highlightTimeout);
        }
        card._highlightTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3500, () => {
            card.highlight = null;
            card._highlightTimeout = null;
            card.drawingArea.queue_draw();
            return GLib.SOURCE_REMOVE;
        });

        // Smoothly scroll to the target position
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            try {
                let targetY = 0;
                const [ok, targetPt] = card.drawingArea.compute_point(
                    this.pagesBox,
                    new Graphene.Point({
                        x: 0,
                        y: (y || 0) * this.zoomFactor
                    })
                );
                if (ok && targetPt && targetPt.y > 0) {
                    targetY = targetPt.y;
                } else {
                    // Geometric offset fallback
                    targetY = 20; // margin-top
                    for (let i = 0; i < cardIndex && i < this.pageCards.length; i++) {
                        const [pw, ph] = this.pageCards[i].page.get_size();
                        targetY += Math.round(ph * this.zoomFactor) + 4 + 28 + 20;
                    }
                    targetY += (y || 0) * this.zoomFactor;
                }

                const vadj = this.scrolledWindow.get_vadjustment();
                if (vadj) {
                    const viewHeight = this.scrolledWindow.get_height() || 400;
                    const targetScroll = Math.max(0, targetY - (viewHeight / 3));
                    const maxScroll = Math.max(0, vadj.get_upper() - vadj.get_page_size());
                    vadj.set_value(Math.min(targetScroll, maxScroll));
                }
            } catch (e) {
                console.error('Failed to scroll to sync position:', e);
            }
            return GLib.SOURCE_REMOVE;
        });
    }
}
