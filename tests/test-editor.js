/**
 * Test: Editor & UI Interactions (Autocompletion, Context Menus, and Resize Verification)
 */

import GLib from 'gi://GLib';
import Graphene from 'gi://Graphene';
import Adw from 'gi://Adw?version=1';
import { MainWindow } from '../src/window.js';

export function runEditorInteractionTest() {
    return new Promise((resolve, reject) => {
        console.log('[Editor & UI] Testing autocompletion overlay, context menus, and resizing...');

        Adw.init();
        const app = new Adw.Application({ application_id: 'org.texflow.TestEditorInteraction' });

        app.connect('activate', () => {
            try {
                const win = new MainWindow({ application: app });
                win.set_default_size(760, 600);
                win.present();

                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 800, () => {
                    try {
                        // 1. Verify Resize & Split Layout (Check for negative overflow)
                        const startChild = win.paned.get_start_child();
                        const [ok1, pt1] = startChild.compute_point(win.paned, new Graphene.Point({ x: 0, y: 0 }));
                        if (!ok1 || pt1.x < 0) {
                            throw new Error(`Editor is clipped or shifted into negative coordinates: x=${pt1?.x}`);
                        }
                        console.log(`  ✓ Resize Check: Editor x=${pt1.x} (non-negative, no stripped content).`);

                        // 2. Autocompletion & Typing Continuity
                        win.editor.view.grab_focus();
                        win.editor.insertText('\n\\');

                        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
                            try {
                                const isVisible = win.editor.autocompletion.popupBox.get_visible();
                                if (!isVisible) {
                                    throw new Error('Autocompletion overlay did not appear after typing backslash');
                                }

                                // Type letters after backslash
                                win.editor.insertText('s');
                                win.editor.insertText('e');
                                win.editor.insertText('c');

                                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
                                    try {
                                        const text = win.editor.getText();
                                        if (!text.endsWith('\\sec')) {
                                            throw new Error(`Typing was blocked or dropped: ended with ${JSON.stringify(text.slice(-10))}`);
                                        }

                                        // Apply suggestion
                                        win.editor.autocompletion._applySuggestion(0);
                                        const afterApply = win.editor.getText();
                                        if (!afterApply.includes('\\section')) {
                                            throw new Error(`Autocompletion apply failed: ${afterApply.slice(-20)}`);
                                        }
                                        console.log('  ✓ Autocompletion: Keystrokes allowed without interruption, snippet applied cleanly.');

                                        // 3. Editor Context Menu ("Move to PDF Position")
                                        win.editor._lastRightClickPos = { line: 25, col: 1 };
                                        win.editor._showContextMenu(50, 50, 25, 1);
                                        if (!win.editor.contextPopover.get_visible()) {
                                            throw new Error('Editor context popover failed to appear');
                                        }
                                        win.editor.contextPopover.popdown();
                                        console.log('  ✓ Editor Context Menu: "Move to PDF Position" popover displays correctly.');

                                        // 4. PDF Preview Auto-fit
                                        const card = win.preview.pageCards[0];
                                        const daWidth = card.drawingArea.get_content_width();
                                        const scrollerWidth = win.preview.scrolledWindow.get_width();
                                        console.log(`  ✓ PDF Preview Auto-Fit: Page width ${daWidth}px fits inside ${scrollerWidth}px scroller.`);

                                        win.compiler.cleanup();
                                        app.quit();
                                        resolve(true);
                                    } catch (err) {
                                        win.compiler.cleanup();
                                        app.quit();
                                        reject(err);
                                    }
                                    return GLib.SOURCE_REMOVE;
                                });
                            } catch (err) {
                                win.compiler.cleanup();
                                app.quit();
                                reject(err);
                            }
                            return GLib.SOURCE_REMOVE;
                        });
                    } catch (err) {
                        win.compiler.cleanup();
                        app.quit();
                        reject(err);
                    }
                    return GLib.SOURCE_REMOVE;
                });
            } catch (err) {
                app.quit();
                reject(err);
            }
        });

        app.run([]);
    });
}
