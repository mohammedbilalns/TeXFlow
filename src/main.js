/**
 * TeXFlow - Modern GTK4 & GJS LaTeX and PDFTeX Studio.
 * Application lifecycle and entrypoint.
 */

import GObject from 'gi://GObject';
import Adw from 'gi://Adw?version=1';
import Gtk from 'gi://Gtk?version=4.0';
import Gdk from 'gi://Gdk?version=4.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { MainWindow } from './window.js';

export const Application = GObject.registerClass({
    GTypeName: 'TexflowApplication'
}, class Application extends Adw.Application {
    _init() {
        super._init({
            application_id: 'io.github.latexapp.texflow',
            flags: Gio.ApplicationFlags.HANDLES_OPEN | Gio.ApplicationFlags.HANDLES_COMMAND_LINE
        });

        this.window = null;
    }

    vfunc_startup() {
        super.vfunc_startup();
        this._loadStyles();
    }

    vfunc_activate() {
        if (!this.window) {
            this.window = new MainWindow({ application: this });
        }
        this.window.present();
    }

    vfunc_open(files) {
        this.vfunc_activate();
        if (files && files.length > 0) {
            const file = files[0];
            try {
                const [success, contents] = file.load_contents(null);
                if (success) {
                    const text = new TextDecoder().decode(contents);
                    this.window.editor.setText(text);
                    this.window.currentFile = file;
                    this.window.setModified(false);

                    const parentDir = file.get_parent();
                    if (parentDir) {
                        this.window.compiler.setDocDir(parentDir.get_path());
                    }

                    if (text.includes('\\bye') && !text.includes('\\documentclass')) {
                        this.window.engineDropdown.set_selected(1);
                        this.window.compiler.setEngine('pdftex');
                    }

                    this.window.triggerCompile(true);
                }
            } catch (e) {
                console.error('Error opening file from args:', e);
            }
        }
    }

    vfunc_command_line(commandLine) {
        const args = commandLine.get_arguments();

        if (args.includes('--help') || args.includes('-h')) {
            print('Usage: texflow [OPTIONS] [FILE.tex]');
            print('');
            print('Modern GTK4 & GJS LaTeX and PDFTeX Studio with Autosuggestions and Live Preview.');
            print('');
            print('Options:');
            print('  -h, --help       Show this help message');
            print('  -v, --version    Show application version');
            print('');
            return 0;
        }

        if (args.includes('--version') || args.includes('-v')) {
            print('TeXFlow 1.0.0');
            return 0;
        }

        this.vfunc_activate();

        if (args.length > 1) {
            const filePath = args[1];
            if (!filePath.startsWith('-')) {
                const file = Gio.File.new_for_commandline_arg(filePath);
                this.vfunc_open([file]);
            }
        }

        return 0;
    }

    _loadStyles() {
        try {
            const provider = new Gtk.CssProvider();
            const currentFile = Gio.File.new_for_uri(import.meta.url);
            const cssFile = currentFile.get_parent().get_child('style.css');

            if (cssFile.query_exists(null)) {
                provider.load_from_path(cssFile.get_path());
                const display = Gdk.Display.get_default();
                if (display) {
                    Gtk.StyleContext.add_provider_for_display(
                        display,
                        provider,
                        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
                    );
                }
            }
        } catch (e) {
            console.warn('Failed to load style.css:', e.message);
        }
    }
});

export function main(args = []) {
    const app = new Application();
    return app.run(args);
}
