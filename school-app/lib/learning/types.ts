export type SkillDimension =
  | "meaningRecognition"
  | "readingRecognition"
  | "listeningRecognition"
  | "activeRecall"
  | "speakingProduction"
  | "writingProduction";

export type LearningStep =
  | "campus"
  | "today"
  | "preview"
  | "read"
  | "collect"
  | "listen"
  | "comprehension"
  | "dictation"
  | "activate"
  | "speak"
  | "write"
  | "report"
  | "notebook"
  | "library"
  | "profile";

export interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  audioSrc: string;
}

export interface VocabularyItem {
  id: string;
  term: string;
  definition: string;
  chineseMeaning: string;
  example: string;
  cloze: string;
  clozeAnswer: string;
  meaningChoices: string[];
  meaningAnswer: number;
  targetDimensions: SkillDimension[];
}

export interface LearningEvent {
  id: string;
  occurredAt: string;
  lessonId: string;
  type: string;
  vocabularyItemId?: string;
  dimension?: SkillDimension;
  result?: "correct" | "incorrect" | "partial" | "completed";
  evidence?: string;
}

export interface UserVocabularyState {
  vocabularyItemId: string;
  dimensions: Record<SkillDimension, number>;
  exposureCount: number;
  lastSeenAt?: string;
  nextReviewAt?: string;
}

export interface DictationResult {
  expected: string;
  actual: string;
  missing: string[];
  extra: string[];
  misspelled: Array<{ expected: string; actual: string }>;
  correct: boolean;
}

export interface ReviewTask {
  id: string;
  vocabularyItemId: string;
  dueAt: string;
  reason: string;
}

export interface LearningSession {
  schemaVersion: 1;
  lessonId: string;
  currentStep: LearningStep;
  completedSteps: LearningStep[];
  events: LearningEvent[];
  savedVocabularyIds: string[];
  vocabulary: Record<string, UserVocabularyState>;
  firstListenCompleted: boolean;
  transcriptRevealed: boolean;
  comprehensionAnswers: Record<string, number>;
  dictationInputs: Record<string, string>;
  dictationResults: Record<string, DictationResult>;
  meaningAnswers: Record<string, number>;
  recallAnswers: Record<string, string>;
  originalSentences: Record<string, string>;
  speakingPlan: string;
  speakingCompleted: boolean;
  writingResponse: string;
  writingSubmitted: boolean;
  conversationExpressionIds: string[];
  reviewTasks: ReviewTask[];
  lessonCompleted: boolean;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  articleTitle: string;
  articleParagraphs: string[];
  sourceLabel: string;
  sourceUrl: string;
  sourceNote: string;
  vocabulary: VocabularyItem[];
  transcript: TranscriptSegment[];
}

export interface TodayPlan {
  lessonId: string;
  title: string;
  minutes: number;
  stages: Array<{ label: string; detail: string }>;
}

export interface LearningRepository {
  getTodayPlan(): Promise<TodayPlan>;
  getLesson(id: string): Promise<Lesson>;
  getSession(lessonId: string): Promise<LearningSession | null>;
  saveEvent(event: LearningEvent): Promise<void>;
  saveSession(session: LearningSession): Promise<void>;
  getVocabularyState(itemId: string): Promise<UserVocabularyState | null>;
  getReviewQueue(): Promise<ReviewTask[]>;
}
