import type { LessonRecord, SubmissionRecord } from "@/lib/browser-store";

export type ReviewSchedule = {
  dueOn: string;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  reviewAttemptOn?: string;
  reviewQuizCorrect?: boolean;
  reviewExercisePassed?: boolean;
  lastReviewedOn?: string;
  lastMissedOn?: string;
};

export type ReviewQueueItem = {
  lessonId: string;
  dueOn: string;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  latestIssue?: SubmissionRecord;
  legacy: boolean;
};

const successfulIntervals = [1, 3, 7, 14, 30, 60] as const;

export function addCalendarDays(day: string, days: number) {
  const [year, month, date] = day.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, date + days, 12));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, "0")}-${String(result.getUTCDate()).padStart(2, "0")}`;
}

export function daysBetweenCalendarDates(from: string, to: string) {
  const [fromYear, fromMonth, fromDate] = from.split("-").map(Number);
  const [toYear, toMonth, toDate] = to.split("-").map(Number);
  return Math.round((Date.UTC(toYear, toMonth - 1, toDate) - Date.UTC(fromYear, fromMonth - 1, fromDate)) / 86_400_000);
}

export function createInitialReviewSchedule(today: string): ReviewSchedule {
  return { dueOn: addCalendarDays(today, 1), intervalDays: 1, repetitions: 0, lapses: 0 };
}

function missedReview(current: ReviewSchedule | undefined, today: string): ReviewSchedule {
  return {
    dueOn: addCalendarDays(today, 1),
    intervalDays: 1,
    repetitions: 0,
    lapses: Math.min(10_000, (current?.lapses ?? 0) + (current?.lastMissedOn === today ? 0 : 1)),
    ...(current?.lastReviewedOn ? { lastReviewedOn: current.lastReviewedOn } : {}),
    lastMissedOn: today,
  };
}

export function recordReviewEvidence(
  current: ReviewSchedule | undefined,
  evidence: { kind: "quiz" | "exercise"; correct: boolean },
  today: string,
): ReviewSchedule | undefined {
  if (!evidence.correct) return missedReview(current, today);
  if (!current || current.dueOn > today) return current;

  const sameAttemptDay = current.reviewAttemptOn === today;
  const quizCorrect = evidence.kind === "quiz"
    ? true
    : sameAttemptDay && current.reviewQuizCorrect === true;
  const exercisePassed = evidence.kind === "exercise"
    ? true
    : sameAttemptDay && current.reviewExercisePassed === true;

  if (quizCorrect && exercisePassed) {
    const repetitions = Math.min(10_000, current.repetitions + 1);
    const intervalDays = successfulIntervals[Math.min(repetitions, successfulIntervals.length - 1)];
    return {
      dueOn: addCalendarDays(today, intervalDays),
      intervalDays,
      repetitions,
      lapses: current.lapses,
      lastReviewedOn: today,
    };
  }

  return {
    ...current,
    reviewAttemptOn: today,
    reviewQuizCorrect: quizCorrect,
    reviewExercisePassed: exercisePassed,
  };
}

function isDayKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isReviewSchedule(value: unknown): value is ReviewSchedule {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const schedule = value as Record<string, unknown>;
  return isDayKey(schedule.dueOn)
    && successfulIntervals.includes(Number(schedule.intervalDays) as typeof successfulIntervals[number])
    && Number.isSafeInteger(schedule.repetitions) && Number(schedule.repetitions) >= 0 && Number(schedule.repetitions) <= 10_000
    && Number.isSafeInteger(schedule.lapses) && Number(schedule.lapses) >= 0 && Number(schedule.lapses) <= 10_000
    && (schedule.reviewAttemptOn === undefined || isDayKey(schedule.reviewAttemptOn))
    && (schedule.reviewQuizCorrect === undefined || typeof schedule.reviewQuizCorrect === "boolean")
    && (schedule.reviewExercisePassed === undefined || typeof schedule.reviewExercisePassed === "boolean")
    && (schedule.lastReviewedOn === undefined || isDayKey(schedule.lastReviewedOn))
    && (schedule.lastMissedOn === undefined || isDayKey(schedule.lastMissedOn));
}

function latestFailedSubmissions(submissions: SubmissionRecord[]) {
  const latest = new Map<string, SubmissionRecord>();
  for (const submission of submissions) {
    if (submission.status !== "failed" && submission.status !== "compile_error") continue;
    const existing = latest.get(submission.lessonId);
    if (!existing || submission.submittedAt > existing.submittedAt) latest.set(submission.lessonId, submission);
  }
  return latest;
}

function latestSubmissions(submissions: SubmissionRecord[]) {
  const latest = new Map<string, SubmissionRecord>();
  for (const submission of submissions) {
    const existing = latest.get(submission.lessonId);
    if (!existing || submission.submittedAt > existing.submittedAt) latest.set(submission.lessonId, submission);
  }
  return latest;
}

export function buildReviewQueue(
  lessons: Record<string, LessonRecord>,
  submissions: SubmissionRecord[],
  today: string,
): ReviewQueueItem[] {
  const issues = latestFailedSubmissions(submissions);
  const mostRecent = latestSubmissions(submissions);
  const scheduled = new Set<string>();
  const queue: ReviewQueueItem[] = [];

  for (const [lessonId, record] of Object.entries(lessons)) {
    if (!record.reviewSchedule) continue;
    scheduled.add(lessonId);
    queue.push({
      lessonId,
      dueOn: record.reviewSchedule.dueOn,
      intervalDays: record.reviewSchedule.intervalDays,
      repetitions: record.reviewSchedule.repetitions,
      lapses: record.reviewSchedule.lapses,
      latestIssue: issues.get(lessonId),
      legacy: false,
    });
  }

  for (const [lessonId, latest] of mostRecent) {
    if (scheduled.has(lessonId)) continue;
    if (latest.status !== "failed" && latest.status !== "compile_error") continue;
    const issue = issues.get(lessonId) ?? latest;
    queue.push({ lessonId, dueOn: today, intervalDays: 1, repetitions: 0, lapses: 1, latestIssue: issue, legacy: true });
  }

  return queue.sort((left, right) => left.dueOn.localeCompare(right.dueOn) || left.lessonId.localeCompare(right.lessonId));
}

export function countDueReviews(lessons: Record<string, LessonRecord>, submissions: SubmissionRecord[], today: string) {
  return buildReviewQueue(lessons, submissions, today).filter((item) => item.dueOn <= today).length;
}
