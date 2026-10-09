import { dateInJapan } from "./calendar";
import { createInitialReviewSchedule, isReviewSchedule, recordReviewEvidence, type ReviewSchedule } from "./review-schedule";

export type ThemePreference = "dark" | "light";

export type LearnerSettings = {
  startDate: string;
  dailyTargetMinutes: number;
  studyDaysPerWeek: number;
  theme: ThemePreference;
};

export type LessonRecord = {
  lessonId: string;
  draft: string;
  quizChoice?: number;
  quizCorrect?: boolean;
  debugAnswer?: string;
  debugRevealed?: boolean;
  solutionRevealed?: boolean;
  reflection?: string;
  hintsUsed?: number;
  completedAt?: string;
  lastAttemptAt?: string;
  attempts: number;
  bestScore?: number;
  reviewSchedule?: ReviewSchedule;
};

export type SubmissionRecord = {
  id: string;
  lessonId: string;
  source: string;
  submittedAt: string;
  status: "passed" | "failed" | "compile_error" | "unavailable" | "runner_error";
  score?: number;
  compilerOutput?: string;
  stdout?: string;
  stderr?: string;
  durationMs?: number;
};

export type LearnerProject = {
  id: string;
  title: string;
  goal: string;
  status: "planned" | "active" | "complete";
  repositoryUrl: string;
  updatedAt: string;
};

export type PortfolioItem = {
  id: string;
  title: string;
  summary: string;
  technologies: string;
  repositoryUrl: string;
  updatedAt: string;
};

export type MentorUsage = {
  provider: "openai" | "ollama";
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
};

export type MentorConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  mode?: "teacher" | "socratic" | "debugger" | "reviewer" | "architect" | "interviewer" | "examiner" | "planner";
  usage?: MentorUsage;
};

export type LearnerState = {
  schemaVersion: 1;
  settings: LearnerSettings;
  lessons: Record<string, LessonRecord>;
  submissions: SubmissionRecord[];
  projects: LearnerProject[];
  portfolio: PortfolioItem[];
};

const databaseName = "cpp-mastery-local";
const objectStoreName = "learner-state";
const secretStoreName = "private-secrets";
const mentorConversationStoreName = "mentor-conversations";
const stateKey = "primary";
const runnerTokenKey = "runner-api-token";
const mentorTokenKey = "mentor-api-token";
let databasePromise: Promise<IDBDatabase> | undefined;

function todayInJapan() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "01";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function createInitialState(): LearnerState {
  return {
    schemaVersion: 1,
    settings: {
      startDate: todayInJapan(),
      dailyTargetMinutes: 45,
      studyDaysPerWeek: 6,
      theme: "dark",
    },
    lessons: {},
    submissions: [],
    projects: [],
    portfolio: [],
  };
}

function openDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("このブラウザーではIndexedDBを利用できません。"));
  }
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 3);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(objectStoreName)) {
          database.createObjectStore(objectStoreName);
        }
        if (!database.objectStoreNames.contains(secretStoreName)) {
          database.createObjectStore(secretStoreName);
        }
        if (!database.objectStoreNames.contains(mentorConversationStoreName)) {
          database.createObjectStore(mentorConversationStoreName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("学習データを開けませんでした。"));
      request.onblocked = () => reject(new Error("別のタブがデータ更新を止めています。タブを再読み込みしてください。"));
    });
  }
  return databasePromise;
}

export async function readRunnerApiToken(): Promise<string> {
  const database = await openDatabase();
  const transaction = database.transaction(secretStoreName, "readonly");
  return new Promise<string>((resolve, reject) => {
    const request = transaction.objectStore(secretStoreName).get(runnerTokenKey);
    request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : "");
    request.onerror = () => reject(request.error ?? new Error("実行ワーカーのトークンを読み込めませんでした。"));
  });
}

export async function saveRunnerApiToken(token: string): Promise<void> {
  const value = token.trim();
  if (value.length < 32 || value.length > 512) throw new Error("トークンは32〜512文字で入力してください。");
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(secretStoreName, "readwrite");
    transaction.objectStore(secretStoreName).put(value, runnerTokenKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("実行ワーカーのトークンを保存できませんでした。"));
    transaction.onabort = () => reject(transaction.error ?? new Error("実行ワーカーのトークン保存が中断されました。"));
  });
}

export async function clearRunnerApiToken(): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(secretStoreName, "readwrite");
    transaction.objectStore(secretStoreName).delete(runnerTokenKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("実行ワーカーのトークンを削除できませんでした。"));
    transaction.onabort = () => reject(transaction.error ?? new Error("実行ワーカーのトークン削除が中断されました。"));
  });
}

