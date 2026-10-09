"use client";

import Editor, { loader } from "@monaco-editor/react";
import { useMemo } from "react";
import { Check, CircleAlert, Clock3, Play, RotateCcw, TerminalSquare } from "lucide-react";
import type { Lesson } from "@/lib/lessons";
import type { GradeResult } from "@/lib/runner-client";

loader.config({ paths: { vs: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/monaco/vs` } });

type Props = {
  lesson: Lesson;
  code: string;
  onCodeChange: (value: string) => void;
  standard: "c++17" | "c++20" | "c++23";
  onStandardChange: (value: "c++17" | "c++20" | "c++23") => void;
  result: GradeResult | null;
  running: boolean;
  onSubmit: () => void;
};

export function CodeEditorPanel({ lesson, code, onCodeChange, standard, onStandardChange, result, running, onSubmit }: Props) {
  const lines = useMemo(() => code.split("\n").length, [code]);
  return (
    <section className="code-workspace">
      <div className="editor-topbar"><div className="editor-file"><span className="file-dot" />main.cpp<span className="unsaved-dot" title="この端末に自動保存" /></div><div className="editor-tools"><label className="standard-select"><span>標準</span><select value={standard} onChange={(event) => onStandardChange(event.target.value as Props["standard"])} aria-label="C++標準"><option value="c++17">C++17</option><option value="c++20">C++20</option><option value="c++23">C++23</option></select></label><button className="icon-button editor-reset" type="button" onClick={() => onCodeChange(lesson.exercise.starter)} title="初期コードに戻す" aria-label="初期コードに戻す"><RotateCcw size={15} /></button></div></div>
      <div className="monaco-shell"><Editor height="340px" language="cpp" value={code} onChange={(value) => onCodeChange(value ?? "")} theme="vs-dark" options={{ automaticLayout: true, minimap: { enabled: false }, fontSize: 13, lineHeight: 22, fontFamily: "Consolas, 'Cascadia Code', monospace", padding: { top: 14, bottom: 14 }, scrollBeyondLastLine: false, tabSize: 4, insertSpaces: true, wordWrap: "on", renderLineHighlight: "line", overviewRulerBorder: false, hideCursorInOverviewRuler: true, smoothScrolling: true, suggestOnTriggerCharacters: true }} /></div>
      <div className="editor-statusbar"><span><span className="status-dot" />C++ source</span><span>UTF-8</span><span>Ln {lines}, Col 1</span></div>
      <div className="editor-action-row"><div className="test-summary"><TerminalSquare size={15} /><span>公開テスト {lesson.exercise.tests.length} 件</span><span className="test-input-note">標準入力あり</span></div><button type="button" className="button button-primary submit-button" onClick={onSubmit} disabled={running}>{running ? <span className="spinner" /> : <Play size={14} fill="currentColor" />}{running ? "実行中…" : "コンパイルして採点"}</button></div>
      {result && <div className={`grading-panel grading-${result.status}`} aria-live="polite">
        <div className="grading-heading">{result.status === "passed" ? <Check size={16} /> : <CircleAlert size={16} />}<strong>{result.message}</strong>{result.durationMs > 0 && <span><Clock3 size={13} />{result.durationMs} ms</span>}</div>
        {result.compilerOutput && <details className="diagnostic-details" open={result.status === "compile_error"}><summary>コンパイラ診断</summary><pre>{result.compilerOutput}</pre></details>}
        {result.cases.map((test, index) => <div className="test-result-row" key={index}><span className={`test-result-icon ${test.passed ? "passed" : "failed"}`}>{test.passed ? <Check size={13} /> : <CircleAlert size={13} />}</span><strong>テスト {index + 1}</strong><span>{test.passed ? "一致" : "不一致"}</span><span className="test-duration">{test.durationMs} ms</span></div>)}
        {result.cases.filter((test) => !test.passed).map((test, index) => <div className="output-comparison" key={`output-${index}`}><div><span>期待する出力</span><pre>{test.expected || "(出力なし)"}</pre></div><div><span>実際の出力</span><pre>{test.actual || "(出力なし)"}</pre></div>{test.stderr && <div className="stderr-output"><span>標準エラー</span><pre>{test.stderr}</pre></div>}</div>)}
      </div>}
      <p className="editor-footnote">コードはこのブラウザーに保存されます。実行には別ホストの隔離ワーカーが必要です。</p>
    </section>
  );
}
