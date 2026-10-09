import { week5LessonSeeds } from "./lesson-seeds/week-05.ts";
import { week6LessonSeeds } from "./lesson-seeds/week-06.ts";
import { week7LessonSeeds } from "./lesson-seeds/week-07.ts";
import { week8LessonSeeds } from "./lesson-seeds/week-08.ts";

export type Lesson = {
  id: string;
  version: 1;
  week: number;
  day: number;
  title: string;
  subject: string;
  difficulty: "入門" | "基礎";
  prerequisites: string[];
  goal: string;
  minutes: number;
  explanation: string;
  example: string;
  exampleOutput: string;
  commonMistake: string;
  quiz: { question: string; choices: string[]; answer: number; explanation: string };
  exercise: {
    prompt: string;
    starter: string;
    solution: string;
    input: string;
    expectedOutput: string;
    tests: { input: string; output: string }[];
    hiddenTests: { input: string; output: string }[];
    hints: [string, string, string];
  };
  debug: { code: string; fix: string; explanation: string };
  standard: "c++17";
};

export type LessonSeed = Omit<Lesson, "id" | "version" | "week" | "day" | "subject" | "difficulty" | "prerequisites" | "standard" | "exercise"> & {
  prompt: string;
  solution: string;
  input?: string;
  tests?: { input: string; output: string }[];
  hiddenTests?: { input: string; output: string }[];
  hints: [string, string, string];
};

const weekNames = [
  "環境・プログラムの形",
  "変数・型・初期化",
  "演算・変換・安全性",
  "条件分岐・ループ",
  "関数・引数・戻り値",
  "配列・文字列・ポインタ",
  "参照・const・引数の渡し方",
  "構造体・列挙型・名前空間",
];

const starter = `#include <iostream>

int main() {
    // ここに処理を書く
    return 0;
}`;