export async function readMentorApiToken(): Promise<string> {
  const database = await openDatabase();
  const transaction = database.transaction(secretStoreName, "readonly");
  return new Promise<string>((resolve, reject) => {
    const request = transaction.objectStore(secretStoreName).get(mentorTokenKey);
    request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : "");
    request.onerror = () => reject(request.error ?? new Error("AI講師のトークンを読み込めませんでした。"));
  });
}

export async function saveMentorApiToken(token: string): Promise<void> {
  const value = token.trim();
  if (value.length < 32 || value.length > 512) throw new Error("トークンは32〜512文字で入力してください。");
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(secretStoreName, "readwrite");
    transaction.objectStore(secretStoreName).put(value, mentorTokenKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("AI講師のトークンを保存できませんでした。"));
    transaction.onabort = () => reject(transaction.error ?? new Error("AI講師のトークン保存が中断されました。"));
  });
}

export async function clearMentorApiToken(): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(secretStoreName, "readwrite");
    transaction.objectStore(secretStoreName).delete(mentorTokenKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("AI講師のトークンを削除できませんでした。"));
    transaction.onabort = () => reject(transaction.error ?? new Error("AI講師のトークン削除が中断されました。"));
  });
}

export async function readMentorConversation(): Promise<MentorConversationMessage[]> {
  const database = await openDatabase();
  const transaction = database.transaction(mentorConversationStoreName, "readonly");
  return new Promise<MentorConversationMessage[]>((resolve, reject) => {
    const request = transaction.objectStore(mentorConversationStoreName).get(stateKey);
    request.onsuccess = () => resolve(isMentorConversation(request.result) ? request.result : []);
    request.onerror = () => reject(request.error ?? new Error("AI講師の会話履歴を読み込めませんでした。"));
  });
}

export async function saveMentorConversation(messages: MentorConversationMessage[]): Promise<void> {
  if (!isMentorConversation(messages)) throw new Error("AI講師の会話履歴が正しくありません。");
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(mentorConversationStoreName, "readwrite");
    transaction.objectStore(mentorConversationStoreName).put(messages, stateKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("AI講師の会話履歴を保存できませんでした。"));
    transaction.onabort = () => reject(transaction.error ?? new Error("AI講師の会話履歴保存が中断されました。"));
  });
}

export async function clearMentorConversation(): Promise<void> {
  await saveMentorConversation([]);
}

export async function readLearnerState(): Promise<LearnerState> {
  const database = await openDatabase();
  const transaction = database.transaction(objectStoreName, "readonly");
  const state = await new Promise<LearnerState | undefined>((resolve, reject) => {
    const request = transaction.objectStore(objectStoreName).get(stateKey);
    request.onsuccess = () => resolve(request.result as LearnerState | undefined);
    request.onerror = () => reject(request.error ?? new Error("学習データを読み込めませんでした。"));
  });
  if (!state) {
    return updateLearnerState((current) => current);
  }
  return state;
}

function writeState(state: LearnerState) {
  return openDatabase().then((database) => new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    transaction.objectStore(objectStoreName).put(state, stateKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("学習データを保存できませんでした。"));
    transaction.onabort = () => reject(transaction.error ?? new Error("学習データの保存が中断されました。"));
  }));
}

export function updateLearnerState(update: (current: LearnerState) => LearnerState): Promise<LearnerState> {
  return openDatabase().then((database) => new Promise<LearnerState>((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    const store = transaction.objectStore(objectStoreName);
    const request = store.get(stateKey);
    let updated: LearnerState;
    request.onsuccess = () => {
      try {
        updated = update((request.result as LearnerState | undefined) ?? createInitialState());
        store.put(updated, stateKey);
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    };
    request.onerror = () => reject(request.error ?? new Error("学習データを更新できませんでした。"));
    transaction.oncomplete = () => resolve(updated);
    transaction.onerror = () => reject(transaction.error ?? new Error("学習データを保存できませんでした。"));
    transaction.onabort = () => reject(transaction.error ?? new Error("学習データの更新が中断されました。"));
  }));
}

export async function saveLessonDraft(lessonId: string, draft: string) {
  return updateLearnerState((state) => ({
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: { ...(state.lessons[lessonId] ?? { lessonId, draft: "", attempts: 0 }), draft },
    },
  }));
}

