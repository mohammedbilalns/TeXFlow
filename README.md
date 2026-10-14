# TeXFlow — Modern LaTeX & PDFTeX Studio

A high-performance GTK4 and GJS (GNOME JavaScript) desktop application for writing and compiling LaTeX and Plain TeX documents, featuring real-time syntax highlighting, intelligent autosuggestions, debounced non-blocking live preview, Poppler PDF rendering, multi-engine support (`pdflatex`, `pdftex`, `xelatex`, `lualatex`), and clickable compiler diagnostics.

![TeXFlow Screenshot](data/io.github.latexapp.texflow.svg)

---

## Key Features

- **LaTeX & Plain TeX Code Editing**:
  - Built with `GtkSourceView-5` featuring full LaTeX syntax highlighting.
  - Bracket matching, line numbers, current line highlighting, smart indentation.
  - Automatic light/dark mode synchronization with GNOME's `Adwaita` and `Adwaita-dark` style schemes.
  - In-editor search and replace bar (`Ctrl+F`) with match navigation.
  - Live cursor line/column counter and real-time word and character statistics.

- **Intelligent LaTeX Autosuggestions & Autocompletion**:
  - Interactive popup anchored to the cursor position with categorized badges (`CMD`, `ENV`, `MATH`, `PKG`, `TEX`).
  - Over 130+ built-in LaTeX commands, environments, math symbols, Greek letters, and Plain TeX primitives.
  - Snippet expansion with automatic placeholder navigation (places cursor directly inside braces `{}` or environment blocks).
  - Arrow key navigation (`Up` / `Down`), completion on `Enter` / `Tab`, and force trigger via `Ctrl+Space`.

- **High-Performance Live PDF Preview**:
  - Rendered with `Poppler` and Cairo into GTK4 drawing surfaces.
  - Multi-page continuous vertical scroll layout with drop-shadow paper sheets.
  - **Smooth update support**: Vertical scroll position is strictly preserved across re-compilations so the preview updates in-place without jumping back to page 1.
  - Zoom controls: Zoom In (`Ctrl++`), Zoom Out (`Ctrl+-`), Fit to Width (`Ctrl+0`), and 100% reset.
  - Direct PDF export dialog (`Ctrl+E` or File -> Export PDF).

- **Multi-Engine Compilation & PDFTeX Support**:
  - One-click engine selector dropdown in headerbar:
    - **`pdflatex`**: Standard LaTeX documents (default).
    - **`pdftex`**: Donald Knuth's Plain TeX format with direct PDF compilation and sub-50ms passes.
    - **`xelatex`**: XeTeX with native Unicode and OpenType font support.
    - **`lualatex`**: Modern LuaTeX scriptable engine.
  - Smart engine auto-detection: detects Plain TeX documents (e.g. `\bye`) and automatically activates `pdftex`.
  - Non-blocking asynchronous process pipeline using `Gio.Subprocess` — the UI never stutters or freezes while compiling.
  - Live compilation toggle switch ("Live" ON/OFF) with a 600ms debounce timer.

- **Compiler Diagnostics & Log Panel**:
  - Collapsible bottom drawer (`Ctrl+L` or terminal button).
  - Parsed issues list extracting error line numbers, severity, and messages (`-file-line-error`).
  - **Clickable error navigation**: Clicking any error in the list instantly scrolls the editor to that exact line and sets the cursor.
  - Searchable raw compiler output console for detailed debugging.

- **Document Starter Templates**:
  - **Standard Article**: Academic article with title, abstract, sections, equations, and tables.
  - **Mathematics & Science**: `amsmath`, `amsthm`, theorem/proof environments, and matrices.
  - **Plain TeX (`pdftex`)**: Native Plain TeX demonstration using Knuth's primitives.
  - **Beamer Presentation**: Multi-frame presentation slide deck with columns and blocks.
  - **Technical / Lab Report**: Multi-chapter formal report layout.

---

## Project Structure

