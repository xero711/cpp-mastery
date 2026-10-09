"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, Clock3, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { dateInJapan, formatJapaneseDate } from "@/lib/calendar";
import { readLearnerState, type LearnerState } from "@/lib/browser-store";
import { lessons } from "@/lib/lessons";
import { buildReviewQueue, daysBetweenCalendarDates } from "@/lib/review-schedule";

export function ReviewPage() {
  const [state, setState] = useState<LearnerState | null>(null);
  const [today, setToday] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readLearnerState().then(setState).catch(() => setState(null)).finally(() => {
      setToday(dateInJapan());
      setReady(true);
    });
  }, []);

  const items = useMemo(
    () => state && today ? buildReviewQueue(state.lessons, state.submissions, today) : [],
    [state, today],
  );
  const dueCount = items.filter((item) => item.dueOn <= today).length;

  return <div className="page-stack">
    <section className="page-title-row">
      <div><div className="eyebrow"><span className="eyebrow-line" />REVIEW CENTER</div><h1>復習センター</h1><p className="page-lead">間違えた理解チェックや提出から復習日を設定し、学習記録をもとに再挑戦します。</p></div>
      <div className="practice-count"><strong>{ready ? dueCount : "—"}</strong><span>期限を迎えた課題</span></div>
    </section>

    <section className="review-intro panel">
      <div className="review-intro-icon"><RotateCcw size={19} /></div>
      <div><strong>クイズと公開テストの両方で、思い出せるか確かめます。</strong><p>両方に通ると次の復習間隔を1・3・7・14・30・60日へ広げ、間違えた場合は翌日へ戻します。</p></div>
    </section>

    {!ready ? <div className="loading-state">学習データを確認しています…</div>
      : !state ? <div className="callout callout-warning">学習データを読み込めません。ブラウザーの保存領域を確認してください。</div>
        : items.length ? <>
          <div className="review-schedule-summary"><CalendarClock size={15} /><span>{items.length}件を予定中</span><span>{dueCount}件が今日まで、{items.length - dueCount}件は今後の予定です</span></div>
          <div className="review-list">{items.map((item) => {
            const lesson = lessons.find((entry) => entry.id === item.lessonId);
            const daysUntil = daysBetweenCalendarDates(today, item.dueOn);
            const dueLabel = daysUntil < 0 ? `${Math.abs(daysUntil)}日遅れ` : daysUntil === 0 ? "今日が期限" : `あと${daysUntil}日`;
            return <article className={`review-card panel ${daysUntil <= 0 ? "review-card-due" : ""}`} key={item.lessonId}>
              <div className="review-card-icon"><AlertTriangle size={17} /></div>
              <div className="review-card-content">
                <div className="practice-meta">
                  <span>{lesson ? `W${String(lesson.week).padStart(2, "0")} · DAY ${lesson.day}` : item.lessonId}</span>
                  <span className={daysUntil <= 0 ? "review-due-label" : "review-future-label"}><Clock3 size={12} />{dueLabel}</span>
                </div>
                <strong>{lesson?.title ?? "教材が更新された課題"}</strong>
                <p>{item.latestIssue?.status === "compile_error"
                  ? "前回のコンパイル診断を読み、原因を説明してからもう一度実装します。"
                  : item.latestIssue?.status === "failed"
                    ? "前回のテスト結果を見直し、違った条件を含めて再確認します。"
                    : "理解チェックに答え、資料を見ずにコードを再実装します。"}</p>
                {item.latestIssue && <div className="review-code-output"><span>前回の記録</span><pre>{item.latestIssue.compilerOutput || item.latestIssue.stdout || "出力なし"}</pre></div>}
                <div className="review-interval">次回 {formatJapaneseDate(item.dueOn)} · 間隔 {item.intervalDays}日 · 定着確認 {item.repetitions}回</div>
              </div>
              <Link className="button button-secondary" href={lesson ? `/learn/${lesson.week}/${lesson.day}/` : "/practice/"}>再挑戦<ArrowRight size={14} /></Link>
            </article>;
          })}</div>
        </> : <div className="empty-state panel"><span className="empty-ring"><RotateCcw size={19} /></span><strong>復習予定はありません</strong><span>理解チェックやコード提出の結果に応じて、ここに次の復習日を記録します。</span><Link href="/practice/" className="button button-secondary">課題を見る<ArrowRight size={14} /></Link></div>}
  </div>;
}
