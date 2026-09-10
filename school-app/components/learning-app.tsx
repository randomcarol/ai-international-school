"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookMarked, BookOpen, Check, CheckCircle2, ChevronRight,
  CircleAlert, Clock3, Headphones, Languages, Library, MessageCircle,
  NotebookPen, Pause, Play, RotateCcw, School, SkipBack, Sparkles, UserRound,
  Volume2, Waves
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  dictationSegmentIds, lesson, listeningQuestions, readingQuestions,
  speakingPrompt, todayPlan, writingPrompt
} from "@/lib/learning/content";
import { repository } from "@/lib/learning/repository";
import { canOpenStep, completedPercent, LESSON_FLOW, resumeStep, STEP_LABELS } from "@/lib/learning/flow";
import {
  createReviewTasks, diffDictation, targetExpressionsIn, updateVocabularyState,
  usefulOriginalSentence, wordCount
} from "@/lib/learning/scoring";
import type { LearningEvent, LearningSession, LearningStep } from "@/lib/learning/types";

function eventId(type: string) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addEvent(target: LearningSession, type: string, options: Partial<LearningEvent> = {}) {
  target.events.push({ id: eventId(type), occurredAt: new Date().toISOString(), lessonId: lesson.id, type, ...options });
}

function targetLabel(id: string) {
  return lesson.vocabulary.find((item) => item.id === id)?.term ?? id;
}

function HighlightedText({ text, onWord }: { text: string; onWord: (id: string) => void }) {
  const parts = text.split(/(trade[- ]?offs?|prioriti[sz](?:e|es|ed|ing)|stakeholders?)/gi);
  return <>{parts.map((part, index) => {
    const id = targetExpressionsIn(part)[0];
    return id ? <button className="word-link" type="button" key={`${part}-${index}`} onClick={() => onWord(id)}>{part}</button> : part;
  })}</>;
}

function QuestionSet({ questions, answers, onAnswer }: {
  questions: Array<{ id: string; prompt: string; options: string[]; answer: number; explanation: string }>;
  answers: Record<string, number>;
  onAnswer: (id: string, answer: number, correct: boolean) => void;
}) {
  return <div className="question-stack">{questions.map((question, questionIndex) => {
    const chosen = answers[question.id]; const answered = Number.isInteger(chosen);
    return <article className="question-card" key={question.id}>
      <p className="section-kicker">QUESTION {questionIndex + 1} OF {questions.length}</p>
      <h3>{question.prompt}</h3>
      <div className="answer-list">{question.options.map((option, index) => {
        const status = answered ? index === question.answer ? "correct" : index === chosen ? "incorrect" : "muted" : "";
        return <button type="button" className={`answer-option ${status}`} key={option} disabled={answered} onClick={() => onAnswer(question.id, index, index === question.answer)}>
          <span>{String.fromCharCode(65 + index)}</span>{option}{status === "correct" && <Check aria-hidden="true" />}
        </button>;
      })}</div>
      {answered && <p className={`answer-note ${chosen === question.answer ? "success" : "retry"}`}><b>{chosen === question.answer ? "Correct." : "Review it once more."}</b> {question.explanation}</p>}
    </article>;
  })}</div>;
}

