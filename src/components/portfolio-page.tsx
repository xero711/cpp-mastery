"use client";

import { Download, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { readLearnerState, updateLearnerState, type LearnerState, type PortfolioItem } from "@/lib/browser-store";

export function PortfolioPage() {
  const [state, setState] = useState<LearnerState | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { readLearnerState().then(setState).catch(() => setState(null)); }, []);

  async function addEntry(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const item: PortfolioItem = { id: crypto.randomUUID(), title: title.trim(), summary: summary.trim(), technologies: technologies.trim(), repositoryUrl: repositoryUrl.trim(), updatedAt: new Date().toISOString() };
    const updated = await updateLearnerState((current) => ({ ...current, portfolio: [item, ...current.portfolio] }));
    setState(updated); setTitle(""); setSummary(""); setTechnologies(""); setRepositoryUrl(""); setNotice("作品を保存しました");
  }

  async function removeEntry(id: string) {
    const updated = await updateLearnerState((current) => ({ ...current, portfolio: current.portfolio.filter((item) => item.id !== id) }));
    setState(updated);
  }

  function exportMarkdown() {
    const entries = state?.portfolio ?? [];
    const markdown = ["# C++ Mastery Portfolio", "", ...entries.flatMap((item) => [
      `## ${item.title}`, "", item.summary || "説明は未記入です。", "",
      `- 使用技術: ${item.technologies || "未記入"}`,
      `- ソースコード: ${item.repositoryUrl || "未登録"}`,
      `- 更新日: ${new Date(item.updatedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
      "",
    ])].join("\n");
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "cpp-mastery-portfolio.md"; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="page-stack"><section className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />PORTFOLIO</div><h1>ポートフォリオ</h1><p className="page-lead">作品の目的、技術、検証結果を整理してMarkdownに出力します。</p></div><button className="button button-secondary" onClick={exportMarkdown} disabled={!state?.portfolio.length}><Download size={15} />Markdownを書き出す</button></section>
    {notice && <div className="save-toast"><Save size={14} />{notice}<button onClick={() => setNotice("")}>閉じる</button></div>}
    <div className="portfolio-layout"><form className="portfolio-form panel" onSubmit={addEntry}><div className="panel-heading"><div><span className="section-kicker">NEW ENTRY</span><h2>作品を登録</h2></div><Plus size={16} className="muted-icon" /></div><label>作品名<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：A*経路探索ビジュアライザー" /></label><label>概要・技術的な課題<textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={5} placeholder="何を作り、どんな課題をどう解決したか" /></label><label>使用技術<input value={technologies} onChange={(event) => setTechnologies(event.target.value)} placeholder="C++20, CMake, GoogleTest" /></label><label>ソースコードURL<input type="url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/..." /></label><button className="button button-primary" type="submit"><Save size={15} />この端末に保存</button></form>
      <section className="portfolio-list"><div className="portfolio-list-head"><div><span className="section-kicker">YOUR WORK</span><h2>登録した作品</h2></div><span>{state?.portfolio.length ?? 0} 件</span></div>{state?.portfolio.length ? state.portfolio.map((item) => <article className="portfolio-card panel" key={item.id}><div className="portfolio-card-top"><span>PROJECT</span><button className="icon-button" onClick={() => void removeEntry(item.id)} aria-label={`${item.title}を削除`}><Trash2 size={15} /></button></div><h3>{item.title}</h3><p>{item.summary || "概要は未記入です。"}</p><div className="portfolio-chips">{(item.technologies || "技術未記入").split(",").map((technology) => <span key={technology}>{technology.trim()}</span>)}</div>{item.repositoryUrl && <a href={item.repositoryUrl} target="_blank" rel="noreferrer" className="portfolio-repo">ソースコードを見る<ExternalLink size={13} /></a>}</article>) : <div className="empty-state panel"><strong>作品はまだありません</strong><span>仕様、テスト、計測結果を揃えた作品を登録できます。</span></div>}</section></div>
  </div>;
}
