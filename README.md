# 番茄钟盲盒 · Pomodoro Blind Box

> 在 DeepSeek Harness 的输入框下方放一个番茄钟。每完成一个专注段，就开一个盲盒；15 件藏品、4 个稀有度，还有一本可以翻的图鉴。

一个 [DeepSeek Harness](https://github.com/deepseek-ai) Web UI 插件：纯前端、无依赖、无构建步骤、无网络请求。计时和收集进度只存在浏览器的 `localStorage` 里。

![MIT](https://img.shields.io/badge/license-MIT-green)
![DSH](https://img.shields.io/badge/DeepSeek%20Harness-Web%20UI-blue)

![浅色主题演示：输入框下方的番茄钟 → 连开两个盲盒（史诗 / 传说）→ 图鉴点亮](https://cdn.jsdelivr.net/gh/WU55UY/dsh-pomodoro-box@main/docs/preview.gif)

> 上面不是示意图：[`tools/render-preview.py`](tools/render-preview.py) 直接执行本仓库的 `client.js`，渲染真实的 `PomodoroDock` / `PomodoroBox` / `CollectionGrid` 组件，用真实 CSS keyframes、真实中文词典和 Harness 浅色主题 token 逐帧截图合成。三段分镜：计时 → 连开两个不同稀有度的盲盒 → 图鉴点亮刚开出的两件藏品。图片走 jsDelivr CDN，避免 `raw.githubusercontent.com` 在部分网络下不可达导致 README 里的图裂。

## 功能

- **番茄钟**：专注 15 / 25 / 45 / 60 分钟，短休息与长休息 3 / 5 / 10 / 15 分钟；开始、暂停、继续、跳过、重置。
- **长休息节奏**：每完成 4 个专注段自动进入一次长休息（时长可配）。
- **盲盒**：只有真正走完的专注段才会发盒；跳过不会。开箱有摇晃、开盖、物件弹出的动画，并适配 `prefers-reduced-motion`；等待与结果两态共用同一网格单元，卡片高度恒定，切换只做淡入。
- **15 件藏品 / 4 个稀有度**：普通 60%、稀有 25%、史诗 12%、传说 3%；档位内等概率。每次独立抽取，重复是正常的。
- **图鉴**：设置面板里的 5×3 网格，已收集的亮起并按稀有度着色；点格子查看名称、稀有度和描述，未发现的显示为锁定；集齐 15 件后显示「已集齐」，开箱卡也会带上「图鉴已集齐」。
- **双语与主题**：中英文词典；颜色、圆角、阴影全部走 Harness Theme token，跟随明暗主题。
- **持久化**：计时之外的设置、统计、图鉴和未领取的盲盒都存在 `localStorage`；刷新页面不会丢收集进度。

## 安装

需要 DeepSeek Harness 的 0.2.x 版本，最低 `0.2.1-rc.2`（`engines.dsh` 声明为 `>=0.2.1-rc.2 <0.3.0-0`；上界写成 `-0` 是为了在 `includePrerelease` 语义下把 `0.3.0` 的预发布版也挡在外面）。

**A. 从 npm 安装（推荐）**

```bash
dsh plugin --profile desktop add dsh-pomodoro-box
```

**B. 预打包 tarball（不经过 npm，25 KB）**

```bash
dsh plugin --profile desktop add https://github.com/WU55UY/dsh-pomodoro-box/releases/download/v1.2.4/dsh-pomodoro-box-1.2.4.tgz
```

`desktop` 换成你实际使用的 profile 名（Web 版通常是 `web`）。这两种方式都会把 `dsh-pomodoro-box` 写进该 profile 的 `dsh.profile.bundles`，重启一次 Harness 生效。

**C. 钉在 tag 上的 git 源**

```bash
dsh plugin --profile desktop add "git+https://github.com/WU55UY/dsh-pomodoro-box.git#v1.2.4"
```

**D. 插件市场**

加下面「插件市场」一节的索引源，然后在 **插件 → 发现** 里点安装。

**E. 从本地目录安装**

1. `git clone https://github.com/WU55UY/dsh-pomodoro-box.git`
2. 打开 Harness 的 **设置 → 插件**，选择安装 Bundle / Install bundle。
3. 目标选择克隆下来的 `dsh-pomodoro-box` 文件夹（绝对路径）。
4. 在插件列表里启用 **Pomodoro Blind Box**。
5. 输入框下方出现 `🍅 番茄钟 25:00 专注` 一栏即可使用；如果没出现，刷新一次页面。

装好之后，输入框下方长这样（同样是真实组件渲染，不是画的）：

![输入框下方的番茄钟栏](https://cdn.jsdelivr.net/gh/WU55UY/dsh-pomodoro-box@main/docs/dock.png)

这是一个标准 Bundle：`package.json` 里的 `dsh.bundle.patch` 把插件行插入当前 profile，`dsh.client` 把 `client.js` 作为 Web Client module 下发。包名与 `client.js` 里的 `__ModuleLoader__.load({ id })` 必须一致，都是 `dsh-pomodoro-box`。

> 插件注册在 `conversation.composer.dock` 和 `shell.overlay` 两个 Slot 上。

## 插件市场

本仓库自带一个 format-1 插件索引，可以直接加进 Harness：**插件 → 发现 → 添加索引源**，填

```
https://cdn.jsdelivr.net/gh/WU55UY/dsh-pomodoro-box@main/market/index.json
```

索引由 [`market/build-index.mjs`](market/build-index.mjs) 生成，条目里的 `source` 钉在具体提交上，所以市场里装到的和仓库里那一版完全一致。

> jsDelivr 会缓存分支引用（`@main`），索引改动最长可能 12 小时后才生效；要立刻生效或想要不可变 URL，把 `@main` 换成具体提交哈希即可。
>
> format-1 的 `source` 只支持 `npm` 和 `git` 两种，**没有 tarball 类型**，所以索引里走「git + 钉提交」，22 KB 的 tarball 快路径放在 awesome-dsh-plugin 的条目里。

改完索引后建议用官方校验器自检：

```bash
node -e "import('@deepseek-ai/dsh-plugin-market-index').then(m => console.log(m.parseMarketIndex(JSON.parse(require('fs').readFileSync('market/index.json','utf8')), 'https://example.com/index.json').plugins.length + ' plugin(s) OK'))"
```

## 使用

| 操作 | 说明 |
| --- | --- |
| 点计时 chip | 开始 / 暂停 / 继续 |
| ⏭ | 跳过当前阶段（**不发盲盒**） |
| ⟳ | 重置回专注起点 |
| ⚙ | 打开时长设置和图鉴 |
| 专注自然走完 | 弹出盲盒卡片：`收下` 或 `先收起来`（收起并把计时器折叠成小胶囊） |

盲盒卡片可以用 `Esc` 关闭；设置面板点击外部或按 `Esc` 也会收起。折叠后点胶囊即可恢复。

## 稀有度与概率

| 稀有度 | 出现概率 | 件数 | 档位内单件概率 |
| --- | ---: | ---: | ---: |
| 普通 Common | 60% | 6 | 10% |
| 稀有 Rare | 25% | 4 | 6.25% |
| 史诗 Epic | 12% | 3 | 4% |
| 传说 Legendary | 3% | 2 | 1.5% |

先抽稀有度，再在该档位内等概率抽一件。没有保底、不去重，所以连抽重复很正常。按当前权重模拟，集齐 15 件大约需要 **90 个番茄钟（中位数）**，平均约 109 个。

## 数据与隐私

所有数据都在本机浏览器里，键名 `dsh.pomodoro-box.v1`：

```json
{
  "version": 2,
  "settings": { "focus": 25, "shortBreak": 5, "longBreak": 15 },
  "stats": { "total": 12, "boxes": 12, "owned": ["coffee", "star"] },
  "pending": {
    "id": 12,
    "itemId": "star",
    "tier": "legendary",
    "newItem": true,
    "openedAt": 1760000000000
  }
}
```

`pending` 为 `null` 表示没有待领取的盒；`owned` 是已收集的物品 id，按发现顺序排列。插件不发送任何网络请求，也不读取 Harness 的会话内容。

想重置收集进度，在 DevTools 控制台执行：

```js
localStorage.removeItem('dsh.pomodoro-box.v1')
```

然后刷新页面。

## 开发

没有构建步骤：`client.js` 就是最终产物，由 Host 作为 Client module 直接下发。

```
pomodoro-box/
├── package.json        Bundle 清单：dsh.bundle.patch + dsh.client
├── cordis.patch.yml    插入插件行（id: pomodoro-box）
├── index.js            Host 半边，目前不需要做任何事
├── client.js           全部 UI 与状态机（单文件 Client module）
├── locale/
│   ├── zh.json         插件列表里的标题/描述 + 词典
│   └── en.json
├── docs/               README 用的真实渲染素材（dock.png / preview.gif）
├── tools/
│   └── render-preview.py  三段分镜动图 + dock 截图，均从 client.js 重新渲染
└── icon.svg            插件图标（原创 SVG）
```

几个容易踩的点：

- `client.js` 必须调用 `window.__ModuleLoader__.load({ id: 'dsh-pomodoro-box', factory })`，`id` 与包名一致；React 从共享模块表 `require('react')` 取，不写 JSX/TypeScript。
- `client.js` 里的 `EN` / `ZH` 是运行时词典；`locale/*.json` 是 Host 在插件列表里读取的元数据和同一份词典。**两边要同步改**。
- 修改 `client.js` 后，在插件管理里**禁用再启用**该插件即可让页面拿到新代码；如果 HMR 正在运行也可能自动生效。
- 主题只用 `--dsw-alias-*` token 和插件私有的 `--dsh-pomo-*` 变量；新增颜色请先确认 token 存在。
- 新增文件时记得加进 `package.json` 的 `files`。

## English

Pomodoro Blind Box is a DeepSeek Harness Web UI plugin that puts a focus timer under the composer. Every completed focus session opens one blind box; there are 15 collectible items across 4 rarities (60% / 25% / 12% / 3%), and a 5×3 collection gallery in the settings panel. Skipping a session never grants a box.

- **Install**: `dsh plugin --profile desktop add dsh-pomodoro-box` (npm), or attach the prebuilt tarball from the latest GitHub release if you would rather not go through npm; the market index below and installing the cloned folder as a bundle both work too.
- **Data**: everything lives in `localStorage` under `dsh.pomodoro-box.v1`; the plugin makes no network requests.
- **Dev**: no build step. `client.js` is loaded as a Client module via `window.__ModuleLoader__`; keep the runtime `EN`/`ZH` dictionaries in sync with `locale/*.json`.
- **Preview**: the GIF above is a three-shot cut rendered frame-by-frame from the shipped `client.js` by `tools/render-preview.py` — the composer dock, two blind boxes (epic / legendary), then the collection gallery lighting up. Real components, real CSS keyframes, real locale strings and light-theme tokens; not a mockup.

## License

[MIT](LICENSE)