export function LearningApp() {
  const [session, setSession] = useState<LearningSession | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showChinese, setShowChinese] = useState<Record<string, boolean>>({});
  const [storageNote, setStorageNote] = useState("Saved on this device");
  const [speakingSeconds, setSpeakingSeconds] = useState(45);
  const [speakingActive, setSpeakingActive] = useState(false);

  useEffect(() => { void repository.getSession(lesson.id).then((value) => setSession(value)); }, []);

  const mutate = useCallback((recipe: (next: LearningSession) => void) => {
    setSession((current) => {
      if (!current) return current;
      const next = structuredClone(current); recipe(next); next.updatedAt = new Date().toISOString();
      void repository.saveSession(next).catch(() => setStorageNote("Progress is available for this visit only"));
      return next;
    });
  }, []);

  const navigate = useCallback((step: LearningStep, complete?: LearningStep) => {
    mutate((next) => {
      if (complete && !next.completedSteps.includes(complete)) { next.completedSteps.push(complete); addEvent(next, `${complete}_completed`, { result: "completed" }); }
      if (step === "report" && !next.lessonCompleted) {
        next.lessonCompleted = true;
        if (!next.completedSteps.includes("report")) next.completedSteps.push("report");
        next.reviewTasks = createReviewTasks(next);
        addEvent(next, "lesson_completed", { result: "completed" });
        next.reviewTasks.forEach((task) => addEvent(next, "review_scheduled", { vocabularyItemId: task.vocabularyItemId, result: "completed", evidence: task.reason }));
      }
      next.currentStep = step;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [mutate]);

  useEffect(() => {
    if (!speakingActive || speakingSeconds <= 0) return;
    const timer = window.setTimeout(() => setSpeakingSeconds((value) => {
      if (value <= 1) { setSpeakingActive(false); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearTimeout(timer);
  }, [speakingActive, speakingSeconds]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool || !session) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({
        name: "get_today_learning_progress", title: "Get today’s learning progress",
        description: "Read the visible lesson step, completed steps, saved vocabulary, and scheduled reviews.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => ({ currentStep: session.currentStep, completedSteps: session.completedSteps, savedVocabulary: session.savedVocabularyIds, reviewTasks: session.reviewTasks })
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: "open_learning_step", title: "Open a learning step",
        description: "Navigate the visible app to one available step in today’s lesson without marking it complete.",
        inputSchema: { type: "object", properties: { step: { type: "string", enum: LESSON_FLOW } }, required: ["step"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input: unknown) => {
          const step = (input as { step?: LearningStep })?.step;
          if (!step || !LESSON_FLOW.includes(step)) throw new Error("Invalid learning step");
          if (!canOpenStep(session, step)) throw new Error("Complete the previous learning step first");
          navigate(step); return { opened: step };
        }
      }, { signal: lifecycle.signal });
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [session, navigate]);

  if (!session) return <main className="loading-screen"><span className="crest">AI</span><p>Opening your school day…</p></main>;

  const step = session.currentStep;
  const progress = completedPercent(session);
  const activeNav = ["campus", "today", "notebook", "library", "profile"].includes(step) ? step : "today";

  return <main className="app-shell">
    <AppHeader active={activeNav} onNavigate={navigate} />
    {step === "campus" && <Campus session={session} onNavigate={navigate} />}
    {step === "today" && <Today session={session} onNavigate={navigate} />}
    {step === "preview" && <LessonFrame session={session} progress={progress} step={step} onNavigate={navigate}><Preview onNavigate={navigate} /></LessonFrame>}
    {step === "read" && <LessonFrame session={session} progress={progress} step={step} onNavigate={navigate}><Read session={session} selectedWord={selectedWord} setSelectedWord={setSelectedWord} onNavigate={navigate} mutate={mutate} /></LessonFrame>}
    {step === "collect" && <LessonFrame session={session} progress={progress} step={step} onNavigate={navigate}><Collect session={session} showChinese={showChinese} setShowChinese={setShowChinese} mutate={mutate} onNavigate={navigate} /></LessonFrame>}
    {step === "listen" && <LessonFrame session={session} progress={progress} step={step} onNavigate={navigate}><Listening session={session} mutate={mutate} onNavigate={navigate} setSelectedWord={setSelectedWord} selectedWord={selectedWord} /></LessonFrame>}
    {step === "comprehension" && <LessonFrame session={session} progress={progress} step={step} onNavigate={navigate}><Comprehension session={session} mutate={mutate} onNavigate={navigate} /></LessonFrame>}
    {step === "dictation" && <LessonFrame session={session} progress={progress} step={step} onNavigate={navigate}><Dictation session={session} mutate={mutate} onNavigate={navigate} /></LessonFrame>}
    {step === "activate" && <LessonFrame session={session} progress={progress} step={step} onNavigate={navigate}><Activate session={session} mutate={mutate} onNavigate={navigate} /></LessonFrame>}
    {step === "speak" && <LessonFrame session={session} progress={progress} step={step} onNavigate={navigate}><Speak session={session} mutate={mutate} onNavigate={navigate} seconds={speakingSeconds} active={speakingActive} setActive={setSpeakingActive} setSeconds={setSpeakingSeconds} /></LessonFrame>}
    {step === "write" && <LessonFrame session={session} progress={progress} step={step} onNavigate={navigate}><Write session={session} mutate={mutate} onNavigate={navigate} /></LessonFrame>}
    {step === "report" && <LessonFrame session={session} progress={progress} step={step} onNavigate={navigate}><Report session={session} onNavigate={navigate} /></LessonFrame>}
    {step === "notebook" && <Notebook session={session} onNavigate={navigate} onReset={async () => setSession(await repository.reset())} />}
    {step === "library" && <EmptyState type="library" onNavigate={navigate} />}
    {step === "profile" && <EmptyState type="profile" onNavigate={navigate} />}
    <div className="device-note"><span />{storageNote}</div>
  </main>;
}

function AppHeader({ active, onNavigate }: { active: string; onNavigate: (step: LearningStep) => void }) {
  const items: Array<[LearningStep, string, typeof School]> = [["campus", "Campus", School], ["today", "Today", Clock3], ["library", "Library", Library], ["notebook", "Notebook", BookMarked], ["profile", "Profile", UserRound]];
  return <header className="topbar">
    <button className="brand-mark" type="button" onClick={() => onNavigate("campus")} aria-label="AI International School campus">
      <span className="crest">AI</span><span><b>AI INTERNATIONAL</b><small>SCHOOL · FALL TERM</small></span>
    </button>
    <nav className="main-nav" aria-label="Primary navigation">{items.map(([id, label, Icon]) => <button type="button" className={active === id ? "active" : ""} onClick={() => onNavigate(id)} key={id}><Icon /><span>{label}</span></button>)}</nav>
    <span className="profile-mark" aria-label="Student DZ">DZ</span>
  </header>;
}

function Campus({ session, onNavigate }: { session: LearningSession; onNavigate: (step: LearningStep) => void }) {
  const done = session.lessonCompleted;
  const next = resumeStep(session);
  return <section className="campus-home">
    <Image className="campus-image" src="/assets/campus.png" alt="A hand-painted cutaway international school campus" fill priority sizes="100vw" />
    <div className="campus-shade" />
    <aside className="today-card">
      <p className="kicker">FRIDAY · SEPTEMBER 11</p>
      <h1>{done ? <>Lesson complete.<br />Three words in motion.</> : <>One useful lesson.<br />Three words to keep.</>}</h1>
      <p className="lesson-title">{lesson.title}</p>
      <div className="lesson-meta"><span>{lesson.level}</span><span>{lesson.duration}</span><span>Original lesson</span></div>
      <div className="stage-row" aria-label="Today’s three learning stages">{[[Headphones,"Understand"],[BookOpen,"Activate"],[MessageCircle,"Use"]].map(([Icon,label]) => { const I=Icon as typeof Headphones; return <div key={String(label)}><I /><span>{String(label)}</span></div>; })}</div>
      <Progress value={completedPercent(session)} aria-label="Lesson progress" />
      <Button size="lg" className="primary-action" onClick={() => onNavigate(next)}>{done ? "Open lesson report" : session.completedSteps.length ? "Continue today’s lesson" : "Start today’s lesson"}<NotebookPen /></Button>
      {done && session.reviewTasks.length > 0 && <button className="tomorrow-note" onClick={() => onNavigate("notebook")}><span>Tomorrow</span><b>{session.reviewTasks.length} short reviews are ready</b><ChevronRight /></button>}
      <p className="privacy-note">Your progress stays on this device.</p>
    </aside>
    <button type="button" className="campus-label classroom-label" onClick={() => onNavigate("preview")}><span>Career classroom</span><small>Today · 09:30</small></button>
    <button type="button" className="campus-label library-label" onClick={() => onNavigate(canOpenStep(session, "read") ? "read" : "preview")}><span>Reading room</span><small>{canOpenStep(session, "read") ? "Open today’s article" : "Preview the lesson first"}</small></button>
  </section>;
}

function Today({ session, onNavigate }: { session: LearningSession; onNavigate: (step: LearningStep) => void }) {
  const next = resumeStep(session);
  return <section className="page-surface"><header className="page-heading"><p className="section-kicker">TODAY · 15 MINUTES</p><h1>Your English, in one connected lesson.</h1><p>Understand an idea, activate three expressions, then use them aloud and in writing.</p></header>
    <div className="today-grid"><article className="schedule-card featured"><div className="schedule-time">09:30</div><div><p className="section-kicker">CAREER CLASSROOM · {lesson.level}</p><h2>{lesson.title}</h2><p>{lesson.description}</p><div className="lesson-meta"><span>Read</span><span>Listen</span><span>Speak</span><span>Write</span></div><Progress value={completedPercent(session)} /><Button size="lg" onClick={() => onNavigate(next)}>{session.lessonCompleted ? "View your report" : session.completedSteps.length ? "Continue lesson" : "Start lesson"}<ArrowRight /></Button></div></article>
      <aside className="schedule-side"><h3>Today’s rhythm</h3>{todayPlan.stages.map((stage, index) => <div className="mini-stage" key={stage.label}><span>0{index+1}</span><p><b>{stage.label}</b><small>{stage.detail}</small></p></div>)}<div className="goal-note"><Sparkles /><p><b>Today’s transfer goal</b><span>Use one expression in speech and two in writing.</span></p></div></aside></div>
  </section>;
}

function LessonFrame({ children, session, progress, step, onNavigate }: { children: React.ReactNode; session: LearningSession; progress: number; step: LearningStep; onNavigate: (step: LearningStep) => void }) {
  return <section className="lesson-shell"><aside className="lesson-rail"><button className="rail-back" onClick={() => onNavigate("today")}><ArrowLeft />Today</button><div><p className="section-kicker">TODAY’S LESSON</p><h2>{lesson.title}</h2></div><nav aria-label="Lesson steps">{LESSON_FLOW.map((id, index) => { const available=canOpenStep(session,id); return <button key={id} disabled={!available} aria-label={`${STEP_LABELS[id]}${available?"":" (locked)"}`} className={id === step ? "active" : session.completedSteps.includes(id) ? "complete" : ""} onClick={() => onNavigate(id)}><span>{session.completedSteps.includes(id) ? <Check /> : index + 1}</span>{STEP_LABELS[id]}</button> })}</nav><div className="rail-progress"><p><span>Your progress</span><b>{progress}%</b></p><Progress value={progress} /></div></aside><div className="lesson-work"><div className="mobile-lesson-progress"><span>{STEP_LABELS[step]} · {Math.max(1,LESSON_FLOW.indexOf(step)+1)} / {LESSON_FLOW.length}</span><Progress value={progress} /></div>{children}</div></section>;
}

function Preview({ onNavigate }: { onNavigate: (step: LearningStep, complete?: LearningStep) => void }) {
  return <div className="content-narrow"><header className="lesson-heading"><p className="section-kicker">LESSON PREVIEW · {lesson.duration}</p><h1>{lesson.title}</h1><p>{lesson.description}</p></header><div className="preview-visual"><Image src="/assets/classroom.png" alt="A warm classroom ready for today’s lesson" fill sizes="(max-width: 760px) 100vw, 800px" /><div><span>Today’s transfer</span><b>Notice → hear → use</b></div></div><div className="objective-grid"><article><BookOpen /><h3>Read for an idea</h3><p>See how a campus team makes a practical sustainability decision.</p></article><article><Waves /><h3>Hear a new context</h3><p>Listen once without text, then work with sentence-level audio.</p></article><article><MessageCircle /><h3>Make the language yours</h3><p>Use today’s expressions in speech and writing.</p></article></div><div className="word-preview">{lesson.vocabulary.map((word) => <span key={word.id}>{word.term}</span>)}</div><div className="action-row"><Button variant="outline" onClick={() => onNavigate("today")}><ArrowLeft />Back</Button><Button size="lg" onClick={() => onNavigate("read", "preview")}>Begin with the article<ArrowRight /></Button></div></div>;
}

function Read({ session, selectedWord, setSelectedWord, mutate, onNavigate }: { session: LearningSession; selectedWord: string | null; setSelectedWord: (id: string | null) => void; mutate: (recipe: (next: LearningSession) => void) => void; onNavigate: (step: LearningStep, complete?: LearningStep) => void }) {
  const allAnswered = readingQuestions.every((q) => Number.isInteger(session.comprehensionAnswers[q.id]));
  const openWord = (id: string) => { setSelectedWord(id); mutate((next) => { const current=next.vocabulary[id]; next.vocabulary[id]=updateVocabularyState(current,"readingRecognition","partial"); next.vocabulary[id].vocabularyItemId=id; addEvent(next,"vocabulary_opened",{vocabularyItemId:id,dimension:"readingRecognition",result:"partial",evidence:"Opened from the reading article"}); }); };
  const word = lesson.vocabulary.find((item) => item.id === selectedWord);
  return <div className="reading-layout"><article className="article-paper"><p className="section-kicker">READ · ORIGINAL ARTICLE</p><h1>{lesson.articleTitle}</h1><p className="reading-deck">A student team discovers that better events begin with clear priorities and shared evidence.</p>{lesson.articleParagraphs.map((paragraph, index) => <p className="article-paragraph" key={index}><HighlightedText text={paragraph} onWord={openWord} /></p>)}<footer><p>{lesson.sourceNote}</p><a href={lesson.sourceUrl} target="_blank" rel="noreferrer">Read the EPA source guidance <ArrowRight /></a></footer></article><aside className="reading-tools"><div className="source-card"><p className="section-kicker">SOURCE NOTE</p><b>{lesson.sourceLabel}</b><p>Public guidance last checked for this prototype on September 11, 2026.</p></div><div className="word-inspector"><p className="section-kicker">CLICK A HIGHLIGHTED WORD</p>{word ? <><h2>{word.term}</h2><p>{word.definition}</p><p className="example">“{word.example}”</p><button onClick={() => setSelectedWord(null)}>Close note</button></> : <p>Target expressions are underlined in the article. Open one to record a reading encounter.</p>}</div></aside><div className="reading-check"><header><p className="section-kicker">CHECK THE IDEA</p><h2>Three quick reading questions</h2></header><QuestionSet questions={readingQuestions} answers={session.comprehensionAnswers} onAnswer={(id,answer,correct) => mutate((next)=>{next.comprehensionAnswers[id]=answer;addEvent(next,"comprehension_answered",{result:correct?"correct":"incorrect",evidence:`Reading question ${id}`});})}/><div className="action-row"><Button variant="outline" onClick={()=>onNavigate("preview")}><ArrowLeft />Preview</Button><Button disabled={!allAnswered} onClick={()=>onNavigate("collect","read")}>Collect today’s words<ArrowRight /></Button></div></div></div>;
}

function Collect({ session, showChinese, setShowChinese, mutate, onNavigate }: { session: LearningSession; showChinese: Record<string, boolean>; setShowChinese: React.Dispatch<React.SetStateAction<Record<string,boolean>>>; mutate: (recipe:(next:LearningSession)=>void)=>void; onNavigate:(step:LearningStep,complete?:LearningStep)=>void }) {
  const allSaved=lesson.vocabulary.every((item)=>session.savedVocabularyIds.includes(item.id));
  return <div className="content-wide"><header className="lesson-heading"><p className="section-kicker">COLLECT · 3 EXPRESSIONS</p><h1>Keep the language that carries the idea.</h1><p>Save each expression to your notebook. Chinese support stays one tap away.</p></header><div className="vocabulary-grid">{lesson.vocabulary.map((word,index)=>{const saved=session.savedVocabularyIds.includes(word.id);return <article className="vocabulary-card" key={word.id}><span className="word-index">0{index+1}</span><p className="part-of-speech">TARGET EXPRESSION</p><h2>{word.term}</h2><p>{word.definition}</p><p className="example">{word.example}</p>{showChinese[word.id]&&<p className="chinese-meaning">{word.chineseMeaning}</p>}<div><button className="text-action" onClick={()=>{setShowChinese((current)=>({...current,[word.id]:!current[word.id]}));mutate((next)=>addEvent(next,"chinese_meaning_revealed",{vocabularyItemId:word.id,result:"completed"}));}}><Languages />{showChinese[word.id]?"Hide Chinese":"Show Chinese"}</button><Button variant={saved?"secondary":"outline"} disabled={saved} onClick={()=>mutate((next)=>{if(!next.savedVocabularyIds.includes(word.id))next.savedVocabularyIds.push(word.id);addEvent(next,"vocabulary_saved",{vocabularyItemId:word.id,result:"completed"});})}>{saved?<><Check />Saved</>:"Add to notebook"}</Button></div></article>})}</div><div className="action-row"><Button variant="outline" onClick={()=>onNavigate("read")}><ArrowLeft />Article</Button><Button disabled={!allSaved} onClick={()=>onNavigate("listen","collect")}>Hear them in a new scene<Headphones /></Button></div></div>;
}

function Listening({ session, mutate, onNavigate, setSelectedWord, selectedWord }: { session:LearningSession; mutate:(recipe:(next:LearningSession)=>void)=>void; onNavigate:(step:LearningStep,complete?:LearningStep)=>void; setSelectedWord:(id:string|null)=>void; selectedWord:string|null }) {
  const audioRef=useRef<HTMLAudioElement>(null);const [segment,setSegment]=useState(0);const [playing,setPlaying]=useState(false);const [speed,setSpeed]=useState(1);const [loop,setLoop]=useState(false);const [audioError,setAudioError]=useState(false);const [showChinese,setShowChinese]=useState(false);
  const current=lesson.transcript[segment];
  useEffect(()=>{if(audioRef.current)audioRef.current.playbackRate=speed;},[speed,segment]);
  useEffect(()=>{if(playing&&audioRef.current){audioRef.current.play().catch(()=>{setPlaying(false);setAudioError(true);});}},[segment,playing]);
  const toggle=()=>{const audio=audioRef.current;if(!audio)return;if(audio.paused){setAudioError(false);audio.playbackRate=speed;void audio.play().then(()=>{setPlaying(true);mutate((next)=>addEvent(next,"audio_started",{result:"completed",evidence:`Started ${current.id}`}));}).catch(()=>setAudioError(true));}else{audio.pause();setPlaying(false);}};
  const ended=()=>{if(loop&&audioRef.current){audioRef.current.currentTime=0;void audioRef.current.play();return;}if(segment<lesson.transcript.length-1){setSegment((v)=>v+1);}else{setPlaying(false);mutate((next)=>{if(!next.firstListenCompleted){next.firstListenCompleted=true;lesson.vocabulary.forEach((word)=>{next.vocabulary[word.id]=updateVocabularyState(next.vocabulary[word.id],"listeningRecognition","partial");next.vocabulary[word.id].vocabularyItemId=word.id;});addEvent(next,"first_listen_completed",{result:"completed"});}});}};
  const replaySegment=(index:number)=>{setSegment(index);setPlaying(true);mutate((next)=>addEvent(next,"transcript_segment_replayed",{result:"completed",evidence:lesson.transcript[index].id}));};
  const word=lesson.vocabulary.find((item)=>item.id===selectedWord);
  return <div className="content-wide"><header className="lesson-heading"><p className="section-kicker">LISTEN · A NEW CONTEXT</p><h1>First, listen without reading.</h1><p>Maya and Daniel are planning the same event. Follow their decision, not every word.</p></header><div className="listening-grid"><section className="player-card"><div className="sound-orbit"><Waves /><span>{segment+1}</span></div><p className="section-kicker">LOCAL AUDIO · {current.speaker.toUpperCase()}</p><h2>{session.firstListenCompleted?"Listen again with the transcript":"What should the team do first?"}</h2><audio ref={audioRef} src={current.audioSrc} onEnded={ended} onPause={(event)=>{if(event.currentTarget.currentTime>0&&!event.currentTarget.ended)setPlaying(false)}} onError={()=>setAudioError(true)} preload="auto" />
    <div className="segment-progress"><span style={{width:`${((segment+1)/lesson.transcript.length)*100}%`}} /></div><p className="audio-position">Sentence {segment+1} of {lesson.transcript.length}</p><div className="player-controls"><Button variant="outline" size="icon-lg" aria-label="Back five seconds" onClick={()=>{if(audioRef.current)audioRef.current.currentTime=Math.max(0,audioRef.current.currentTime-5)}}><SkipBack /></Button><Button size="icon-lg" className="play-button" aria-label={playing?"Pause audio":"Play audio"} onClick={toggle}>{playing?<Pause />:<Play />}</Button><label>Speed<select value={speed} onChange={(e)=>setSpeed(Number(e.target.value))}><option value={.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option></select></label></div><label className="loop-control"><input type="checkbox" checked={loop} onChange={(e)=>setLoop(e.target.checked)}/> Repeat the current sentence</label>{audioError&&<p className="error-note"><CircleAlert/>Audio could not play. Check the local asset, then try again.</p>}
    {!session.firstListenCompleted&&<p className="first-listen-note"><Headphones/>The transcript unlocks after all {lesson.transcript.length} sentences play.</p>}{session.firstListenCompleted&&!session.transcriptRevealed&&<Button className="reveal-button" onClick={()=>mutate((next)=>{next.transcriptRevealed=true;addEvent(next,"transcript_revealed",{result:"completed"});})}>Reveal transcript<BookOpen/></Button>}</section><aside className="transcript-panel"><div className="transcript-title"><div><p className="section-kicker">SENTENCE TRANSCRIPT</p><h2>{session.transcriptRevealed?"Read, replay, notice":"Listen first"}</h2></div><Volume2 /></div>{session.transcriptRevealed?<div className="transcript-list">{lesson.transcript.map((item,index)=><div key={item.id} className={segment===index?"active":""}><span>{item.speaker}</span><p><HighlightedText text={item.text} onWord={(id)=>{setSelectedWord(id);setShowChinese(false);mutate((next)=>addEvent(next,"vocabulary_opened",{vocabularyItemId:id,result:"completed",evidence:"Opened from listening transcript"}));}}/></p><button type="button" aria-label={`Replay sentence ${index+1}`} onClick={()=>replaySegment(index)}><Play/></button></div>)}</div>:<div className="locked-transcript"><Headphones/><p>The words stay hidden during your first listen.</p><span>Listen for the decision and the reasons behind it.</span></div>}{word&&session.transcriptRevealed&&<div className="inline-word-note"><button aria-label="Close word note" onClick={()=>setSelectedWord(null)}>×</button><b>{word.term}</b><p>{word.definition}</p>{showChinese&&<p className="chinese-meaning">{word.chineseMeaning}</p>}<div className="inline-word-actions"><button type="button" onClick={()=>{setShowChinese((value)=>!value);mutate((next)=>addEvent(next,"chinese_meaning_revealed",{vocabularyItemId:word.id,result:"completed",evidence:"Opened from listening transcript"}));}}>{showChinese?"Hide Chinese":"Show Chinese"}</button><button type="button" disabled={session.savedVocabularyIds.includes(word.id)} onClick={()=>mutate((next)=>{if(!next.savedVocabularyIds.includes(word.id))next.savedVocabularyIds.push(word.id);addEvent(next,"vocabulary_saved",{vocabularyItemId:word.id,result:"completed",evidence:"Saved from listening transcript"});})}>{session.savedVocabularyIds.includes(word.id)?"Saved in notebook":"Add to notebook"}</button></div></div>}</aside></div><div className="action-row"><Button variant="outline" onClick={()=>onNavigate("collect")}><ArrowLeft/>Words</Button><Button disabled={!session.transcriptRevealed} onClick={()=>onNavigate("comprehension","listen")}>Check your listening<ArrowRight/></Button></div></div>;
}

function Comprehension({ session, mutate, onNavigate }: {session:LearningSession;mutate:(recipe:(next:LearningSession)=>void)=>void;onNavigate:(step:LearningStep,complete?:LearningStep)=>void}) {
  const all=listeningQuestions.every((q)=>Number.isInteger(session.comprehensionAnswers[q.id]));
  const map:Record<string,string>={l1:"trade-off",l2:"stakeholder",l3:"prioritize"};
  return <div className="content-narrow"><header className="lesson-heading"><p className="section-kicker">COMPREHENSION · LISTENING</p><h1>What did they decide?</h1><p>Each explanation points back to evidence in the conversation.</p></header><QuestionSet questions={listeningQuestions} answers={session.comprehensionAnswers} onAnswer={(id,answer,correct)=>mutate((next)=>{next.comprehensionAnswers[id]=answer;const vocabId=map[id];next.vocabulary[vocabId]=updateVocabularyState(next.vocabulary[vocabId],"listeningRecognition",correct?"correct":"incorrect");next.vocabulary[vocabId].vocabularyItemId=vocabId;addEvent(next,"comprehension_answered",{vocabularyItemId:vocabId,dimension:"listeningRecognition",result:correct?"correct":"incorrect",evidence:`Listening question ${id}`});})}/><div className="action-row"><Button variant="outline" onClick={()=>onNavigate("listen")}><ArrowLeft/>Listen again</Button><Button disabled={!all} onClick={()=>onNavigate("dictation","comprehension")}>Try a short dictation<ArrowRight/></Button></div></div>;
}

function playSegment(id:string){const item=lesson.transcript.find((segment)=>segment.id===id);if(!item)return;const audio=new Audio(item.audioSrc);audio.playbackRate=.9;void audio.play();}

function Dictation({session,mutate,onNavigate}:{session:LearningSession;mutate:(recipe:(next:LearningSession)=>void)=>void;onNavigate:(step:LearningStep,complete?:LearningStep)=>void}) {
  const items=dictationSegmentIds.map((id)=>lesson.transcript.find((segment)=>segment.id===id)!);const all=items.every((item)=>session.dictationResults[item.id]);
  return <div className="content-narrow"><header className="lesson-heading"><p className="section-kicker">DICTATION · TWO SENTENCES</p><h1>Catch the words you know.</h1><p>Capitalization and final punctuation do not affect the comparison.</p></header><div className="dictation-stack">{items.map((item,index)=>{const result=session.dictationResults[item.id];return <article className="dictation-card" key={item.id}><div className="dictation-head"><span>0{index+1}</span><Button variant="outline" onClick={()=>playSegment(item.id)}><Play/>Play sentence</Button></div><label htmlFor={`dictation-${item.id}`}>Type what you hear</label><textarea id={`dictation-${item.id}`} value={session.dictationInputs[item.id]??""} disabled={!!result} placeholder="Write the sentence here…" onChange={(e)=>mutate((next)=>{next.dictationInputs[item.id]=e.target.value})}/>{!result?<Button disabled={!session.dictationInputs[item.id]?.trim()} onClick={()=>mutate((next)=>{const value=next.dictationInputs[item.id]??"";const diff=diffDictation(item.text,value);next.dictationResults[item.id]=diff;targetExpressionsIn(item.text).forEach((vocabId)=>{next.vocabulary[vocabId]=updateVocabularyState(next.vocabulary[vocabId],"listeningRecognition",diff.correct?"correct":"partial");next.vocabulary[vocabId].vocabularyItemId=vocabId;});addEvent(next,"dictation_submitted",{dimension:"listeningRecognition",result:diff.correct?"correct":"partial",evidence:value});})}>Compare my sentence</Button>:<div className={`dictation-result ${result.correct?"success":"review"}`}><p><b>{result.correct?"You caught the complete sentence.":"Here is the exact difference."}</b></p>{!result.correct&&<><p className="expected-line"><span>Original</span>{item.text}</p>{result.misspelled.length>0&&<p><span>Spelling</span>{result.misspelled.map((word)=>`${word.actual} → ${word.expected}`).join(", ")}</p>}{result.missing.length>0&&<p><span>Missing</span>{result.missing.join(", ")}</p>}{result.extra.length>0&&<p><span>Extra</span>{result.extra.join(", ")}</p>}</>}</div>}</article>})}</div><div className="action-row"><Button variant="outline" onClick={()=>onNavigate("comprehension")}><ArrowLeft/>Questions</Button><Button disabled={!all} onClick={()=>onNavigate("activate","dictation")}>Activate the words<ArrowRight/></Button></div></div>;
}

function Activate({session,mutate,onNavigate}:{session:LearningSession;mutate:(recipe:(next:LearningSession)=>void)=>void;onNavigate:(step:LearningStep,complete?:LearningStep)=>void}) {
  const complete=lesson.vocabulary.every((word)=>Number.isInteger(session.meaningAnswers[word.id])&&session.recallAnswers[word.id]!==undefined&&session.originalSentences[word.id]!==undefined);
  return <div className="content-wide"><header className="lesson-heading"><p className="section-kicker">ACTIVATE · FROM RECOGNITION TO USE</p><h1>Make each expression do some work.</h1><p>Meaning first, then recall, then one sentence that belongs to you.</p></header><div className="activation-stack">{lesson.vocabulary.map((word,index)=>{const meaning=session.meaningAnswers[word.id];const recall=session.recallAnswers[word.id];const sentence=session.originalSentences[word.id];const recallCorrect=recall!==undefined&&recall.trim().toLowerCase()===word.clozeAnswer.toLowerCase();const sentenceUseful=sentence!==undefined&&usefulOriginalSentence(sentence,word.id);return <article className="activation-card" key={word.id}><div className="activation-word"><span>0{index+1}</span><div><h2>{word.term}</h2><p>{word.definition}</p></div></div><div className="micro-task"><p className="task-label">A · CHOOSE THE MEANING</p><div className="compact-options">{word.meaningChoices.map((choice,choiceIndex)=><button key={choice} disabled={Number.isInteger(meaning)} className={Number.isInteger(meaning)?choiceIndex===word.meaningAnswer?"correct":choiceIndex===meaning?"incorrect":"muted":""} onClick={()=>mutate((next)=>{next.meaningAnswers[word.id]=choiceIndex;const correct=choiceIndex===word.meaningAnswer;next.vocabulary[word.id]=updateVocabularyState(next.vocabulary[word.id],"meaningRecognition",correct?"correct":"incorrect");next.vocabulary[word.id].vocabularyItemId=word.id;addEvent(next,"vocabulary_exercise_answered",{vocabularyItemId:word.id,dimension:"meaningRecognition",result:correct?"correct":"incorrect",evidence:"Meaning recognition"});})}>{choice}</button>)}</div></div><div className="micro-task"><label htmlFor={`recall-${word.id}`}><span className="task-label">B · ACTIVE RECALL</span>{word.cloze}</label><div className="inline-entry"><input id={`recall-${word.id}`} disabled={recall!==undefined} defaultValue="" placeholder="Type the expression"/><Button disabled={recall!==undefined} onClick={(e)=>{const input=(e.currentTarget.previousElementSibling as HTMLInputElement);if(!input.value.trim())return;mutate((next)=>{next.recallAnswers[word.id]=input.value.trim();const correct=input.value.trim().toLowerCase()===word.clozeAnswer.toLowerCase();next.vocabulary[word.id]=updateVocabularyState(next.vocabulary[word.id],"activeRecall",correct?"correct":"incorrect");next.vocabulary[word.id].vocabularyItemId=word.id;addEvent(next,"vocabulary_exercise_answered",{vocabularyItemId:word.id,dimension:"activeRecall",result:correct?"correct":"incorrect",evidence:input.value.trim()});});}}>Check</Button></div>{recall!==undefined&&<p className={recallCorrect?"micro-feedback success":"micro-feedback retry"}>{recallCorrect?"Exactly.":`Answer: ${word.clozeAnswer}`}</p>}</div><div className="micro-task"><label htmlFor={`sentence-${word.id}`}><span className="task-label">C · YOUR SENTENCE</span>Use <b>{word.term}</b> in a sentence of at least six words.</label><div className="inline-entry"><input id={`sentence-${word.id}`} disabled={sentence!==undefined} placeholder="Write a true or realistic sentence"/><Button disabled={sentence!==undefined} onClick={(e)=>{const input=(e.currentTarget.previousElementSibling as HTMLInputElement);if(!input.value.trim())return;mutate((next)=>{next.originalSentences[word.id]=input.value.trim();const useful=usefulOriginalSentence(input.value,word.id);next.vocabulary[word.id]=updateVocabularyState(next.vocabulary[word.id],"writingProduction",useful?"correct":"partial");next.vocabulary[word.id].vocabularyItemId=word.id;addEvent(next,"original_sentence_submitted",{vocabularyItemId:word.id,dimension:"writingProduction",result:useful?"correct":"partial",evidence:input.value.trim()});});}}>Save sentence</Button></div>{sentence!==undefined&&<p className={sentenceUseful?"micro-feedback success":"micro-feedback retry"}>{sentenceUseful?"The expression appears in a complete sentence.":`Keep refining it: include “${word.term}” in a sentence of at least six words.`}</p>}</div></article>})}</div><div className="action-row"><Button variant="outline" onClick={()=>onNavigate("dictation")}><ArrowLeft/>Dictation</Button><Button disabled={!complete} onClick={()=>onNavigate("speak","activate")}>Use them aloud<MessageCircle/></Button></div></div>;
}

function Speak({session,mutate,onNavigate,seconds,active,setActive,setSeconds}:{session:LearningSession;mutate:(recipe:(next:LearningSession)=>void)=>void;onNavigate:(step:LearningStep,complete?:LearningStep)=>void;seconds:number;active:boolean;setActive:(v:boolean)=>void;setSeconds:(v:number)=>void}) {
  const detected=targetExpressionsIn(session.speakingPlan);const ready=wordCount(session.speakingPlan)>=12&&detected.length>0;
  const finish=()=>{setActive(false);mutate((next)=>{next.speakingCompleted=true;next.conversationExpressionIds=targetExpressionsIn(next.speakingPlan);next.conversationExpressionIds.forEach((id)=>{next.vocabulary[id]=updateVocabularyState(next.vocabulary[id],"speakingProduction","partial");next.vocabulary[id].vocabularyItemId=id;addEvent(next,"target_expression_used",{vocabularyItemId:id,dimension:"speakingProduction",result:"partial",evidence:"Prepared and self-reported in an unrecorded speaking practice"});});addEvent(next,"conversation_completed",{result:"completed",evidence:"Communication goal met: prepared at least 12 words, included a target expression, and self-reported a 45-second response"});});};
  return <div className="speaking-scene"><Image src="/assets/courtyard.png" alt="Maya waits beside a courtyard bench for a practice conversation" fill sizes="100vw"/><div className="speaking-overlay"/><div className="speaking-task"><p className="section-kicker">CAMPUS CONVERSATION · MAYA</p><h1>Say the idea in your own voice.</h1><blockquote>“{speakingPrompt}”</blockquote><div className="target-chips"><span>Try one naturally</span>{lesson.vocabulary.map((word)=><b className={detected.includes(word.id)?"used":""} key={word.id}>{detected.includes(word.id)&&<Check/>}{word.term}</b>)}</div><label htmlFor="speaking-plan">Make a few notes before you speak</label><textarea id="speaking-plan" value={session.speakingPlan} disabled={session.speakingCompleted} onChange={(e)=>mutate((next)=>{next.speakingPlan=e.target.value})} placeholder="I would prioritize… The trade-off is… Our main stakeholder…"/><p className="honesty-note">No microphone or speech recognition is used. This step gives you a timer; completion is self-reported, so the report marks speaking evidence as practice rather than verified accuracy.</p>{!session.speakingCompleted?<div className="speaking-controls">{!active?<Button size="lg" disabled={!ready} onClick={()=>{setSeconds(45);setActive(true)}}><Play/>Start 45-second practice</Button>:<><div className="timer"><span>{seconds}</span>seconds</div><Button size="lg" onClick={finish}><Check/>I finished speaking</Button></>}</div>:<div className="spoken-complete"><CheckCircle2/><div><b>Communication goal: completed</b><p>You prepared a concrete answer and used {detected.map(targetLabel).join(", ")}.</p><p>For a more natural response, connect the priority and its consequence: “I’d prioritize clear directions, even if the trade-off is fewer printed guides.”</p><small>Rule-based feedback: length, target-expression presence, and your completion confirmation only. Grammar and pronunciation were not assessed.</small></div></div>}<div className="action-row"><Button variant="outline" onClick={()=>onNavigate("activate")}><ArrowLeft/>Practice words</Button><Button disabled={!session.speakingCompleted} onClick={()=>onNavigate("write","speak")}>Use them in writing<NotebookPen/></Button></div></div></div>;
}

function Write({session,mutate,onNavigate}:{session:LearningSession;mutate:(recipe:(next:LearningSession)=>void)=>void;onNavigate:(step:LearningStep,complete?:LearningStep)=>void}) {
  const count=wordCount(session.writingResponse);const detected=targetExpressionsIn(session.writingResponse);const ready=count>=90&&count<=160&&detected.length>=2;
  const submit=()=>mutate((next)=>{next.writingSubmitted=true;const found=targetExpressionsIn(next.writingResponse);lesson.vocabulary.forEach((word)=>{const used=found.includes(word.id);next.vocabulary[word.id]=updateVocabularyState(next.vocabulary[word.id],"writingProduction",used?"correct":"partial");next.vocabulary[word.id].vocabularyItemId=word.id;if(used)addEvent(next,"target_expression_used",{vocabularyItemId:word.id,dimension:"writingProduction",result:"correct",evidence:next.writingResponse});});addEvent(next,"writing_submitted",{result:"completed",evidence:`${wordCount(next.writingResponse)} words`});});
  return <div className="writing-workspace"><header className="lesson-heading"><p className="section-kicker">WRITE · TRANSFER THE IDEA</p><h1>Turn today’s language into a recommendation.</h1><p>{writingPrompt}</p></header><div className="writing-grid"><section><textarea aria-label="Writing response" disabled={session.writingSubmitted} value={session.writingResponse} onChange={(e)=>mutate((next)=>{next.writingResponse=e.target.value})} placeholder="The committee should…"/><div className="writing-status"><span className={count>=90&&count<=160?"met":""}>{count} / 90–140 words</span><span className={detected.length>=2?"met":""}>{detected.length} / 2 target expressions</span></div>{session.writingSubmitted&&<div className="writing-feedback"><CheckCircle2/><div><b>Your recommendation is saved.</b><p>The report will show exactly which target expressions appeared. It does not claim to assess grammar or writing quality.</p></div></div>}</section><aside><p className="section-kicker">A CLEAR PARAGRAPH</p><ol><li><span>1</span><p><b>Recommendation</b>What should the team do?</p></li><li><span>2</span><p><b>Reason</b>Why should it be prioritized?</p></li><li><span>3</span><p><b>Trade-off</b>What disadvantage would you accept?</p></li><li><span>4</span><p><b>Stakeholder</b>Who is affected?</p></li></ol><div className="target-checks">{lesson.vocabulary.map((word)=><p className={detected.includes(word.id)?"used":""} key={word.id}>{detected.includes(word.id)?<Check/>:<span/>}{word.term}</p>)}</div></aside></div><div className="action-row"><Button variant="outline" onClick={()=>onNavigate("speak")}><ArrowLeft/>Speaking</Button>{!session.writingSubmitted?<Button disabled={!ready} onClick={submit}>Submit writing<Check/></Button>:<Button onClick={()=>onNavigate("report","write")}>Open lesson report<ArrowRight/></Button>}</div></div>;
}

function Report({session,onNavigate}:{session:LearningSession;onNavigate:(step:LearningStep)=>void}) {
  const writingWords=targetExpressionsIn(session.writingResponse);const tomorrow=session.reviewTasks[0]?.dueAt;
  return <div className="content-wide"><header className="report-heading"><div className="success-seal"><Check/></div><div><p className="section-kicker">LESSON COMPLETE · EVIDENCE, NOT A SCORE</p><h1>Three expressions moved across skills.</h1><p>Your report traces what you actually did. It does not estimate an overall English level.</p></div></header><div className="report-grid"><section className="evidence-table"><div className="evidence-head"><span>Expression</span><span>Read</span><span>Heard</span><span>Spoke*</span><span>Wrote</span></div>{lesson.vocabulary.map((word)=>{const item=session.vocabulary[word.id];return <div className="evidence-row" key={word.id}><b>{word.term}</b><EvidenceCell active={item.dimensions.readingRecognition>0}/><EvidenceCell active={item.dimensions.listeningRecognition>0}/><EvidenceCell active={session.conversationExpressionIds.includes(word.id)} partial/><EvidenceCell active={writingWords.includes(word.id)}/></div>})}<p className="table-note">* Speaking is self-reported and unrecorded, so it is shown as practice evidence rather than verified accuracy.</p></section><aside className="report-summary"><p className="section-kicker">TOMORROW’S REVIEW</p><h2>{tomorrow?new Intl.DateTimeFormat("en",{weekday:"long",month:"short",day:"numeric"}).format(new Date(tomorrow)):"After this lesson"}</h2><p>Meet these expressions in fresh contexts, then use the least active one again.</p>{session.reviewTasks.map((task)=><div className="review-line" key={task.id}><BookMarked/><p><b>{targetLabel(task.vocabularyItemId)}</b><span>{task.reason}</span></p></div>)}</aside></div><div className="learning-evidence"><article><p className="section-kicker">DICTATION EVIDENCE</p><h3>{Object.values(session.dictationResults).filter((result)=>result.correct).length} / {dictationSegmentIds.length} exact sentences</h3><p>{Object.values(session.dictationResults).some((result)=>!result.correct)?"The Notebook keeps the exact missing and misspelled words for review.":"Both sentences matched after capitalization and punctuation were normalized."}</p></article><article><p className="section-kicker">YOUR SPEAKING PLAN</p><h3>{session.conversationExpressionIds.length} target expression{session.conversationExpressionIds.length===1?"":"s"}</h3><p>{session.speakingPlan||"No speaking notes saved."}</p></article><article><p className="section-kicker">YOUR WRITING</p><h3>{wordCount(session.writingResponse)} words · {writingWords.length} targets</h3><p>{session.writingResponse||"No writing saved."}</p></article></div><div className="action-row"><Button variant="outline" onClick={()=>onNavigate("notebook")}><BookMarked/>Open notebook</Button><Button onClick={()=>onNavigate("campus")}>Return to campus<School/></Button></div></div>;
}

function EvidenceCell({active,partial=false}:{active:boolean;partial?:boolean}){return <span className={active?partial?"evidence partial":"evidence active":"evidence"}>{active?<Check/>:"—"}</span>}

function Notebook({session,onNavigate,onReset}:{session:LearningSession;onNavigate:(step:LearningStep)=>void;onReset:()=>Promise<void>}) {
  return <section className="page-surface"><header className="page-heading"><p className="section-kicker">YOUR NOTEBOOK</p><h1>What you noticed, heard, and used.</h1><p>Skill signals stay separate so recognition is not mistaken for active vocabulary.</p></header><div className="notebook-layout"><section><h2>Today’s expressions</h2>{lesson.vocabulary.map((word)=>{const item=session.vocabulary[word.id];return <article className="notebook-word" key={word.id}><div><p className="section-kicker">{session.savedVocabularyIds.includes(word.id)?"SAVED":"ENCOUNTERED"}</p><h3>{word.term}</h3><p>{word.definition}</p></div><div className="dimension-bars">{[["Meaning",item.dimensions.meaningRecognition],["Listening",item.dimensions.listeningRecognition],["Recall",item.dimensions.activeRecall],["Speaking*",item.dimensions.speakingProduction],["Writing",item.dimensions.writingProduction]].map(([label,value])=><div key={String(label)}><span>{label}</span><div><i style={{width:`${value}%`}}/></div><b>{value}</b></div>)}</div>{session.originalSentences[word.id]&&<blockquote>“{session.originalSentences[word.id]}”</blockquote>}</article>})}</section><aside className="notebook-side"><h2>Review queue</h2>{session.reviewTasks.length?session.reviewTasks.map((task)=><div className="review-task" key={task.id}><Clock3/><p><b>{targetLabel(task.vocabularyItemId)}</b><span>{task.reason}</span><small>{new Date(task.dueAt).toLocaleString("en",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</small></p></div>):<div className="empty-card"><BookMarked/><p>Complete today’s lesson to create a review task.</p></div>}<AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="reset-button"><RotateCcw/>Reset local progress</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reset this learning demo?</AlertDialogTitle><AlertDialogDescription>This deletes only AI International School progress stored on this device. Other browser data is not touched.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep progress</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={()=>void onReset()}>Reset demo</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></aside></div><div className="action-row"><span/><Button onClick={()=>onNavigate(session.lessonCompleted?"report":"today")}>{session.lessonCompleted?"Return to report":"Continue today"}<ArrowRight/></Button></div></section>;
}

function EmptyState({type,onNavigate}:{type:"library"|"profile";onNavigate:(step:LearningStep)=>void}) {
  const library=type==="library";return <section className="page-surface empty-page"><div className="empty-illustration">{library?<Library/>:<UserRound/>}</div><p className="section-kicker">{library?"LIBRARY · NEXT PHASE":"PROFILE · FALL TERM"}</p><h1>{library?"One complete lesson before a large catalog.":"Your learning evidence will shape this profile."}</h1><p>{library?"This phase validates the full learning loop with one source-backed lesson. Search, filters, downloads, and a larger content library belong to the next phase.":"Today’s local prototype tracks skill-specific evidence. Accounts, cross-device history, and long-term goals are intentionally not connected yet."}</p><Button onClick={()=>onNavigate("today")}>Go to today’s lesson<ArrowRight/></Button></section>;
}

declare global {
  interface Document { modelContext?: { registerTool(tool:{name:string;title?:string;description:string;inputSchema:object;execute:(input:unknown)=>unknown;annotations?:{readOnlyHint?:boolean;untrustedContentHint?:boolean}},options?:{signal?:AbortSignal}):void|Promise<void> } }
}
