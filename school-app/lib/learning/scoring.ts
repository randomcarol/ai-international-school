import type { DictationResult, LearningSession, ReviewTask, SkillDimension, UserVocabularyState } from "./types";

export const SCORE_RULES: Record<SkillDimension, { correct: number; partial: number; incorrect: number }> = {
  meaningRecognition: { correct: 12, partial: 5, incorrect: 0 },
  readingRecognition: { correct: 10, partial: 4, incorrect: 0 },
  listeningRecognition: { correct: 12, partial: 5, incorrect: 0 },
  activeRecall: { correct: 16, partial: 7, incorrect: 0 },
  speakingProduction: { correct: 18, partial: 9, incorrect: 0 },
  writingProduction: { correct: 18, partial: 9, incorrect: 0 }
};

export const DIMENSIONS: SkillDimension[] = ["meaningRecognition", "readingRecognition", "listeningRecognition", "activeRecall", "speakingProduction", "writingProduction"];

export function emptyVocabularyState(vocabularyItemId: string): UserVocabularyState {
  return { vocabularyItemId, dimensions: Object.fromEntries(DIMENSIONS.map((key) => [key, 0])) as Record<SkillDimension, number>, exposureCount: 0 };
}

export function updateVocabularyState(state: UserVocabularyState | undefined, dimension: SkillDimension, result: "correct" | "partial" | "incorrect", evidenceAt = new Date().toISOString()): UserVocabularyState {
  const current = state ?? emptyVocabularyState("unknown");
  return {
    ...current,
    dimensions: { ...current.dimensions, [dimension]: Math.min(100, current.dimensions[dimension] + SCORE_RULES[dimension][result]) },
    exposureCount: current.exposureCount + 1,
    lastSeenAt: evidenceAt
  };
}

export function normalizeText(value: string): string[] {
  return value.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'-]+/g, " ").replace(/[.,!?;:]$/g, "").trim().split(/\s+/).filter(Boolean);
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = old;
    }
  }
  return row[b.length];
}

export function diffDictation(expected: string, actual: string): DictationResult {
  const a = normalizeText(expected); const b = normalizeText(actual);
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) for (let j = b.length - 1; j >= 0; j -= 1) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const missing: string[] = []; const extra: string[] = [];
  let i = 0; let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i += 1; j += 1; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { missing.push(a[i]); i += 1; }
    else { extra.push(b[j]); j += 1; }
  }
  missing.push(...a.slice(i)); extra.push(...b.slice(j));
  const misspelled: Array<{ expected: string; actual: string }> = [];
  for (let mi = missing.length - 1; mi >= 0; mi -= 1) {
    const candidate = extra.findIndex((word) => distance(missing[mi], word) <= Math.max(1, Math.floor(missing[mi].length / 4)));
    if (candidate >= 0) { misspelled.push({ expected: missing[mi], actual: extra[candidate] }); missing.splice(mi, 1); extra.splice(candidate, 1); }
  }
  return { expected, actual, missing, extra, misspelled, correct: missing.length === 0 && extra.length === 0 && misspelled.length === 0 };
}

export function targetExpressionsIn(text: string): string[] {
  const normalized = text.toLowerCase();
  const patterns: Record<string, RegExp> = {
    "trade-off": /\btrade[ -]?offs?\b/i,
    prioritize: /\bprioriti[sz](?:e|es|ed|ing)\b/i,
    stakeholder: /\bstakeholders?\b/i
  };
  return Object.entries(patterns).filter(([, pattern]) => pattern.test(normalized)).map(([id]) => id);
}

export function usefulOriginalSentence(text: string, vocabularyItemId: string): boolean {
  return normalizeText(text).length >= 6 && targetExpressionsIn(text).includes(vocabularyItemId);
}

export function createReviewTasks(session: LearningSession, now = new Date()): ReviewTask[] {
  const due = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  return Object.values(session.vocabulary).map((item) => {
    const active = Math.max(item.dimensions.speakingProduction, item.dimensions.writingProduction);
    const reason = active > 0 ? "Use it once more in a fresh context." : "You recognized it, but have not used it actively yet.";
    return { id: `review-${session.lessonId}-${item.vocabularyItemId}`, vocabularyItemId: item.vocabularyItemId, dueAt: due, reason };
  });
}

export function wordCount(value: string): number {
  return normalizeText(value).length;
}
