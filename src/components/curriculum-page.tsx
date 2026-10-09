"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Circle, LockKeyhole, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { curriculumWeeks, totalLearningDays } from "@/lib/curriculum";
import { readLearnerState, type LearnerState } from "@/lib/browser-store";

export function CurriculumPage() {
  const [state, setState] = useState<LearnerState | null>(null);
  const [phaseFilter, setPhaseFilter] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => { readLearnerState().then(setState).catch(() => setState(null)); }, []);

  const weeks = useMemo(() => curriculumWeeks.filter((week) =>
    (phaseFilter === 0 || week.phase === phaseFilter)
    && (!query || `${week.title} ${week.phaseTitle} ${week.goal}`.toLowerCase().includes(query.toLowerCase())),
  ), [phaseFilter, query]);

  const completedDays = state ? Object.values(state.lessons).filter((lesson) => Boolean(lesson.completedAt)).length : 0;

  return (
    <div className="page-stack">
      <section className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />CURRICULUM</div><h1>104週間のカリキュラム</h1><p className="page-lead">学ぶ順序と到達目標を確認。完了状況はこの端末の学習記録から表示します。</p></div><div className="curriculum-total"><strong>{completedDays}<small> / {totalLearningDays}</small></strong><span>学習日を完了</span></div></section>

      <section className="phase-overview">
        <div className="phase-overview-heading"><div><span className="section-kicker">8 PHASES</span><h2>基礎から実践へ</h2></div><span className="phase-overview-note">1週 = 7日 · 104週 = 728学習日</span></div>
        <div className="phase-cards">{curriculumWeeks.filter((week) => week.week % 13 === 1).map((week) => <button type="button" key={week.phase} className={`phase-card ${phaseFilter === week.phase ? "phase-card-selected" : ""}`} onClick={() => setPhaseFilter(phaseFilter === week.phase ? 0 : week.phase)}><span className="phase-number">0{week.phase}</span><strong>{week.phaseTitle}</strong><small>Week {String(week.week).padStart(2, "0")}–{String(week.week + 12).padStart(2, "0")}</small></button>)}</div>
      </section>

      <section className="panel curriculum-panel">
        <div className="panel-heading"><div><span className="section-kicker">WEEKLY PLAN</span><h2>{phaseFilter ? `Phase 0${phaseFilter}` : "全ての週"}</h2></div><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="トピックを検索" aria-label="トピックを検索" />{query && <button type="button" onClick={() => setQuery("")} aria-label="検索をクリア">×</button>}</label></div>
        <div className="curriculum-legend"><span><Check size={13} />完了</span><span><Circle size={11} />未着手</span><span><LockKeyhole size={12} />これから</span></div>
        <div className="week-list">
          {weeks.map((week) => {
            const dayRecords = Array.from({ length: 7 }, (_, index) => state?.lessons[`w${week.week}-d${index + 1}`]);
            const completeCount = dayRecords.filter((record) => Boolean(record?.completedAt)).length;
            const inProgress = dayRecords.some((record) => Boolean(record?.lastAttemptAt || record?.quizChoice !== undefined));
            const status = completeCount === 7 ? "complete" : inProgress || completeCount > 0 ? "active" : "upcoming";
            return (
              <details className="week-row" key={week.week}>
                <summary className="week-summary">
                  <span className={`week-status ${status}`}>{status === "complete" ? <Check size={13} /> : status === "active" ? <span /> : <Circle size={10} />}</span>
                  <span className="week-index">W{String(week.week).padStart(2, "0")}</span>
                  <span className="week-info"><strong>{week.title}</strong><small>Phase 0{week.phase} · {week.phaseTitle}</small></span>
                  <span className="week-progress-mini"><span style={{ width: `${(completeCount / 7) * 100}%` }} /></span>
                  <span className="week-count">{completeCount}/7</span>
                  <ChevronDown className="week-chevron" size={17} />
                </summary>
                <div className="week-detail">
                  <div className="week-goal"><span>到達目標</span><p>{week.goal}</p></div>
                  <div className="week-detail-meta"><div><span>前提知識</span><p>{week.prerequisite}</p></div><div><span>週課題</span><p>{week.exercise}</p></div><div><span>評価の証拠</span><p>{week.evidence}</p></div></div>
                  <div className="day-grid">{week.days.map((day) => {
                    const id = `w${week.week}-d${day.day}`;
                    const record = state?.lessons[id];
                    const lessonHref = `/learn/${week.week}/${day.day}/`;
                    return <Link className={`day-card ${record?.completedAt ? "day-complete" : ""}`} key={id} href={lessonHref}><span className="day-card-number">DAY {day.day}{record?.completedAt ? <Check size={13} /> : null}</span><strong>{day.label}</strong><small>{day.focus.split(" — ")[1]}</small><span className="day-card-link">{record?.completedAt ? "見直す" : "内容を見る"}<ArrowRight size={12} /></span></Link>;
                  })}</div>
                  <p className="lesson-availability">{week.week <= 4 ? "この週は学習教材・例題・課題を利用できます。" : "この週の目標と日程を公開中です。日別の詳細教材は順次制作します。"}</p>
                </div>
              </details>
            );
          })}
          {weeks.length === 0 && <div className="empty-state"><Search size={21} /><strong>一致する週がありません</strong><span>別のキーワードを検索してください。</span></div>}
        </div>
      </section>
      <div className="page-footnote">カリキュラムの進捗は、学習者が完了し実行結果を確認した教材だけを数えます。</div>
    </div>
  );
}
