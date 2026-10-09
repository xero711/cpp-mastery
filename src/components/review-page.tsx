"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { readLearnerState, type LearnerState } from "@/lib/browser-store";
import { lessons } from "@/lib/lessons";

export function ReviewPage() {
  const [state, setState] = useState<LearnerState | null>(null);
  useEffect(() => { readLearnerState().then(setState).catch(() => setState(null)); }, []);
  const items = state?.submissions.filter((submission) => submission.status === "failed" || submission.status === "compile_error") ?? [];
  return <div className="page-stack"><section className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />REVIEW CENTER</div><h1>復習センター</h1><p className="page-lead">保存された提出結果から、不正解とコンパイルエラーを振り返ります。</p></div><div className="practice-count"><strong>{items.length}</strong><span>見直し候補</span></div></section>
    <section className="review-intro panel"><div className="review-intro-icon"><RotateCcw size={19} /></div><div><strong>一度通っただけでは、定着と判断しません。</strong><p>間違いの原因を説明してから、コードを見ずにもう一度取り組みましょう。</p></div></section>
    {items.length ? <div className="review-list">{items.map((item) => { const lesson = lessons.find((entry) => entry.id === item.lessonId); return <article className="review-card panel" key={item.id}><div className="review-card-icon"><AlertTriangle size={17} /></div><div className="review-card-content"><div className="practice-meta"><span>{lesson ? `W${String(lesson.week).padStart(2, "0")} · DAY ${lesson.day}` : item.lessonId}</span><span><Clock3 size={12} />{new Date(item.submittedAt).toLocaleString("ja-JP")}</span></div><strong>{lesson?.title ?? "教材が更新された課題"}</strong><p>{item.status === "compile_error" ? "コンパイル診断を読み、最初に報告されたエラーから直します。" : "期待した出力と実際の出力の違いを見て、境界条件を確認します。"}</p><div className="review-code-output"><span>直近の出力</span><pre>{item.compilerOutput || item.stdout || "出力なし"}</pre></div></div><Link className="button button-secondary" href={lesson ? `/learn/${lesson.week}/${lesson.day}/` : "/practice/"}>再挑戦<ArrowRight size={14} /></Link></article>; })}</div> : <div className="empty-state panel"><span className="empty-ring"><RotateCcw size={19} /></span><strong>{state ? "復習候補はまだありません" : "学習データを確認中"}</strong><span>課題を提出すると、見直しが必要なものをここに表示します。</span><Link href="/practice/" className="button button-secondary">課題を見る<ArrowRight size={14} /></Link></div>}
  </div>;
}
