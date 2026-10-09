"use client";

import Link from "next/link";
import { Activity, ArrowRight, BarChart3, CircleHelp, Code2, ShieldQuestion } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { curriculumWeeks, totalLearningDays } from "@/lib/curriculum";
import { readLearnerState, type LearnerState } from "@/lib/browser-store";

export function AnalyticsPage() {
  const [state, setState] = useState<LearnerState | null>(null);
  useEffect(() => { readLearnerState().then(setState).catch(() => setState(null)); }, []);
  const metrics = useMemo(() => {
    if (!state) return null;
    const submitted = state.submissions.length;
    const scored = state.submissions.filter((item) => item.score !== undefined);
    const average = scored.length ? Math.round(scored.reduce((total, item) => total + (item.score ?? 0), 0) / scored.length) : null;
    const passCount = state.submissions.filter((item) => item.status === "passed").length;
    const correctChecks = Object.values(state.lessons).filter((item) => item.quizCorrect).length;
    const completed = Object.values(state.lessons).filter((item) => item.completedAt).length;
    const phaseEvidence = curriculumWeeks.filter((week) => week.week % 13 === 1).map((phase) => {
      const complete = curriculumWeeks.slice(phase.week - 1, phase.week + 12).reduce((total, week) => total + week.days.filter((day) => Boolean(state.lessons[`w${week.week}-d${day.day}`]?.completedAt)).length, 0);
      return { phase, complete, total: 91 };
    });
    return { submitted, average, passCount, correctChecks, completed, phaseEvidence };
  }, [state]);
  return <div className="page-stack"><section className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />SKILL ANALYTICS</div><h1>実力分析</h1><p className="page-lead">このブラウザーで記録された回答と提出だけを集計します。</p></div><div className="analytics-evidence"><ShieldQuestion size={15} />未評価は0点にしません</div></section>
    {!metrics ? <div className="loading-state">記録を集計しています…</div> : <><section className="analytics-metrics"><article className="analytics-metric"><span><BookMarkIcon />学習完了</span><strong>{metrics.completed}<small> / {totalLearningDays}</small></strong><div className="thin-track"><span style={{ width: `${metrics.completed / totalLearningDays * 100}%` }} /></div></article><article className="analytics-metric"><span><CircleHelp size={15} />正解した理解チェック</span><strong>{metrics.correctChecks}<small> 件</small></strong><small className="metric-note">回答済み {Object.values(state?.lessons ?? {}).filter((item) => item.quizChoice !== undefined).length}件</small></article><article className="analytics-metric"><span><Code2 size={15} />提出したコード</span><strong>{metrics.submitted}<small> 回</small></strong><small className="metric-note">実行結果を保存した提出</small></article><article className="analytics-metric"><span><BarChart3 size={15} />平均テストスコア</span><strong>{metrics.average === null ? "—" : metrics.average}<small>{metrics.average === null ? " 未評価" : "%"}</small></strong><small className="metric-note">合格 {metrics.passCount} / {metrics.submitted} 回</small></article></section>
      <section className="panel phase-evidence-panel"><div className="panel-heading"><div><span className="section-kicker">EVIDENCE BY PHASE</span><h2>期ごとの学習記録</h2></div><Activity size={17} className="muted-icon" /></div><div className="phase-evidence-list">{metrics.phaseEvidence.map(({ phase, complete, total }) => <div className="phase-evidence-row" key={phase.phase}><span className="phase-evidence-number">0{phase.phase}</span><span className="phase-evidence-title">{phase.phaseTitle}</span><div className="thin-track"><span style={{ width: `${complete / total * 100}%` }} /></div><span className="phase-evidence-count">{complete}<small> / 91</small></span></div>)}</div><p className="analytics-note">正答率・学習時間・分野別スキルの確信度は、測定データが蓄積してから表示します。現在は学習時間と未評価スキルを推測していません。</p></section><Link className="text-link" href="/practice/">演習から記録を増やす<ArrowRight size={14} /></Link></>}
  </div>;
}

function BookMarkIcon() { return <BarChart3 size={15} />; }
