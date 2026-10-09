"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp, Eye, EyeOff, Lightbulb, Lock, Play, Save, ShieldCheck, TerminalSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { curriculumWeeks } from "@/lib/curriculum";
import { dateInJapan, lessonSlotForDate } from "@/lib/calendar";
import { readRunnerApiToken, readLearnerState, recordSubmission, saveLessonAnswer, saveLessonDraft, saveQuizChoice, type LearnerState } from "@/lib/browser-store";
import { findLesson } from "@/lib/lessons";
import { gradeLessonCode, revealLessonAnswer, type GradeResult } from "@/lib/runner-client";
import { CodeEditorPanel } from "@/components/code-editor-panel";

type Standard = "c++17" | "c++20" | "c++23";

export function LessonPage({ requestedWeek, requestedDay }: { requestedWeek?: number; requestedDay?: number }) {
  const [state, setState] = useState<LearnerState | null>(null);
  const [ready, setReady] = useState(false);
  const [target, setTarget] = useState({ week: requestedWeek ?? 1, day: requestedDay ?? 1 });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [standards, setStandards] = useState<Record<string, Standard>>({});
  const [results, setResults] = useState<Record<string, GradeResult>>({});
  const [running, setRunning] = useState(false);
  const [debugDrafts, setDebugDrafts] = useState<Record<string, string>>({});
  const [reflectionDrafts, setReflectionDrafts] = useState<Record<string, string>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, string>>({});
  const [revealedDebug, setRevealedDebug] = useState<Record<string, { fix: string; explanation: string }>>({});
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState("");

  const lesson = findLesson(target.week, target.day);
  const week = curriculumWeeks[target.week - 1];
  const record = lesson ? state?.lessons[lesson.id] : undefined;
  const code = lesson ? drafts[lesson.id] ?? record?.draft ?? lesson.exercise.starter : "";
  const standard = lesson ? standards[lesson.id] ?? "c++17" : "c++17";
  const result = lesson ? results[lesson.id] ?? null : null;
  const quizChoice = record?.quizChoice ?? null;
  const debugAnswer = lesson ? debugDrafts[lesson.id] ?? record?.debugAnswer ?? "" : "";
  const reflection = lesson ? reflectionDrafts[lesson.id] ?? record?.reflection ?? "" : "";
  const debugRevealed = Boolean(record?.debugRevealed);
  const solutionRevealed = Boolean(record?.solutionRevealed);
  const hintCount = record?.hintsUsed ?? 0;
  const quizIsCorrect = Boolean(record?.quizCorrect);
  const quizSubmitted = quizChoice !== null && record?.quizCorrect !== undefined;
  const completed = Boolean(record?.completedAt);

  useEffect(() => {
    const todayValue = dateInJapan();
    readLearnerState().then((loaded) => {
      setState(loaded);
      if (requestedWeek === undefined || requestedDay === undefined) {
        setTarget(lessonSlotForDate(todayValue, loaded.settings.startDate));
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, [requestedWeek, requestedDay]);

  useEffect(() => {
    if (!ready || !lesson || !code) return;
    const timer = window.setTimeout(() => {
      saveLessonDraft(lesson.id, code).then((updated) => {
        setState(updated);
        setSaveMessage("下書きを保存しました");
      })
        .catch(() => setSaveMessage("下書きの保存に失敗しました"));
    }, 550);
    return () => window.clearTimeout(timer);
  }, [code, lesson, ready]);

  const previousHref = useMemo(() => {
    if (target.day > 1) return `/learn/${target.week}/${target.day - 1}/`;
    return target.week > 1 ? `/learn/${target.week - 1}/7/` : "/curriculum/";
  }, [target]);
  const nextHref = useMemo(() => {
    if (target.day < 7) return `/learn/${target.week}/${target.day + 1}/`;
    return target.week < 104 ? `/learn/${target.week + 1}/1/` : "/curriculum/";
  }, [target]);

  async function chooseQuiz(index: number) {
    if (!lesson) return;
    setActionMessages((current) => ({ ...current, [lesson.id]: "" }));
    const updated = await saveQuizChoice(lesson.id, index, index === lesson.quiz.answer);
    setState(updated);
  }

  async function saveDebugAndReveal() {
    if (!lesson) return;
    setActionMessages((current) => ({ ...current, [lesson.id]: "" }));
    try {
      const runnerToken = await readRunnerApiToken().catch(() => "");
      const answer = await revealLessonAnswer(lesson.id, "debug", runnerToken);
      const fix = answer.fix;
      const explanation = answer.explanation;
      if (typeof fix !== "string" || typeof explanation !== "string") throw new Error("デバッグ解説の応答を確認できませんでした。");
      setRevealedDebug((current) => ({ ...current, [lesson.id]: { fix, explanation } }));
      const updated = await saveLessonAnswer(lesson.id, { debugRevealed: true });
      setState(updated);
    } catch (error) {
      setActionMessages((current) => ({ ...current, [lesson.id]: error instanceof Error ? error.message : "解説を取得できませんでした。" }));
    }
  }

  async function revealHint() {
    if (!lesson || hintCount >= lesson.exercise.hints.length) return;
    const next = hintCount + 1;
    const updated = await saveLessonAnswer(lesson.id, { hintsUsed: next });
    setState(updated);
  }

  async function revealSolution() {
    if (!lesson) return;
    setActionMessages((current) => ({ ...current, [lesson.id]: "" }));
    try {
      const runnerToken = await readRunnerApiToken().catch(() => "");
      const answer = await revealLessonAnswer(lesson.id, "solution", runnerToken);
      const solution = answer.solution;
      if (typeof solution !== "string") throw new Error("模範解答の応答を確認できませんでした。");
      setRevealedSolutions((current) => ({ ...current, [lesson.id]: solution }));
      const updated = await saveLessonAnswer(lesson.id, { solutionRevealed: true });
      setState(updated);
    } catch (error) {
      setActionMessages((current) => ({ ...current, [lesson.id]: error instanceof Error ? error.message : "模範解答を取得できませんでした。" }));
    }
  }

  async function saveReflection(value: string) {
    if (lesson) setReflectionDrafts((current) => ({ ...current, [lesson.id]: value }));
    if (!lesson) return;
    const updated = await saveLessonAnswer(lesson.id, { reflection: value });
    setState(updated);
  }

  async function submitCode() {
    if (!lesson || running) return;
    setRunning(true);
    try {
      const runnerToken = await readRunnerApiToken().catch(() => "");
      const graded = await gradeLessonCode(code, lesson, standard, runnerToken);
      const submission = {
        id: crypto.randomUUID(),
        lessonId: lesson.id,
        source: code,
        submittedAt: new Date().toISOString(),
        status: graded.status,
        score: graded.score,
        compilerOutput: graded.compilerOutput,
        stdout: graded.cases[0]?.actual,
        stderr: graded.cases[0]?.stderr,
        durationMs: graded.durationMs,
      } as const;
      const updated = await recordSubmission(submission);
      setState(updated);
      setResults((current) => ({ ...current, [lesson.id]: graded }));
    } finally {
      setRunning(false);
    }
  }

  if (!ready) return <div className="loading-state"><span className="spinner" />学習データを開いています…</div>;
  if (!week) return <div className="empty-state"><strong>この週はカリキュラムにありません。</strong><Link href="/curriculum/">カリキュラムへ</Link></div>;
  if (!lesson) return (
    <div className="page-stack">
      <div className="lesson-back"><Link href="/curriculum/"><ArrowLeft size={15} />カリキュラム</Link><span>Week {String(target.week).padStart(2, "0")} · Day {target.day}</span></div>
      <section className="planned-lesson panel"><div className="planned-icon"><Lock size={23} /></div><span className="section-kicker">LESSON CONTENT IN PROGRESS</span><h1>{week.days[target.day - 1]?.label}: {week.title}</h1><p>{week.days[target.day - 1]?.focus}</p><div className="callout callout-info"><BookOpen size={17} /><span>この日の詳細教材はまだ制作中です。週の目標・課題・前提知識はカリキュラムで確認できます。</span></div><Link className="button button-secondary" href="/curriculum/">カリキュラムを見る<ArrowRight size={15} /></Link></section>
    </div>
  );

  const dayLabel = week.days[target.day - 1]?.label ?? "学習";
  return (
    <div className="page-stack lesson-page">
      <div className="lesson-back"><Link href="/curriculum/"><ArrowLeft size={15} />カリキュラム</Link><span>Week {String(target.week).padStart(2, "0")} <ChevronRight size={13} /> Day {target.day}</span><span className="lesson-save-state"><Save size={13} />{saveMessage || "下書きは自動保存"}</span></div>
      <section className="lesson-heading"><div><div className="eyebrow"><span className="eyebrow-line" />{week.phaseTitle} <span className="eyebrow-muted">· {dayLabel}</span></div><h1>{lesson.title}</h1><p className="page-lead">{lesson.goal}</p></div><div className={`lesson-completion-chip ${completed ? "is-complete" : ""}`}>{completed ? <><CheckCircle2 size={15} />完了</> : <><CircleHelp size={15} />学習中</>}</div></section>
      <div className="lesson-meta-row"><span><BookOpen size={14} />{lesson.subject}</span><span>難易度: {lesson.difficulty}</span><span>目安 {lesson.minutes}分</span><span>C++17 / 20 / 23</span></div>

      <div className="lesson-grid">
        <div className="lesson-content-column">
          <section className="lesson-section panel"><div className="lesson-section-heading"><span className="step-number">01</span><div><span className="section-kicker">RECALL</span><h2>前回内容を思い出す</h2></div></div><div className="recall-card"><span>まずは自分の言葉で</span><p>{target.week === 1 && target.day === 1 ? "プログラムが画面に文字を表示するまでに、どんな作業が必要だと思いますか？" : `「${lesson.prerequisites[0]}」のうち、今日使うことをひとつ思い出してみましょう。`}</p><small>答えは先に確認せず、頭の中で説明してみてください。</small></div></section>

          <section className="lesson-section panel"><div className="lesson-section-heading"><span className="step-number">02</span><div><span className="section-kicker">TODAY&apos;S GOAL</span><h2>今日できるようになること</h2></div></div><div className="goal-card"><CheckCircle2 size={19} /><p>{lesson.goal}</p></div><div className="prerequisite-line"><span>前提</span>{lesson.prerequisites.join(" · ")}</div></section>

          <section className="lesson-section panel"><div className="lesson-section-heading"><span className="step-number">03</span><div><span className="section-kicker">CONCEPT</span><h2>概念を理解する</h2></div></div><p className="lesson-prose">{lesson.explanation}</p><div className="mistake-note"><span className="note-badge">注意</span><span>{lesson.commonMistake}</span></div></section>

          <section className="lesson-section panel"><div className="lesson-section-heading"><span className="step-number">04</span><div><span className="section-kicker">CODE EXAMPLE</span><h2>コード例で動きを確かめる</h2></div></div><div className="sample-code"><div><span className="file-dot" />example.cpp <span className="sample-language">C++17</span></div><pre><code>{lesson.example}</code></pre></div><div className="output-card"><div><TerminalSquare size={14} />実行結果</div><pre>{lesson.exampleOutput}</pre></div><p className="lesson-prose small-prose">図や出力例は説明用です。提出コードの評価には、下の実行ワーカーが返す結果だけを使います。</p></section>

          <section className="lesson-section panel quiz-section"><div className="lesson-section-heading"><span className="step-number">05</span><div><span className="section-kicker">QUICK CHECK</span><h2>理解を確認する</h2></div></div><p className="quiz-question">{lesson.quiz.question}</p><div className="quiz-options">{lesson.quiz.choices.map((choice, index) => <button type="button" key={choice} className={`quiz-option ${quizSubmitted && quizChoice === index ? quizIsCorrect ? "quiz-correct" : "quiz-wrong" : ""}`} onClick={() => void chooseQuiz(index)}><span className="choice-letter">{String.fromCharCode(65 + index)}</span><span>{choice}</span>{quizSubmitted && quizChoice === index && (quizIsCorrect ? <Check size={16} /> : <CircleHelp size={16} />)}</button>)}</div>{quizSubmitted && <div className={`quiz-feedback ${quizIsCorrect ? "feedback-correct" : "feedback-wrong"}`}><strong>{quizIsCorrect ? "正解" : "もう一度考えてみよう"}</strong><span>{lesson.quiz.explanation}</span></div>}{actionMessages[lesson.id] && <p className="editor-footnote">{actionMessages[lesson.id]}</p>}</section>

          <section className="lesson-section panel debug-section"><div className="lesson-section-heading"><span className="step-number">06</span><div><span className="section-kicker">DEBUGGING</span><h2>バグを見つける</h2></div></div><p className="lesson-prose">このコードが正しく動かない原因を考え、どこを直すか書いてみてください。</p><div className="sample-code debug-code"><div><span className="file-dot file-dot-red" />broken.cpp</div><pre><code>{lesson.debug.code}</code></pre></div><textarea className="answer-textarea" value={debugAnswer} onChange={(event) => { const value = event.target.value; setDebugDrafts((current) => ({ ...current, [lesson.id]: value })); void saveLessonAnswer(lesson.id, { debugAnswer: value }).then(setState); }} placeholder="原因と修正方法を自分の言葉で書く" aria-label="デバッグの回答" /><button type="button" className="button button-secondary reveal-button" onClick={() => void saveDebugAndReveal()}>{revealedDebug[lesson.id] ? <EyeOff size={15} /> : <Eye size={15} />}{revealedDebug[lesson.id] ? "解説を表示中" : debugRevealed ? "解説をもう一度見る" : "解説を確認"}</button>{revealedDebug[lesson.id] && <div className="answer-reveal"><strong>修正の考え方</strong><pre>{revealedDebug[lesson.id].fix}</pre><p>{revealedDebug[lesson.id].explanation}</p></div>}{actionMessages[lesson.id] && <p className="editor-footnote">{actionMessages[lesson.id]}</p>}</section>

          <section className="lesson-section panel exercise-section"><div className="lesson-section-heading"><span className="step-number">07</span><div><span className="section-kicker">IMPLEMENT</span><h2>自分で実装する</h2></div></div><p className="lesson-prose">{lesson.exercise.prompt}</p>{lesson.exercise.input && <div className="stdin-hint"><span>公開テスト入力の例</span><code>{lesson.exercise.input.trimEnd() || "(入力なし)"}</code></div>}
            <div className="hint-area"><button type="button" className="hint-button" onClick={revealHint} disabled={hintCount >= lesson.exercise.hints.length}><Lightbulb size={15} />ヒントを見る <span>{hintCount}/{lesson.exercise.hints.length}</span></button>{hintCount > 0 && <div className="hint-list">{lesson.exercise.hints.slice(0, hintCount).map((hint, index) => <p key={index}><span>ヒント {index + 1}</span>{hint}</p>)}</div>}</div>
            <CodeEditorPanel lesson={lesson} code={code || lesson.exercise.starter} onCodeChange={(value) => setDrafts((current) => ({ ...current, [lesson.id]: value }))} standard={standard} onStandardChange={(value) => setStandards((current) => ({ ...current, [lesson.id]: value }))} result={result} running={running} onSubmit={submitCode} />
            <div className="solution-area"><button type="button" className="text-button" onClick={() => void revealSolution()}>{revealedSolutions[lesson.id] ? <EyeOff size={14} /> : <Eye size={14} />}{revealedSolutions[lesson.id] ? "模範解答を表示中" : solutionRevealed ? "模範解答をもう一度見る" : "模範解答を見る"}</button>{revealedSolutions[lesson.id] && <div className="answer-reveal solution-reveal"><strong>ひとつの実装例</strong><pre>{revealedSolutions[lesson.id]}</pre><p>入力・出力条件を満たす別の実装も考えられます。模範解答の形だけを暗記せず、各行の理由を説明してください。</p></div>}{actionMessages[lesson.id] && <p className="editor-footnote">{actionMessages[lesson.id]}</p>}</div>
          </section>

          <section className="lesson-section panel reflection-section"><div className="lesson-section-heading"><span className="step-number">08</span><div><span className="section-kicker">REFLECTION</span><h2>今日の振り返り</h2></div></div><p className="lesson-prose">何がわかり、どこで迷ったかを短く残します。次回ここから再開できます。</p><textarea className="answer-textarea reflection-input" value={reflection} onChange={(event) => void saveReflection(event.target.value)} placeholder="例：整数同士の割り算は小数にならないことを、出力で確かめた。" aria-label="今日の振り返り" /><div className="lesson-evidence"><ShieldCheck size={15} /><span>学習完了は、理解チェックと実際の公開テストに通った記録が両方そろった場合だけ付きます。</span></div></section>

          <div className="lesson-pagination"><Link className="button button-ghost" href={previousHref}><ArrowLeft size={15} />前の日</Link><Link className="button button-secondary" href="/curriculum/">週の計画<ChevronRight size={14} /></Link><Link className="button button-primary" href={nextHref}>次の日へ<ArrowRight size={15} /></Link></div>
        </div>
        <aside className="lesson-aside"><div className="lesson-aside-card"><span className="section-kicker">LEARNING FLOW</span><strong>今日の学習</strong><div className="flow-steps">{["前回の確認", "目標を知る", "概念と例", "クイズ", "デバッグ", "コード実装", "理解度を確認", "振り返り保存"].map((name, index) => <div className={`flow-step ${index < 3 ? "flow-step-done" : ""}`} key={name}><span>{index < 3 ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</span>{name}</div>)}</div><div className="aside-progress"><div><span>教材の状態</span><strong>{completed ? "完了" : "学習中"}</strong></div><div className="thin-track"><span style={{ width: completed ? "100%" : "24%" }} /></div><small>確認と実行結果に基づく</small></div></div><div className="lesson-aside-note"><Lock size={15} /><span>コードと学習履歴はIndexedDBに保存され、このブラウザー内に残ります。</span></div><div className="lesson-aside-note note-runner"><Play size={14} /><span>実行ボタンは設定済みの隔離ワーカーにのみ送信します。Pages自体ではコードを動かしません。</span></div></aside>
      </div>
    </div>
  );
}
