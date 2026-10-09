import Link from "next/link";
import { ArrowRight, KeyRound, MessageCircleQuestion, ShieldCheck, Sparkles } from "lucide-react";

export function MentorPage() {
  return <div className="page-stack"><section className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" />AI MENTOR</div><h1>AI講師</h1><p className="page-lead">C++の疑問を、理解度に合わせて一緒に整理する場所です。</p></div><span className="mentor-status"><span />未接続</span></section>
    <section className="mentor-offline panel"><div className="mentor-illustration"><div className="mentor-orbit" /><div className="mentor-spark"><Sparkles size={25} /></div></div><span className="section-kicker">OPTIONAL SERVICE</span><h2>AI講師はまだ接続されていません</h2><p>GitHub Pagesは静的サイトのため、AI APIキーを安全に保管するサーバーがありません。キーをブラウザーへ置かず、サーバー側のAI連携を追加してから有効にします。</p><div className="mentor-security"><div><ShieldCheck size={16} /><strong>APIキーを公開しない</strong><span>環境変数は静的ファイルに含めません。</span></div><div><KeyRound size={16} /><strong>コードは許可なく送信しない</strong><span>AIへ提出コードを送る機能は未実装です。</span></div></div><Link href="/learn/today/" className="button button-secondary"><MessageCircleQuestion size={15} />今日の教材で学ぶ<ArrowRight size={14} /></Link></section>
  </div>;
}
