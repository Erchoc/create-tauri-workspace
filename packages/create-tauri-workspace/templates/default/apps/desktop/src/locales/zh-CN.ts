import type { Messages } from "./en";

// Typed as Messages, so leaving a key out or misspelling one fails the build.
export const zhCN: Messages = {
  "app.tagline": "一个 macOS 与 Windows 桌面应用，该接的都已经接好了。",

  "theme.label": "主题",
  "theme.system": "跟随系统",
  "theme.light": "浅色",
  "theme.dark": "深色",

  "language.label": "语言",
  "language.system": "跟随系统",

  "status.ready": "就绪",

  "demo.label": "示例",
  "demo.title": "调用原生能力",
  "demo.name": "名字",
  "demo.submit": "运行",
  "demo.browserHint": "请运行桌面应用以调用原生能力。",
  "demo.result": "原生层返回：{value}",
  "demo.empty": "原生层没有返回内容。",

  "runtime.label": "运行时",
  "runtime.version": "版本",
  "runtime.platform": "系统",
  "runtime.architecture": "架构",
  "runtime.updates": "自动更新",
  "runtime.updatesEnabled": "已开启",
  "runtime.updatesUnconfigured": "未配置",
  "runtime.updatesDesktopOnly": "仅桌面端",

  "storage.label": "本地数据",
  "storage.title": "配置文件位置",
  "storage.automaticUpdates": "自动下载更新",

  "update.checkNow": "检查更新",
  "update.available": "发现新版本 {version}。",
  "update.download": "下载更新",
  "update.checking": "正在检查更新…",
  "update.downloading": "正在下载更新…",
  "update.downloadingPercent": "正在下载更新… {percent}%",
  "update.ready": "{version} 已下载完成，可以安装。",
  "update.install": "立即安装",
  "update.installing": "正在安装，应用将自动重启…",
  "update.failed": "更新失败：{message}",

  "update.confirmTitle": "现在安装更新？",
  "update.confirmBody":
    "{name} 将关闭、安装 {version} 并重新打开。请先保存正在进行的工作。",
  "update.confirmAccept": "关闭并安装",
  "update.confirmCancel": "稍后再说",

  "error.title": "出了点问题",
  "error.heading": "界面已停止",
  "error.retry": "重试",
  "error.reload": "重新加载",
};
