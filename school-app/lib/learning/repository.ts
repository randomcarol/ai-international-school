"use client";

import { lesson, LESSON_ID, todayPlan } from "./content";
import { emptyVocabularyState } from "./scoring";
import type { LearningEvent, LearningRepository, LearningSession, ReviewTask, UserVocabularyState } from "./types";

const STORAGE_KEY = "ai-international-school:learning:v1";

export function createInitialSession(): LearningSession {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    lessonId: LESSON_ID,
    currentStep: "campus",
    completedSteps: [],
    events: [],
    savedVocabularyIds: [],
    vocabulary: Object.fromEntries(lesson.vocabulary.map((item) => [item.id, emptyVocabularyState(item.id)])),
    firstListenCompleted: false,
    transcriptRevealed: false,
    comprehensionAnswers: {},
    dictationInputs: {},
    dictationResults: {},
    meaningAnswers: {},
    recallAnswers: {},
    originalSentences: {},
    speakingPlan: "",
    speakingCompleted: false,
    writingResponse: "",
    writingSubmitted: false,
    conversationExpressionIds: [],
    reviewTasks: [],
    lessonCompleted: false,
    updatedAt: now
  };
}

export function validSession(value: unknown): value is LearningSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LearningSession>;
  return candidate.schemaVersion === 1 && candidate.lessonId === LESSON_ID && Array.isArray(candidate.events) && typeof candidate.currentStep === "string";
}

export class LocalLearningRepository implements LearningRepository {
  private memory: LearningSession | null = null;

  async getTodayPlan() { return todayPlan; }
  async getLesson(id: string) { if (id !== LESSON_ID) throw new Error("Lesson not found"); return lesson; }
  async getSession(lessonId: string) {
    if (lessonId !== LESSON_ID) return null;
    if (this.memory) return structuredClone(this.memory);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (validSession(parsed)) { this.memory = parsed; return structuredClone(parsed); }
      }
    } catch { /* recover with a fresh session */ }
    this.memory = createInitialSession();
    return structuredClone(this.memory);
  }
  async saveEvent(event: LearningEvent) {
    const session = (await this.getSession(LESSON_ID)) ?? createInitialSession();
    if (!session.events.some((item) => item.id === event.id)) session.events.push(event);
    await this.saveSession(session);
  }
  async saveSession(session: LearningSession) {
    const copy = { ...session, updatedAt: new Date().toISOString() };
    this.memory = structuredClone(copy);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(copy)); } catch { /* session still works in memory */ }
  }
  async getVocabularyState(itemId: string): Promise<UserVocabularyState | null> {
    const session = await this.getSession(LESSON_ID); return session?.vocabulary[itemId] ?? null;
  }
  async getReviewQueue(): Promise<ReviewTask[]> {
    const session = await this.getSession(LESSON_ID); return session?.reviewTasks ?? [];
  }
  async reset() {
    this.memory = createInitialSession();
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
    return structuredClone(this.memory);
  }
}

export const repository = new LocalLearningRepository();
export { STORAGE_KEY };
