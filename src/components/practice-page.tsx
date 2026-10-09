"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { readLearnerState, type LearnerState } from "@/lib/browser-store";
import { lessons } from "@/lib/lessons";

export function PracticePage() {
  const [state, setState] = useState<LearnerState | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [week, setWeek] = useState(0);

  useEffect(() => { readLearnerState().then(setState).catch(() => setState(null)); }, []);

  const visible = useMemo(() => lessons.filter((lesson) => {
    const completed = Boolean(state?.lessons[lesson.id]?.completedAt);
    return (week === 0 || lesson.week === week)
      && (filter === "all" || (filter === "done" ? completed : !completed))
      && (!query || `${lesson.title} ${lesson.goal} ${lesson.subject}`.toLowerCase().includes(query.toLowerCase()));
  }), [filter, query, state, week]);

  return <div className="page-stack"><section className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />PRACTICE</div><h1>コード演習</h1><p className="page-lead">最初の4週間から28題。実際の採点結果と学習状況で絞り込めます。</p></div><div className="practice-count"><strong>{lessons.length}</strong><span>課題</span></div></section>
    <section className="filter-bar panel"><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="課題名・トピックを検索" aria-label="課題検索" /></label><label className="filter-select"><SlidersHorizontal size={15} /><select value={week} onChange={(event) => setWeek(Number(event.target.value))} aria-label="週で絞り込む"><option value={0}>すべての週</option>{Array.from({ length: 4 }, (_, index) => <option value={index + 1} key={index}>Week {String(index + 1).padStart(2, "0")}</option>)}</select></label><div className="segmented-control" role="group" aria-label="課題状態"><button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>すべて</button><button className={filter === "open" ? "selected" : ""} onClick={() => setFilter("open")}>未完了</button><button className={filter === "done" ? "selected" : ""} onClick={() => setFilter("done")}>完了</button></div></section>
    <div className="practice-list">{visible.map((lesson) => { const record = state?.lessons[lesson.id]; const completed = Boolean(record?.completedAt); return <Link className="practice-card" href={`/learn/${lesson.week}/${lesson.day}/`} key={lesson.id}><div className={`practice-status ${completed ? "practice-done" : ""}`}>{completed ? <CheckCircle2 size={18} /> : <Circle size={17} />}</div><div className="practice-main"><div className="practice-meta"><span>W{String(lesson.week).padStart(2, "0")} · DAY {lesson.day}</span><span>{lesson.difficulty}</span><span>{lesson.minutes}分</span></div><strong>{lesson.title}</strong><p>{lesson.exercise.prompt}</p><div className="practice-tags"><span>理解クイズ</span><span>デバッグ</span><span>C++17</span></div></div><div className="practice-result">{completed ? <><strong className="result-pass">確認済み</strong><small>公開テストに通過</small></> : record?.attempts ? <><strong>{record.attempts} 回提出</strong><small>最高 {record.bestScore ?? 0}%</small></> : <><strong>未提出</strong><small>課題へ進む</small></>}<ArrowRight size={16} /></div></Link>; })}{visible.length === 0 && <div className="empty-state"><Search size={22} /><strong>課題が見つかりません</strong><span>フィルターを変更してください。</span></div>}</div>
  </div>;
}
