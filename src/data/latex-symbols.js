/**
 * LaTeX and TeX symbols, commands, environments, and snippets database
 * for autocompletion and autosuggestions.
 */

export const LATEX_SYMBOLS = [
    // --- Document Structures & Classes ---
    {
        name: '\\documentclass',
        type: 'command',
        description: 'Declare document class (article, report, book, beamer)',
        insertText: '\\documentclass[${1:12pt}]{${2:article}}\n',
        cursorOffset: -10
    },
    {
        name: '\\usepackage',
        type: 'command',
        description: 'Include an external LaTeX package',
        insertText: '\\usepackage{${1:package}}',
        cursorOffset: -1
    },
    {
        name: '\\title',
        type: 'command',
        description: 'Document title',
        insertText: '\\title{${1:Title}}',
        cursorOffset: -1
    },
    {
        name: '\\author',
        type: 'command',
        description: 'Document author',
        insertText: '\\author{${1:Author Name}}',
        cursorOffset: -1
    },
    {
        name: '\\date',
        type: 'command',
        description: 'Document date',
        insertText: '\\date{\\today}',
        cursorOffset: 0
    },
    {
        name: '\\maketitle',
        type: 'command',
        description: 'Generate title block from \\title, \\author, \\date',
        insertText: '\\maketitle\n',
        cursorOffset: 0
    },
    {
        name: '\\tableofcontents',
        type: 'command',
        description: 'Generate table of contents',
        insertText: '\\tableofcontents\n',
        cursorOffset: 0
    },
    {
        name: '\\section',
        type: 'command',
        description: 'Top-level section heading',
        insertText: '\\section{${1:Section Title}}',
        cursorOffset: -1
    },
    {
        name: '\\subsection',
        type: 'command',
        description: 'Subsection heading',
        insertText: '\\subsection{${1:Subsection Title}}',
        cursorOffset: -1
    },
    {
        name: '\\subsubsection',
        type: 'command',
        description: 'Subsubsection heading',
        insertText: '\\subsubsection{${1:Subsubsection Title}}',
        cursorOffset: -1
    },
    {
        name: '\\paragraph',
        type: 'command',
        description: 'Paragraph heading',
        insertText: '\\paragraph{${1:Paragraph Title}} ',
        cursorOffset: -2
    },
    {
        name: '\\chapter',
        type: 'command',
        description: 'Chapter heading (in books/reports)',
        insertText: '\\chapter{${1:Chapter Title}}',
        cursorOffset: -1
    },

    // --- Environments ---
    {
        name: 'document',
        type: 'environment',
        description: 'Main document body environment',
        insertText: '\\begin{document}\n    ${1}\n\\end{document}',
        cursorOffset: -15
    },
    {
        name: 'equation',
        type: 'environment',
        description: 'Numbered display math equation',
        insertText: '\\begin{equation}\n    ${1}\n\\end{equation}',
        cursorOffset: -15
    },
    {
        name: 'equation*',
        type: 'environment',
        description: 'Unnumbered display math equation',
        insertText: '\\begin{equation*}\n    ${1}\n\\end{equation*}',
        cursorOffset: -16
    },
    {
        name: 'align',
        type: 'environment',
        description: 'Multi-line aligned equations (numbered)',
        insertText: '\\begin{align}\n    ${1} &= \n\\end{align}',
        cursorOffset: -14
    },
    {
        name: 'align*',
        type: 'environment',
        description: 'Multi-line aligned equations (unnumbered)',
        insertText: '\\begin{align*}\n    ${1} &= \n\\end{align*}',
        cursorOffset: -15
    },
    {
        name: 'gather',
        type: 'environment',
        description: 'Multi-line centered equations',
        insertText: '\\begin{gather}\n    ${1}\n\\end{gather}',
        cursorOffset: -13
    },
    {
        name: 'itemize',
        type: 'environment',
        description: 'Unordered bulleted list',
        insertText: '\\begin{itemize}\n    \\item ${1}\n\\end{itemize}',
        cursorOffset: -14
    },
    {
        name: 'enumerate',
        type: 'environment',
        description: 'Ordered numbered list',
        insertText: '\\begin{enumerate}\n    \\item ${1}\n\\end{enumerate}',
        cursorOffset: -16
    },
    {
        name: 'description',
        type: 'environment',
        description: 'Labeled description list',
        insertText: '\\begin{description}\n    \\item[${1:Term}] ${2:Description}\n\\end{description}',
        cursorOffset: -18
    },
    {
        name: 'figure',
        type: 'environment',
        description: 'Floating figure container with caption and label',
        insertText: '\\begin{figure}[htbp]\n    \\centering\n    \\includegraphics[width=0.8\\linewidth]{${1:image.png}}\n    \\caption{${2:Caption}}\n    \\label{fig:${3:label}}\n\\end{figure}',
        cursorOffset: -75
    },
    {
        name: 'table',
        type: 'environment',
        description: 'Floating table container with caption and label',
        insertText: '\\begin{table}[htbp]\n    \\centering\n    \\caption{${1:Caption}}\n    \\label{tab:${2:label}}\n    \\begin{tabular}{cc}\n        \\hline\n        A & B \\\\\n        \\hline\n        1 & 2 \\\\\n        \\hline\n    \\end{tabular}\n\\end{table}',
        cursorOffset: -100
    },
    {
        name: 'tabular',
        type: 'environment',
        description: 'Tabular data environment',
        insertText: '\\begin{tabular}{${1:c c}}\n    ${2:Item 1} & ${3:Item 2} \\\\\n\\end{tabular}',
        cursorOffset: -30
    },
    {
        name: 'matrix',
        type: 'environment',
        description: 'Plain matrix without delimiters',
        insertText: '\\begin{matrix}\n    ${1:a} & ${2:b} \\\\\n    ${3:c} & ${4:d}\n\\end{matrix}',
        cursorOffset: -35
    },
    {
        name: 'pmatrix',
        type: 'environment',
        description: 'Matrix enclosed in parentheses ( )',
        insertText: '\\begin{pmatrix}\n    ${1:a} & ${2:b} \\\\\n    ${3:c} & ${4:d}\n\\end{pmatrix}',
        cursorOffset: -36
    },
    {
        name: 'bmatrix',
        type: 'environment',
        description: 'Matrix enclosed in square brackets [ ]',
        insertText: '\\begin{bmatrix}\n    ${1:a} & ${2:b} \\\\\n    ${3:c} & ${4:d}\n\\end{bmatrix}',
        cursorOffset: -36
    },
    {
        name: 'vmatrix',
        type: 'environment',
        description: 'Determinant matrix enclosed in vertical bars | |',
        insertText: '\\begin{vmatrix}\n    ${1:a} & ${2:b} \\\\\n    ${3:c} & ${4:d}\n\\end{vmatrix}',
        cursorOffset: -36
    },
    {
        name: 'cases',
        type: 'environment',
        description: 'Piecewise function cases',
        insertText: '\\begin{cases}\n    ${1:case 1}, & \\text{if } ${2:condition} \\\\\n    ${3:case 2}, & \\text{otherwise}\n\\end{cases}',
        cursorOffset: -65
    },
    {
        name: 'proof',
        type: 'environment',
        description: 'Mathematical proof environment with QED symbol',
        insertText: '\\begin{proof}\n    ${1}\n\\end{proof}',
        cursorOffset: -12
    },
    {
        name: 'theorem',
        type: 'environment',
        description: 'Theorem block',
        insertText: '\\begin{theorem}\n    ${1}\n\\end{theorem}',
        cursorOffset: -14
    },
    {
        name: 'lemma',
        type: 'environment',
        description: 'Lemma block',
        insertText: '\\begin{lemma}\n    ${1}\n\\end{lemma}',
        cursorOffset: -12
    },
    {
        name: 'definition',
        type: 'environment',
        description: 'Definition block',
        insertText: '\\begin{definition}\n    ${1}\n\\end{definition}',
        cursorOffset: -17
    },
    {
        name: 'frame',
        type: 'environment',
        description: 'Beamer slide frame',
        insertText: '\\begin{frame}{${1:Slide Title}}\n    ${2}\n\\end{frame}',
        cursorOffset: -13
    },
    {
        name: 'abstract',
        type: 'environment',
        description: 'Document abstract section',
        insertText: '\\begin{abstract}\n    ${1}\n\\end{abstract}',
        cursorOffset: -15
    },
    {
        name: 'center',
        type: 'environment',
        description: 'Centered text or graphics block',
        insertText: '\\begin{center}\n    ${1}\n\\end{center}',
        cursorOffset: -13
    },
    {
        name: 'verbatim',
        type: 'environment',
        description: 'Preformatted literal text / code block',
        insertText: '\\begin{verbatim}\n${1}\n\\end{verbatim}',
        cursorOffset: -14
    },

    // --- Text Formatting & Styles ---
    {
        name: '\\textbf',
        type: 'command',
        description: 'Bold text',
        insertText: '\\textbf{${1:text}}',
        cursorOffset: -1
    },
    {
        name: '\\textit',
        type: 'command',
        description: 'Italic text',
        insertText: '\\textit{${1:text}}',
        cursorOffset: -1
    },
    {
        name: '\\underline',
        type: 'command',
        description: 'Underlined text',
        insertText: '\\underline{${1:text}}',
        cursorOffset: -1
    },
    {
        name: '\\texttt',
        type: 'command',
        description: 'Monospace typewriter text',
        insertText: '\\texttt{${1:text}}',
        cursorOffset: -1
    },
    {
        name: '\\emph',
        type: 'command',
        description: 'Emphasized text',
        insertText: '\\emph{${1:text}}',
        cursorOffset: -1
    },
    {
        name: '\\textsc',
        type: 'command',
        description: 'Small capitals text',
        insertText: '\\textsc{${1:text}}',
        cursorOffset: -1
    },
    {
        name: '\\textsf',
        type: 'command',
        description: 'Sans-serif text',
        insertText: '\\textsf{${1:text}}',
        cursorOffset: -1
    },
    {
        name: '\\textcolor',
        type: 'command',
        description: 'Colored text with xcolor',
        insertText: '\\textcolor{${1:red}}{${2:text}}',
        cursorOffset: -1
    },

    // --- Math Constructs & Functions ---
    {
        name: '\\frac',
        type: 'math',
        description: 'Fraction: \\frac{num}{den}',
        insertText: '\\frac{${1:num}}{${2:den}}',
        cursorOffset: -7
    },
    {
        name: '\\dfrac',
        type: 'math',
        description: 'Display-style large fraction',
        insertText: '\\dfrac{${1:num}}{${2:den}}',
        cursorOffset: -7
    },
    {
        name: '\\sqrt',
        type: 'math',
        description: 'Square root: \\sqrt{x}',
        insertText: '\\sqrt{${1:x}}',
        cursorOffset: -1
    },
    {
        name: '\\sum',
        type: 'math',
        description: 'Summation operator ∑',
        insertText: '\\sum_{${1:i=1}}^{${2:n}} ',
        cursorOffset: -5
    },
    {
        name: '\\int',
        type: 'math',
        description: 'Definite or indefinite integral ∫',
        insertText: '\\int_{${1:a}}^{${2:b}} ${3:f(x)}\\, dx',
        cursorOffset: -16
    },
    {
        name: '\\iint',
        type: 'math',
        description: 'Double integral ∬',
        insertText: '\\iint_{${1:D}} ',
        cursorOffset: -1
    },
    {
        name: '\\prod',
        type: 'math',
        description: 'Product operator ∏',
        insertText: '\\prod_{${1:i=1}}^{${2:n}} ',
        cursorOffset: -5
    },
    {
        name: '\\lim',
        type: 'math',
        description: 'Limit operator: lim_{x -> a}',
        insertText: '\\lim_{${1:x} \\to ${2:\\infty}} ',
        cursorOffset: -1
    },
    {
        name: '\\partial',
        type: 'math',
        description: 'Partial derivative symbol ∂',
        insertText: '\\partial ',
        cursorOffset: 0
    },
    {
        name: '\\nabla',
        type: 'math',
        description: 'Del / gradient operator ∇',
        insertText: '\\nabla ',
        cursorOffset: 0
    },
    {
        name: '\\infty',
        type: 'math',
        description: 'Infinity symbol ∞',
        insertText: '\\infty',
        cursorOffset: 0
    },
    {
        name: '\\mathbf',
        type: 'math',
        description: 'Bold math font for vectors/matrices',
        insertText: '\\mathbf{${1:v}}',
        cursorOffset: -1
    },
    {
        name: '\\mathbb',
        type: 'math',
        description: 'Blackboard bold font: ℝ, ℂ, ℤ, ℕ',
        insertText: '\\mathbb{${1:R}}',
        cursorOffset: -1
    },
    {
        name: '\\mathcal',
        type: 'math',
        description: 'Calligraphic font for sets/transforms',
        insertText: '\\mathcal{${1:L}}',
        cursorOffset: -1
    },
    {
        name: '\\text',
        type: 'math',
        description: 'Text inside math mode',
        insertText: '\\text{${1:words}}',
        cursorOffset: -1
    },
    {
        name: '\\left',
        type: 'math',
        description: 'Auto-sizing left delimiter',
        insertText: '\\left( ${1} \\right)',
        cursorOffset: -8
    },

    // --- Greek Letters (Math) ---
    { name: '\\alpha', type: 'math', description: 'Greek letter α', insertText: '\\alpha', cursorOffset: 0 },
    { name: '\\beta', type: 'math', description: 'Greek letter β', insertText: '\\beta', cursorOffset: 0 },
    { name: '\\gamma', type: 'math', description: 'Greek letter γ', insertText: '\\gamma', cursorOffset: 0 },
    { name: '\\delta', type: 'math', description: 'Greek letter δ', insertText: '\\delta', cursorOffset: 0 },
    { name: '\\epsilon', type: 'math', description: 'Greek letter ϵ', insertText: '\\epsilon', cursorOffset: 0 },
    { name: '\\varepsilon', type: 'math', description: 'Greek letter ε (variant)', insertText: '\\varepsilon', cursorOffset: 0 },
    { name: '\\zeta', type: 'math', description: 'Greek letter ζ', insertText: '\\zeta', cursorOffset: 0 },
    { name: '\\eta', type: 'math', description: 'Greek letter η', insertText: '\\eta', cursorOffset: 0 },
    { name: '\\theta', type: 'math', description: 'Greek letter θ', insertText: '\\theta', cursorOffset: 0 },
    { name: '\\vartheta', type: 'math', description: 'Greek letter ϑ (variant)', insertText: '\\vartheta', cursorOffset: 0 },
    { name: '\\lambda', type: 'math', description: 'Greek letter λ', insertText: '\\lambda', cursorOffset: 0 },
    { name: '\\mu', type: 'math', description: 'Greek letter μ', insertText: '\\mu', cursorOffset: 0 },
    { name: '\\nu', type: 'math', description: 'Greek letter ν', insertText: '\\nu', cursorOffset: 0 },
    { name: '\\xi', type: 'math', description: 'Greek letter ξ', insertText: '\\xi', cursorOffset: 0 },
    { name: '\\pi', type: 'math', description: 'Greek letter π', insertText: '\\pi', cursorOffset: 0 },
    { name: '\\rho', type: 'math', description: 'Greek letter ρ', insertText: '\\rho', cursorOffset: 0 },
    { name: '\\sigma', type: 'math', description: 'Greek letter σ', insertText: '\\sigma', cursorOffset: 0 },
    { name: '\\tau', type: 'math', description: 'Greek letter τ', insertText: '\\tau', cursorOffset: 0 },
    { name: '\\phi', type: 'math', description: 'Greek letter ϕ', insertText: '\\phi', cursorOffset: 0 },
    { name: '\\varphi', type: 'math', description: 'Greek letter φ (variant)', insertText: '\\varphi', cursorOffset: 0 },
    { name: '\\chi', type: 'math', description: 'Greek letter χ', insertText: '\\chi', cursorOffset: 0 },
    { name: '\\psi', type: 'math', description: 'Greek letter ψ', insertText: '\\psi', cursorOffset: 0 },
    { name: '\\omega', type: 'math', description: 'Greek letter ω', insertText: '\\omega', cursorOffset: 0 },
    { name: '\\Gamma', type: 'math', description: 'Uppercase Greek letter Γ', insertText: '\\Gamma', cursorOffset: 0 },
    { name: '\\Delta', type: 'math', description: 'Uppercase Greek letter Δ (Laplacian/change)', insertText: '\\Delta', cursorOffset: 0 },
    { name: '\\Theta', type: 'math', description: 'Uppercase Greek letter Θ', insertText: '\\Theta', cursorOffset: 0 },
    { name: '\\Lambda', type: 'math', description: 'Uppercase Greek letter Λ', insertText: '\\Lambda', cursorOffset: 0 },
    { name: '\\Sigma', type: 'math', description: 'Uppercase Greek letter Σ', insertText: '\\Sigma', cursorOffset: 0 },
    { name: '\\Phi', type: 'math', description: 'Uppercase Greek letter Φ', insertText: '\\Phi', cursorOffset: 0 },
    { name: '\\Psi', type: 'math', description: 'Uppercase Greek letter Ψ', insertText: '\\Psi', cursorOffset: 0 },
    { name: '\\Omega', type: 'math', description: 'Uppercase Greek letter Ω', insertText: '\\Omega', cursorOffset: 0 },

    // --- Math Relations & Arrows ---
    { name: '\\leq', type: 'math', description: 'Less than or equal ≤', insertText: '\\leq ', cursorOffset: 0 },
    { name: '\\geq', type: 'math', description: 'Greater than or equal ≥', insertText: '\\geq ', cursorOffset: 0 },
    { name: '\\neq', type: 'math', description: 'Not equal ≠', insertText: '\\neq ', cursorOffset: 0 },
    { name: '\\approx', type: 'math', description: 'Approximately equal ≈', insertText: '\\approx ', cursorOffset: 0 },
    { name: '\\equiv', type: 'math', description: 'Equivalent / identically equal ≡', insertText: '\\equiv ', cursorOffset: 0 },
    { name: '\\in', type: 'math', description: 'Element of ∈', insertText: '\\in ', cursorOffset: 0 },
    { name: '\\notin', type: 'math', description: 'Not an element of ∉', insertText: '\\notin ', cursorOffset: 0 },
    { name: '\\subset', type: 'math', description: 'Subset ⊂', insertText: '\\subset ', cursorOffset: 0 },
    { name: '\\subseteq', type: 'math', description: 'Subset or equal ⊆', insertText: '\\subseteq ', cursorOffset: 0 },
    { name: '\\cup', type: 'math', description: 'Set union ∪', insertText: '\\cup ', cursorOffset: 0 },
    { name: '\\cap', type: 'math', description: 'Set intersection ∩', insertText: '\\cap ', cursorOffset: 0 },
    { name: '\\times', type: 'math', description: 'Cross product / multiplication ×', insertText: '\\times ', cursorOffset: 0 },
    { name: '\\cdot', type: 'math', description: 'Dot product ·', insertText: '\\cdot ', cursorOffset: 0 },
    { name: '\\to', type: 'math', description: 'Right arrow →', insertText: '\\to ', cursorOffset: 0 },
    { name: '\\rightarrow', type: 'math', description: 'Right arrow →', insertText: '\\rightarrow ', cursorOffset: 0 },
    { name: '\\Rightarrow', type: 'math', description: 'Implies arrow ⇒', insertText: '\\Rightarrow ', cursorOffset: 0 },
    { name: '\\iff', type: 'math', description: 'If and only if ⟺', insertText: '\\iff ', cursorOffset: 0 },
    { name: '\\forall', type: 'math', description: 'Universal quantifier ∀', insertText: '\\forall ', cursorOffset: 0 },
    { name: '\\exists', type: 'math', description: 'Existential quantifier ∃', insertText: '\\exists ', cursorOffset: 0 },

    // --- References, Figures, Citations ---
    {
        name: '\\label',
        type: 'command',
        description: 'Create an anchor label for cross-referencing',
        insertText: '\\label{${1:sec:name}}',
        cursorOffset: -1
    },
    {
        name: '\\ref',
        type: 'command',
        description: 'Reference a section, figure, or table label',
        insertText: '\\ref{${1:label}}',
        cursorOffset: -1
    },
    {
        name: '\\eqref',
        type: 'command',
        description: 'Reference an equation label (with parentheses)',
        insertText: '\\eqref{${1:eq:name}}',
        cursorOffset: -1
    },
    {
        name: '\\cite',
        type: 'command',
        description: 'BibTeX citation reference',
        insertText: '\\cite{${1:key}}',
        cursorOffset: -1
    },
    {
        name: '\\footnote',
        type: 'command',
        description: 'Add a footnote',
        insertText: '\\footnote{${1:Footnote text}}',
        cursorOffset: -1
    },
    {
        name: '\\includegraphics',
        type: 'command',
        description: 'Insert an external image (graphicx)',
        insertText: '\\includegraphics[width=${1:0.8\\linewidth}]{${2:image.png}}',
        cursorOffset: -1
    },
    {
        name: '\\href',
        type: 'command',
        description: 'Hyperlink URL and anchor text (hyperref)',
        insertText: '\\href{${1:https://example.com}}{${2:text}}',
        cursorOffset: -1
    },
    {
        name: '\\url',
        type: 'command',
        description: 'Format a plain URL',
        insertText: '\\url{${1:https://example.com}}',
        cursorOffset: -1
    },

    // --- Layout, Spacing & Breaks ---
    { name: '\\newpage', type: 'command', description: 'Start a new page', insertText: '\\newpage\n', cursorOffset: 0 },
    { name: '\\clearpage', type: 'command', description: 'Flush all floats and start a new page', insertText: '\\clearpage\n', cursorOffset: 0 },
    { name: '\\vspace', type: 'command', description: 'Vertical space (e.g. 1em, 10pt)', insertText: '\\vspace{${1:1em}}', cursorOffset: -1 },
    { name: '\\hspace', type: 'command', description: 'Horizontal space (e.g. 1em, 10pt)', insertText: '\\hspace{${1:1em}}', cursorOffset: -1 },
    { name: '\\centering', type: 'command', description: 'Center align current block', insertText: '\\centering\n', cursorOffset: 0 },
    { name: '\\noindent', type: 'command', description: 'Suppress paragraph indentation', insertText: '\\noindent ', cursorOffset: 0 },
    { name: '\\rule', type: 'command', description: 'Draw a horizontal rule/line', insertText: '\\rule{${1:\\linewidth}}{${2:0.4pt}}', cursorOffset: -1 },

    // --- Plain TeX Primitives (for pdftex engine) ---
    {
        name: '\\bye',
        type: 'pdftex',
        description: 'Plain TeX end of document command',
        insertText: '\\bye\n',
        cursorOffset: 0
    },
    {
        name: '\\input',
        type: 'pdftex',
        description: 'Plain TeX include file command',
        insertText: '\\input ${1:filename}\n',
        cursorOffset: -1
    },
    {
        name: '\\def',
        type: 'pdftex',
        description: 'Plain TeX macro definition',
        insertText: '\\def\\${1:macroname}{${2:definition}}',
        cursorOffset: -1
    },
    {
        name: '\\vfill\\eject',
        type: 'pdftex',
        description: 'Plain TeX page break',
        insertText: '\\vfill\\eject\n',
        cursorOffset: 0
    },
    {
        name: '\\font',
        type: 'pdftex',
        description: 'Plain TeX font selection',
        insertText: '\\font\\${1:myfont}=${2:cmr12}\n',
        cursorOffset: -1
    },
    {
        name: '\\hsize',
        type: 'pdftex',
        description: 'Plain TeX horizontal page dimension',
        insertText: '\\hsize=6.5in\n',
        cursorOffset: 0
    },
    {
        name: '\\vsize',
        type: 'pdftex',
        description: 'Plain TeX vertical page dimension',
        insertText: '\\vsize=9.0in\n',
        cursorOffset: 0
    },
    {
        name: '\\magnification',
        type: 'pdftex',
        description: 'Plain TeX magnification factor',
        insertText: '\\magnification=\\magstep1\n',
        cursorOffset: 0
    },
    {
        name: '\\baselineskip',
        type: 'pdftex',
        description: 'Plain TeX line spacing distance',
        insertText: '\\baselineskip=14pt\n',
        cursorOffset: 0
    },
    {
        name: '\\centerline',
        type: 'pdftex',
        description: 'Plain TeX center single line of text',
        insertText: '\\centerline{${1:Centered text}}',
        cursorOffset: -1
    },
    {
        name: '\\halign',
        type: 'pdftex',
        description: 'Plain TeX table alignment primitive',
        insertText: '\\halign{#\\hfil &\\quad #\\hfil\\cr\n    ${1:Col 1} & ${2:Col 2} \\cr\n}',
        cursorOffset: -10
    }
];
