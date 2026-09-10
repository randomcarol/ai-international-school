import test from "node:test";
import assert from "node:assert/strict";
import { canOpenStep, completedPercent, LESSON_FLOW, resumeStep } from "../lib/learning/flow";
import { createInitialSession, LocalLearningRepository, STORAGE_KEY, validSession } from "../lib/learning/repository";
import {
  createReviewTasks, diffDictation, emptyVocabularyState, normalizeText,
  targetExpressionsIn, updateVocabularyState, usefulOriginalSentence
} from "../lib/learning/scoring";

test("dictation ignores capitalization and punctuation but reports spelling differences", () => {
  assert.deepEqual(normalizeText("Good, we should prioritize it!"), ["good", "we", "should", "prioritize", "it"]);
  assert.equal(diffDictation("We should prioritize students.", "we should prioritize students").correct, true);
  const result = diffDictation("Each stakeholder matters.", "Each stakehoder matters.");
  assert.equal(result.correct, false);
  assert.deepEqual(result.misspelled, [{ expected: "stakeholder", actual: "stakehoder" }]);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.extra, []);
});

test("vocabulary dimensions accumulate independently and never exceed 100", () => {
  let state = emptyVocabularyState("prioritize");
  state = updateVocabularyState(state, "readingRecognition", "partial", "2026-09-11T00:00:00.000Z");
  state = updateVocabularyState(state, "writingProduction", "correct", "2026-09-11T00:01:00.000Z");
  assert.equal(state.dimensions.readingRecognition, 4);
  assert.equal(state.dimensions.writingProduction, 18);
  assert.equal(state.dimensions.speakingProduction, 0);
  for (let index = 0; index < 10; index += 1) state = updateVocabularyState(state, "writingProduction", "correct");
  assert.equal(state.dimensions.writingProduction, 100);
  assert.equal(state.exposureCount, 12);
});

test("target expression detection handles inflections and validates original use", () => {
  assert.deepEqual(targetExpressionsIn("Stakeholders prioritized a fair tradeoff."), ["trade-off", "prioritize", "stakeholder"]);
  assert.equal(usefulOriginalSentence("I would prioritize clear directions for every stakeholder.", "prioritize"), true);
  assert.equal(usefulOriginalSentence("prioritize now", "prioritize"), false);
});

test("review tasks are deterministic, unique, and due exactly 24 hours later", () => {
  const session = createInitialSession();
  session.vocabulary["trade-off"] = updateVocabularyState(session.vocabulary["trade-off"], "writingProduction", "correct");
  const now = new Date("2026-09-11T03:00:00.000Z");
  const tasks = createReviewTasks(session, now);
  assert.equal(tasks.length, 3);
  assert.equal(new Set(tasks.map((task) => task.id)).size, 3);
  assert.ok(tasks.every((task) => task.dueAt === "2026-09-12T03:00:00.000Z"));
  assert.match(tasks.find((task) => task.vocabularyItemId === "trade-off")!.reason, /fresh context/);
  assert.match(tasks.find((task) => task.vocabularyItemId === "stakeholder")!.reason, /not used it actively/);
});

test("the lesson resumes at the first incomplete step and locks future steps", () => {
  const session = createInitialSession();
  assert.equal(LESSON_FLOW.length, 10);
  assert.equal(resumeStep(session), "preview");
  assert.equal(canOpenStep(session, "preview"), true);
  assert.equal(canOpenStep(session, "read"), false);
  session.completedSteps.push("preview", "read", "collect");
  assert.equal(resumeStep(session), "listen");
  assert.equal(canOpenStep(session, "listen"), true);
  assert.equal(canOpenStep(session, "write"), false);
  assert.equal(completedPercent(session), 30);
});

test("the storage adapter recovers from corrupt data and reloads a valid session", async () => {
  let stored: string | null = "not-json";
  const localStorage = {
    getItem: (key: string) => key === STORAGE_KEY ? stored : null,
    setItem: (key: string, value: string) => { if (key === STORAGE_KEY) stored = value; },
    removeItem: (key: string) => { if (key === STORAGE_KEY) stored = null; }
  };
  Object.defineProperty(globalThis, "window", { value: { localStorage }, configurable: true });
  const first = new LocalLearningRepository();
  const recovered = await first.getSession("greener-career-fair-001");
  assert.equal(recovered?.currentStep, "campus");
  recovered!.completedSteps.push("preview");
  await first.saveSession(recovered!);
  const second = new LocalLearningRepository();
  const reloaded = await second.getSession("greener-career-fair-001");
  assert.equal(validSession(reloaded), true);
  assert.deepEqual(reloaded?.completedSteps, ["preview"]);
});

test("a representative journey preserves evidence across all five skills", () => {
  const session = createInitialSession();
  const id = "stakeholder";
  session.vocabulary[id] = updateVocabularyState(session.vocabulary[id], "readingRecognition", "partial");
  session.vocabulary[id] = updateVocabularyState(session.vocabulary[id], "listeningRecognition", "correct");
  session.vocabulary[id] = updateVocabularyState(session.vocabulary[id], "activeRecall", "correct");
  session.vocabulary[id] = updateVocabularyState(session.vocabulary[id], "speakingProduction", "partial");
  session.vocabulary[id] = updateVocabularyState(session.vocabulary[id], "writingProduction", "correct");
  session.savedVocabularyIds.push(id);
  session.speakingCompleted = true;
  session.writingSubmitted = true;
  session.reviewTasks = createReviewTasks(session);
  const dimensions = session.vocabulary[id].dimensions;
  assert.ok(dimensions.readingRecognition > 0);
  assert.ok(dimensions.listeningRecognition > 0);
  assert.ok(dimensions.activeRecall > 0);
  assert.ok(dimensions.speakingProduction > 0);
  assert.ok(dimensions.writingProduction > 0);
  assert.ok(session.reviewTasks.some((task) => task.vocabularyItemId === id));
});
