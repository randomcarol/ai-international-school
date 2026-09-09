# AI International School · 可交互校园 Demo

打开 [index.html](./index.html)，无需安装依赖或配置 API。图片、样式、脚本均在本目录，离线可运行；只有查看官方来源需要联网。

## 本轮设计

从此前的设计概念收敛为一套连续体验：温暖的手绘校园剖面图 → 场景化教室 → 简约学习页面。美术借鉴模拟校园的空间表达与校园生活游戏的叙事构图，使用原创生成插画，没有截取参考游戏的画面作为产品背景。

用 imagegen 生成了三张统一方向的场景图，保存在 `assets/campus.png`、`assets/classroom.png`、`assets/courtyard.png`。场景负责空间与人物氛围，文字、导航和题目均由 HTML 渲染，因此不会把学习内容画死在图片里。

## 可走通的路径

1. 全景点击 Career classroom → 看教室和黑板 → Take a seat → 课程规划 → 选 Google / Amazon 题 → 写回答 → 固定追问 → 自查 → 完成标记。
2. 全景点击 Reading room → 教室入口 → 阅读页面 → 逐题选择与判分 → 解释 → 三题汇总 → 去找 Maya。
3. 全景点击 Maya / Courtyard café → 三个不同的对话开场 → 对应的下一句 → 输入回应 → 剧本回应与表达复盘。
4. Language studio → 会话选择题 → 重试或反馈 → Maya 对话。

地图支持拖动与缩放。右下角 Scenes 可直达各场景。角色目前是插画中的人物配合热点，不是能自由行走的小人；没有实现寻路、恋爱系统、校园建设或 3D 镜头。

## 内容来源与题目边界

核验日期：2026-09-09。

- **ETS**：[TOEFL iBT Reading Practice Questions](https://www.ets.org/pdfs/toefl/toefl-ibt-reading-practice-sets.pdf#page=8)，2023 公开练习资料，选择 Set 2 的 *Extinction of the Dinosaurs*，原文位于 PDF 第 8–9 页。Demo 中只提供简短改写学习笔记及三道原创理解题，完整文章通过官方链接阅读。不是官方原题复刻，也不声称适配 2026 考试结构。
- **Google**：[How to prepare for an interview](https://grow.google/grow-your-career/articles/interview-tips/)，官网页面日期为 2025-12-11。官网提供行为题、STAR 与具体证据的准备建议，但没有可核验的“新发布三道行为面试原题”。因此实现三道明确标注的指南改编题：困难决策、技术难题、可验证的个人贡献。没有将用户托管的 sites.google.com 网页当作 Google 官方发布。
- **Amazon**：[Leadership Principles](https://www.amazon.jobs/content/en/our-workplace/leadership-principles) 与 [Interview Loop](https://amazon.jobs/content/en/how-we-hire/interview-loop)。三道原创场景映射 Customer Obsession、Ownership、Have Backbone; Disagree and Commit，并各配一条追问。不是面试真题库。

## 数据与反馈

- 所有学习内容、NPC 回应和追问为固定脚本，无远端模型、语音录制或上传。
- 写作只提供 STAR 支架、语言开头、虚构示例、用户自行勾选的检查项。不生成伪装成 AI 评估的分数。
- 阅读按照三道原创题的固定答案判分，不换算成托福成绩。
- 回答和完成标记保存到本地 `localStorage` 的 `ais-campus-demo-v2`；浏览器不支持时仅当前会话可用。
- Scenes 中的 Reset 需要确认，只清理这个 Demo 自己的存储键。不要在公共设备填写真实敏感工作信息。
- 浏览器对 `file://` 的本地存储持久化行为可能不同；这是无账户的设计验证原型，不应作为正式学习档案。

## 下一步建议

先验证“找教室—进入—学习—回校园”的流程是否有沉浸感，再做真实 Agent。优先采用可交互的分层 2D 场景与角色精灵，沿用独立 HTML 学习页；暂不承担全 3D 校园成本。课程内容与学习证据应独立于场景，由同一份学习状态驱动黑板、任务与人物对话。

后续接真实评分时，要分别记录理解正确性、语言表达、沟通策略，保留具体证据与人工可修正反馈；不要用一个好感度或一个“英语分数”替代这些维度。

## 验证状态

JavaScriptCore 下通过 103 项断言，覆盖 35 个页面路由的模板渲染，以及作答、追问、自查完成、阅读正误反馈、会话分支、HTML 转义、存储不可用降级和清理范围。运行方式：在本目录执行 `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/runtime.js app.js tests/assertions.js`。

这些测试使用最小 DOM 替身，不等同于真实浏览器测试。三张图片均已确认存在且尺寸为 1536×1024。真实浏览器自动验收因工具审批阶段的账户额度限制被阻止；尚未完成桌面/移动端截图排版验收，请勿将上述断言数量理解为视觉验收通过。
