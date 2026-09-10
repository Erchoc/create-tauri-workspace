# create-tauri-workspace

[![CI](https://github.com/erchoc/create-tauri-workspace/actions/workflows/ci.yml/badge.svg)](https://github.com/erchoc/create-tauri-workspace/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/create-tauri-workspace.svg)](https://www.npmjs.com/package/create-tauri-workspace)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Runtime dependencies: 0](https://img.shields.io/badge/runtime_dependencies-0-2ea44f.svg)](./packages/create-tauri-workspace/package.json)

[English](./README.md) · 简体中文

一条命令生成 macOS 与 Windows 桌面应用，自带签名自动更新、设计 token 体系和发布流水线。

![生成的应用，亮色与暗色主题](./site/preview.png)

## 快速开始

```bash
npx create-tauri-workspace my-app --identifier dev.you.myapp --repo you/my-app
cd my-app
bun run dev
```

只有名字是必填项。建议先运行 `npx create-tauri-workspace doctor` 检查本机环境。

## 包含什么

- **签名自动更新**：运行 `bun run updater:init` 生成密钥后才启用。没有密钥时更新
  插件根本不会注册，应用不会提供一个自己无法校验的安装包。
- **设计 token 体系**：亮暗双主题，窗口内自带主题切换。颜色、间距、圆角集中在一
  个文件里。
- **两个 Rust crate，边界清晰**：`crates/core` 可单元测试且不依赖 Tauri；
  `crates/app` 负责把它接到桌面外壳上。
- **桌面软件基本盘**：单实例启动、窗口位置记忆、结构化日志、设置持久化、错误边界。
- **发布流水线**：在任何平台开始构建前先校验 tag、版本号和签名密钥，然后产出草稿
  Release。
- **面向 AI 协作**：一份 `AGENTS.md`，外加 Claude Code 和 Codex 共用的技能。

## 安装技能

两个工具读取同一份 `SKILL.md`，只是目录不同：

```bash
npx create-tauri-workspace skill install            # 仅当前项目
npx create-tauri-workspace skill install --global   # 所有项目
```

| 工具 | 安装位置 |
| --- | --- |
| Claude Code | `.claude/skills/desktop-app/` |
| Codex | `.agents/skills/desktop-app/` |

Claude Code 也可以按插件方式安装：

```text
/plugin marketplace add erchoc/create-tauri-workspace
/plugin install desktop-app@create-tauri-workspace
```

## 命令行

```text
create-tauri-workspace [project-name] [options]
create-tauri-workspace skill install [options]
create-tauri-workspace doctor

  --output <directory>  新项目的父目录
  --identifier <id>     应用标识符，例如 com.example.app
  --repo <owner/name>   用于下载更新的 GitHub 仓库
  --no-install          跳过 bun install
  --no-git              跳过 git init
```

## 环境要求

| 工具 | 最低版本 | 用途 |
| --- | --- | --- |
| [Bun](https://bun.sh/) | 1.4 | 运行项目的全部命令 |
| [Node.js](https://nodejs.org/) | 24 | 运行发布与更新配置脚本 |
| [Rust](https://rustup.rs/) | 1.98 | 编译桌面应用本体 |

以及 [Tauri 平台依赖](https://v2.tauri.app/start/prerequisites/)。在生成的项目里
运行 `bun run doctor`，会逐项说明缺什么、怎么补。

这些版本约束的是开发者，不是用户：最终交付的是原生二进制，内部不含任何
JavaScript 运行时。

## 仓库结构

```text
packages/create-tauri-workspace/
├── bin/                  可执行入口
├── src/                  CLI 模块
├── skills/desktop-app/   技能本体，同时作为 Claude Code 插件源
└── templates/default/    被生成出来的应用模板
site/                     说明网站，发布到 GitHub Pages
scripts/                  打包校验与发布辅助脚本
```

## 参与开发

```bash
bun install
bun run check
```

详见 [CONTRIBUTING.md](./CONTRIBUTING.md) 与 [PUBLISHING.md](./PUBLISHING.md)。

## 许可证

MIT
