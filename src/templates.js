/**
 * Starter templates for LaTeX and Plain TeX (pdftex) documents.
 */

export const TEMPLATES = {
    article: {
        id: 'article',
        name: 'Standard Article',
        engine: 'pdflatex',
        description: 'Standard academic / general LaTeX article with abstract, sections, equations, and references',
        content: `\\documentclass[11pt,a4paper]{article}

% --- Packages ---
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage[colorlinks=true,linkcolor=blue,citecolor=blue,urlcolor=blue]{hyperref}
\\usepackage{geometry}
\\geometry{margin=1in}

% --- Document Information ---
\\title{\\textbf{Interactive \\LaTeX\\ Document with Live Preview}}
\\author{Author Name \\\\ \\texttt{author@example.com}}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
This document demonstrates live editing and instant PDF preview using GJS and GTK4. You can edit this text, add mathematical equations, insert environments, and observe real-time compilation without interrupting your workflow.
\\end{abstract}

\\section{Introduction}
Welcome to \\textbf{TeXFlow}! This application features:
\\begin{itemize}
    \\item Real-time background compilation with \\texttt{pdflatex} and \\texttt{pdftex}.
    \\item Intelligent autocompletion for \\LaTeX{} commands and math symbols.
    \\item High-DPI Poppler PDF live preview with smooth scroll preservation.
    \\item Clickable compiler diagnostics and error navigation.
\\end{itemize}

\\section{Mathematical Formulations}
Here is a numbered display equation showing Maxwell's curl equations:
\\begin{equation}
    \\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}, \\quad 
    \\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}
    \\label{eq:maxwell}
\\end{equation}

We can reference Equation~\\eqref{eq:maxwell} anywhere in our text. Here is an aligned derivation using the \\texttt{align*} environment:
\\begin{align*}
    I &= \\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx \\\\
    I^2 &= \\left( \\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx \\right) \\left( \\int_{-\\infty}^{\\infty} e^{-y^2} \\, dy \\right) \\\\
    &= \\int_{0}^{2\\pi} \\int_{0}^{\\infty} e^{-r^2} r \\, dr \\, d\\theta \\\\
    &= 2\\pi \\cdot \\frac{1}{2} = \\pi \\implies I = \\sqrt{\\pi}
\\end{align*}

\\section{Tabular Data}
Tables are styled cleanly using \\texttt{booktabs}:
\\begin{table}[htbp]
    \\centering
    \\caption{Comparison of TeX Compilation Engines}
    \\label{tab:engines}
    \\vspace{0.5em}
    \\begin{tabular}{lllr}
        \\toprule
        \\textbf{Engine} & \\textbf{Primary Target} & \\textbf{Speed} & \\textbf{Unicode Support} \\\\
        \\midrule
        \\texttt{pdflatex} & Standard \\LaTeX & Very Fast & Good (inputenc) \\\\
        \\texttt{pdftex}   & Plain \\TeX     & Ultra Fast & ASCII / 8-bit \\\\
        \\texttt{xelatex}  & Modern Fonts    & Moderate   & Native UTF-8 \\\\
        \\texttt{lualatex} & Scriptable \\TeX & Moderate   & Native UTF-8 \\\\
        \\bottomrule
    \\end{tabular}
\\end{table}

\\section{Conclusion}
Feel free to test autosuggestions by typing \\texttt{\\textbackslash} anywhere in the editor!

\\end{document}
`
    },

    math: {
        id: 'math',
        name: 'Mathematics & Science Paper',
        engine: 'pdflatex',
        description: 'Comprehensive math paper with amsmath, amsthm, theorems, matrices, and proofs',
        content: `\\documentclass[12pt]{article}

\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{mathtools}
\\usepackage{geometry}
\\geometry{margin=1.1in}

% --- Theorem Environments ---
\\newtheorem{theorem}{Theorem}[section]
\\newtheorem{lemma}[theorem]{Lemma}
\\newtheorem{corollary}[theorem]{Corollary}
\\theoremstyle{definition}
\\newtheorem{definition}{Definition}[section]
\\newtheorem{example}{Example}[section]
\\theoremstyle{remark}
\\newtheorem*{remark}{Remark}

\\title{\\textbf{Advanced Mathematical Formulations}}
\\author{Department of Mathematics}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Spectral Theory and Linear Operators}

\\begin{definition}[Self-Adjoint Operator]
Let $\\mathcal{H}$ be a Hilbert space with inner product $\\langle \\cdot, \\cdot \\rangle$. A densely defined linear operator $A: \\mathcal{D}(A) \\to \\mathcal{H}$ is called \\emph{self-adjoint} if $A = A^*$, which implies:
\\[
    \\langle Ax, y \\rangle = \\langle x, Ay \\rangle \\quad \\forall x, y \\in \\mathcal{D}(A).
\\]
\\end{definition}

\\begin{theorem}[Spectral Decomposition]
Every compact self-adjoint operator $T$ on a Hilbert space has an orthonormal basis of eigenvectors $(\\phi_n)_{n=1}^\\infty$ with real eigenvalues $(\\lambda_n)_{n=1}^\\infty$ such that:
\\[
    Tx = \\sum_{n=1}^\\infty \\lambda_n \\langle x, \\phi_n \\rangle \\phi_n.
\\]
\\end{theorem}

\\begin{proof}
Let $\\lambda_1 = \\sup_{\\|x\\|=1} |\\langle Tx, x \\rangle|$. Since $T$ is compact, the supremum is attained at some unit vector $\\phi_1$. By the Rayleigh quotient variational principle, $\\phi_1$ satisfies $T\\phi_1 = \\lambda_1 \\phi_1$. Inductive projection onto the orthogonal complement $(\\text{span}\\{\\phi_1\\})^\\perp$ yields the remaining orthonormal eigenbasis.
\\end{proof}

\\section{Matrix Formulations}
Consider the symmetric transition matrix $\\mathbf{M} \\in \\mathbb{R}^{3 \\times 3}$:
\\[
    \\mathbf{M} = \\begin{pmatrix}
        2 & -1 & 0 \\\\
        -1 & 2 & -1 \\\\
        0 & -1 & 2
    \\end{pmatrix}
\\]
The characteristic polynomial is computed via determinant:
\\[
    \\det(\\mathbf{M} - \\lambda \\mathbf{I}) = \\begin{vmatrix}
        2-\\lambda & -1 & 0 \\\\
        -1 & 2-\\lambda & -1 \\\\
        0 & -1 & 2-\\lambda
    \\end{vmatrix} = (2-\\lambda)( (2-\\lambda)^2 - 1 ) - (2-\\lambda).
\\]

\\end{document}
`
    },

    plain_tex: {
        id: 'plain_tex',
        name: 'Plain TeX (pdftex Engine)',
        engine: 'pdftex',
        description: 'Clean Plain TeX document designed specifically for the pdftex engine without LaTeX overhead',
        content: `% Plain TeX sample for pdftex engine
\\magnification=\\magstep1
\\baselineskip=15pt
\\hsize=6.25in
\\vsize=8.75in
\\parindent=20pt
\\parskip=6pt plus 1pt minus 1pt

% --- Title Block ---
\\centerline{\\bf Getting Started with Plain \\TeX\\ and PDF\\TeX}
\\vskip 6pt
\\centerline{\\it Built-in Direct Engine Support}
\\vskip 18pt

\\noindent
This document is written in Donald Knuth's original Plain \\TeX\\ format and compiles directly using the {\\tt pdftex} engine without external macro libraries.

\\bigskip
\\centerline{\\bf 1. The Speed of Plain \\TeX}
\\medskip

Plain \\TeX\\ has virtually zero macro loading overhead, resulting in instant sub-50ms compilation passes. It is ideal for math notes, articles, and lightweight documents.

Here is an inline formula: $e^{i\\pi} + 1 = 0$, and a displayed formula:
$$
    \\int_0^\\infty {\\sin x \\over x}\\,dx = {\\pi \\over 2}
$$

\\bigskip
\\centerline{\\bf 2. Tables with Alignment Primitives}
\\medskip

Plain \\TeX\\ uses the powerful {\\tt \\string\\halign} primitive for tables:

\\medskip
\\centerline{\\vbox{\\halign{#\\hfil &\\quad\\hfil#\\quad &\\quad#\\hfil\\cr
    \\bf Command & \\bf Engine & \\bf Purpose \\cr
    \\noalign{\\hrule\\vskip 3pt}
    {\\tt pdftex}   & TeX 3.14159 & Native PDF output from Plain TeX \\cr
    {\\tt pdflatex} & TeX + LaTeX & Standard document formatting \\cr
    {\\tt xelatex}  & XeTeX       & Modern OpenType fonts and UTF-8 \\cr
    \\noalign{\\vskip 3pt\\hrule}
}}}

\\bigskip
\\centerline{\\bf 3. Key Advantages}
\\medskip

\\item{$\\bullet$} Extremely lightweight memory footprint.
\\item{$\\bullet$} Absolute typographic precision directly from TeX primitives.
\\item{$\\bullet$} Instant live-preview feedback in TeXFlow.

\\vskip 24pt
\\centerline{--- End of Plain \\TeX\\ Demonstration ---}

\\vfill\\eject
\\bye
`
    },

    beamer: {
        id: 'beamer',
        name: 'Beamer Presentation Slides',
        engine: 'pdflatex',
        description: 'Modern presentation slide deck with frames, bullet blocks, and math equations',
        content: `\\documentclass[aspectratio=169]{beamer}

\\usetheme{Madrid}
\\usecolortheme{default}

\\title[TeXFlow Presentation]{\\textbf{Modern \\LaTeX\\ Presentation}}
\\subtitle{Interactive Editing and Live Rendering}
\\author{Author Name}
\\institute{GNOME Community}
\\date{\\today}

\\begin{document}

\\begin{frame}
    \\titlepage
\\end{frame}

\\begin{frame}{Overview and Features}
    \\begin{columns}[T]
        \\begin{column}{0.48\\textwidth}
            \\textbf{Editor Capabilities:}
            \\begin{itemize}
                \\item Syntax Highlighting
                \\item LaTeX Autosuggestions
                \\item Real-Time Error Parsing
                \\item Keyboard Navigation
            \\end{itemize}
        \\end{column}
        \\begin{column}{0.48\\textwidth}
            \\textbf{Live Preview:}
            \\begin{itemize}
                \\item Instant Poppler rendering
                \\item Continuous page scrolling
                \\item Non-blocking compilation
                \\item \\texttt{pdftex} \\& \\texttt{pdflatex}
            \\end{itemize}
        \\end{column}
    \\end{columns}
\\end{frame}

\\begin{frame}{Mathematics in Slides}
    \\begin{block}{Euler's Identity}
        The most beautiful theorem in mathematics relates five fundamental constants:
        \\[
            e^{i\\pi} + 1 = 0
        \\]
    \\end{block}

    \\begin{alertblock}{Key Observation}
        Live preview renders this mathematical expression in real time as you edit!
    \\end{alertblock}
\\end{frame}

\\begin{frame}{Thank You!}
    \\centering
    \\Large
    \\textbf{Questions and Discussion}
    
    \\vspace{1em}
    \\normalsize
    \\texttt{https://github.com/latexapp/texflow}
\\end{frame}

\\end{document}
`
    },

    report: {
        id: 'report',
        name: 'Technical / Lab Report',
        engine: 'pdflatex',
        description: 'Structured report format with executive summary, methodology, results, and discussion',
        content: `\\documentclass[12pt,a4paper]{report}

\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{geometry}
\\usepackage{fancyhdr}
\\geometry{margin=1in}

\\pagestyle{fancy}
\\fancyhf{}
\\rhead{Technical Report}
\\lhead{Project TeXFlow}
\\rfoot{Page \\thepage}

\\title{\\Huge \\textbf{Technical Performance Report}\\\\ \\Large Live Preview \\& Compilation Benchmarks}
\\author{\\textbf{Lead Engineer} \\\\ Engineering Division}
\\date{\\today}

\\begin{document}

\\maketitle

\\chapter{Executive Summary}
This report outlines the latency characteristics and responsiveness of real-time \\LaTeX\\ and \\texttt{pdftex} compilation pipelines. Using debounced background worker processes, document rendering achieves sub-second response times across multi-page technical documents.

\\chapter{Methodology and Results}

\\section{Experimental Setup}
Compilation tests were executed on Linux with modern TeX Live binaries:
\\begin{itemize}
    \\item Engine: \\texttt{pdflatex} vs \\texttt{pdftex}
    \\item Output format: PDF 1.5
    \\item IPC: Asynchronous \\texttt{Gio.Subprocess}
\\end{itemize}

\\section{Latency Observations}
\\begin{table}[htbp]
\\centering
\\caption{Measured Compilation Latency}
\\vspace{0.5em}
\\begin{tabular}{llr}
    \\toprule
    \\textbf{Document Size} & \\textbf{Engine} & \\textbf{Median Latency (ms)} \\\\
    \\midrule
    1 Page (Plain TeX)   & \\texttt{pdftex}   & 25 ms \\\\
    2 Pages (Standard)    & \\texttt{pdflatex} & 180 ms \\\\
    10 Pages (Full Paper) & \\texttt{pdflatex} & 420 ms \\\\
    \\bottomrule
\\end{tabular}
\\end{table}

\\chapter{Conclusion}
The debounced live compilation pipeline provides optimal responsiveness without causing processor thrashing.

\\end{document}
`
    }
};
