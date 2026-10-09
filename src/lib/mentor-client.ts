import { useSyncExternalStore } from "react";

export type MentorMode = "teacher" | "socratic" | "debugger" | "reviewer" | "architect" | "interviewer" | "examiner" | "planner";
export type MentorProvider = "openai" | "ollama";
export type MentorUsage = {
  provider: MentorProvider;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
};
export type MentorChatMessage = { role: "user" | "assistant"; content: string };
export type MentorHealth = { ready: boolean; provider: MentorProvider; model: string; costEstimateConfigured: boolean };

const configuredMentor = normalizeMentorUrl(process.env.NEXT_PUBLIC_MENTOR_URL);
const mentorUrlStorageKey = "cpp-mastery-mentor-url";
const mentorUrlChangedEvent = "cpp-mastery-mentor-url-changed";

export function normalizeMentorUrl(value: string | undefined) {
  if (!value?.trim()) return "";
  try {
    const url = new URL(value.trim());
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((!loopback && url.protocol !== "https:") || (loopback && !["http:", "https:"].includes(url.protocol))
      || url.username || url.password || url.search || url.hash) return "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

export function getMentorUrlOverride() {
  if (typeof window === "undefined") return "";
  try { return normalizeMentorUrl(window.localStorage.getItem(mentorUrlStorageKey) ?? undefined); }
  catch { return ""; }
}

export function getConfiguredMentorUrl() {
  return getMentorUrlOverride() || configuredMentor;
}

export function saveMentorUrlOverride(value: string) {
  const normalized = normalizeMentorUrl(value);
  if (!normalized) throw new Error("AIサービスURLはHTTPSで入力してください。HTTPを使えるのはlocalhost、127.0.0.1、または[::1]だけです。");
  if (typeof window === "undefined") throw new Error("ブラウザーからURLを保存してください。");
  window.localStorage.setItem(mentorUrlStorageKey, normalized);
  window.dispatchEvent(new Event(mentorUrlChangedEvent));
  return normalized;
}

export function clearMentorUrlOverride() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(mentorUrlStorageKey);
  window.dispatchEvent(new Event(mentorUrlChangedEvent));
}

function jsonRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readError(response: Response) {
  try {
    const text = await response.text();
    if (text.length > 4_096) return `AIサービスがHTTP ${response.status}を返しました。`;
    const value: unknown = JSON.parse(text);
    return jsonRecord(value) && typeof value.message === "string" ? value.message : `AIサービスがHTTP ${response.status}を返しました。`;
  } catch {
    return `AIサービスがHTTP ${response.status}を返しました。`;
  }
}

function mentorHeaders(token: string) {
  return { Authorization: `Bearer ${token.trim()}`, "Content-Type": "application/json" };
}

export async function checkMentorHealth(token: string): Promise<MentorHealth> {
  const url = getConfiguredMentorUrl();
  if (!url) throw new Error("設定画面でAIサービスURLを登録してください。");
  if (!token.trim()) throw new Error("設定画面でAIサービスのアクセストークンを登録してください。");
  const response = await fetch(`${url}/v1/health`, {
    headers: { Authorization: `Bearer ${token.trim()}` },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(await readError(response));
  const value: unknown = await response.json();
  if (!jsonRecord(value) || typeof value.ready !== "boolean" || !["openai", "ollama"].includes(String(value.provider))
    || typeof value.model !== "string" || typeof value.costEstimateConfigured !== "boolean") {
    throw new Error("AIサービスの状態応答を確認できませんでした。");
  }
  return value as MentorHealth;
}

function isMentorUsage(value: unknown): value is MentorUsage {
  return jsonRecord(value) && ["openai", "ollama"].includes(String(value.provider))
    && typeof value.model === "string"
    && (value.inputTokens === null || (Number.isSafeInteger(value.inputTokens) && Number(value.inputTokens) >= 0))
    && (value.outputTokens === null || (Number.isSafeInteger(value.outputTokens) && Number(value.outputTokens) >= 0))
    && (value.estimatedCostUsd === null || (typeof value.estimatedCostUsd === "number" && Number.isFinite(value.estimatedCostUsd) && value.estimatedCostUsd >= 0));
}

export async function streamMentorReply({
  messages,
  mode,
  context = "",
  token,
  signal,
  onDelta,
}: {
  messages: MentorChatMessage[];
  mode: MentorMode;
  context?: string;
  token: string;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}): Promise<MentorUsage> {
  const url = getConfiguredMentorUrl();
  if (!url) throw new Error("設定画面でAIサービスURLを登録してください。");
  if (!token.trim()) throw new Error("設定画面でAIサービスのアクセストークンを登録してください。");
  const response = await fetch(`${url}/v1/chat`, {
    method: "POST",
    headers: mentorHeaders(token),
    body: JSON.stringify({ messages, mode, context }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(120_000)]) : AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(await readError(response));
  if (!response.body) throw new Error("AIサービスからストリーム応答がありません。");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let usage: MentorUsage | null = null;
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let boundary: RegExpMatchArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(buffer)) !== null) {
        const boundaryIndex = boundary.index ?? 0;
        const frame = buffer.slice(0, boundaryIndex);
        buffer = buffer.slice(boundaryIndex + boundary[0].length);
        const data = frame.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
        if (!data) continue;
        let event: unknown;
        try { event = JSON.parse(data); } catch { continue; }
        if (!jsonRecord(event) || typeof event.type !== "string") continue;
        if (event.type === "delta" && typeof event.text === "string") onDelta(event.text);
        else if (event.type === "done" && isMentorUsage(event.usage)) usage = event.usage;
        else if (event.type === "error") throw new Error(typeof event.message === "string" ? event.message : "AI回答を完了できませんでした。");
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
  if (!usage) throw new Error("AIサービスの完了情報を受け取れませんでした。");
  return usage;
}

function subscribeMentorUrl(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  window.addEventListener(mentorUrlChangedEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(mentorUrlChangedEvent, onChange);
  };
}

export function useMentorConfigured() {
  return useSyncExternalStore(subscribeMentorUrl, () => Boolean(getConfiguredMentorUrl()), () => Boolean(configuredMentor));
}