const lessonSeeds: LessonSeed[][] = [
  [
    { title: "コンパイラに最初の指示を出す", goal: "コンパイラと実行プログラムの役割を区別し、最小のC++プログラムを作る。", minutes: 35, explanation: "C++のソースコードは人が書くテキストです。コンパイラはそれを機械が実行できる形式へ変換します。ソースファイルを保存しただけでは、プログラムはまだ動きません。", example: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!\\n";\n}`, exampleOutput: "Hello, C++!", commonMistake: "ファイルの拡張子を .cpp で保存しただけで、コンパイル済みだと思ってしまう。", quiz: { question: "C++ソースコードを実行可能なプログラムへ変換する役目はどれ？", choices: ["コンパイラ", "キーボード", "テキストエディタ"], answer: 0, explanation: "コンパイラがソースを翻訳し、実行可能な形式を作ります。" }, prompt: "画面に Hello, C++! と1行で表示するプログラムを書いてください。", solution: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!\\n";\n    return 0;\n}`, hints: ["出力には標準ライブラリの <iostream> を使います。", "std::cout に表示したい文字列を << で渡します。", "文字列の末尾に \\n を入れると改行されます。"], debug: { code: `#include <iostream>\nint main() {\n    std::cout << "Hello, C++!"\n}`, fix: `#include <iostream>\nint main() {\n    std::cout << "Hello, C++!\\n";\n}`, explanation: "文の末尾にセミコロンが必要です。閉じ波括弧の前に main の閉じ括弧も置きます。" } },
    { title: "main と文の終わり", goal: "main 関数、波括弧、文末のセミコロンを読み取る。", minutes: 30, explanation: "C++の実行は main 関数から始まります。波括弧は関数本体を囲み、通常の文はセミコロンで終わります。", example: `#include <iostream>\nint main() {\n    std::cout << "start\\n";\n    std::cout << "end\\n";\n}`, exampleOutput: "start\nend", commonMistake: "波括弧と丸括弧を同じ役割だと思い、main の境界を間違える。", quiz: { question: "プログラムの実行が始まる関数は？", choices: ["start", "main", "cout"], answer: 1, explanation: "C++プログラムの開始点は main 関数です。" }, prompt: "start と end をそれぞれ別の行に表示してください。", solution: `#include <iostream>\nint main() {\n    std::cout << "start\\n";\n    std::cout << "end\\n";\n    return 0;\n}`, hints: ["出力する文を2つ用意します。", "各文はセミコロンで終わります。", "文字列の末尾に \\n を入れます。"], debug: { code: `int main() {\n    std::cout << "ready\\n";\n    return 0;\n}`, fix: `#include <iostream>\nint main() {\n    std::cout << "ready\\n";\n    return 0;\n}`, explanation: "std::cout を使う前に <iostream> をインクルードします。" } },
    { title: "標準出力と改行", goal: "複数の値を出力し、空白と改行を意図どおりに扱う。", minutes: 30, explanation: "std::cout は標準出力へ左から順番に値を書き出します。<< を続けて使うと、文字列や数値を組み合わせられます。", example: `#include <iostream>\nint main() {\n    std::cout << "score: " << 42 << '\\n';\n}`, exampleOutput: "score: 42", commonMistake: "表示したい空白を文字列に入れ忘れ、値同士がつながる。", quiz: { question: "std::cout << \"HP \" << 10; の出力は？", choices: ["HP 10", "10 HP", "コンパイルエラー"], answer: 0, explanation: "<< の左から順に、文字列の後へ整数10が出力されます。" }, prompt: "name: Ada と level: 3 を2行で表示してください。", solution: `#include <iostream>\nint main() {\n    std::cout << "name: Ada\\n";\n    std::cout << "level: 3\\n";\n    return 0;\n}`, hints: ["各行は別々に出力できます。", "文字列の中に表示内容を入れます。", "1行目の文字列の末尾へ \\n を入れます。"], debug: { code: `std::cout << "HP" << 10;`, fix: `std::cout << "HP " << 10;`, explanation: "数値との間に空白が必要なら、文字列側に空白を含めます。" } },
    { title: "コンパイルと実行の区別", goal: "ビルドの結果とプログラムの標準出力を別々に確認する。", minutes: 35, explanation: "コンパイル時には構文・型などを調べて実行ファイルを作ります。その後の実行時に、プログラムが画面へ出力します。コンパイル成功は、期待した動作の証明ではありません。", example: `int main() {\n    return 0;\n}`, exampleOutput: "出力なしで正常終了", commonMistake: "エラーが出なかっただけで、出力や動作も正しいと判断する。", quiz: { question: "画面へ文字を出す処理を実際に行うのはいつ？", choices: ["編集時", "実行時", "ファイル名変更時"], answer: 1, explanation: "プログラムの出力文は、実行時に評価されます。" }, prompt: "Ready と表示し、正常終了するプログラムを作ってください。", solution: `#include <iostream>\nint main() {\n    std::cout << "Ready\\n";\n    return 0;\n}`, hints: ["戻り値0は通常の終了を表します。", "出力文を return 0; より前に置きます。", "<iostream> と std::cout を使います。"], debug: { code: `int main() {\n    std::cout << "Ready\\n";\n    return 1;\n}`, fix: `int main() {\n    std::cout << "Ready\\n";\n    return 0;\n}`, explanation: "この課題では正常終了コード0を返します。ヘッダーも忘れずに追加します。" } },
    { title: "コメントで意図を残す", goal: "コメントと実行されるコードを区別し、意味のあるコメントを書く。", minutes: 25, explanation: "// 以降は行末まで、/* と */ の間はコメントです。コメントは説明用で、実行結果を変えません。コードをそのまま言い換えるだけでなく、理由を書くと役立ちます。", example: `int main() {\n    // 初回起動時の表示\n    std::cout << "Welcome\\n";\n}`, exampleOutput: "Welcome", commonMistake: "コメントの中のコードも実行されると思い込む。", quiz: { question: "// で始まるテキストは通常どう扱われる？", choices: ["コメントとして無視される", "整数に変換される", "必ず画面へ表示される"], answer: 0, explanation: "単一行コメントはコンパイラに実行される文として扱われません。" }, prompt: "画面に Training と表示し、その文の目的をコメントで説明してください。", solution: `#include <iostream>\nint main() {\n    // 学習開始時の状態を表示する\n    std::cout << "Training\\n";\n    return 0;\n}`, hints: ["コメントは // で書けます。", "説明したい文の直前にコメントを置きます。", "プログラムの目的を書くと読み手に伝わります。"], debug: { code: `// std::cout << "Start\\n";`, fix: `std::cout << "Start\\n";`, explanation: "先頭の // があるため、出力文はコメントとして無視されています。" } },
    { title: "エラーを小さく切り分ける", goal: "診断メッセージのファイル・行・原因候補を探し、1つずつ直す。", minutes: 40, explanation: "コンパイラ診断は、最初のエラーから読むと原因を追いやすくなります。1度に多くの箇所を変えるより、ひとつ修正して再ビルドすると、原因と結果を結び付けられます。", example: `#include <iostream>\nint main() {\n    std::cout << "Build\\n";\n    return 0;\n}`, exampleOutput: "Build", commonMistake: "最初のエラーを無視し、後続のエラーを個別に直そうとする。", quiz: { question: "診断が複数ある場合、最初に確認するのは？", choices: ["最後の警告", "最初に報告されたエラー", "実行時間"], answer: 1, explanation: "最初の構文ミスが後続の診断を引き起こしていることがあります。" }, prompt: "Build OK と表示するプログラムを完成させ、終了コード0を返してください。", solution: `#include <iostream>\nint main() {\n    std::cout << "Build OK\\n";\n    return 0;\n}`, hints: ["#include と main を確認します。", "出力文の句読点を確認します。", "return 0; の後で main を閉じます。"], debug: { code: `#include <iostream>\nint main() {\n    std::cout << "Build OK\\n"\n    return 0;\n}`, fix: `#include <iostream>\nint main() {\n    std::cout << "Build OK\\n";\n    return 0;\n}`, explanation: "出力文の最後のセミコロンが抜けています。" } },
    { title: "1週間の統合：起動メッセージ", goal: "環境確認からビルド、実行、出力確認までを自分で通す。", minutes: 45, explanation: "小さなプログラムでも、保存・ビルド・実行・結果確認までが開発の一連の流れです。画面に表示された文字と終了状態をそれぞれ確かめます。", example: `#include <iostream>\nint main() {\n    std::cout << "Game Start\\n";\n    std::cout << "Ready\\n";\n}`, exampleOutput: "Game Start\nReady", commonMistake: "エディタ上のコードだけで満足し、実際にビルド・実行しない。", quiz: { question: "動作を確認したと言える証拠は？", choices: ["ソースを保存した", "ビルドし、実行結果を確かめた", "コメントを書いた"], answer: 1, explanation: "実行まで行い、出力と終了状態を確認して初めて動作の証拠になります。" }, prompt: "Game Start、Player ready の順に2行で表示するプログラムを作ってください。", solution: `#include <iostream>\nint main() {\n    std::cout << "Game Start\\n";\n    std::cout << "Player ready\\n";\n    return 0;\n}`, hints: ["出力文を2つに分けます。", "それぞれ末尾で改行します。", "文字と空白を課題どおりに確認します。"], debug: { code: `std::cout << "Game Start\\nPlayer ready";`, fix: `std::cout << "Game Start\\nPlayer ready\\n";`, explanation: "2行目の後ろに改行がなく、末尾までの出力形式が指定と一致しません。" } },
  ],
  [
    { title: "変数に値を保存する", goal: "名前付きの値を宣言し、代入後に使う。", minutes: 35, explanation: "変数は型と名前を持つ記憶領域です。宣言時に初期値を与えると、意図しない値を読む危険を減らせます。", example: `int score = 120;\nstd::cout << score << '\\n';`, exampleOutput: "120", commonMistake: "宣言しただけで初期値のある変数だと思い込む。", quiz: { question: "int score = 120; の初期値は？", choices: ["0", "120", "未定義"], answer: 1, explanation: "初期化子 = 120 によって、宣言時に120が設定されます。" }, prompt: "int 型の lives を3で初期化し、lives: 3 と表示してください。", solution: `#include <iostream>\nint main() {\n    int lives = 3;\n    std::cout << "lives: " << lives << '\\n';\n}`, hints: ["整数には int を使います。", "宣言と初期化を同時に書きます。", "std::cout にラベルと変数を順に渡します。"], debug: { code: `int lives;\nstd::cout << lives;`, fix: `int lives = 3;\nstd::cout << lives;`, explanation: "初期化前のローカルな整数を読むことはできません。値を設定してから使います。" } },
    { title: "整数と浮動小数点数", goal: "整数型と小数を扱う型の違いを説明する。", minutes: 35, explanation: "int は整数を、double は小数を含む近似値を扱います。型によって表現できる値や演算結果が異なります。", example: `int count = 4;\ndouble ratio = 0.5;\nstd::cout << count * ratio << '\\n';`, exampleOutput: "2", commonMistake: "double なら十進小数を常に完全な精度で保存できると考える。", quiz: { question: "0.5 のような小数を扱う型として基本的に適切なのは？", choices: ["double", "bool", "char"], answer: 0, explanation: "double は浮動小数点数を表します。" }, prompt: "int 型の coins を8、double 型の bonus を1.5とし、積を表示してください。", solution: `#include <iostream>\nint main() {\n    int coins = 8;\n    double bonus = 1.5;\n    std::cout << coins * bonus << '\\n';\n}`, hints: ["整数と小数はそれぞれ別の変数にします。", "掛け算は * 演算子です。", "出力前に変数名と型を確認します。"], debug: { code: `int half = 5 / 2;\nstd::cout << half;`, fix: `double half = 5.0 / 2.0;\nstd::cout << half;`, explanation: "整数同士の除算は小数部分を切り捨てます。小数が必要なら少なくとも一方を浮動小数点数にします。" } },
    { title: "初期化方法と const", goal: "初期値を与えてから使い、変わらない値を const にする。", minutes: 30, explanation: "C++には =、丸括弧、波括弧による初期化があります。波括弧初期化は値の縮小変換を防ぐため、初心者にも安全な選択です。const は値を後から変更できないことを表します。", example: `const int maxLives{3};\nint lives{maxLives};`, exampleOutput: "値の表示なし", commonMistake: "const にした変数を後から変更しようとする。", quiz: { question: "const int limit{10}; の後で limit = 20; を行うと？", choices: ["正常に変更される", "コンパイルエラー", "limit が文字列になる"], answer: 1, explanation: "const オブジェクトは初期化後に変更できません。" }, prompt: "const int maxHp を100で初期化し、maxHp を1行で表示してください。", solution: `#include <iostream>\nint main() {\n    const int maxHp{100};\n    std::cout << maxHp << '\\n';\n}`, hints: ["固定値を const で宣言します。", "波括弧の中に初期値を置きます。", "const は型の前に置きます。"], debug: { code: `const int stage{1};\nstage = 2;`, fix: `int stage{1};\nstage = 2;`, explanation: "stage を変えるなら const を付けません。固定値のままなら代入文を削除します。" } },
    { title: "文字・真偽値・型推論", goal: "char と bool を使い分け、auto の型を初期化式から読む。", minutes: 30, explanation: "char は1文字、bool は true/false を表します。auto は初期化式から型を推論しますが、読みやすさのため値の意味が明確な名前を使います。", example: `char rank{'A'};\nbool cleared{true};\nauto stage{2};`, exampleOutput: "出力なし", commonMistake: "文字列の引用符と1文字の引用符を混同する。", quiz: { question: "1文字の A を表すリテラルは？", choices: [`"A"`, `'A'`, "true"], answer: 1, explanation: "'A' は文字リテラル、\"A\" は文字列リテラルです。" }, prompt: "char 型の rank を S、bool 型の cleared を true にして、値を1行ずつ表示してください。", solution: `#include <iostream>\nint main() {\n    char rank{'S'};\n    bool cleared{true};\n    std::cout << rank << '\\n' << std::boolalpha << cleared << '\\n';\n}`, hints: ["char は単一引用符を使います。", "bool は true または false です。", "boolalpha を使うと true/false として表示できます。"], debug: { code: `char key{"W"};`, fix: `char key{'W'};`, explanation: "char の初期値は単一引用符で囲む1文字です。" } },
    { title: "入力を読み取る", goal: "標準入力から値を受け取り、同じ値を結果に使う。", minutes: 40, explanation: "std::cin は標準入力から型に合う値を読みます。読み取り前に変数を宣言し、入力と出力が対応するようにします。", example: `int level{};\nstd::cin >> level;\nstd::cout << level << '\\n';`, exampleOutput: "入力に応じて変わる", commonMistake: "変数へ入力する前に、その値を使ってしまう。", quiz: { question: "int value{}; std::cin >> value; の後、value に入るのは？", choices: ["標準入力から読み取った整数", "常に0", "ファイル名"], answer: 0, explanation: ">> が入力ストリームから値を読み、変数に格納します。" }, prompt: "入力された整数を2倍して表示してください。テスト入力は 7 です。", solution: `#include <iostream>\nint main() {\n    int value{};\n    std::cin >> value;\n    std::cout << value * 2 << '\\n';\n}`, input: "7\n", hints: ["int 変数を用意します。", "std::cin >> value; で読みます。", "読み取った値を2倍して出力します。"], debug: { code: `int value{};\nstd::cout << value * 2;\nstd::cin >> value;`, fix: `int value{};\nstd::cin >> value;\nstd::cout << value * 2;`, explanation: "入力を出力より先に読み取ります。" } },
    { title: "範囲とオーバーフロー", goal: "型が表現できる範囲を意識し、境界値をテストに含める。", minutes: 40, explanation: "整数型には表現できる範囲があります。符号付き整数の範囲外演算は未定義動作になり得るため、上限・下限を設計とテストで扱います。", example: `#include <limits>\nint top = std::numeric_limits<int>::max();`, exampleOutput: "出力なし", commonMistake: "整数がどんな大きさでも正確に増え続けると考える。", quiz: { question: "int の表現範囲を超える計算を前提にしてよい？", choices: ["よい", "よくない。範囲を検討する", "コンパイラが必ず大きい型に変える"], answer: 1, explanation: "整数型の表現範囲は有限です。範囲外を避ける設計にします。" }, prompt: "入力された整数を読み、正の数なら positive、それ以外なら non-positive と表示してください。", solution: `#include <iostream>\nint main() {\n    int value{};\n    std::cin >> value;\n    if (value > 0) std::cout << "positive\\n";\n    else std::cout << "non-positive\\n";\n}`, input: "-1\n", hints: ["入力を int に読み込みます。", "比較演算子 > で0より大きいか調べます。", "0以下の分岐も用意します。"], debug: { code: `int hp{100};\nhp = hp + 1'000'000'000;`, fix: `int hp{100};\n// 想定範囲に合う型を選び、上限を検査してから加算する`, explanation: "大きな値を無条件で加える設計は範囲を超える恐れがあります。先に上限を検査します。" } },
    { title: "総合：ステータス表示", goal: "複数の型、入力、計算、出力をつないで動作を確認する。", minutes: 45, explanation: "変数は型と役割を合わせて選び、入力から出力までの順序を保ちます。テスト入力を変えたときに結果が追従するかを確かめます。", example: `int hp{80};\nint damage{15};\nstd::cout << hp - damage << '\\n';`, exampleOutput: "65", commonMistake: "固定値を表示するだけで、入力値に基づいた計算をしていない。", quiz: { question: "ユーザー入力を計算に使う順番は？", choices: ["計算→入力→出力", "入力→計算→出力", "出力→計算→入力"], answer: 1, explanation: "入力が先に必要で、その値を使って計算し、結果を表示します。" }, prompt: "入力されたHPとダメージを読み、残りHPを `HP: <値>` 形式で表示してください。入力は 80 15 です。", solution: `#include <iostream>\nint main() {\n    int hp{};\n    int damage{};\n    std::cin >> hp >> damage;\n    std::cout << "HP: " << hp - damage << '\\n';\n}`, input: "80 15\n", hints: ["整数変数を2つ用意します。", "std::cin で2つの値を順に読みます。", "表示ラベルと hp - damage を出力します。"], debug: { code: `int hp{};\nint damage{};\nstd::cin >> hp >> damage;\nstd::cout << "HP: " << damage - hp;`, fix: `std::cout << "HP: " << hp - damage;`, explanation: "引き算の順序が逆です。残りHPは現在HPから受けたダメージを引きます。" } },
  ],
  [
    { title: "算術演算子", goal: "四則演算と整数除算の結果を予測する。", minutes: 35, explanation: "+ - * / % は数値演算です。整数同士の / は小数部分を捨て、% は整数の余りを返します。", example: `std::cout << 7 / 2 << ' ' << 7 % 2 << '\\n';`, exampleOutput: "3 1", commonMistake: "整数除算でも小数が残ると考える。", quiz: { question: "整数の 7 / 2 の結果は？", choices: ["3", "3.5", "4"], answer: 0, explanation: "両方が整数なので小数部分が捨てられます。" }, prompt: "入力された分数の整数部分と余りを `q=<商> r=<余り>` の形式で表示してください。入力は 17 5 です。", solution: `#include <iostream>\nint main() {\n    int a{}, b{};\n    std::cin >> a >> b;\n    std::cout << "q=" << a / b << " r=" << a % b << '\\n';\n}`, input: "17 5\n", hints: ["商は /、余りは % です。", "2つの入力値を読みます。", "文字列と2つの計算結果を連結して出力します。"], debug: { code: `int seconds{125};\nstd::cout << seconds / 60 << ':' << seconds / 60;`, fix: `std::cout << seconds / 60 << ':' << seconds % 60;`, explanation: "秒の残りは60で割った余りです。" } },
    { title: "演算子の優先順位", goal: "括弧で意図を明示し、式を段階的に評価する。", minutes: 30, explanation: "掛け算と割り算は足し算・引き算より先に評価されます。複雑な式では括弧を使うと、意図が読みやすくなります。", example: `std::cout << 2 + 3 * 4 << '\\n';\nstd::cout << (2 + 3) * 4 << '\\n';`, exampleOutput: "14\n20", commonMistake: "左から順番にすべての演算が行われると思い込む。", quiz: { question: "2 + 3 * 4 の結果は？", choices: ["20", "14", "24"], answer: 1, explanation: "掛け算を先に計算するため、2 + 12 = 14です。" }, prompt: "入力された幅と高さから長方形の周の長さを計算してください。入力は 4 7 です。", solution: `#include <iostream>\nint main() {\n    int w{}, h{};\n    std::cin >> w >> h;\n    std::cout << 2 * (w + h) << '\\n';\n}`, input: "4 7\n", hints: ["周の長さは幅と高さの和の2倍です。", "先に w + h をまとめます。", "括弧を付けてから2を掛けます。"], debug: { code: `int w{4}, h{7};\nstd::cout << 2 * w + h;`, fix: `std::cout << 2 * (w + h);`, explanation: "周の長さでは幅と高さの合計を2倍にします。" } },
    { title: "代入と複合代入", goal: "代入式と加算代入の状態変化を追跡する。", minutes: 30, explanation: "= は右辺を左辺へ代入します。+= や -= は現在値に加減算して更新します。これは等しいかを調べる == とは別の演算子です。", example: `int score{10};\nscore += 5;\nstd::cout << score << '\\n';`, exampleOutput: "15", commonMistake: "条件式で == の代わりに = を使ってしまう。", quiz: { question: "score += 3; は何をする？", choices: ["scoreを3で割る", "scoreに3を加える", "scoreが3か調べる"], answer: 1, explanation: "複合代入 += は現在値に右辺を足して代入します。" }, prompt: "入力した初期スコアに、ボーナス5を加えて表示してください。入力は 12 です。", solution: `#include <iostream>\nint main() {\n    int score{};\n    std::cin >> score;\n    score += 5;\n    std::cout << score << '\\n';\n}`, input: "12\n", hints: ["入力値を score に読みます。", "score += 5; で更新します。", "更新後の値を出力します。"], debug: { code: `int score{10};\nscore =+ 5;`, fix: `score += 5;`, explanation: "=+ は加算代入ではありません。複合代入は += の順です。" } },
    { title: "比較と論理演算", goal: "比較式と論理式の結果を bool として使う。", minutes: 35, explanation: "==、!=、<、<= などの比較は bool を返します。&& は両方、|| はどちらか、! は真偽を反転します。", example: `int hp{40};\nbool alive = hp > 0;\nstd::cout << std::boolalpha << alive << '\\n';`, exampleOutput: "true", commonMistake: "条件式で & と && を取り違える。", quiz: { question: "hp > 0 && hp < 100 が true になる条件は？", choices: ["両方の比較が true", "どちらか一方だけ true", "hp が100以上"], answer: 0, explanation: "論理AND && は左右両方が true のとき true です。" }, prompt: "入力された年齢が18以上なら adult、それ以外なら minor と表示してください。入力は 20 です。", solution: `#include <iostream>\nint main() {\n    int age{};\n    std::cin >> age;\n    std::cout << (age >= 18 ? "adult\\n" : "minor\\n");\n}`, input: "20\n", hints: ["age と18を比較します。", "条件演算子は condition ? A : B です。", "文字列の末尾に改行を付けます。"], debug: { code: `if (hp = 0) {\n    std::cout << "down";\n}`, fix: `if (hp == 0) {\n    std::cout << "down";\n}`, explanation: "条件で値を比較するには == を使います。= は代入です。" } },
    { title: "型変換と narrowing", goal: "変換後の値を予測し、縮小変換を避ける。", minutes: 40, explanation: "型変換によって小数部が失われたり、表現範囲が変わったりします。波括弧初期化は危険な縮小変換をコンパイル時に拒否します。", example: `int whole = 3.8;\n// int exact{3.8}; は縮小変換のため拒否される`, exampleOutput: "出力なし", commonMistake: "変換で情報が失われる可能性を考えず、暗黙変換を使う。", quiz: { question: "int x{3.8}; の扱いは？", choices: ["3になる", "コンパイル時に縮小変換として拒否", "4になる"], answer: 1, explanation: "波括弧初期化は小数から整数への縮小変換を拒否します。" }, prompt: "入力した合計点を3科目の平均として小数で表示してください。入力は 7 8 9 です。", solution: `#include <iostream>\nint main() {\n    int a{}, b{}, c{};\n    std::cin >> a >> b >> c;\n    double average = (a + b + c) / 3.0;\n    std::cout << average << '\\n';\n}`, input: "7 8 9\n", hints: ["平均は合計を3で割ります。", "3.0 のような浮動小数点数を式に使います。", "int に戻さず double として表示します。"], debug: { code: `int sum{7 + 8 + 9};\ndouble avg = sum / 3;`, fix: `double avg = sum / 3.0;`, explanation: "sum / 3 は整数同士なので、double に代入する前に小数が切り捨てられます。" } },
    { title: "未定義動作を避ける", goal: "安全でない整数式を見つけ、制約や検査を追加する。", minutes: 40, explanation: "未定義動作は、C++仕様が結果を定めていない状態です。符号付き整数のオーバーフローや0除算を「たまたま動いた」結果に頼らず、条件を先に検査します。", example: `if (divisor != 0) {\n    std::cout << value / divisor;\n}`, exampleOutput: "入力・条件により変化", commonMistake: "1回の実行で期待値が出たので、未定義動作のない安全なコードだと思う。", quiz: { question: "未定義動作が発生したとき、結果は？", choices: ["常に0", "仕様で定められていない", "必ず例外"], answer: 1, explanation: "未定義動作の後の振る舞いは規格で保証されません。" }, prompt: "2つの整数を読み、割る数が0なら `cannot divide by zero`、そうでなければ整数の商を表示してください。入力は 20 0 です。", solution: `#include <iostream>\nint main() {\n    int value{}, divisor{};\n    std::cin >> value >> divisor;\n    if (divisor == 0) std::cout << "cannot divide by zero\\n";\n    else std::cout << value / divisor << '\\n';\n}`, input: "20 0\n", hints: ["除算の前に divisor を確認します。", "0の場合とそれ以外で分岐します。", "0なら指定されたエラー文字列を出します。"], debug: { code: `int result = value / divisor;\nif (divisor == 0) std::cout << "error";`, fix: `if (divisor == 0) std::cout << "error";\nelse std::cout << value / divisor;`, explanation: "0除算を防ぐ検査より先に割り算が実行されています。" } },
    { title: "総合：安全なミニ計算機", goal: "入力・演算・分岐を組み合わせ、想定外の入力を考慮する。", minutes: 45, explanation: "複数の演算を1つのプログラムにまとめるときは、入力順と条件判定を明確にします。ゼロ除算を避け、整数除算の仕様も利用者にわかるようにします。", example: `if (op == '/' && b == 0) {\n    std::cout << "error\\n";\n}`, exampleOutput: "条件により変わる", commonMistake: "演算子を読んでも使わず、入力値と分岐がつながっていない。", quiz: { question: "除算の安全性を確かめるべき条件は？", choices: ["除数が0か", "被除数が正か", "出力が改行か"], answer: 0, explanation: "整数除算では除数が0のケースを先に処理します。" }, prompt: "整数2つ a b と演算子 + または - を読み、`result: <値>` と表示してください。入力は `9 - 4` です。", solution: `#include <iostream>\nint main() {\n    int a{}, b{};\n    char op{};\n    std::cin >> a >> op >> b;\n    int result = (op == '+') ? a + b : a - b;\n    std::cout << "result: " << result << '\\n';\n}`, input: "9 - 4\n", hints: ["整数2つと文字1つを順に読みます。", "演算子が '+' か比較します。", "この課題の対象演算は + と - です。"], debug: { code: `char op{};\nstd::cin >> op;\nif (op == "+")`, fix: `if (op == '+')`, explanation: "char は単一引用符の文字リテラルと比較します。" } },
  ],
  [
    { title: "if と else", goal: "条件を評価し、互いに排他的な処理を選ぶ。", minutes: 35, explanation: "if は条件が true のときにブロックを実行します。else は条件が false のときの分岐です。比較条件の境界を確認します。", example: `if (score >= 60) std::cout << "pass\\n";\nelse std::cout << "retry\\n";`, exampleOutput: "scoreにより変わる", commonMistake: "60点ちょうどが合格かどうか、境界をテストしない。", quiz: { question: "score == 60 のとき score >= 60 は？", choices: ["true", "false", "コンパイルエラー"], answer: 0, explanation: "60は60以上なので条件は true です。" }, prompt: "入力された整数が偶数なら even、奇数なら odd と表示してください。入力は 8 です。", solution: `#include <iostream>\nint main() {\n    int number{};\n    std::cin >> number;\n    if (number % 2 == 0) std::cout << "even\\n";\n    else std::cout << "odd\\n";\n}`, input: "8\n", hints: ["偶数は2で割った余りが0です。", "% 演算子で余りを求めます。", "余りが0かを if で調べます。"], debug: { code: `if (score > 60) std::cout << "pass";`, fix: `if (score >= 60) std::cout << "pass";`, explanation: "60点を含めるなら >= を使います。" } },
    { title: "else if で範囲を分ける", goal: "条件の順序と境界を保って複数の分類を行う。", minutes: 35, explanation: "else if は上から順に評価され、最初に成立した分岐だけ実行します。広い条件を先に書くと、後の分岐へ到達できないことがあります。", example: `if (score >= 80) grade = 'A';\nelse if (score >= 60) grade = 'B';\nelse grade = 'C';`, exampleOutput: "scoreにより変わる", commonMistake: "score >= 60 を先に置き、80以上も先に分類してしまう。", quiz: { question: "score=90で、最初の条件が score >= 60 の場合、次の分岐は？", choices: ["必ず評価される", "最初が成立するため評価されない", "エラーになる"], answer: 1, explanation: "if-else if では先に成立した枝が選ばれます。" }, prompt: "入力点数が80以上なら A、60以上なら B、それ以外は C と表示してください。入力は 75 です。", solution: `#include <iostream>\nint main() {\n    int score{};\n    std::cin >> score;\n    if (score >= 80) std::cout << "A\\n";\n    else if (score >= 60) std::cout << "B\\n";\n    else std::cout << "C\\n";\n}`, input: "75\n", hints: ["80以上の条件を先に書きます。", "次に60以上を確認します。", "どちらでもなければCです。"], debug: { code: `if (score >= 60) grade = 'B';\nelse if (score >= 80) grade = 'A';`, fix: `if (score >= 80) grade = 'A';\nelse if (score >= 60) grade = 'B';`, explanation: "80以上も先の60以上で分類されるため、境界が高い条件を先に判定します。" } },
    { title: "switch で選択肢を扱う", goal: "離散した値を switch/case で読みやすく処理する。", minutes: 35, explanation: "switch は整数・列挙値などの離散値に対する複数分岐に使えます。各 case の break で次の case への意図しない通過を防ぎます。", example: `switch (command) {\ncase 'w': std::cout << "up\\n"; break;\ndefault: std::cout << "unknown\\n";\n}`, exampleOutput: "commandにより変わる", commonMistake: "break を書かず、次の case へ処理が続く。", quiz: { question: "case の最後に break を置く主な理由は？", choices: ["次のcaseへの通過を防ぐ", "変数を初期化する", "ループを開始する"], answer: 0, explanation: "break はswitch文から抜け、次のcaseの処理へ進まないようにします。" }, prompt: "入力された数字1なら start、2なら pause、それ以外なら unknown と表示してください。入力は 2 です。", solution: `#include <iostream>\nint main() {\n    int command{};\n    std::cin >> command;\n    switch (command) {\n    case 1: std::cout << "start\\n"; break;\n    case 2: std::cout << "pause\\n"; break;\n    default: std::cout << "unknown\\n";\n    }\n}`, input: "2\n", hints: ["整数を読み、値に応じて分岐します。", "caseごとに指定語を出します。", "default は他の値を受け取ります。"], debug: { code: `switch (command) {\ncase 1: std::cout << "start";\ncase 2: std::cout << "pause"; break;\n}`, fix: `switch (command) {\ncase 1: std::cout << "start"; break;\ncase 2: std::cout << "pause"; break;\n}`, explanation: "case 1 に break がなく、case 2 の処理も続けて実行されます。" } },
    { title: "while と終了条件", goal: "while の反復条件を更新し、必ず終了するループを書く。", minutes: 35, explanation: "while は条件を先に調べ、true の間くり返します。ループ内で状態が変わらず条件も変化しないと、無限ループになります。", example: `int count{3};\nwhile (count > 0) {\n    std::cout << count << '\\n';\n    --count;\n}`, exampleOutput: "3\n2\n1", commonMistake: "ループ条件に関係する変数を更新し忘れる。", quiz: { question: "while (count > 0) の中で count を変えないと？", choices: ["必ず1回で終了", "条件次第で無限に続く", "コンパイル不可"], answer: 1, explanation: "countが正のままなら条件が変わらず、ループが終了しません。" }, prompt: "入力された正の整数 n から1までを降順で表示してください。入力は 3 です。", solution: `#include <iostream>\nint main() {\n    int n{};\n    std::cin >> n;\n    while (n > 0) {\n        std::cout << n << '\\n';\n        --n;\n    }\n}`, input: "3\n", hints: ["n が0より大きい間くり返します。", "各回の最後に n を1減らします。", "出力は減らす前に行います。"], debug: { code: `int n{3};\nwhile (n > 0) {\n    std::cout << n << '\\n';\n}`, fix: `--n;`, explanation: "n が減らず、n > 0 がずっとtrueのままです。" } },
    { title: "for で回数を決める", goal: "初期化、継続条件、更新をfor文に分けて書く。", minutes: 35, explanation: "for の括弧には初期化; 条件; 更新を順に書きます。回数が決まった反復に向いています。", example: `for (int i = 0; i < 4; ++i) {\n    std::cout << i << '\\n';\n}`, exampleOutput: "0\n1\n2\n3", commonMistake: "i < 4 と i <= 4 の違いを見落とし、1回多く実行する。", quiz: { question: "for (int i=0; i<4; ++i) は何回実行される？", choices: ["3回", "4回", "5回"], answer: 1, explanation: "iは0,1,2,3で条件を満たし、4では終了します。" }, prompt: "入力された n について、0から n-1 までの整数を1行ずつ表示してください。入力は 4 です。", solution: `#include <iostream>\nint main() {\n    int n{};\n    std::cin >> n;\n    for (int i = 0; i < n; ++i) std::cout << i << '\\n';\n}`, input: "4\n", hints: ["カウンタを0から始めます。", "n 未満を条件にします。", "各回で ++i し、i を出力します。"], debug: { code: `for (int i = 0; i <= n; ++i) std::cout << i << '\\n';`, fix: `for (int i = 0; i < n; ++i) std::cout << i << '\\n';`, explanation: "n個を0から表示する場合はn未満までです。<=だとnも含まれます。" } },
    { title: "break と continue", goal: "反復の終了と現在回のスキップを使い分ける。", minutes: 35, explanation: "break は最も内側のループを終了します。continue はその回の残りの処理を飛ばして、次の反復へ進みます。", example: `for (int i = 1; i <= 5; ++i) {\n    if (i == 3) continue;\n    std::cout << i << ' ';\n}`, exampleOutput: "1 2 4 5", commonMistake: "continue の後に更新式がないwhileループで、条件変数も更新せず停止しない。", quiz: { question: "continue の動作は？", choices: ["ループ全体を終える", "現在の反復を飛ばす", "プログラムを終了する"], answer: 1, explanation: "continueは現在回の残りを飛ばし、次の反復に移ります。" }, prompt: "1からnまでのうち、3の倍数だけを飛ばして表示してください。入力は 5 です。", solution: `#include <iostream>\nint main() {\n    int n{};\n    std::cin >> n;\n    for (int i = 1; i <= n; ++i) {\n        if (i % 3 == 0) continue;\n        std::cout << i << '\\n';\n    }\n}`, input: "5\n", hints: ["1からnまでループします。", "3で割った余りが0ならcontinueします。", "それ以外の数だけ出力します。"], debug: { code: `int i{1};\nwhile (i <= 5) {\n    if (i == 3) continue;\n    std::cout << i << '\\n';\n    ++i;\n}`, fix: `if (i == 3) { ++i; continue; }`, explanation: "i==3でcontinueすると末尾の++iを飛ばし、条件が変わらないままになります。" } },
    { title: "総合：数当てゲームのロジック", goal: "入力、条件、反復をつなぎ、終了条件が明確な小課題を作る。", minutes: 50, explanation: "数当てゲームでは、入力値を目標値と比べて、正解なら終了、違えばヒントを出して続けます。今回は再現しやすいよう目標値を固定します。", example: `const int target{7};\nint guess{};\nstd::cin >> guess;\nif (guess == target) std::cout << "correct\\n";`, exampleOutput: "入力に応じて変わる", commonMistake: "正解した後もループを続ける、または不正解でループを終える。", quiz: { question: "正解時にゲームを終えるにはどんな制御が使える？", choices: ["break", "continue", "++"], answer: 0, explanation: "breakはループを終了します。" }, prompt: "目標値7の数当てを作ります。入力を読み、7なら correct、それより小さければ too low、大きければ too high と表示してください。入力は 5 です。", solution: `#include <iostream>\nint main() {\n    const int target{7};\n    int guess{};\n    std::cin >> guess;\n    if (guess == target) std::cout << "correct\\n";\n    else if (guess < target) std::cout << "too low\\n";\n    else std::cout << "too high\\n";\n}`, input: "5\n", hints: ["targetをconst intで7にします。", "guessを入力してtargetと比較します。", "等しい・小さい・大きいの3分岐にします。"], debug: { code: `if (guess < target) std::cout << "correct";\nelse std::cout << "too low";`, fix: `if (guess == target) std::cout << "correct";\nelse if (guess < target) std::cout << "too low";\nelse std::cout << "too high";`, explanation: "正解判定は == です。大きい場合の分岐も必要です。" } },
  ],
  week5LessonSeeds,
  week6LessonSeeds,
  week7LessonSeeds,
  week8LessonSeeds,
];

