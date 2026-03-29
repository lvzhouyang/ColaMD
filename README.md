<div align="center">

# ColaMD

A lightweight, fast, open-source WYSIWYG Markdown editor for everyone.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/release/marswaveai/colamd.svg)](https://github.com/marswaveai/colamd/releases)

[Download](#download) | [Features](#features) | [Themes](#themes) | [Development](#development) | [中文](README_CN.md)

</div>

---

## What is ColaMD?

ColaMD is a **WYSIWYG Markdown editor** that is simple, fast, and free. No bloat, no distractions — just a beautiful writing experience.

The market lacks a Markdown editor that is simultaneously **WYSIWYG + open source + actively maintained + lightweight**. ColaMD fills that gap.

## Features

- **True WYSIWYG** — Type Markdown, see rich text instantly. No split-pane preview needed.
- **Lightweight** — Fast startup, small footprint, no bloat.
- **File Hot Reload** — External changes (from AI agents, Git, other editors) are detected and synced in real-time.
- **GitHub Flavored Markdown** — Full GFM support including tables, task lists, and strikethrough.
- **Code Syntax Highlighting** — 15+ languages with Prism.js.
- **Math Formulas** — KaTeX support for mathematical expressions.
- **Theme System** — 4 built-in themes + import custom CSS themes.
- **Export** — PDF, HTML, and copy as rich text.
- **Outline Sidebar** — Auto-generated table of contents from headings.
- **Cross-platform** — macOS, Windows, Linux.

## Download

> Coming soon — check [Releases](https://github.com/marswaveai/colamd/releases) for the latest builds.

| Platform | Download |
|----------|----------|
| macOS    | `.dmg`   |
| Windows  | `.exe`   |
| Linux    | `.AppImage` / `.deb` |

## Themes

ColaMD ships with 4 built-in themes:

| Theme | Description |
|-------|-------------|
| **Light** | Clean, GitHub-inspired light theme (default) |
| **Dark** | Easy on the eyes for night writing |
| **Elegant** | Warm tones with serif typography |
| **Newsprint** | Classic print-inspired reading experience |

You can also import any custom `.css` theme file via **Theme → Import Theme**.

## What ColaMD Does NOT Do

ColaMD is intentionally simple. It does not include:

- File manager / file tree / workspace
- Knowledge base or note organization
- Cloud sync or collaboration
- AI features
- Plugin system

It's a **Markdown editor**. That's it. And it does it well.

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/marswaveai/colamd.git
cd colamd
npm install
npm run dev
```

### Build

```bash
# Build for all platforms
npm run dist

# Build for specific platform
npm run dist:mac
npm run dist:win
npm run dist:linux
```

### Tech Stack

- **Electron** — Cross-platform desktop
- **Milkdown** — WYSIWYG Markdown editing (ProseMirror-based)
- **TypeScript** — Strict mode
- **Vite** — Fast builds via electron-vite
- **Prism.js** — Code syntax highlighting
- **KaTeX** — Math rendering

## License

[MIT](LICENSE) — Free forever.

---

<div align="center">

Made with care by [marswave.ai](https://marswave.ai)

</div>
