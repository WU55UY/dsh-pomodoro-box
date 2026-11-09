# Changelog

## 1.2.0

- 发布到 npm：包名从 `@local/dsh-pomodoro-box` 改为 `dsh-pomodoro-box`，去掉 `private`，加 `publishConfig.access: public`。
- 新增 `engines.dsh: ">=0.2.1-rc.2 <0.3.0-0"`，符合插件市场索引对每个版本强制声明兼容范围的规则。
- `client.js` 的 `__ModuleLoader__.load({ id })`、`cordis.patch.yml` 的 bundle 名同步改为新包名。
- README 补充 npm 安装方式：`dsh plugin --profile web add dsh-pomodoro-box`。

## 1.1.0

- 新增设置面板里的 5×3 收集图鉴：已收集物品按稀有度着色，点击查看名称、稀有度和描述，未发现物品显示锁定状态。
- 集齐 15 件后显示「已集齐」进度，开箱卡片增加「图鉴已集齐」标签。
- 面板摘要改为「已完成番茄钟 / 已开出盲盒」，不再和图鉴计数重复。
- 读取存档时对 `owned` 去重并过滤未知物品 id，避免损坏的本地记录影响图鉴。
- 补充 README、MIT LICENSE 与仓库文件。

## 1.0.0

- 首个版本：可配置番茄钟、长休息节奏、15 件藏品与四档稀有度、开箱动画、中英双语、`localStorage` 持久化。
