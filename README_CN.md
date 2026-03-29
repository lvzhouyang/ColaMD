<div align="center">

# ColaMD

轻量、快速、开源免费的所见即所得 Markdown 编辑器。给每个人用的。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/release/marswaveai/colamd.svg)](https://github.com/marswaveai/colamd/releases)

[下载](#下载) | [功能特性](#功能特性) | [主题](#主题) | [开发](#开发) | [English](README.md)

</div>

---

## 什么是 ColaMD？

ColaMD 是一款**所见即所得的 Markdown 编辑器**，简单、快速、免费。没有臃肿功能，没有干扰——只有纯粹的写作体验。

市场上缺一个同时满足"所见即所得 + 开源免费 + 活跃维护 + 轻量"的 Markdown 编辑器。ColaMD 就是来填这个坑的。

## 功能特性

- **真正的所见即所得** — 输入 Markdown 语法，即刻渲染为富文本，无需分屏预览
- **轻量** — 启动快，体积小，不臃肿
- **文件热更新** — 外部修改（AI Agent、Git pull、其他编辑器）自动检测并实时刷新
- **GitHub Flavored Markdown** — 完整 GFM 支持，包括表格、任务列表、删除线
- **代码语法高亮** — 15+ 语言，基于 Prism.js
- **数学公式** — KaTeX 支持
- **主题系统** — 4 个内置主题 + 导入自定义 CSS 主题
- **导出** ��� PDF、HTML、复制为富文本
- **大纲侧边栏** — 根据标题自动生成目录
- **跨平台** — macOS、Windows、Linux

## 下载

> 即将发布 — 请关注 [Releases](https://github.com/marswaveai/colamd/releases) 获取最新构建。

| 平台 | 下载 |
|------|------|
| macOS | `.dmg` |
| Windows | `.exe` |
| Linux | `.AppImage` / `.deb` |

## 主题

ColaMD 内置 4 个主题：

| 主题 | 说明 |
|------|------|
| **Light** | 简洁明亮的 GitHub 风格主题（默认） |
| **Dark** | 护眼暗色主题，适合夜间写作 |
| **Elegant** | 暖色调衬线字体，典雅风格 |
| **Newsprint** | 经典印刷风格阅读体验 |

你也可以通过 **主题 → 导入主题** 导入任何自定义 `.css` 主题文件。

## ColaMD 不做的事

ColaMD 有意保持简单，不包含：

- 文件管理器 / 文件树 / 工作区
- 知识库管理
- 云同步或协作编辑
- AI 功能
- 插件系统

它是一个 **Markdown 编辑器**。仅此而已。把这一件事做好。

## 开发

### 环境要求

- Node.js 18+
- npm 9+

### 开始

```bash
git clone https://github.com/marswaveai/colamd.git
cd colamd
npm install
npm run dev
```

### 构建

```bash
# 全平台构建
npm run dist

# 指定平台构建
npm run dist:mac
npm run dist:win
npm run dist:linux
```

### 技术栈

- **Electron** — 跨平台桌面
- **Milkdown** — 所见即所得 Markdown 编辑（基于 ProseMirror）
- **TypeScript** — 严格模式
- **Vite** — 快速构建（electron-vite）
- **Prism.js** — 代码语法高亮
- **KaTeX** — 数学公式渲染

## 开源协议

[MIT](LICENSE) — 永久免费。

---

<div align="center">

由 [marswave.ai](https://marswave.ai) 用心打造

</div>
