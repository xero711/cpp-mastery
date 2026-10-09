"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Code2, ExternalLink, Info, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { CodeEditorPanel } from "@/components/code-editor-panel";
import { readRunnerApiToken, recordSubmission, readLearnerState, saveLessonDraft, type LearnerState } from "@/lib/browser-store";
import { lessons } from "@/lib/lessons";
import { gradeLessonCode, hasConfiguredRunner, type GradeResult } from "@/lib/runner-client";

type Standard = "c++17" | "c++20" | "c++23";

export function WorkspacePage() {
  const [state, setState] = useState<LearnerState | null>(null);
  const [selectedId, setSelectedId] = useState(lessons[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [standards, setStandards] = useState<Record<string, Standard>>({});
  const [results, setResults] = useState<Record<string, GradeResult>>({});
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);

  const lesson = lessons.find((item) => item.id === selectedId) ?? lessons[0];
  const code = drafts[lesson.id] ?? state?.lessons[lesson.id]?.draft ?? lesson.exercise.starter;
  const standard = standards[lesson.id] ?? "c++17";
  const result = results[lesson.id] ?? null;

  useEffect(() => {
    readLearnerState()
      .then((loaded) => { setState(loaded); setReady(true); })
      .catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      void saveLessonDraft(lesson.id, code).then(setState);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [code, lesson.id, ready]);

  async function submit() {
    if (running) return;
    setRunning(true);
    try {
      const runnerToken = await readRunnerApiToken().catch(() => "");
      const graded = await gradeLessonCode(code, lesson, standard, runnerToken);
      const updated = await recordSubmission({
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
      });
      setState(updated);
      setResults((current) => ({ ...current, [lesson.id]: graded }));
    } finally {
      setRunning(false);
    }
  }

  if (!ready) return <div className="loading-state">ワークスペースを開いています…</div>;
  return <div className="page-stack workspace-page"><section className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />WORKSPACE</div><h1>ブラウザIDE</h1><p className="page-lead">コードはこのブラウザーに保存。コンパイルは別ホストの隔離ワーカーに送ります。</p></div><div className={`runner-badge ${hasConfiguredRunner() ? "runner-badge-on" : ""}`}><span className="status-dot" />{hasConfiguredRunner() ? "RUNNER URL SET" : "RUNNER NOT CONFIGURED"}</div></section>
    <div className="workspace-toolbar panel"><label className="workspace-select"><Code2 size={16} /><span>課題</span><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{lessons.map((item) => <option value={item.id} key={item.id}>W{String(item.week).padStart(2, "0")} · D{item.day} — {item.title}</option>)}</select><ChevronDown size={14} /></label><span className="workspace-save"><Save size={13} />自動保存</span><Link href={`/learn/${lesson.week}/${lesson.day}/`} className="workspace-open-lesson">教材を開く<ExternalLink size={14} /></Link></div>
    <div className="workspace-main-grid"><section className="workspace-problem panel"><div className="panel-heading"><div><span className="section-kicker">EXERCISE</span><h2>{lesson.title}</h2></div><span className="difficulty-pill">{lesson.difficulty}</span></div><p>{lesson.exercise.prompt}</p><div className="problem-spec"><div><span>標準入力</span><pre>{lesson.exercise.input || "(なし)"}</pre></div><div><span>期待出力</span><pre>{lesson.exercise.expectedOutput || "(出力なし)"}</pre></div></div><div className="problem-note"><Info size={14} /><span>公開・非公開テストと採点は隔離runner側で管理し、ブラウザーへは公開ケースの結果だけを返します。</span></div><div className="problem-links"><Link href={`/learn/${lesson.week}/${lesson.day}/`}><ArrowLeft size={14} />解説を見る</Link><span>{state?.lessons[lesson.id]?.attempts ?? 0} 回提出済み</span></div></section>
      <div className="workspace-editor"><CodeEditorPanel lesson={lesson} code={code} onCodeChange={(value) => setDrafts((current) => ({ ...current, [lesson.id]: value }))} standard={standard} onStandardChange={(value) => setStandards((current) => ({ ...current, [lesson.id]: value }))} result={result} running={running} onSubmit={submit} /><div className="workspace-security"><Check size={14} /><span>ブラウザーからホストPCのコンパイラを直接呼び出すことはありません。</span></div></div></div>
  </div>;
}
