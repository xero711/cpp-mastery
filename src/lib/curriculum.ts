export type LearningDayType =
  | "concept"
  | "implementation"
  | "application"
  | "debugging"
  | "design"
  | "integration"
  | "review";

export type CurriculumDay = {
  day: number;
  type: LearningDayType;
  label: string;
  focus: string;
};

export type CurriculumWeek = {
  week: number;
  phase: number;
  phaseTitle: string;
  title: string;
  goal: string;
  prerequisite: string;
  exercise: string;
  evidence: string;
  days: CurriculumDay[];
};

const phaseTitles = [
  "C++基礎",
  "モダンC++の基礎",
  "高度なC++言語機能",
  "低レイヤーと品質",
  "コンピュータサイエンス・数学・アルゴリズム",
  "ゲーム開発の専門技術",
  "実務開発",
  "高度実践と就職準備",
] as const;

const phaseTopics: readonly (readonly string[])[] = [
  [
    "開発環境、コンパイラ、ビルド、C++プログラムの構造",
    "変数、型、初期化、整数、浮動小数点数",
    "演算子、型変換、式、未定義動作の入口",
    "条件分岐、ループ、制御フロー",
    "関数、引数、戻り値、スコープ",
    "配列、文字列、ポインタの基本",
    "参照、const、値渡しと参照渡し",
    "構造体、enum、名前空間",
    "ヘッダー、ソースファイル、翻訳単位、リンケージ",
    "クラス、コンストラクタ、アクセス制御",
    "デストラクタ、オブジェクトの寿命",
    "std::string、std::vector、基本STL",
    "総合演習と第1回実力評価",
  ],
  [
    "オブジェクト指向設計",
    "継承、仮想関数、ポリモーフィズム",
    "合成と継承の使い分け",
    "RAIIとリソース管理",
    "コピー、ムーブ、Rule of Zero/Five",
    "unique_ptr、shared_ptr、weak_ptr",
    "イテレータとコンテナ",
    "STLアルゴリズム",
    "ラムダ式と関数オブジェクト",
    "例外、安全性、エラー処理",
    "テンプレートの基礎",
    "CMake、Git、単体テスト",
    "総合制作と第2回実力評価",
  ],
  [
    "テンプレートの応用",
    "型特性とメタプログラミング",
    "perfect forwardingとvalue category",
    "constexpr、consteval",
    "Conceptsとrequires",
    "rangesとviews",
    "variant、optional、expected",
    "string_view、span、所有権と寿命",
    "polymorphic_allocatorとメモリリソース",
    "coroutineの基本",
    "モジュールとビルド構造",
    "API設計とライブラリ設計",
    "総合制作と第3回実力評価",
  ],
  [
    "メモリレイアウト",
    "アラインメントとパディング",
    "ヒープ、スタック、アロケータ",
    "カスタムメモリアロケータ",
    "CPUキャッシュとデータ局所性",
    "計算量と性能測定",
    "プロファイリング",
    "clang-tidyと静的解析",
    "Sanitizerと動的解析",
    "マルチスレッドの基本",
    "mutex、condition_variable",
    "atomicとメモリモデル",
    "年間総合試験・実践プロジェクト",
  ],
  [
    "時間計算量・空間計算量",
    "配列、リスト、スタック、キュー",
    "木構造、ヒープ",
    "ハッシュテーブル",
    "グラフと探索",
    "最短経路アルゴリズム",
    "動的計画法",
    "空間分割とデータ構造",
    "ベクトルと線形代数",
    "行列と座標変換",
    "三角関数、クォータニオン",
    "物理シミュレーションの基礎",
    "総合評価とアルゴリズム制作",
  ],
  [
    "ゲームループと時間管理",
    "入力システム",
    "シーン管理とオブジェクト管理",
    "Entity Component System",
    "2D描画とレンダリング",
    "3Dグラフィックスの基礎",
    "カメラ・座標変換",
    "当たり判定と物理処理",
    "ゲームAIと状態機械",
    "リソース・アセット管理",
    "マルチスレッドゲームシステム",
    "ゲームの負荷計測と最適化",
    "自作ゲームフレームワーク完成",
  ],
  [
    "大規模プロジェクトの設計",
    "SOLID原則と設計上のトレードオフ",
    "デザインパターンの実践",
    "リファクタリング",
    "テスト戦略",
    "CI/CD",
    "Gitブランチ運用とコードレビュー",
    "ロギング・診断・障害調査",
    "ファイルI/Oとシリアライズ",
    "ネットワーク通信の基礎",
    "クライアントサーバー設計",
    "セキュリティと堅牢性",
    "チーム開発を想定した総合制作",
  ],
  [
    "高度なゲームシステム設計",
    "高性能なデータ処理",
    "並列処理と競合問題",
    "複雑なバグの調査",
    "レガシーコードの改善",
    "大規模コードベースの読解",
    "API・ライブラリ設計レビュー",
    "技術課題と制限時間付き実装",
    "アルゴリズム面接対策",
    "C++技術面接対策",
    "ポートフォリオの仕上げ",
    "最終総合プロジェクト",
    "最終技術評価と今後の成長計画",
  ],
];

