# arXiv Keyword Pin 🏷️

在 arXiv 文章列表页中，按关键词在标题、作者、摘要中匹配，将命中文章**置顶显示并高亮**的油猴脚本。

适合高能物理等领域研究者快速筛选每日新文章。

## 功能

- 🔝 **关键词置顶**：匹配的文章自动排到列表最前面
- 🌟 **高亮标记**：匹配的文章左侧红色竖线 + 黄色背景，关键词文本黄色底色
- 🔍 **多关键词**：空格分隔多个关键词，同时匹配
- 📝 **高级配置**：每行一个关键词，支持含空格的短语（如 `dark matter`）
- ⚡ **正则模式**：勾选后关键词按正则表达式匹配
- 💾 **自动持久化**：关键词保存在本地，下次打开自动生效
- 🎯 **匹配范围**：标题 + 作者 + 摘要全文

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展（[Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) / [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) / [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)）
2. 点击下方链接安装脚本：

   👉 **​[点击安装](https://github.com/ZhongC01/arxiv-keyword-pin/raw/main/arxiv_keyword_pin.user.js)​**

3. 打开 [arXiv 列表页](https://arxiv.org/list/hep-ph/new)，页面顶部会出现关键词工具栏

## 使用方法

### 快速模式

在工具栏输入框中输入关键词（空格分隔），按回车或点击「应用」：

axion dark matter gravitational wave


### 高级配置

点击 ⚙ 按钮，弹出编辑器，每行一个关键词，适合输入含空格的短语：

axion
dark matter
gravitational wave
Wilson coefficient
^(muon|mu) collider


最后一行是正则，需要勾选「正则模式」才生效。

### 选项

| 选项 | 说明 |
|------|------|
| 区分大小写 | 默认不区分，勾选后严格匹配大小写 |
| 正则模式 | 勾选后每个关键词按正则表达式解析 |

### 效果示意

匹配的文章会被移到列表最前面，并带有视觉标记：

- 左侧 **红色竖线** 标识命中文章
- 背景 **浅黄色渐变** 区分未命中文章
- 匹配的关键词文本 **黄色底色** 高亮
- 列表顶部显示 **命中数量** 和 **匹配关键词**
- 匹配区与未匹配区之间有 **分隔线**

## 适用页面

所有 `https://arxiv.org/list/*` 下的列表页，例如：

- [hep-ph 新文章](https://arxiv.org/list/hep-ph/new)（高能物理 - 唯象）
- [hep-th 新文章](https://arxiv.org/list/hep-th/new)（高能物理 - 理论）
- [astro-ph.CO 新文章](https://arxiv.org/list/astro-ph.CO/new)（宇宙学）
- [gr-qc 新文章](https://arxiv.org/list/gr-qc/new)（广义相对论与量子宇宙学）
- [hep-ex 新文章](https://arxiv.org/list/hep-ex/new)（高能物理 - 实验）
- 以及其他所有 arXiv 分类列表页

## 常见问题

**Q：关键词保存在哪里？会不会丢失？​**

关键词保存在 Tampermonkey 的本地存储（GM_setValue）中，不会随页面刷新丢失。但清除浏览器数据或重装 Tampermonkey 时会丢失，建议在高级配置中备份。

**Q：可以用中文关键词吗？​**

可以，脚本对任何语言的文本都有效。但 arXiv 文章的标题和摘要绝大多数是英文，中文关键词大概率匹配不到。

**Q：正则模式怎么用？​**

勾选「正则模式」后，每个关键词都会被当作 JavaScript 正则表达式解析。例如：

- `^(muon|mu) collider` — 匹配以 muon collider 或 mu collider 开头的文本
- `top.{0,5}higgs` — 匹配 top 和 higgs 之间间隔不超过 5 个字符
- `\d+\s*TeV` — 匹配数字 + TeV（如 10 TeV、13TeV）

如果正则语法有误，该条会被跳过并在控制台输出警告。

**Q：匹配顺序是怎样的？​**

所有命中文章保持原始相对顺序置于列表顶部，未命中文章保持原始相对顺序置于下方。

**Q：脚本会影响 arXiv 原有功能吗？​**

不会。脚本仅调整 DOM 顺序和添加视觉标记，不修改任何链接、不拦截请求、不改变页面原有功能。点击「清除」按钮可恢复原始顺序。

## 更新日志

### v1.1

- 首个公开版本
- 关键词置顶与高亮
- 多关键词 / 正则 / 大小写敏感支持
- 高级配置弹窗
- 自动持久化

## 许可证

[MIT License](LICENSE)


