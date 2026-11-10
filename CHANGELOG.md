# Changelog

## Unreleased

- 修复开箱卡片的高度跳变：`client.js` 把「盲盒正在打开…」和结果区放进同一个 grid 单元（`.dshPomo_reveal`），两态只切换 `visibility` / `opacity`，卡片从挂载起高度恒定；`prefers-reduced-motion` 下过渡也归零。
- 理顺开箱时序：去掉 `dshPomoVanish` / `dshPomoLid` 的 0.58s 延迟和 `dshPomoItem` 的 0.68s 延迟，火花延迟从 0.72s 降到 0.06s。切到结果时礼盒立刻开盖、藏品立刻弹出，不再有「结果文字已出现、礼盒又摇一次」的空档。
- README 动图回到浅色主题（`body[data-ds-light-theme]`），保留三段分镜构图；深色版宝石与礼盒对比过强、整体发闷。
- `tools/render-preview.py`：GIF 调色板最终定为「全帧 + 藏品区域 3× 加权采样，FASTOCTREE 256 色」。此前 MEDIANCUT 会把 💎 整块压成单一灰蓝 `(152,183,209)`，现在保留 60+ 级蓝色渐变（`(103,185,250)` ~ `(151,216,252)`），体积反而从 554 KiB 降到 441 KiB。浏览器 profile 改为按 worker 线程复用系统临时目录，工作区只保留 PNG，并支持 `--reassemble` 用已有帧重调色板。构建产物 `build/` 已加入 `.gitignore`。

## 1.2.2

- 发布到 npm：从这一版起可以直接 `dsh plugin --profile <name> add dsh-pomodoro-box`，也可以 `tarball` / `git+…#v1.2.2` 安装。
- README 安装章节改为 npm 优先，tarball、git tag、插件索引、本地目录作为备选路径。
- 插件索引的 `source` 从「git 钉提交」切换为 `npm`，市场里装到的与 npm 上的一致。

## 1.2.1

- README 删掉「从 npm 安装」：这个包**还没有发布到 npm**，指向不存在包的命令只会 404；改为预打包 tarball、git 钉提交、插件索引、本地目录四条实测可用的路径。
- `CHANGELOG` 里 1.2.0 关于「发布到 npm」的措辞改成「为发布 npm 做准备」；`publishConfig` 仍在，等账号满足 npm 的 2FA 要求才发。
- 插件索引的 `publishTimestamp` 修正为当前时间（原值 `1762670000` 是 2025-11-09，比实际早一年，按时间排序的市场会把它埋到底部）。

## 1.2.0

- 为发布 npm 做准备：包名从 `@local/dsh-pomodoro-box` 改为 `dsh-pomodoro-box`，去掉 `private`，加 `publishConfig.access: public`（尚未实际发布）。
- 新增 `engines.dsh: ">=0.2.1-rc.2 <0.3.0-0"`，符合插件市场索引对每个版本强制声明兼容范围的规则。
- `client.js` 的 `__ModuleLoader__.load({ id })`、`cordis.patch.yml` 的 bundle 名同步改为新包名。
- `locale/*.json` 与 README 里的包名、标题同步更新。

## 1.1.0

- 新增设置面板里的 5×3 收集图鉴：已收集物品按稀有度着色，点击查看名称、稀有度和描述，未发现物品显示锁定状态。
- 集齐 15 件后显示「已集齐」进度，开箱卡片增加「图鉴已集齐」标签。
- 面板摘要改为「已完成番茄钟 / 已开出盲盒」，不再和图鉴计数重复。
- 读取存档时对 `owned` 去重并过滤未知物品 id，避免损坏的本地记录影响图鉴。
- 补充 README、MIT LICENSE 与仓库文件。

## 1.0.0

- 首个版本：可配置番茄钟、长休息节奏、15 件藏品与四档稀有度、开箱动画、中英双语、`localStorage` 持久化。