export async function saveQuizChoice(lessonId: string, quizChoice: number, quizCorrect: boolean) {
  return updateLearnerState((state) => {
    const previous = state.lessons[lessonId] ?? { lessonId, draft: "", attempts: 0 };
    let reviewSchedule = previous.reviewSchedule;
    if (!quizCorrect) {
      reviewSchedule = recordReviewEvidence(reviewSchedule, { kind: "quiz", correct: false }, dateInJapan());
    } else if (reviewSchedule) {
      reviewSchedule = recordReviewEvidence(reviewSchedule, { kind: "quiz", correct: true }, dateInJapan());
    } else if (state.submissions.some((submission) => submission.lessonId === lessonId && submission.status === "passed")) {
      reviewSchedule = createInitialReviewSchedule(dateInJapan());
    }

    return {
      ...state,
      lessons: {
        ...state.lessons,
        [lessonId]: {
          ...previous,
          quizChoice,
          quizCorrect,
          ...(reviewSchedule ? { reviewSchedule } : {}),
          ...(quizCorrect && state.submissions.some((submission) => submission.lessonId === lessonId && submission.status === "passed")
            ? { completedAt: previous.completedAt ?? new Date().toISOString() }
            : {}),
        },
      },
    };
  });
}

export async function saveLessonAnswer(lessonId: string, values: Partial<Pick<LessonRecord, "debugAnswer" | "debugRevealed" | "solutionRevealed" | "reflection" | "hintsUsed">>) {
  return updateLearnerState((state) => ({
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: { ...(state.lessons[lessonId] ?? { lessonId, draft: "", attempts: 0 }), ...values },
    },
  }));
}

