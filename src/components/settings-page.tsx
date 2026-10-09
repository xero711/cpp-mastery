"use client";

import Link from "next/link";
import { type ChangeEvent, useEffect, useState } from "react";
import { AlertCircle, Check, Download, FileDown, FileUp, HardDrive, Link2, Moon, Sun } from "lucide-react";
import { clearRunnerApiToken, exportLearnerState, importLearnerState, readLearnerState, readRunnerApiToken, saveRunnerApiToken, updateLearnerState, type LearnerState } from "@/lib/browser-store";
import { clearRunnerUrlOverride, getConfiguredRunnerUrl, getRunnerUrlOverride, saveRunnerUrlOverride, useRunnerConfigured } from "@/lib/runner-client";

export function SettingsPage() {
  const runnerConfigured = useRunnerConfigured();
  const [state, setState] = useState<LearnerState | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [runnerToken, setRunnerToken] = useState("");
  const [runnerTokenSaved, setRunnerTokenSaved] = useState(false);
  const [runnerUrl, setRunnerUrl] = useState("");
  const [runnerUrlOverrideSaved, setRunnerUrlOverrideSaved] = useState(false);
  useEffect(() => {
    Promise.all([readLearnerState(), readRunnerApiToken()])
      .then(([loaded, token]) => {
        setState(loaded);
        setRunnerTokenSaved(Boolean(token));
        setRunnerUrl(getConfiguredRunnerUrl());
        setRunnerUrlOverrideSaved(Boolean(getRunnerUrlOverride()));
      })
      .catch((error) => setNotice({ type: "error", message: error.message }));
  }, []);

  async function storeRunnerUrl() {
    setBusy(true);
    try {
      const saved = saveRunnerUrlOverride(runnerUrl);
      setRunnerUrl(saved);
      setRunnerUrlOverrideSaved(true);
      setNotice({ type: "success", message: "実行ワーカーURLをこのブラウザーに保存しました。" });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "URLを保存できませんでした。" });
    } finally { setBusy(false); }
  }

  async function removeRunnerUrl() {
    setBusy(true);
    try {
      clearRunnerUrlOverride();
      setRunnerUrl(getConfiguredRunnerUrl());
      setRunnerUrlOverrideSaved(false);
      setNotice({ type: "success", message: "このブラウザーのURL設定を削除しました。" });
    } catch {
      setNotice({ type: "error", message: "URL設定を削除できませんでした。" });
    } finally { setBusy(false); }
  }

  async function saveSettings(patch: Partial<LearnerState["settings"]>) {
    if (!state) return;
    setBusy(true);
    try {
      const updated = await updateLearnerState((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
      setState(updated);
      if (patch.theme) document.documentElement.dataset.theme = patch.theme;
      setNotice({ type: "success", message: "設定をこの端末に保存しました。" });
    } catch {
      setNotice({ type: "error", message: "設定を保存できませんでした。" });
    } finally { setBusy(false); }
  }

  async function storeRunnerToken() {
    setBusy(true);
    try {
      await saveRunnerApiToken(runnerToken);
      setRunnerToken("");
      setRunnerTokenSaved(true);
      setNotice({ type: "success", message: "実行ワーカーのトークンをこのブラウザーへ保存しました。" });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "トークンを保存できませんでした。" });
    } finally { setBusy(false); }
  }

  async function removeRunnerToken() {
    setBusy(true);
    try {
      await clearRunnerApiToken();
      setRunnerToken("");
      setRunnerTokenSaved(false);
      setNotice({ type: "success", message: "実行ワーカーのトークンを削除しました。" });
    } catch {
      setNotice({ type: "error", message: "実行ワーカーのトークンを削除できませんでした。" });
    } finally { setBusy(false); }
  }

  async function downloadBackup() {
    try {
      const content = await exportLearnerState();
      const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `cpp-mastery-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setNotice({ type: "success", message: "学習データを書き出しました。バックアップは個人情報として保管してください。" });
    } catch {
      setNotice({ type: "error", message: "学習データを書き出せませんでした。" });
    }
  }

  async function restoreBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const restored = await importLearnerState(await file.text());
      setState(restored);
      document.documentElement.dataset.theme = restored.settings.theme;
      setNotice({ type: "success", message: "バックアップを復元しました。現在の端末データを置き換えています。" });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "バックアップを読み込めませんでした。" });
    } finally { setBusy(false); event.target.value = ""; }
  }

  if (!state) return <div className="page-stack"><div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />SETTINGS</div><h1>設定・データ</h1></div></div><div className="loading-state">端末の設定を読み込んでいます…</div></div>;
  return <div className="page-stack"><section className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />SETTINGS</div><h1>設定・データ</h1><p className="page-lead">学習のペースと、この端末に保存されたデータを管理します。</p></div><span className="local-pill"><span className="status-dot" />{busy ? "保存中" : "IndexedDB"}</span></section>
    {notice && <div className={`settings-notice ${notice.type === "error" ? "notice-error" : "notice-success"}`}>{notice.type === "error" ? <AlertCircle size={15} /> : <Check size={15} />}{notice.message}<button onClick={() => setNotice(null)}>閉じる</button></div>}
    <div className="settings-layout"><div className="settings-main">
      <section className="settings-card panel"><div className="panel-heading"><div><span className="section-kicker">LEARNING PLAN</span><h2>学習計画</h2></div><HardDrive size={17} className="muted-icon" /></div><label className="settings-field"><span><strong>学習開始日</strong><small>カリキュラム上の今日の位置を計算します。</small></span><input type="date" value={state.settings.startDate} onChange={(event) => void saveSettings({ startDate: event.target.value })} /></label><label className="settings-field"><span><strong>1日の目標時間</strong><small>教材の推奨時間と一緒に表示します。</small></span><select value={state.settings.dailyTargetMinutes} onChange={(event) => void saveSettings({ dailyTargetMinutes: Number(event.target.value) })}>{[20, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} 分</option>)}</select></label><label className="settings-field"><span><strong>週の学習日数</strong><small>予定の目安です。進捗や評価を自動変更しません。</small></span><select value={state.settings.studyDaysPerWeek} onChange={(event) => void saveSettings({ studyDaysPerWeek: Number(event.target.value) })}>{[3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} 日</option>)}</select></label></section>
      <section className="settings-card panel"><div className="panel-heading"><div><span className="section-kicker">APPEARANCE</span><h2>表示テーマ</h2></div></div><div className="theme-options"><button className={`theme-choice ${state.settings.theme === "dark" ? "theme-selected" : ""}`} onClick={() => void saveSettings({ theme: "dark" })}><Moon size={17} /><span><strong>ダーク</strong><small>目に優しい暗色</small></span>{state.settings.theme === "dark" && <Check size={15} />}</button><button className={`theme-choice ${state.settings.theme === "light" ? "theme-selected" : ""}`} onClick={() => void saveSettings({ theme: "light" })}><Sun size={17} /><span><strong>ライト</strong><small>明るい背景</small></span>{state.settings.theme === "light" && <Check size={15} />}</button></div></section>
      <section className="settings-card panel">
        <div className="panel-heading"><div><span className="section-kicker">C++ RUNNER</span><h2>実行ワーカー接続</h2></div><HardDrive size={17} className="muted-icon" /></div>
        <p className="settings-description">URLはこのブラウザーだけに保存します。公開ランナーにはHTTPS、手元のWindowsランナーには http://127.0.0.1:8081 を使えます。</p>
        <label className="runner-token-label">
          <span><strong>実行ワーカーURL</strong><small>{runnerUrlOverrideSaved ? "このブラウザーに保存済み" : runnerConfigured ? "サイトのビルド設定を使用中" : "このブラウザーでは未設定"}</small></span>
          <input className="runner-token-input runner-url-input" type="url" autoComplete="url" spellCheck={false} maxLength={2_048} value={runnerUrl} onChange={(event) => setRunnerUrl(event.target.value)} placeholder="https://runner.example.com または http://127.0.0.1:8081" aria-label="実行ワーカーのURL" />
        </label>
        <div className="backup-actions"><button className="button button-primary" onClick={() => void storeRunnerUrl()} disabled={busy || !runnerUrl.trim()}>URLを保存</button><button className="button button-secondary" onClick={() => void removeRunnerUrl()} disabled={busy || !runnerUrlOverrideSaved}>この端末のURLを削除</button></div>
        <p className="settings-description">HTTPS以外を使えるのは localhost、127.0.0.1、[::1] のみです。GitHub Pagesからローカルランナーへ初めて接続するとき、Chromeのローカルネットワーク許可を求められたら、自分のPCで起動したランナーの場合だけ許可してください。</p>
        <label className="runner-token-label">
          <span><strong>アクセストークン</strong><small>{runnerTokenSaved ? "このブラウザーに保存済み" : "このブラウザーには未登録"}</small></span>
          <input className="runner-token-input" type="password" autoComplete="off" spellCheck={false} maxLength={512} value={runnerToken} onChange={(event) => setRunnerToken(event.target.value)} placeholder="32文字以上" aria-label="実行ワーカーのアクセストークン" />
        </label>
        <div className="backup-actions"><button className="button button-primary" onClick={() => void storeRunnerToken()} disabled={busy || !runnerToken.trim()}>トークンを保存</button><button className="button button-secondary" onClick={() => void removeRunnerToken()} disabled={busy || !runnerTokenSaved}>トークンを削除</button></div>
        <div className="settings-privacy"><AlertCircle size={14} /><span>トークンは別のIndexedDB領域に保存し、バックアップには含めません。入力したURLのサービスへコードとトークンを送るため、信頼できるランナーだけを登録してください。</span></div>
      </section>
      <section className="settings-card panel"><div className="panel-heading"><div><span className="section-kicker">BACKUP</span><h2>学習データの移行</h2></div><FileDown size={17} className="muted-icon" /></div><p className="settings-description">設定、回答、提出コード、作品情報をJSONにまとめます。別のブラウザーへ移すには、書き出したファイルを復元してください。</p><div className="backup-actions"><button className="button button-primary" onClick={downloadBackup}><Download size={15} />JSONを書き出す</button><label className="button button-secondary file-input-label"><FileUp size={15} />JSONから復元<input type="file" accept="application/json,.json" onChange={restoreBackup} /></label></div><div className="settings-privacy"><AlertCircle size={14} /><span>バックアップには学習コードやメモが含まれることがあります。GitHubへコミットせず、個人用に保管してください。</span></div></section>
    </div><aside className="settings-aside"><section className="service-status-card panel"><span className="section-kicker">CONNECTED SERVICES</span><h2>外部サービス</h2><div className="service-row"><span className={`service-status-mark ${runnerConfigured ? "service-on" : ""}`} /> <span><strong>C++実行ワーカー</strong><small>{runnerConfigured ? `URL設定済み · トークン${runnerTokenSaved ? "登録済み" : "未登録"}` : "接続先URL未設定"}</small></span></div><div className="service-row"><span className="service-status-mark" /> <span><strong>AI講師</strong><small>APIサーバー未接続</small></span></div><p className="service-description">GitHub Pagesにはサーバー機能がありません。C++実行は認証付きの隔離ワーカーへ送ります。</p><Link href="/mentor/" className="text-link">セキュリティについて<ArrowRightIcon /></Link></section><section className="data-status-card panel"><span className="section-kicker">LOCAL DATA</span><h2>保存先</h2><div className="data-status"><HardDrive size={16} /><div><strong>このブラウザー</strong><small>IndexedDB · クラウド同期なし</small></div></div><p>ブラウザーのデータ削除や別端末への切り替えに備えて、定期的にバックアップしてください。</p></section></aside></div>
  </div>;
}

function ArrowRightIcon() { return <Link2 size={14} />; }
