import type { LearningSession, LearningStep } from "./types";

export const LESSON_FLOW: LearningStep[] = [
  "preview", "read", "collect", "listen", "comprehension",
  "dictation", "activate", "speak", "write", "report"
];

export const STEP_LABELS: Partial<Record<LearningStep, string>> = {
  preview: "Preview", read: "Read", collect: "Collect", listen: "Listen",
  comprehension: "Check", dictation: "Dictate", activate: "Activate",
  speak: "Speak", write: "Write", report: "Reflect"
};

export function completedPercent(session: Pick<LearningSession, "completedSteps">) {
  const completed = LESSON_FLOW.filter((step) => session.completedSteps.includes(step)).length;
  return Math.round((completed / LESSON_FLOW.length) * 100);
}

export function resumeStep(session: Pick<LearningSession, "completedSteps" | "lessonCompleted">): LearningStep {
  if (session.lessonCompleted) return "report";
  return LESSON_FLOW.find((step) => !session.completedSteps.includes(step)) ?? "report";
}

export function canOpenStep(session: Pick<LearningSession, "completedSteps" | "lessonCompleted">, step: LearningStep) {
  if (!LESSON_FLOW.includes(step)) return true;
  if (session.lessonCompleted || step === "preview" || session.completedSteps.includes(step)) return true;
  const index = LESSON_FLOW.indexOf(step);
  return index > 0 && session.completedSteps.includes(LESSON_FLOW[index - 1]);
}
