# AI International School — Daily English Slice

这是一个可完整走通的本地英语学习纵向切片。校园负责承载氛围、今日计划和学习结果；真正的产品主线是同一组表达在阅读、听力、提取、主动回忆、口语和写作中的迁移。

## 完整路径

```text
Campus / Today
→ Lesson Preview
→ Reading + Comprehension
→ Vocabulary Collection
→ First Listening (transcript locked)
→ Sentence Transcript + Comprehension
→ Dictation
→ Vocabulary Activation
→ Conversation with Maya
→ Writing Transfer
→ Evidence Report
→ Tomorrow Review
```

课程为原创 B2 级内容 `A Greener Career Fair`。目标表达为 `trade-off`、`prioritize`、`stakeholder`。英文文章参考 [U.S. EPA Green Meetings](https://www.epa.gov/p2/green-meetings) 的公开建议重新创作，并非复制原文。听力对话也是原创内容，8 个句段共约 82 秒；音频已作为本地 WAV 资源提交，运行时不请求 TTS 服务或 API key。

## 技术与数据

- Next.js App Router、React、TypeScript strict、Vinext
- 带版本号的 `localStorage` repository；只有一个项目专属键
- append-only `LearningEvent` 记录关键学习动作
- 六个独立词汇维度，识别与主动使用不会合并成一个“总分”
- 规则式听写差异、目标表达检测、口语练习说明与次日复习
- `get_today_learning_progress` 与 `open_learning_step` 两个可选 WebMCP 工具

主要实现位于：

- `components/learning-app.tsx`：完整用户旅程和交互
- `lib/learning/content.ts`：原创课程内容
- `lib/learning/repository.ts`：本地数据适配器
- `lib/learning/scoring.ts`：透明评分与文本规则
- `lib/learning/flow.ts`：顺序、断点续学和步骤锁定
- `tests/learning-domain.test.ts`：领域和代表性学习链测试

## 运行

要求 Node.js `>=22.13.0` 和 pnpm。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开终端输出的本地地址，默认通常是 `http://localhost:5173/`。

质量检查：

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

本机没有系统 Node 时，可把 Codex bundled runtime 的 Node 和 pnpm 目录临时加入 `PATH`，再执行同样的命令。

## 真实限制

- 口语步骤不申请麦克风权限，也不录音；完成与否由用户确认，表达证据只按准备文本识别，不能代表发音、流利度或语法评价。
- 听力只有精确的句段文件，没有伪造逐词时间轴；同步和重播粒度是句级。
- 本阶段只有一节课和简单的 24 小时复习任务，不是完整课程库或 FSRS 系统。
- 数据仅保存在当前浏览器设备；没有账户、云同步、数据库或跨设备恢复。
- 英文文章和规则式反馈适合产品验证，不等同于经过大规模教研标定的课程或能力测评。

## 范围

本阶段刻意没有实现课程搜索、TOEFL 体系、实时语音、LLM Agent、校园建设和社交关系数值。后续边界记录在 `docs/ROADMAP.md`。