const phasePrerequisites = [
  "C言語の基本的な読み書き。未経験の項目は前提ミニ課題で確認する。",
  "第1期の基礎構文と関数・クラスの初歩。",
  "クラス、寿命、標準ライブラリ、テンプレート基礎。",
  "ポインタ、オブジェクト寿命、ビルド、テストの基礎。",
  "C++基礎と計算量をコードで説明できること。",
  "データ構造、数学基礎、C++の設計とビルド。",
  "中規模コードを分割してテストできること。",
  "前期の制作物とレビュー記録。未評価の技能は評価してから進む。",
] as const;

const dayTemplate: readonly { type: LearningDayType; label: string; instruction: string }[] = [
  { type: "concept", label: "概念をつかむ", instruction: "仕組みと用語を自分の言葉で説明し、小さなコードで確かめる。" },
  { type: "implementation", label: "基本を実装する", instruction: "最小の仕様を満たすコードを書き、入力と出力を記録する。" },
  { type: "application", label: "条件を変えて応用する", instruction: "境界値や別の利用条件を加え、設計と結果の差を説明する。" },
  { type: "debugging", label: "読んで直す", instruction: "不具合を再現し、原因・修正・再発を防ぐテストを残す。" },
  { type: "design", label: "設計を比べる", instruction: "2つの実装方針を比較し、制約に応じた選択理由を書く。" },
  { type: "integration", label: "統合課題", instruction: "週の技能を小さな成果物にまとめ、ビルドと動作確認を行う。" },
  { type: "review", label: "復習と評価", instruction: "資料を閉じて再現し、誤りを分類して次の復習点を記録する。" },
];

export const curriculumWeeks: CurriculumWeek[] = phaseTopics.flatMap((topics, phaseIndex) =>
  topics.map((title, topicIndex) => {
    const week = phaseIndex * 13 + topicIndex + 1;
    const milestone = topicIndex === 12;
    const weekNumber = String(week).padStart(2, "0");
    const phaseNumber = phaseIndex + 1;
    const evidence = milestone
      ? `第${phaseNumber}期の制作物、テスト、設計理由をレビューし、未評価の技能は保留として記録する。`
      : `小さな実装、境界条件のテスト、短い技術説明を学習履歴に残す。`;
    return {
      week,
      phase: phaseNumber,
      phaseTitle: phaseTitles[phaseIndex],
      title,
      goal: `「${title}」をコードの振る舞いと設計上の理由から説明し、週末課題で再現できる。`,
      prerequisite: phasePrerequisites[phaseIndex],
      exercise: milestone
        ? `第${phaseNumber}期の統合課題を完成させ、テスト結果と振り返りを記録する。`
        : `「${title}」を使う小さな例を実装し、${phaseIndex >= 4 ? "計算量・性能・設計" : "入力・出力・寿命"}の観点から確認する。`,
      evidence,
      days: dayTemplate.map((day, dayIndex) => ({
        day: dayIndex + 1,
        type: day.type,
        label: day.label,
        focus: `Week ${weekNumber}: ${title} — ${day.instruction}`,
      })),
    };
  }),
);

export const curriculumDays = curriculumWeeks.flatMap((week) =>
  week.days.map((day) => ({ ...day, week: week.week, weekTitle: week.title, id: `w${week.week}-d${day.day}` })),
);

export const totalLearningDays = curriculumDays.length;