```
latex-app/
├── bin/
│   └── texflow                     # Executable launcher script
├── texflow                         # Root convenience executable
├── data/
│   ├── io.github.latexapp.texflow.desktop # Desktop launcher
│   └── io.github.latexapp.texflow.svg     # Application icon
├── src/
│   ├── main.js                     # Application class & CLI handler
│   ├── window.js                   # Main Adw.ApplicationWindow & layout
│   ├── editor.js                   # GtkSourceView-5 editor & search bar
│   ├── autocompletion.js           # LaTeX suggestions popover engine
│   ├── compiler.js                 # Async multi-engine compilation pipeline
│   ├── preview.js                  # High-DPI Poppler + Cairo preview
│   ├── log-panel.js                # Clickable error diagnostics drawer
│   ├── quick-toolbar.js            # Visual LaTeX formatting buttons
│   ├── templates.js                # Starter templates
│   ├── style.css                   # Custom CSS styling
│   └── data/
│       └── latex-symbols.js        # LaTeX & Plain TeX symbols database
├── package.json                    # Package metadata & scripts
├── tests/                          # Automated verification test suite
│   ├── run-all.js                  # Master test suite runner
│   ├── test-compiler.js            # pdflatex & pdftex compilation tests
│   ├── test-editor.js              # Editor, autocompletion & resize tests
│   ├── test-rendering.js           # Poppler & Cairo preview rendering tests
│   ├── test-symbols.js             # LaTeX symbol database tests
│   ├── test-synctex.js             # Bidirectional SyncTeX navigation tests
│   └── test-templates.js           # Starter templates validation
└── README.md                       # Documentation
```

---

## Requirements

Ensure the following system packages are installed on your Linux distribution:

- `gjs` (GNOME JavaScript 1.76+)
- `gtk4` & `libadwaita-1`
- `gtksourceview-5`
- `poppler-glib`
- `texlive-bin` or `texlive-core` (providing `pdflatex` and `pdftex`)

On Arch Linux / Manjaro:
```bash
sudo pacman -S gjs gtk4 libadwaita gtksourceview5 poppler-glib texlive-basic texlive-latex
```

On Fedora:
```bash
sudo dnf install gjs gtk4 libadwaita gtksourceview5 poppler-glib texlive-scheme-basic texlive-latex
```

On Ubuntu / Debian:
```bash
sudo apt install gjs libgtk-4-dev libadwaita-1-dev libgtksourceview-5-dev libpoppler-glib-dev texlive-latex-base
```

---

## Running the Application

### 1. Launch Directly
From the project folder:
```bash
./texflow
```
or
```bash
./bin/texflow
```

### 2. Open an Existing File
```bash
./texflow /path/to/document.tex
```

### 3. Run Automated Tests
```bash
npm test
```
or
```bash
gjs -m tests/run-all.js
```

---

## Keyboard Shortcuts

| Shortcut | Description |
|---|---|
| `Ctrl+R` / `F5` / `Ctrl+Enter` | Compile document immediately |
| `Ctrl+S` | Save document |
| `Ctrl+Shift+S` | Save As... |
| `Ctrl+O` | Open file |
| `Ctrl+N` | New file |
| `Ctrl+F` | Find in document |
| `Ctrl+L` | Toggle diagnostics log drawer |
| `Ctrl+E` | Export compiled PDF |
| `Ctrl+B` | Wrap selection in `\textbf{}` |
| `Ctrl+I` | Wrap selection in `\textit{}` |
| `Ctrl+M` | Wrap selection in `$ $` (inline math) |
| `Ctrl+Shift+M` | Insert equation block `\begin{equation}` |
| `Ctrl+Space` | Force trigger autosuggestions popover |
| `Ctrl +` / `Ctrl =` | Zoom in PDF preview |
| `Ctrl -` | Zoom out PDF preview |
| `Ctrl+0` | Fit preview to width |

---

## License

MIT License. Designed and developed with GJS and GTK4.
