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
const stateKey = "primary";
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
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(objectStoreName)) {
          database.createObjectStore(objectStoreName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("学習データを開けませんでした。"));
      request.onblocked = () => reject(new Error("別のタブがデータ更新を止めています。タブを再読み込みしてください。"));
    });
  }
  return databasePromise;
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
  return updateLearnerState((state) => ({
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: {
        ...(state.lessons[lessonId] ?? { lessonId, draft: "", attempts: 0 }),
        quizChoice,
        quizCorrect,
        ...(quizCorrect && state.submissions.some((submission) => submission.lessonId === lessonId && submission.status === "passed")
          ? { completedAt: state.lessons[lessonId]?.completedAt ?? new Date().toISOString() }
          : {}),
      },
    },
  }));
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
    && isOptional(value.bestScore, (item) => typeof item === "number" && Number.isFinite(item) && item >= 0 && item <= 100);
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

export async function exportLearnerState() {
  return JSON.stringify({ format: "cpp-mastery-backup", exportedAt: new Date().toISOString(), state: await readLearnerState() }, null, 2);
}

export async function importLearnerState(text: string) {
  if (text.length > 8_000_000) throw new Error("バックアップは8 MB以下にしてください。");
  const parsed: unknown = JSON.parse(text);
  const candidate = parsed && typeof parsed === "object" && "state" in parsed ? (parsed as { state: unknown }).state : parsed;
  if (!isLearnerState(candidate)) throw new Error("C++ Masteryのバックアップ形式ではありません。");
  await writeState(candidate);
  return candidate;
}