const hiddenTestsByLesson: Record<string, { input: string; output: string }[]> = {
  "w1-d1": [{ input: "ignored input\n", output: "Hello, C++!" }],
  "w1-d2": [{ input: "ignored input\n", output: "start\nend" }],
  "w1-d3": [{ input: "ignored input\n", output: "name: Ada\nlevel: 3" }],
  "w1-d4": [{ input: "ignored input\n", output: "Ready" }],
  "w1-d5": [{ input: "ignored input\n", output: "Training" }],
  "w1-d6": [{ input: "ignored input\n", output: "Build OK" }],
  "w1-d7": [{ input: "ignored input\n", output: "Game Start\nPlayer ready" }],
  "w2-d1": [{ input: "ignored input\n", output: "lives: 3" }],
  "w2-d2": [{ input: "ignored input\n", output: "12" }],
  "w2-d3": [{ input: "ignored input\n", output: "100" }],
  "w2-d4": [{ input: "ignored input\n", output: "S\ntrue" }],
  "w2-d5": [{ input: "-3\n", output: "-6" }, { input: "0\n", output: "0" }],
  "w2-d6": [{ input: "5\n", output: "positive" }, { input: "0\n", output: "non-positive" }],
  "w2-d7": [{ input: "0 0\n", output: "HP: 0" }, { input: "150 30\n", output: "HP: 120" }],
  "w3-d1": [{ input: "19 4\n", output: "q=4 r=3" }, { input: "8 3\n", output: "q=2 r=2" }],
  "w3-d2": [{ input: "1 5\n", output: "12" }, { input: "10 2\n", output: "24" }],
  "w3-d3": [{ input: "-5\n", output: "0" }, { input: "0\n", output: "5" }],
  "w3-d4": [{ input: "18\n", output: "adult" }, { input: "17\n", output: "minor" }],
  "w3-d5": [{ input: "7 8 10\n", output: "8.33333" }],
  "w3-d6": [{ input: "20 3\n", output: "6" }, { input: "0 7\n", output: "0" }],
  "w3-d7": [{ input: "6 + 2\n", output: "result: 8" }, { input: "4 - 9\n", output: "result: -5" }],
  "w4-d1": [{ input: "-3\n", output: "odd" }, { input: "0\n", output: "even" }],
  "w4-d2": [{ input: "80\n", output: "A" }, { input: "60\n", output: "B" }, { input: "59\n", output: "C" }],
  "w4-d3": [{ input: "1\n", output: "start" }, { input: "0\n", output: "unknown" }],
  "w4-d4": [{ input: "1\n", output: "1" }, { input: "5\n", output: "5\n4\n3\n2\n1" }],
  "w4-d5": [{ input: "1\n", output: "0" }, { input: "0\n", output: "" }],
  "w4-d6": [{ input: "3\n", output: "1\n2" }, { input: "7\n", output: "1\n2\n4\n5\n7" }],
  "w4-d7": [{ input: "7\n", output: "correct" }, { input: "8\n", output: "too high" }],
  "w5-d1": [{ input: "ignored input\n", output: "ready" }],
  "w5-d2": [{ input: "-11\n", output: "damage: -11" }],
  "w5-d3": [{ input: "100 -20\n", output: "80" }],
  "w5-d4": [{ input: "1\n", output: "alive" }],
  "w5-d5": [{ input: "-10\n", output: "0" }],
  "w5-d6": [{ input: "0 0\n", output: "HP: 0\ndown" }],
  "w5-d7": [{ input: "99 2\n", output: "100" }],
  "w6-d1": [{ input: "100 -5 6\n", output: "-5" }],
  "w6-d2": [{ input: "1 2 3\n", output: "6" }],
  "w6-d3": [{ input: "Codex\n", output: "Hello, Codex" }],
  "w6-d4": [{ input: "two  spaces\n", output: "text: two  spaces" }],
  "w6-d5": [{ input: "17\n", output: "17" }],
  "w6-d6": [{ input: "-2 0 4\n", output: "-2 0 4" }],
  "w6-d7": [{ input: "1 2 3\n", output: "6" }],
  "w7-d1": [{ input: "100 -30\n", output: "70" }],
  "w7-d2": [{ input: "4 -10\n", output: "-6" }],
  "w7-d3": [{ input: "CPlusPlus\n", output: "name: CPlusPlus" }],
  "w7-d4": [{ input: "50 -3\n", output: "50" }],
  "w7-d5": [{ input: "12 -7\n", output: "5" }],
  "w7-d6": [{ input: "S -10\n", output: "0" }],
  "w7-d7": [{ input: "B 40\n", output: "40" }],
  "w8-d1": [{ input: "10 -5\n", output: "x: 10 y: -5" }],
  "w8-d2": [{ input: "Ada 0\n", output: "name: Ada\nhp: 0" }],
  "w8-d3": [{ input: "3\n", output: "unknown" }],
  "w8-d4": [{ input: "-20\n", output: "0" }],
  "w8-d5": [{ input: "-1\n", output: "down" }],
  "w8-d6": [{ input: "5 6 0 0\n", output: "5 6" }],
  "w8-d7": [{ input: "100 2\n", output: "88" }],
};

