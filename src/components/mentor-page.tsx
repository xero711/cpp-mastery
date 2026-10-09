"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Activity, ArrowRight, BookOpen, Bot, CircleStop, Code2, Eraser, KeyRound, Send, ShieldCheck, Sparkles } from "lucide-react";
import { clearMentorConversation, readMentorApiToken, readMentorConversation, saveMentorConversation, type MentorConversationMessage } from "@/lib/browser-store";
import { checkMentorHealth, getConfiguredMentorUrl, streamMentorReply, type MentorHealth, type MentorMode } from "@/lib/mentor-client";

const modes: { id: MentorMode; label: string; description: string }[] = [
  { id: "teacher", label: "Teacher · 講師", description: "概念を前提から説明します。" },
  { id: "socratic", label: "Socratic · 対話", description: "質問と小さなヒントで考えを進めます。" },
  { id: "debugger", label: "Debugger · 調査", description: "原因候補と確認手順を整理します。" },
  { id: "reviewer", label: "Reviewer · レビュー", description: "コードの品質を観点別に確認します。" },
  { id: "architect", label: "Architect · 設計", description: "設計案とトレードオフを比べます。" },
  { id: "interviewer", label: "Interviewer · 面接", description: "技術面接の質問を一問ずつ出します。" },
  { id: "examiner", label: "Examiner · 理解確認", description: "答えを伏せて理解度を確認します。" },
  { id: "planner", label: "Planner · 学習計画", description: "提示された記録と時間から計画を提案します。" },
];

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function statusText(health: MentorHealth | null, loading: boolean, tokenReady: boolean, urlReady: boolean) {
  if (loading) return "接続先を確認中";
  if (!urlReady) return "サービスURL未設定";
  if (!tokenReady) return "トークン未登録";
  if (!health) return "AIサービス未接続";
  return `${health.provider === "openai" ? "OpenAI" : "Ollama"} · ${health.model}`;
}