export async function recordSubmission(submission: SubmissionRecord) {
  return updateLearnerState((state) => {
    const previous = state.lessons[submission.lessonId] ?? { lessonId: submission.lessonId, draft: submission.source, attempts: 0 };
    const passed = submission.status === "passed";
    const submissionDay = dateInJapan(new Date(submission.submittedAt));
    let reviewSchedule = previous.reviewSchedule;
    if (passed) {
      reviewSchedule = reviewSchedule
        ? recordReviewEvidence(reviewSchedule, { kind: "exercise", correct: true }, submissionDay)
        : previous.quizCorrect ? createInitialReviewSchedule(submissionDay) : undefined;
    } else if (submission.status === "failed" || submission.status === "compile_error") {
      reviewSchedule = recordReviewEvidence(reviewSchedule, { kind: "exercise", correct: false }, submissionDay);
    }
    return {
      ...state,
      lessons: {
        ...state.lessons,
        [submission.lessonId]: {
          ...previous,
          draft: submission.source,
          attempts: previous.attempts + 1,
          lastAttemptAt: submission.submittedAt,
          bestScore: Math.max(previous.bestScore ?? 0, submission.score ?? 0),
          ...(reviewSchedule ? { reviewSchedule } : {}),
          ...(passed && previous.quizCorrect ? { completedAt: previous.completedAt ?? submission.submittedAt } : {}),
        },
      },
      submissions: [submission, ...state.submissions].slice(0, 200),
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function isBoundedString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.length <= maxLength;
}

function isOptional(value: unknown, check: (candidate: unknown) => boolean) {
  return value === undefined || check(value);
}

function isValidDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

function isValidDay(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isOptionalHttpUrl(value: unknown) {
  if (value === "") return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isSubmission(value: unknown): value is SubmissionRecord {
  if (!isRecord(value)) return false;
  return isBoundedString(value.id, 128)
    && typeof value.lessonId === "string" && /^w\d+-d\d+$/.test(value.lessonId)
    && isBoundedString(value.source, 32_000)
    && isValidDate(value.submittedAt)
    && ["passed", "failed", "compile_error", "unavailable", "runner_error"].includes(String(value.status))
    && isOptional(value.score, (item) => typeof item === "number" && Number.isFinite(item) && item >= 0 && item <= 100)
    && isOptional(value.compilerOutput, (item) => isBoundedString(item, 32_000))
    && isOptional(value.stdout, (item) => isBoundedString(item, 32_000))
    && isOptional(value.stderr, (item) => isBoundedString(item, 32_000))
    && isOptional(value.durationMs, (item) => typeof item === "number" && Number.isFinite(item) && item >= 0);
}

function isLearnerProject(value: unknown): value is LearnerProject {
  if (!isRecord(value)) return false;
  return isBoundedString(value.id, 128)
    && isBoundedString(value.title, 160)
    && isBoundedString(value.goal, 2000)
    && ["planned", "active", "complete"].includes(String(value.status))
    && isOptionalHttpUrl(value.repositoryUrl)
    && isValidDate(value.updatedAt);
}

function isPortfolioItem(value: unknown): value is PortfolioItem {
  if (!isRecord(value)) return false;
  return isBoundedString(value.id, 128)
    && isBoundedString(value.title, 160)
    && isBoundedString(value.summary, 4000)
    && isBoundedString(value.technologies, 1000)
    && isOptionalHttpUrl(value.repositoryUrl)
    && isValidDate(value.updatedAt);
}

function isLessonRecord(key: string, value: unknown): value is LessonRecord {
  if (!/^w\d+-d\d+$/.test(key) || !isRecord(value)) return false;
  return value.lessonId === key
    && isBoundedString(value.draft, 32_000)
    && Number.isSafeInteger(value.attempts) && Number(value.attempts) >= 0
    && isOptional(value.quizChoice, (item) => Number.isInteger(item) && Number(item) >= 0 && Number(item) <= 5)
    && isOptional(value.quizCorrect, (item) => typeof item === "boolean")
    && isOptional(value.debugAnswer, (item) => isBoundedString(item, 4000))
    && isOptional(value.debugRevealed, (item) => typeof item === "boolean")
    && isOptional(value.solutionRevealed, (item) => typeof item === "boolean")
    && isOptional(value.reflection, (item) => isBoundedString(item, 4000))
    && isOptional(value.hintsUsed, (item) => Number.isInteger(item) && Number(item) >= 0 && Number(item) <= 3)
    && isOptional(value.completedAt, isValidDate)
    && isOptional(value.lastAttemptAt, isValidDate)
    && isOptional(value.bestScore, (item) => typeof item === "number" && Number.isFinite(item) && item >= 0 && item <= 100)
    && isOptional(value.reviewSchedule, isReviewSchedule);
}

export function isLearnerState(value: unknown): value is LearnerState {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.settings)) return false;
  const { settings, lessons, submissions, projects, portfolio } = value;
  if (!isValidDay(settings.startDate)
    || !Number.isInteger(settings.dailyTargetMinutes) || Number(settings.dailyTargetMinutes) < 5 || Number(settings.dailyTargetMinutes) > 720
    || !Number.isInteger(settings.studyDaysPerWeek) || Number(settings.studyDaysPerWeek) < 1 || Number(settings.studyDaysPerWeek) > 7
    || !["dark", "light"].includes(String(settings.theme))) return false;
  if (!isRecord(lessons) || Object.keys(lessons).length > 728
    || !Object.entries(lessons).every(([lessonId, record]) => isLessonRecord(lessonId, record))) return false;
  return Array.isArray(submissions) && submissions.length <= 200 && submissions.every(isSubmission)
    && Array.isArray(projects) && projects.length <= 100 && projects.every(isLearnerProject)
    && Array.isArray(portfolio) && portfolio.length <= 100 && portfolio.every(isPortfolioItem);
}

function isMentorConversation(value: unknown): value is MentorConversationMessage[] {
  if (!Array.isArray(value) || value.length > 200) return false;
  return value.every((message) => {
    if (!isRecord(message) || !isBoundedString(message.id, 128)
      || !["user", "assistant"].includes(String(message.role))
      || !isBoundedString(message.content, 32_000) || !isValidDate(message.createdAt)) return false;
    if (!isOptional(message.mode, (mode) => ["teacher", "socratic", "debugger", "reviewer", "architect", "interviewer", "examiner", "planner"].includes(String(mode)))) return false;
    if (message.usage === undefined) return true;
    const usage = message.usage;
    return isRecord(usage) && ["openai", "ollama"].includes(String(usage.provider))
      && isBoundedString(usage.model, 200)
      && (usage.inputTokens === null || (Number.isSafeInteger(usage.inputTokens) && Number(usage.inputTokens) >= 0))
      && (usage.outputTokens === null || (Number.isSafeInteger(usage.outputTokens) && Number(usage.outputTokens) >= 0))
      && (usage.estimatedCostUsd === null || (typeof usage.estimatedCostUsd === "number" && Number.isFinite(usage.estimatedCostUsd) && usage.estimatedCostUsd >= 0));
  });
}

export async function exportLearnerState() {
  const [state, mentorConversation] = await Promise.all([readLearnerState(), readMentorConversation()]);
  return JSON.stringify({ format: "cpp-mastery-backup", exportedAt: new Date().toISOString(), state, mentorConversation }, null, 2);
}

export async function importLearnerState(text: string) {
  if (text.length > 8_000_000) throw new Error("バックアップは8 MB以下にしてください。");
  const parsed: unknown = JSON.parse(text);
  const candidate = parsed && typeof parsed === "object" && "state" in parsed ? (parsed as { state: unknown }).state : parsed;
  if (!isLearnerState(candidate)) throw new Error("C++ Masteryのバックアップ形式ではありません。");
  const mentorConversation = parsed && typeof parsed === "object" && "mentorConversation" in parsed
    ? (parsed as { mentorConversation: unknown }).mentorConversation
    : [];
  if (!isMentorConversation(mentorConversation)) throw new Error("AI講師の会話履歴が正しくありません。");
  await writeState(candidate);
  await saveMentorConversation(mentorConversation);
  return candidate;
}
