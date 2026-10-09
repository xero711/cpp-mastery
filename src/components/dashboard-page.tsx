"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BookOpenCheck, CalendarDays, Code2, Flame, MoveRight, Play, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { curriculumWeeks, totalLearningDays } from "@/lib/curriculum";
import { dateInJapan, formatJapaneseDate, lessonSlotForDate } from "@/lib/calendar";
import { readLearnerState, type LearnerState } from "@/lib/browser-store";
import { findLesson } from "@/lib/lessons";
import { hasConfiguredRunner } from "@/lib/runner-client";
import { buildReviewQueue } from "@/lib/review-schedule";

function streakFromDates(dates: string[], today: string) {
  const set = new Set(dates);
  let cursor = set.has(today) ? today : previousDay(today);
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = previousDay(cursor);
  }
  return count;
}

function previousDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - 1, 12));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function DashboardPage() {
  const [state, setState] = useState<LearnerState | null>(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    readLearnerState().then((loaded) => {
      setToday(dateInJapan());
      setState(loaded);
    }).catch(() => {
      setToday(dateInJapan());
      setState(null);
    });
  }, []);

  const snapshot = useMemo(() => {
    if (!state || !today) return null;
    const slot = lessonSlotForDate(today, state.settings.startDate);
    const completed = Object.values(state.lessons).filter((lesson) => Boolean(lesson.completedAt)).length;
    const correctChecks = Object.values(state.lessons).filter((lesson) => lesson.quizChoice !== undefined).length;
    const studyDates = Object.values(state.lessons)
      .flatMap((lesson) => [lesson.completedAt, lesson.lastAttemptAt])
      .filter((date): date is string => Boolean(date))
      .map((date) => date.slice(0, 10));
    const currentWeek = curriculumWeeks[slot.week - 1];
    const currentLesson = findLesson(slot.week, slot.day);
    const reviewQueue = buildReviewQueue(state.lessons, state.submissions, today);
    const needsReview = reviewQueue.filter((item) => item.dueOn <= today).length;
    return {
      slot,
      completed,
      correctChecks,
      attempts: state.submissions.length,
      streak: streakFromDates(studyDates, today),
      currentWeek,
      currentLesson,
      needsReview,
      progress: Math.round((completed / totalLearningDays) * 100),
    };
  }, [state, today]);

  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" />C++ MASTERY <span className="eyebrow-muted">· 学習ホーム</span></div>
          <h1>今日も一歩、<em>C++を自分のものに。</em></h1>
          <p className="page-lead">コードを書いて、試して、理由を説明する。積み上げはこの端末に記録されます。</p>
        </div>
        <div className="today-date"><CalendarDays size={16} />{today ? formatJapaneseDate(today) : "日付を確認中"}</div>
      </section>

      {!snapshot ? (
        <div className="callout callout-warning">学習データを読み込めません。ブラウザーのローカルストレージが利用できるか確認してください。</div>
      ) : (
        <>
          <section className="hero-card">
            <div className="hero-glow" />
            <div className="hero-copy">
              <div className="hero-meta"><span className="live-chip"><span />TODAY&apos;S SESSION</span><span>Week {String(snapshot.slot.week).padStart(2, "0")} <span className="hero-meta-divider">/</span> Day {snapshot.slot.day}</span></div>
              <h2>{snapshot.currentLesson?.title ?? snapshot.currentWeek.title}</h2>
              <p>{snapshot.currentLesson?.goal ?? snapshot.currentWeek.goal}</p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/learn/today/"><Play size={16} fill="currentColor" />今日の学習を始める<ArrowRight size={16} /></Link>
                <Link className="button button-ghost" href={`/learn/${snapshot.slot.week}/${snapshot.slot.day}/`}>この日の内容を見る</Link>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="code-glyph">&lt;/&gt;</div><div className="spark spark-one">✦</div><div className="spark spark-two">✦</div></div>
            <div className="hero-bottom"><span><Sparkles size={14} />今日の目標</span><strong>{snapshot.currentLesson ? `${snapshot.currentLesson.minutes}分・理解と実装` : "週の学習計画を確認"}</strong><span className="hero-bottom-right">無理のないペースで進めよう</span></div>
          </section>

          <section className="stats-grid" aria-label="学習記録">
            <article className="stat-card"><div className="stat-top"><span className="stat-icon purple"><BookOpenCheck size={18} /></span><span className="stat-kicker">LEARNING</span></div><strong className="stat-value">{snapshot.completed}<small> / {totalLearningDays}</small></strong><span className="stat-label">完了した学習日</span><div className="stat-foot"><span>カリキュラム全体</span><span>{snapshot.progress}%</span></div><div className="thin-track"><span style={{ width: `${Math.max(snapshot.progress, 1)}%` }} /></div></article>
            <article className="stat-card"><div className="stat-top"><span className="stat-icon cyan"><Code2 size={18} /></span><span className="stat-kicker">PRACTICE</span></div><strong className="stat-value">{snapshot.attempts}<small> 回</small></strong><span className="stat-label">保存されたコード提出</span><div className="stat-foot"><span>採点は実行結果に基づく</span><span>{hasConfiguredRunner() ? "RUNNER URL SET" : "RUNNER OFF"}</span></div><div className={`thin-track ${hasConfiguredRunner() ? "track-cyan" : "track-muted"}`}><span style={{ width: hasConfiguredRunner() ? "100%" : "16%" }} /></div></article>
            <article className="stat-card"><div className="stat-top"><span className="stat-icon orange"><Flame size={18} /></span><span className="stat-kicker">CONSISTENCY</span></div><strong className="stat-value">{snapshot.streak}<small> 日</small></strong><span className="stat-label">記録が続いている日数</span><div className="stat-foot"><span>学習記録のある日から算出</span><span><ArrowUpRight size={13} /></span></div></article>
            <article className="stat-card"><div className="stat-top"><span className="stat-icon green"><Sparkles size={18} /></span><span className="stat-kicker">REVIEW</span></div><strong className="stat-value">{snapshot.needsReview}<small> 件</small></strong><span className="stat-label">期限を迎えた復習</span><div className="stat-foot"><span>理解チェックと提出結果から算出</span><Link href="/review/">復習へ <ArrowRight size={12} /></Link></div></article>
          </section>

          <div className="dashboard-columns">
            <section className="panel progress-panel">
              <div className="panel-heading"><div><span className="section-kicker">YOUR JOURNEY</span><h2>2年間の学習進捗</h2></div><Link className="text-link" href="/curriculum/">全体を見る<ArrowRight size={14} /></Link></div>
              <div className="progress-summary"><div><strong>{snapshot.completed}</strong><span> / 728 日</span></div><span>完了した日だけを表示</span></div>
              <div className="journey-track"><div className="journey-progress" style={{ width: `${snapshot.progress}%` }} /><span className="journey-marker" style={{ left: `${Math.max(snapshot.progress, 0.4)}%` }} /></div>
              <div className="phase-strip">{curriculumWeeks.filter((week) => week.week % 13 === 1).map((week) => <div key={week.phase} className={`phase-item ${week.phase === snapshot.currentWeek.phase ? "phase-current" : ""}`}><span>0{week.phase}</span><strong>{week.phaseTitle}</strong></div>)}</div>
              <div className="panel-divider" />
              <div className="current-focus"><div className="focus-icon"><Code2 size={17} /></div><div className="focus-copy"><span>今週のテーマ · Week {String(snapshot.currentWeek.week).padStart(2, "0")}</span><strong>{snapshot.currentWeek.title}</strong><small>{snapshot.currentWeek.goal}</small></div><Link href="/curriculum/" aria-label="今週の内容を見る" className="round-arrow"><ArrowRight size={16} /></Link></div>
            </section>

            <section className="panel next-panel">
              <div className="panel-heading"><div><span className="section-kicker">KEEP MOVING</span><h2>次のアクション</h2></div><span className="action-count">{snapshot.needsReview ? "復習あり" : "学習中"}</span></div>
              {snapshot.needsReview > 0 ? <Link href="/review/" className="action-card action-review"><span className="action-icon"><ArrowDownRight size={17} /></span><span><strong>{snapshot.needsReview}件の復習期限です</strong><small>クイズと公開テストで再確認</small></span><MoveRight size={16} /></Link> : <Link href="/review/" className="empty-action"><span className="empty-ring"><BookOpenCheck size={19} /></span><strong>今日が期限の復習はありません</strong><small>次回の予定を確認する</small></Link>}
              <Link href="/practice/" className="action-card"><span className="action-icon action-cyan"><Code2 size={17} /></span><span><strong>コード演習を探す</strong><small>収録教材から出題</small></span><MoveRight size={16} /></Link>
              <div className={`runner-callout ${hasConfiguredRunner() ? "runner-ready" : ""}`}><span className="runner-indicator" /><div><strong>{hasConfiguredRunner() ? "C++実行ワーカーURL設定済み" : "C++実行ワーカー未設定"}</strong><small>{hasConfiguredRunner() ? "利用には接続用トークンとサービス稼働が必要です" : "Pagesには実行サーバーが含まれていません"}</small></div><Link href="/settings/" aria-label="設定を見る"><ArrowRight size={15} /></Link></div>
            </section>
          </div>

          <section className="recent-row">
            <div className="recent-heading"><div><span className="section-kicker">RECENT LEARNING</span><h2>カリキュラムから学ぶ</h2></div><span className="recent-description">まだ記録がない場合は、今日の学習からスタート。</span></div>
            <div className="week-card-row">{curriculumWeeks.slice(Math.max(0, snapshot.slot.week - 1), Math.max(0, snapshot.slot.week - 1) + 3).map((week) => <Link className="week-card" key={week.week} href={`/learn/${week.week}/1/`}><div className="week-card-top"><span>WEEK {String(week.week).padStart(2, "0")}</span><span className="week-card-arrow"><ArrowRight size={14} /></span></div><strong>{week.title}</strong><small>{week.phaseTitle} · 7日間</small><div className="week-card-bottom"><span>学習計画</span><span>未着手</span></div></Link>)}</div>
          </section>
        </>
      )}
    </div>
  );
}
