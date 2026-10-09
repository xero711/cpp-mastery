"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  Code2,
  Compass,
  GraduationCap,
  LayoutDashboard,
  Menu,
  NotebookPen,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { readLearnerState } from "@/lib/browser-store";

const navigation = [
  { href: "/dashboard/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/learn/today/", label: "今日の学習", icon: BookOpen },
  { href: "/curriculum/", label: "カリキュラム", icon: Compass },
  { href: "/practice/", label: "コード演習", icon: Code2 },
  { href: "/workspace/", label: "ブラウザIDE", icon: NotebookPen },
  { href: "/projects/", label: "プロジェクト", icon: BriefcaseBusiness },
  { href: "/mentor/", label: "AI講師", icon: Sparkles },
  { href: "/review/", label: "復習", icon: GraduationCap },
  { href: "/analytics/", label: "実力分析", icon: Activity },
  { href: "/portfolio/", label: "ポートフォリオ", icon: BriefcaseBusiness },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    readLearnerState().then((state) => {
      document.documentElement.dataset.theme = state.settings.theme;
      setSettingsOpen(true);
    }).catch(() => setSettingsOpen(false));
  }, []);

  const isActive = (href: string) => {
    const target = href.replace(/\/$/, "");
    const current = (pathname ?? "").replace(/\/$/, "");
    if (target === "/dashboard" && current === "/") return true;
    if (target === "/learn/today" && current.startsWith("/learn/")) return true;
    return current === target || (target !== "/dashboard" && current.startsWith(`${target}/`));
  };

  return (
    <div className="app-frame">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`} aria-label="メインナビゲーション">
        <Link className="brand" href="/dashboard/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">C<span>++</span></span>
          <span className="brand-copy"><strong>Mastery</strong><small>2年間の実践カリキュラム</small></span>
        </Link>
        <div className="nav-caption">学習</div>
        <nav className="main-nav">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-link ${isActive(href) ? "nav-link-active" : ""}`} onClick={() => setMenuOpen(false)}>
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
              {isActive(href) && <ChevronRight className="nav-arrow" size={14} aria-hidden="true" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <div className="status-dot" />
          <div><strong>この端末に保存</strong><span>アカウント同期なし</span></div>
        </div>
        <Link className={`nav-link settings-link ${isActive("/settings/") ? "nav-link-active" : ""}`} href="/settings/" onClick={() => setMenuOpen(false)}>
          <Settings2 size={17} strokeWidth={1.8} aria-hidden="true" /><span>設定・データ</span>
        </Link>
        <div className="sidebar-footer">C++ Mastery <span>v0.1</span></div>
      </aside>
      {menuOpen && <button className="mobile-scrim" aria-label="メニューを閉じる" onClick={() => setMenuOpen(false)} />}
      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"} onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <div className="breadcrumb"><span>学習スペース</span><span className="breadcrumb-divider">/</span><strong>{navigation.find((item) => isActive(item.href))?.label ?? (isActive("/settings/") ? "設定・データ" : "学習")}</strong></div>
          <div className="topbar-right">
            <span className="local-pill"><span className="status-dot" />{settingsOpen ? "ローカル保存" : "保存領域を確認中"}</span>
            <Link className="topbar-settings" href="/settings/" aria-label="設定"><Settings2 size={18} /></Link>
          </div>
        </header>
        <main id="main-content" className="content-area">{children}</main>
      </div>
    </div>
  );
}