export function MentorPage() {
  const [messages, setMessages] = useState<MentorConversationMessage[]>([]);
  const [token, setToken] = useState("");
  const [health, setHealth] = useState<MentorHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<MentorMode>("teacher");
  const [input, setInput] = useState("");
  const [includeContext, setIncludeContext] = useState(false);
  const [context, setContext] = useState("");
  const [assistantDraft, setAssistantDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const abortController = useRef<AbortController | null>(null);
  const scrollAnchor = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([readMentorConversation(), readMentorApiToken()]).then(async ([history, savedToken]) => {
      if (!active) return;
      setMessages(history);
      setToken(savedToken);
      const urlReady = Boolean(getConfiguredMentorUrl());
      if (urlReady && savedToken) {
        try { setHealth(await checkMentorHealth(savedToken)); }
        catch { setHealth(null); }
      }
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : "AI講師の保存データを読み込めませんでした。");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; abortController.current?.abort(); };
  }, []);

  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, assistantDraft]);

  const urlReady = Boolean(getConfiguredMentorUrl());
  const tokenReady = Boolean(token);
  const userTurns = messages.filter((message) => message.role === "user").length;
  const inputTokens = messages.reduce((sum, message) => sum + (message.usage?.inputTokens ?? 0), 0);
  const outputTokens = messages.reduce((sum, message) => sum + (message.usage?.outputTokens ?? 0), 0);
  const costs = messages.filter((message) => message.usage?.estimatedCostUsd !== null && message.usage?.estimatedCostUsd !== undefined);
  const totalCost = costs.reduce((sum, message) => sum + (message.usage?.estimatedCostUsd ?? 0), 0);
  const hasUnknownCost = messages.some((message) => message.usage && message.usage.estimatedCostUsd === null);

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || streaming) return;
    if (!urlReady) { setError("設定画面でAIサービスURLを登録してください。"); return; }
    if (!tokenReady) { setError("設定画面でAIサービスのアクセストークンを登録してください。"); return; }

    const userMessage: MentorConversationMessage = { id: newId(), role: "user", content: question, createdAt: new Date().toISOString(), mode };
    const nextMessages = [...messages, userMessage].slice(-200);
    setMessages(nextMessages);
    setInput("");
    setError("");
    setNotice("");
    setAssistantDraft("");
    setStreaming(true);
    try {
      await saveMentorConversation(nextMessages);
    } catch {
      setMessages(messages);
      setInput(question);
      setStreaming(false);
      setError("会話を端末へ保存できないため、AIへは送信しませんでした。");
      return;
    }

    const controller = new AbortController();
    abortController.current = controller;
    let fullReply = "";
    try {
      const usage = await streamMentorReply({
        messages: nextMessages.slice(-18).map(({ role, content }) => ({ role, content })),
        mode,
        context: includeContext ? context : "",
        token,
        signal: controller.signal,
        onDelta: (delta) => {
          fullReply += delta;
          setAssistantDraft(fullReply);
        },
      });
      const assistantMessage: MentorConversationMessage = {
        id: newId(), role: "assistant", content: fullReply, createdAt: new Date().toISOString(), mode, usage,
      };
      const completed = [...nextMessages, assistantMessage].slice(-200);
      setMessages(completed);
      setAssistantDraft("");
      try { await saveMentorConversation(completed); }
      catch { setError("回答は表示しましたが、会話履歴を端末へ保存できませんでした。"); }
      if (usage.estimatedCostUsd === null && usage.provider === "openai") setNotice("トークン使用量を受信しました。費用の概算には、サーバー側でモデル単価を設定してください。");
    } catch (reason) {
      setAssistantDraft("");
      if (controller.signal.aborted) setNotice("回答の生成を中止しました。質問はこの端末の履歴に残っています。");
      else setError(reason instanceof Error ? reason.message : "AIサービスへ接続できませんでした。");
    } finally {
      abortController.current = null;
      setStreaming(false);
    }
  }

  async function eraseHistory() {
    if (streaming) return;
    try {
      await clearMentorConversation();
      setMessages([]);
      setAssistantDraft("");
      setError("");
      setNotice("この端末のAI会話履歴を削除しました。");
    } catch {
      setError("会話履歴を削除できませんでした。");
    }
  }

  function stopReply() {
    abortController.current?.abort();
  }

  const currentMode = modes.find((item) => item.id === mode)!;
  return <div className="page-stack">
    <section className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />AI MENTOR</div><h1>AI講師</h1><p className="page-lead">C++の疑問を、理解度に合わせて一緒に整理します。回答は実行結果や採点とは別のAIによる説明です。</p></div><span className={`mentor-status ${health ? "mentor-status-on" : ""}`}><span />{statusText(health, loading, tokenReady, urlReady)}</span></section>

    {!health && !loading && <section className="mentor-connect-note panel"><div><KeyRound size={17} /><span><strong>AIサービスの接続が必要です</strong><small>接続先URLとトークンを設定すると、会話を開始できます。OpenAIのAPIキーはサーバー環境に保存します。</small></span></div><Link href="/settings/" className="button button-secondary">設定を開く<ArrowRight size={14} /></Link></section>}

    <section className="mentor-chat panel">
      <header className="mentor-chat-header"><div className="mentor-mode-select"><label htmlFor="mentor-mode">指導モード</label><select id="mentor-mode" value={mode} onChange={(event) => setMode(event.target.value as MentorMode)} disabled={streaming}>{modes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><small>{currentMode.description}</small></div><div className="mentor-header-actions"><span><Activity size={14} />送信 {userTurns} 回</span><span>{inputTokens + outputTokens > 0 ? `${inputTokens + outputTokens} tokens` : "使用量未取得"}</span>{costs.length > 0 && <span>{hasUnknownCost ? `概算 $${totalCost.toFixed(6)}+` : `概算 $${totalCost.toFixed(6)}`}</span>}<button type="button" className="icon-button" onClick={() => void eraseHistory()} disabled={streaming || messages.length === 0} aria-label="会話履歴を消去" title="この端末の履歴を消去"><Eraser size={15} /></button></div></header>

      <div className="mentor-transcript" role="log" aria-live="polite" aria-label="AI講師との会話">
        {messages.length === 0 && !assistantDraft && <div className="mentor-welcome"><div className="mentor-illustration"><div className="mentor-orbit" /><div className="mentor-spark"><Sparkles size={25} /></div></div><strong>どこで迷っていますか？</strong><p>まずは疑問を自分の言葉で書いてください。コードや教材を添えるかどうかは、送信前に選べます。</p><div className="mentor-prompts"><button type="button" onClick={() => setInput("参照とポインタの違いを、短いコード例で説明してください。")}>参照とポインタの違い</button><button type="button" onClick={() => setInput("このコンパイルエラーを読む順番を教えてください。答えをすぐに書かず、確認点から説明してください。")}>エラーの読み方</button><button type="button" onClick={() => setInput("自分のC++コードをレビューするとき、まず何を確認すればよいですか？")}>コードレビューの観点</button></div></div>}
        {messages.map((message) => <article key={message.id} className={`mentor-message mentor-message-${message.role}`}>
          <div className="mentor-message-meta"><span>{message.role === "assistant" ? <><Bot size={14} />AI講師</> : <>あなた</>}</span><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>{message.mode && <small>{modes.find((item) => item.id === message.mode)?.label.split(" · ")[0]}</small>}</div>
          <div className="mentor-message-content">{message.content}</div>
          {message.usage && <small className="mentor-usage">{message.usage.provider === "ollama" ? "Ollama · " : "OpenAI · "}{message.usage.model}{message.usage.inputTokens !== null && message.usage.outputTokens !== null ? ` · 入力 ${message.usage.inputTokens} / 出力 ${message.usage.outputTokens} tokens` : ""}{message.usage.estimatedCostUsd !== null ? ` · 概算 $${message.usage.estimatedCostUsd.toFixed(6)}` : ""}</small>}
        </article>)}
        {assistantDraft && <article className="mentor-message mentor-message-assistant mentor-message-streaming"><div className="mentor-message-meta"><span><Bot size={14} />AI講師</span><small>回答中</small></div><div className="mentor-message-content">{assistantDraft}</div></article>}
        <div ref={scrollAnchor} />
      </div>

      {error && <div className="mentor-feedback mentor-feedback-error" role="alert">{error}</div>}
      {notice && <div className="mentor-feedback" role="status">{notice}</div>}
      <form className="mentor-composer" onSubmit={(event) => void submitQuestion(event)}>
        <label className="mentor-context-toggle"><input type="checkbox" checked={includeContext} onChange={(event) => setIncludeContext(event.target.checked)} disabled={streaming} /><span><Code2 size={14} />教材・コードを添付</span><small>オフのままなら追加データは送信しません</small></label>
        {includeContext && <textarea className="mentor-context-input" value={context} onChange={(event) => setContext(event.target.value)} maxLength={16_000} rows={4} placeholder="任意の教材、コンパイラ診断、コードを貼り付けてください。送信する内容だけを書いてください。" aria-label="AI講師に添付する教材やコード" disabled={streaming} />}
        <label className="mentor-question-label" htmlFor="mentor-question">質問</label>
        <div className="mentor-question-row"><textarea id="mentor-question" value={input} onChange={(event) => setInput(event.target.value)} maxLength={16_000} rows={3} placeholder="C++でわからないことを入力…（Ctrl+Enterで送信）" aria-label="AI講師への質問" disabled={streaming} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><button className={`button ${streaming ? "button-secondary" : "button-primary"} mentor-send-button`} type={streaming ? "button" : "submit"} onClick={streaming ? stopReply : undefined} disabled={!streaming && (!input.trim() || loading)}>{streaming ? <><CircleStop size={15} />中止</> : <><Send size={15} />送信</>}</button></div>
      </form>
    </section>

    <section className="mentor-privacy panel"><div><ShieldCheck size={17} /><strong>送信と保存について</strong></div><p>会話履歴はIndexedDBに保存し、バックアップにも含めます。サービス側は会話本文を保存・ログ出力しません。OpenAIを選んだ場合、送信した会話はOpenAI Responses APIへ送られ、`store: false` でリクエストします。Ollamaはサーバーに設定した接続先へ送ります。回答はコンパイルや採点ではありません。</p><div><BookOpen size={15} /><Link href="/learn/today/">今日の教材へ<ArrowRight size={13} /></Link><span>·</span><Link href="/settings/">サービス設定へ<ArrowRight size={13} /></Link></div></section>
  </div>;
}