const exerciseOutputs = [
  "Hello, C++!", "start\nend", "name: Ada\nlevel: 3", "Ready", "Training", "Build OK", "Game Start\nPlayer ready",
  "lives: 3", "12", "100", "S\ntrue", "14", "non-positive", "HP: 65",
  "q=3 r=2", "22", "17", "adult", "8", "cannot divide by zero", "result: 5",
  "even", "B", "pause", "3\n2\n1", "0\n1\n2\n3", "1\n2\n4\n5", "too low",
  "ready", "damage: 18", "11", "alive", "45", "HP: 37\nalive", "80",
  "7", "16", "Hello, Ada", "text: Hello C++", "42", "4 7 9", "16",
  "15", "21", "name: Ada", "10", "15", "80", "75",
  "3 4", "name: Ada\nhp: 80", "pause", "100", "alive", "3 4", "18",
];

export const lessons: Lesson[] = lessonSeeds.flatMap((weekLessons, weekIndex) =>
  weekLessons.map((seed, dayIndex) => ({
    ...seed,
    id: `w${weekIndex + 1}-d${dayIndex + 1}`,
    version: 1 as const,
    week: weekIndex + 1,
    day: dayIndex + 1,
    subject: weekNames[weekIndex],
    difficulty: weekIndex === 0 && dayIndex === 0 ? "入門" as const : "基礎" as const,
    prerequisites: weekIndex === 0 ? ["なし。C言語経験があれば対応する構文を比較する。"] : [`Week ${weekIndex}の内容`],
    minutes: seed.minutes,
    standard: "c++17" as const,
    exercise: {
      prompt: seed.prompt,
      starter,
      solution: seed.solution,
      input: seed.input ?? "",
      expectedOutput: seed.tests?.[0]?.output ?? exerciseOutputs[weekIndex * 7 + dayIndex],
      tests: seed.tests ?? [{ input: seed.input ?? "", output: exerciseOutputs[weekIndex * 7 + dayIndex] }],
      hiddenTests: seed.hiddenTests ?? hiddenTestsByLesson[`w${weekIndex + 1}-d${dayIndex + 1}`] ?? [],
      hints: seed.hints,
    },
    debug: seed.debug,
  })),
);

export function findLesson(week: number, day: number) {
  return lessons.find((lesson) => lesson.week === week && lesson.day === day);
}
