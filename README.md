# AI International School · AI 国际学校

中文名：AI 英语学习校园

一个从五组产品方向、可交互校园概念，迭代到“每日英语学习闭环”纵向切片的 AI 教育产品项目。它不是只展示聊天框，而是把阅读、听力、提取、主动回忆、口语、写作和学习证据串成一条可完成、可恢复、可解释的学习路径。

![桌面端校园主页](school-app/docs/screenshots/desktop-campus.png)

## 项目亮点

- 从 5 个设计概念收敛到校园叙事与学习任务结合的产品方向。
- 用原创 B2 课程贯通阅读、句级听力、听写、词汇激活、对话和写作迁移。
- 用 append-only 学习事件、六维词汇状态和证据报告记录真实学习动作。
- 明确区分已实现的透明规则反馈与未来的 LLM、语音能力，避免演示超卖。
- 桌面端和移动端均完成关键路径验证，并保留自动测试。

## 仓库结构

- `design-concepts/`：五组早期产品视觉与交互方向。
- `campus-demo/`：从概念到校园体验的无构建原型。
- `school-app/`：Next.js、React、TypeScript 实现的完整学习纵向切片。
- `NEXT-DEVELOPMENT-PROMPT.md`：从校园原型进入 MVP 的阶段计划。

## 本地运行

```bash
cd school-app
pnpm install --frozen-lockfile
pnpm dev
```

质量检查：

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

更详细的架构、课程来源、数据策略与限制见 [school-app/README.md](school-app/README.md)。

## AI 定位

本项目以 AI 原生学习产品为方向，并采用 AI 辅助开发；当前 MVP 的课程内容为原创，反馈和评分是透明规则，尚未接入 LLM 或实时语音模型。这样的分层让当前能力可验证，也为后续模型评测留下清晰基线。详见 [AI 协作与能力边界](docs/AI-DEVELOPMENT.md)。

## 版本

本地 Git 对象中恢复了四个完整快照：设计探索、校园概念、MVP 路线图和学习应用。详见 [版本演进](DEVELOPMENT_HISTORY.md)。
