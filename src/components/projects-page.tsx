"use client";

import { ArrowUpRight, CheckCircle2, Circle, CircleDot, Plus, Save, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { readLearnerState, updateLearnerState, type LearnerProject, type LearnerState } from "@/lib/browser-store";

export function ProjectsPage() {
  const [state, setState] = useState<LearnerState | null>(null);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState("");
  useEffect(() => { readLearnerState().then(setState).catch(() => setState(null)); }, []);

  async function addProject(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const project: LearnerProject = { id: crypto.randomUUID(), title: title.trim(), goal: goal.trim(), status: "planned", repositoryUrl: "", updatedAt: new Date().toISOString() };
    const updated = await updateLearnerState((current) => ({ ...current, projects: [project, ...current.projects] }));
    setState(updated); setTitle(""); setGoal(""); setCreating(false); setSaved("プロジェクトを保存しました");
  }

  async function changeStatus(project: LearnerProject, status: LearnerProject["status"]) {
    const updated = await updateLearnerState((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? { ...item, status, updatedAt: new Date().toISOString() } : item) }));
    setState(updated);
  }

  async function removeProject(id: string) {
    const updated = await updateLearnerState((current) => ({ ...current, projects: current.projects.filter((project) => project.id !== id) }));
    setState(updated);
  }

  return <div className="page-stack"><section className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />PROJECTS</div><h1>プロジェクト</h1><p className="page-lead">小さな課題から作品制作まで、自分の制作計画を記録します。</p></div><button className="button button-primary" onClick={() => setCreating(true)}><Plus size={16} />プロジェクトを追加</button></section>
    {saved && <div className="save-toast"><Save size={14} />{saved}<button onClick={() => setSaved("")} aria-label="閉じる"><X size={13} /></button></div>}
    {creating && <form className="project-create panel" onSubmit={addProject}><div className="panel-heading"><div><span className="section-kicker">NEW PROJECT</span><h2>制作計画を記録</h2></div><button type="button" className="icon-button" onClick={() => setCreating(false)} aria-label="閉じる"><X size={17} /></button></div><label>プロジェクト名<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：テキストRPG" /></label><label>学習目的・受け入れ条件<textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="何を実装し、どう動作を確認するか" /></label><button className="button button-primary" type="submit"><Save size={15} />保存</button></form>}
    <div className="project-cards">{state?.projects.map((project) => <article className="project-card panel" key={project.id}><div className="project-card-top"><span className={`project-status status-${project.status}`}>{project.status === "complete" ? <CheckCircle2 size={14} /> : project.status === "active" ? <CircleDot size={14} /> : <Circle size={14} />}{project.status === "complete" ? "完了" : project.status === "active" ? "進行中" : "計画中"}</span><button className="icon-button project-delete" onClick={() => removeProject(project.id)} aria-label={`${project.title}を削除`}><X size={15} /></button></div><h2>{project.title}</h2><p>{project.goal || "学習目標を追記できます。"}</p><div className="project-status-actions"><label>状態<select value={project.status} onChange={(event) => void changeStatus(project, event.target.value as LearnerProject["status"])}><option value="planned">計画中</option><option value="active">進行中</option><option value="complete">完了</option></select></label><span>更新 {new Date(project.updatedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}</span></div><div className="project-empty-link"><span>リポジトリURLは未登録</span><ArrowUpRight size={14} /></div></article>)}
      {state?.projects.length === 0 && <div className="empty-state panel"><span className="empty-ring"><Plus size={20} /></span><strong>制作中のプロジェクトはありません</strong><span>作るものと受け入れ条件を登録して、進捗を残しましょう。</span><button className="button button-secondary" onClick={() => setCreating(true)}>最初のプロジェクトを追加<Plus size={14} /></button></div>}
    </div>
  </div>;
}
