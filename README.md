# Douyin Clean & Best Quality

这是一个适用于 `douyin.com` 的独立油猴脚本。

它把两个功能合并到了一个文件里：

- 隐藏原本依赖 AdGuard 自定义规则实现的页面元素
- 自动把视频切换到当前可用的最高画质

发布后的仓库可以直接使用，不再依赖 AdGuard。

## 功能

- 单文件 Tampermonkey 脚本
- 页面加载后自动注入内置隐藏规则
- 监听抖音单页路由切换和播放器变化
- 自动尝试切换到当前最高可选画质
- 当已切换到 4K 后停止重复检测

## 目录说明

- `Douyin Clean & Best Quality.user.js`：主脚本，可直接安装
- `rules/ADG-rules.txt`：原始 AdGuard 规则参考文件
- `originals/`：合并前的原始文件归档

## 安装方法

1. 安装 Tampermonkey 等用户脚本管理器。
2. 打开 `Douyin Clean & Best Quality.user.js`。
3. 在脚本管理器中安装。
4. 访问 `https://www.douyin.com/` 测试。

## 注意

- 页面净化规则依赖抖音当前的 DOM 结构；如果抖音改版，部分选择器可能会失效。
- 自动最高画质逻辑依赖当前播放器结构；如果播放器改版，脚本可能需要更新。
- `rules/ADG-rules.txt` 主要用于后续维护和对照。

## 来源说明

这个项目由以下两部分整理合并而来：

- 原始“抖音自动最高画质”脚本
- 单独维护的 AdGuard 自定义规则文件

现在主脚本已经内嵌规则，不需要再额外配置 AdGuard。

## 许可证

MIT
