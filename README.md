# pd (皮蛋) — Markdown 操作工具 / Markdown utility

简体中文 | English

## 项目简介 / Project Description
皮蛋（pd）是一个用于编辑、预览和导出 Markdown 文档的工具，基于 Vue 构建，目标是提供轻量、流畅且易扩展的 Markdown 写作与管理体验。
pd is a tool for editing, previewing, and exporting Markdown documents. Built with Vue, pd aims to provide a lightweight, smooth, and extensible Markdown writing and management experience.

## 目录 / Table of Contents
- 功能 / Features
- 安装与运行 / Installation & Run
- 使用说明 / Usage
- 配置项 / Configuration
- 开发与贡献 / Development & Contributing
- 许可 / License
- 联系方式 / Contact

## 功能 / Features
- 实时编辑与实时预览（Markdown -> HTML）  
  Live editing with real-time preview (Markdown -> HTML)
- 支持常见导出格式（HTML / PDF / MD）  
  Export to common formats (HTML / PDF / MD)
- 多主题、代码高亮、表格和数学公式支持（可扩展插件）  
  Themes, syntax highlighting, tables and math support (plugin-friendly)
- 编辑历史 / 撤销重做 / Undo & redo history  
- 支持中文与英文等多语言界面（可扩展）  
  Built-in support for Chinese and English UI, extensible for more languages

## 安装与运行 / Installation & Run
先确保你已安装 Node.js（推荐 v16+）和 npm / pnpm / yarn。

Install Node.js (recommended v16+) and npm / pnpm / yarn first.

安装依赖 / Install dependencies:
```bash
npm install
# or
# pnpm install
# yarn
```

开发模式（热重载） / Development (hot-reload):
```bash
npm run dev
# or npm run serve (if using Vue CLI)
```

构建生产包 / Build for production:
```bash
npm run build
```

本地预览生产包 / Preview production build:
```bash
npm run preview
# or use a static server to serve the dist/ directory
```

代码质量检查 / Lint:
```bash
npm run lint
```

## 使用说明 / Usage
- 打开应用，进入编辑器，在左侧编写 Markdown，右侧实时预览。  
  Open the app, write Markdown on the editor (left) and see instant preview (right).
- 支持拖拽或选择本地 Markdown 文件以导入编辑。  
  Import local Markdown files via drag-and-drop or file select.
- 导出：使用 UI 提供的“导出”菜单选择导出为 HTML / PDF / MD。  
  Export via the UI Export menu to HTML / PDF / or MD.
- 配置主题和渲染选项以满足不同的展示需求。  
  Customize themes and render options for different presentation needs.

示例：将 README.md 导出为 HTML 后即可发布为静态文档站点或保存为本地文档。

Example: Export README.md to HTML for a static docs site or for local archival.

## 配置项 / Configuration
（示例 - 根据项目实际配置项调整）
- theme: 'light' | 'dark' — 编辑器主题  
- export: { pdf: { pageSize: 'A4' }, html: { inlineCSS: true } } — 导出选项  
- editor: { tabSize: 2, wordWrap: true } — 编辑器行为

(Adjust the above example configuration to match actual project options.)

## 开发与贡献 / Development & Contributing
欢迎提出 issue 和 PR。贡献流程建议：
- Fork 本仓库并新建分支：`git checkout -b feat/your-feature`  
- 提交代码并推送：`git push origin feat/your-feature`  
- 发起 Pull Request，描述变更与测试步骤

Please open issues and PRs. Suggested workflow:
- Fork the repo and create a branch: `git checkout -b feat/your-feature`
- Commit and push: `git push origin feat/your-feature`
- Open a Pull Request describing your changes and how to test them

代码风格 / Tests:
- 遵循项目现有代码风格（TypeScript + Vue 风格），运行 lint / 测试用例前先确保本地通过。
Follow existing project style (TypeScript + Vue). Ensure lint/tests pass locally before submitting.

## 许可 / License
本项目使用 MIT 许可（如需其它许可请替换）。  
This project is licensed under the MIT License. Replace if you prefer another license.

## 联系方式 / Contact
如有问题或建议，请在本仓库创建 issue，或通过 Pull Request 提交改进。  
For questions or suggestions, please open an issue or submit a Pull Request.

项目简介（短）：
- 中文：皮蛋，一个操作 Markdown 文档的轻量工具。  
- English: pd — a lightweight tool for working with Markdown documents.
