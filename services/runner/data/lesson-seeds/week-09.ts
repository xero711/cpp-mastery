import type { LessonSeed } from "../lesson-source.ts";

export const week9LessonSeeds: LessonSeed[] = [
  {
    title: "宣言と定義を見分ける",
    goal: "関数の宣言で使い方を先に知らせ、定義で処理の本体を与える。",
    minutes: 35,
    explanation: "関数の宣言（declaration）は、名前・引数の型・戻り値の型をコンパイラへ知らせます。関数の定義（definition）は、その関数が何をするかを本体で書きます。定義には宣言の役割も含まれますが、宣言だけには本体がありません。\n\n`int damageFor(int power);` は宣言です。末尾のセミコロンで終わり、呼び出し側が使う型を示します。`int damageFor(int power) { return power * 2; }` は定義で、波括弧の中に処理があります。\n\nC++は上から読み進めるため、定義より前で関数を呼ぶなら、その前に宣言が必要です。宣言と定義の名前・引数・戻り値は一致させます。",
    example: `#include <iostream>

int damageFor(int power);

int main() {
    std::cout << damageFor(12) << '\\n';
}

int damageFor(int power) {
    return power * 2;
}`,
    exampleOutput: "24",
    commonMistake: "宣言の行に関数本体を書いたり、宣言と定義で引数の型を変えたりする。宣言だけで実行できると思い込むと、リンク時に定義が見つからないエラーになります。",
    quiz: {
      question: "`int heal(int amount);` がコンパイラへ知らせる内容は？",
      choices: ["heal の使い方と型", "heal の処理本体", "実行結果"],
      answer: 0,
      explanation: "セミコロンで終わる宣言は、名前と型を知らせます。処理本体は定義に書きます。",
    },
    prompt: "`int addBonus(int score, int bonus);` を main より前に宣言し、main より後に定義してください。2つの整数を読み、合計を `score: <値>` と表示します。",
    solution: `#include <iostream>

int addBonus(int score, int bonus);

int main() {
    int score{};
    int bonus{};
    std::cin >> score >> bonus;
    std::cout << "score: " << addBonus(score, bonus) << '\\n';
    return 0;
}

int addBonus(int score, int bonus) {
    return score + bonus;
}`,
    input: "120 30\n",
    tests: [
      { input: "120 30\n", output: "score: 150" },
      { input: "0 0\n", output: "score: 0" },
      { input: "-5 5\n", output: "score: 0" },
    ],
    hiddenTests: [{ input: "-8 3\n", output: "score: -5" }],
    hints: [
      "関数の宣言は戻り値型、関数名、引数型を並べ、最後をセミコロンにします。",
      "main の前で宣言し、main の後に同じシグネチャで本体を定義します。",
      "addBonus は2つの値を足して返し、呼び出し側で戻り値を出力します。",
    ],
    debug: {
      code: "int doubleValue(int value) { return value * 2; }\nint main() { std::cout << doubleValue(4) << '\\n'; }\nint doubleValue(int value) { return value * 2; }",
      fix: "int doubleValue(int value);\nint main() { std::cout << doubleValue(4) << '\\n'; }\nint doubleValue(int value) { return value * 2; }",
      explanation: "同じ関数を同一の翻訳単位で2回定義すると再定義エラーです。先頭はセミコロンで終わる宣言にし、本体を持つ定義は1つだけ置きます。",
    },
  },
  {
    title: "ヘッダーが型と宣言を共有する",
    goal: "ヘッダーファイルに公開する宣言を書き、必要な標準ヘッダーを自分で読み込む。",
    minutes: 35,
    explanation: "ヘッダー（header, `.h` または `.hpp`）は、複数のソースファイルで共有する型や関数の宣言を置く場所です。たとえば `score.hpp` に `int addBonus(int score, int bonus);` を置き、`score.cpp` に関数定義を書きます。`main.cpp` が `#include \"score.hpp\"` を書くと、その宣言を使って呼び出しをコンパイルできます。\n\n`#include` はコンパイラの前処理で指定ファイルの内容を取り込みます。標準ライブラリには `<iostream>` や `<string>` のように山括弧を使い、自分のプロジェクトのヘッダーには通常、二重引用符を使います。使う型や関数に対応したヘッダーを明示して読み込みます。\n\nこのブラウザー課題の提出欄は現在1つの `.cpp` をコンパイルします。そのため演習では標準ヘッダーを使い、独自ヘッダーを複数ファイルでビルドする構造は説明図で扱います。",
    example: `#include <iostream>
#include <string>

std::string roomLabel(const std::string& room) {
    return "room: " + room;
}

int main() {
    const std::string room{"Boss"};
    std::cout << roomLabel(room) << '\\n';
}`,
    exampleOutput: "room: Boss",
    commonMistake: "`std::string` を使いながら `<string>` を読み込まない。別ファイルにある定義までヘッダーが自動でリンクしてくれると思い込む。",
    quiz: {
      question: "標準ライブラリの `std::string` を使うとき、対応するヘッダーは？",
      choices: ["`<string>`", "`<iostream>` だけ", "ヘッダーは不要"],
      answer: 0,
      explanation: "std::string の宣言は `<string>` で提供されます。入出力に使う `<iostream>` とは別のヘッダーです。",
    },
    prompt: "`<string>` を読み込み、`roomLabel` が部屋名を受け取って `room: <名前>` を返す関数を定義します。入力された名前を関数に渡し、結果を1行で表示してください。",
    solution: `#include <iostream>
#include <string>

std::string roomLabel(const std::string& room) {
    return "room: " + room;
}

int main() {
    std::string room;
    std::cin >> room;
    std::cout << roomLabel(room) << '\\n';
    return 0;
}`,
    input: "Boss\n",
    tests: [
      { input: "Boss\n", output: "room: Boss" },
      { input: "Lobby\n", output: "room: Lobby" },
      { input: "A\n", output: "room: A" },
    ],
    hiddenTests: [{ input: "FinalStage\n", output: "room: FinalStage" }],
    hints: [
      "文字列型を使うために `<string>` を追加します。",
      "部屋名は `const std::string&` で受け取ると、コピーせず読み取り専用にできます。",
      "関数で `room: ` と名前を結合し、main から戻り値を表示します。",
    ],
    debug: {
      code: "#include <iostream>\nstd::string roomLabel(std::string room) { return room; }",
      fix: "#include <iostream>\n#include <string>\nstd::string roomLabel(const std::string& room) { return room; }",
      explanation: "std::string の宣言を使う翻訳単位には `<string>` をインクルードします。",
    },
  },
  {
    title: "インクルードガードで重複を防ぐ",
    goal: "ヘッダーが同じ翻訳単位へ複数回取り込まれても、型の定義が重複しない仕組みを説明する。",
    minutes: 35,
    explanation: "同じヘッダーが別のヘッダー経由でも取り込まれると、同じ構造体やクラスの定義が一つの翻訳単位に複数回現れる場合があります。インクルードガード（include guard）はプリプロセッサの条件で2回目以降の内容を飛ばします。\n\n`#ifndef GAME_RULES_HPP` は、そのマクロがまだ定義されていないときだけ後続を有効にします。次に `#define GAME_RULES_HPP` を書き、ヘッダーの最後に `#endif` を置きます。マクロ名はプロジェクト内で衝突しにくい固有名にします。\n\n例の2つ目のブロックは同じヘッダーを再度取り込んだ状況を1ファイルで再現します。最初のブロックがマクロを定義したため、2つ目の構造体定義はスキップされます。",
    example: `#ifndef GAME_RULES_HPP
#define GAME_RULES_HPP
struct GameRules { int maxHp; };
#endif

#ifndef GAME_RULES_HPP
#define GAME_RULES_HPP
struct GameRules { int maxHp; };
#endif

#include <iostream>
int main() {
    const GameRules rules{100};
    std::cout << rules.maxHp << '\\n';
}`,
    exampleOutput: "100",
    commonMistake: "`#define` と `#ifndef` のマクロ名を一致させない、またはヘッダーの終わりに `#endif` を置き忘れる。ガード名を汎用的にして別のヘッダーと衝突させる。",
    quiz: {
      question: "インクルードガードの主な目的は？",
      choices: ["同じヘッダーの内容が1つの翻訳単位へ複数回入るのを防ぐ", "実行速度を上げる", "関数を自動で定義する"],
      answer: 0,
      explanation: "ガードはプリプロセッサの条件で、重複した取り込みによる再定義を防ぎます。定義そのものを生成する仕組みではありません。",
    },
    prompt: "`StageInfo` に `int number` を持たせます。`#ifndef STAGE_INFO_HPP`、`#define STAGE_INFO_HPP`、`#endif` で定義を囲み、同じガード付きブロックを2回置いてください。入力値を `stage: <値>` と表示します。",
    solution: `#ifndef STAGE_INFO_HPP
#define STAGE_INFO_HPP
struct StageInfo { int number; };
#endif

#ifndef STAGE_INFO_HPP
#define STAGE_INFO_HPP
struct StageInfo { int number; };
#endif

#include <iostream>
int main() {
    StageInfo stage{};
    std::cin >> stage.number;
    std::cout << "stage: " << stage.number << '\\n';
    return 0;
}`,
    input: "3\n",
    tests: [
      { input: "3\n", output: "stage: 3" },
      { input: "1\n", output: "stage: 1" },
      { input: "99\n", output: "stage: 99" },
    ],
    hiddenTests: [{ input: "0\n", output: "stage: 0" }],
    hints: [
      "構造体定義を `#ifndef` と `#define` の間に置きます。",
      "同じマクロ名を使ったブロックをもう一度置くと、2回目の本体は前処理で除かれます。",
      "`#endif` を両方のブロックに置き、最後に number を読み取って指定形式で出力します。",
    ],
    debug: {
      code: "#ifndef PLAYER_HPP\n#define PLAYER_HPP\nstruct Player { int hp; };\n#endif\n#ifndef PLAYER_HPP\n#define PLAYER_HPP\nstruct Player { int hp; };\n// #endif がない",
      fix: "#ifndef PLAYER_HPP\n#define PLAYER_HPP\nstruct Player { int hp; };\n#endif\n#ifndef PLAYER_HPP\n#define PLAYER_HPP\nstruct Player { int hp; };\n#endif",
      explanation: "条件付きブロックは対応する `#endif` で閉じます。ヘッダーガード全体を正しく閉じると、同じ定義の再取り込みを安全に無視できます。",
    },
  },
  {
    title: "コンパイルエラーとリンクエラーを切り分ける",
    goal: "宣言の不一致によるコンパイルエラーと、定義が見つからないリンクエラーを区別する。",
    minutes: 40,
    explanation: "ビルドは大きく、前処理、各翻訳単位のコンパイル、リンクの順に進みます。関数の宣言が見つからない、呼び出しと宣言の型が合わない、といった問題はコンパイル中に診断されます。\n\n宣言は見つかったのに、その関数を定義した翻訳単位がリンク対象にない場合は、リンカーが外部シンボルを解決できず、`unresolved external symbol` や `undefined reference` のようなリンクエラーになります。宣言に本体はないため、宣言を追加するだけではリンクエラーは直りません。定義を追加するか、定義があるソースファイルをビルドへ含めます。",
    example: `#include <iostream>

int triple(int value);

int main() {
    std::cout << triple(7) << '\\n';
}

int triple(int value) {
    return value * 3;
}`,
    exampleOutput: "21",
    commonMistake: "`undefined reference` を見て関数宣言だけを増やす。リンクエラーは、呼び出された関数の定義か、そのソースファイルがビルドに入っているかを確認する。",
    quiz: {
      question: "関数の宣言はあるが、どの翻訳単位にも定義がないとき、典型的に失敗する段階は？",
      choices: ["リンク", "入力読み取り", "プログラムの終了処理"],
      answer: 0,
      explanation: "コンパイラは宣言を見て呼び出しを翻訳できますが、リンカーが定義を見つけられないためリンクで失敗します。",
    },
    prompt: "`int heal(int hp, int amount);` を宣言し、関数の定義では `hp + amount` を返します。HPと回復量を読み、回復後のHPを表示してください。",
    solution: `#include <iostream>

int heal(int hp, int amount);

int main() {
    int hp{};
    int amount{};
    std::cin >> hp >> amount;
    std::cout << heal(hp, amount) << '\\n';
    return 0;
}

int heal(int hp, int amount) {
    return hp + amount;
}`,
    input: "40 15\n",
    tests: [
      { input: "40 15\n", output: "55" },
      { input: "0 0\n", output: "0" },
      { input: "100 20\n", output: "120" },
    ],
    hiddenTests: [{ input: "-5 5\n", output: "0" }],
    hints: [
      "宣言は main より前に置き、引数の型と順序を決めます。",
      "main から関数を呼び出した後、ファイル内に同じシグネチャの定義を置きます。",
      "定義の本体で hp と amount を足して返します。",
    ],
    debug: {
      code: "int heal(int hp, int amount);\nint main() { return heal(40, 5); }",
      fix: "int heal(int hp, int amount);\nint main() { return heal(40, 5); }\nint heal(int hp, int amount) { return hp + amount; }",
      explanation: "宣言だけでは処理本体がありません。リンク時に呼び出し先を解決できるよう、同じシグネチャの定義もリンク対象に必要です。",
    },
  },
  {
    title: "内部リンケージで実装詳細を隠す",
    goal: "複数ファイルで共有する名前と、1つのソースファイル内だけで使う名前の違いを説明する。",
    minutes: 40,
    explanation: "リンケージ（linkage）は、同じ名前が別のスコープや翻訳単位から同じ実体を指せるかに関係します。通常の名前空間スコープにある関数名は、別の翻訳単位と共有する外部リンケージを持ちます。ヘッダーに宣言し、1つの `.cpp` に定義を置く関数が典型例です。\n\nソースファイルだけで使う補助関数は、無名名前空間 `{ ... }` に置くと、その翻訳単位の内部実装として扱えます。C++ではファイルスコープの `static` 関数も内部リンケージになりますが、現代のC++では無名名前空間が意図を表しやすい方法です。\n\n内部リンケージにした関数は、別の `.cpp` から同じ名前で呼ぶための公開APIではありません。公開する関数と、実装だけの補助関数を分けると、名前の衝突と不要な依存を減らせます。",
    example: `#include <iostream>

namespace {
int clampBonus(int bonus) {
    if (bonus < 0) return 0;
    if (bonus > 20) return 20;
    return bonus;
}
}

int finalScore(int base, int bonus) {
    return base + clampBonus(bonus);
}

int main() {
    std::cout << finalScore(80, 30) << '\\n';
}`,
    exampleOutput: "100",
    commonMistake: "内部リンケージの関数をヘッダーに定義し、各翻訳単位に同じ関数本体を広げてしまう。ヘッダーには公開する宣言を置き、ファイル専用の補助関数は `.cpp` 側に置く。",
    quiz: {
      question: "1つの `.cpp` だけで使う補助関数をC++で表す方法として適切なのは？",
      choices: ["無名名前空間に定義する", "必ず `main` の中に定義する", "関数名を大文字にする"],
      answer: 0,
      explanation: "無名名前空間はその翻訳単位の内部実装を表せます。関数を main の中へ入れる必要はありません。",
    },
    prompt: "無名名前空間に `clampBonus` を定義し、bonus を0〜20の範囲に収めます。`finalScore` は base と調整済みbonusの合計を返します。2つの整数を読み、結果を表示してください。",
    solution: `#include <iostream>

namespace {
int clampBonus(int bonus) {
    if (bonus < 0) return 0;
    if (bonus > 20) return 20;
    return bonus;
}
}

int finalScore(int base, int bonus) {
    return base + clampBonus(bonus);
}

int main() {
    int base{};
    int bonus{};
    std::cin >> base >> bonus;
    std::cout << finalScore(base, bonus) << '\\n';
    return 0;
}`,
    input: "80 30\n",
    tests: [
      { input: "80 30\n", output: "100" },
      { input: "80 -5\n", output: "80" },
      { input: "10 12\n", output: "22" },
    ],
    hiddenTests: [{ input: "70 20\n", output: "90" }],
    hints: [
      "clampBonus は今回のソースファイルだけで使う補助関数です。",
      "無名名前空間に関数定義を置き、負数は0、大きすぎる値は20へ丸めます。",
      "公開関数 finalScore から clampBonus を呼び、base に結果を足します。",
    ],
    debug: {
      code: "namespace { int helper(int x) { return x * 2; } }\nint helper(int x) { return x * 3; }",
      fix: "namespace { int helper(int x) { return x * 2; } }\nint publicValue(int x) { return helper(x); }",
      explanation: "無名名前空間の helper と同じ名前の外部関数を定義すると、同じ翻訳単位内で名前が曖昧になり得ます。内部用の名前を重複させず、公開APIには別の名前を付けます。",
    },
  },
  {
    title: "翻訳単位とリンクの流れを追う",
    goal: "各 `.cpp` が独立してコンパイルされ、オブジェクトファイルがリンクされる流れを説明する。",
    minutes: 40,
    explanation: "翻訳単位（translation unit）は、`.cpp` の内容へ `#include` したファイルを前処理で展開したまとまりです。一般に `.cpp` ごとに翻訳単位ができます。ヘッダーは、それをインクルードした翻訳単位に展開されます。\n\n複数ファイルの流れは次のとおりです。\n\n`main.cpp + score.hpp → main.cpp の翻訳単位 → main.obj`\n`score.cpp + score.hpp → score.cpp の翻訳単位 → score.obj`\n`main.obj + score.obj → リンカー → 実行ファイル`\n\nヘッダーの関数宣言が呼び出し側に使い方を知らせ、`score.cpp` の定義が実体を提供します。リンカーはオブジェクトファイル間の外部シンボルを結びます。定義を含む `.cpp` をビルド対象から外すと、宣言が正しくてもリンクに失敗します。\n\n演習では1つの `.cpp` に宣言・呼び出し・定義をまとめます。複数翻訳単位へ分割したときも、それぞれの役割を同じように追えるか確認してください。",
    example: `#include <iostream>

namespace game {
int finalDamage(int attack, int defense);
}

int main() {
    std::cout << game::finalDamage(30, 8) << '\\n';
}

namespace game {
int finalDamage(int attack, int defense) {
    return attack > defense ? attack - defense : 0;
}
}`,
    exampleOutput: "22",
    commonMistake: "ヘッダーをコンパイルすれば実行ファイルが完成すると考える。ヘッダーは通常、宣言を共有します。`.cpp` を個別にコンパイルした後、必要なオブジェクトファイルをリンクします。",
    quiz: {
      question: "別の `.cpp` にある関数定義を含めて実行ファイルを作る段階は？",
      choices: ["リンク", "前処理だけ", "プログラム実行後"],
      answer: 0,
      explanation: "各翻訳単位をコンパイルしたあと、リンカーがオブジェクトファイル間の外部シンボルを解決します。",
    },
    prompt: "`namespace inventory` に `remaining(int stock, int used)` を宣言し、main の後で定義してください。使用数が在庫を超えたときは0、そうでなければ差を返します。在庫と使用数を読み、残数を表示してください。",
    solution: `#include <iostream>

namespace inventory {
int remaining(int stock, int used);
}

int main() {
    int stock{};
    int used{};
    std::cin >> stock >> used;
    std::cout << inventory::remaining(stock, used) << '\\n';
    return 0;
}

namespace inventory {
int remaining(int stock, int used) {
    return stock > used ? stock - used : 0;
}
}`,
    input: "12 5\n",
    tests: [
      { input: "12 5\n", output: "7" },
      { input: "3 8\n", output: "0" },
      { input: "0 0\n", output: "0" },
    ],
    hiddenTests: [{ input: "100 99\n", output: "1" }],
    hints: [
      "関数を `inventory` 名前空間に宣言し、呼び出し側でも名前空間を明示します。",
      "宣言の後に main が呼び出し、同じ名前空間に定義を置きます。",
      "stock が used より大きければ差を返し、それ以外は0を返します。",
    ],
    debug: {
      code: "namespace game { int score(int hp); }\nint main() { return game::score(5); }\nnamespace game { int score(int value) { return value * 2; } }",
      fix: "namespace game { int score(int hp); }\nint main() { return game::score(5); }\nnamespace game { int score(int hp) { return hp * 2; } }",
      explanation: "宣言と定義の引数名は異なっても構いませんが、引数の型・順序と戻り値の型は一致させます。レビューで同じ名前にそろえると読みやすくなります。",
    },
  },
  {
    title: "週末評価：宣言を使ったスコア集計",
    goal: "名前空間、関数宣言・定義、入力境界を組み合わせて小さなAPIを実装する。",
    minutes: 50,
    explanation: "週末課題では、スコア機能の公開APIを `namespace scoring` にまとめます。関数の宣言を main より前に置けば、呼び出し側は実装の場所に依存せず関数を利用できます。定義は後ろに分けます。\n\n複数ファイルのプロジェクトなら、宣言を `scoring.hpp`、定義を `scoring.cpp`、入力と表示を `main.cpp` に分ける形が基本です。ヘッダーには公開する関数宣言を書き、補助処理の本体はソースファイルに置きます。\n\n現在のブラウザー課題は1ファイル提出なので、ここでは同じ宣言・定義の関係を1つの翻訳単位内でテストします。分割した場合にどの名前が共有されるか、コードを読みながら説明してください。",
    example: `#include <iostream>

namespace scoring {
int total(int first, int second, int third);
int average(int first, int second, int third);
}

int main() {
    std::cout << scoring::total(70, 80, 90) << '\\n';
    std::cout << scoring::average(70, 80, 90) << '\\n';
}

namespace scoring {
int total(int first, int second, int third) {
    return first + second + third;
}
int average(int first, int second, int third) {
    return total(first, second, third) / 3;
}
}`,
    exampleOutput: "240\n80",
    commonMistake: "宣言と定義の引数順を変えたり、ヘッダーへ通常関数の定義を重複して置いたりする。公開宣言と実装の責務を分けて確認します。",
    quiz: {
      question: "複数の `.cpp` から使う `scoring::total` の宣言を共有する場所は？",
      choices: ["`scoring.hpp` のようなヘッダー", "実行ファイルの出力欄", "ローカル変数"],
      answer: 0,
      explanation: "複数の翻訳単位から使う宣言はヘッダーで共有し、通常の関数定義は1つのソースファイルに置きます。",
    },
    prompt: "3科目の点数を読み、`namespace scoring` の `total` と `average` を使って `total: <合計>` と `average: <整数平均>` を2行で表示してください。宣言は main より前、定義は main より後に置きます。点数は0〜100の整数です。",
    solution: `#include <iostream>

namespace scoring {
int total(int first, int second, int third);
int average(int first, int second, int third);
}

int main() {
    int first{};
    int second{};
    int third{};
    std::cin >> first >> second >> third;
    std::cout << "total: " << scoring::total(first, second, third) << '\\n';
    std::cout << "average: " << scoring::average(first, second, third) << '\\n';
    return 0;
}

namespace scoring {
int total(int first, int second, int third) {
    return first + second + third;
}
int average(int first, int second, int third) {
    return total(first, second, third) / 3;
}
}`,
    input: "70 80 90\n",
    tests: [
      { input: "70 80 90\n", output: "total: 240\naverage: 80" },
      { input: "0 0 0\n", output: "total: 0\naverage: 0" },
      { input: "100 50 0\n", output: "total: 150\naverage: 50" },
    ],
    hiddenTests: [{ input: "99 100 98\n", output: "total: 297\naverage: 99" }],
    hints: [
      "scoring 名前空間に total と average の宣言を2つ置きます。",
      "整数3つの入力を読み、呼び出すときは `scoring::` を付けます。",
      "total の定義は3値の和、average は total の戻り値を3で割ります。",
    ],
    debug: {
      code: "namespace scoring { int average(int a, int b, int c); }\nnamespace scoring { int average(int a, int b) { return (a + b) / 2; } }",
      fix: "namespace scoring { int average(int a, int b, int c); }\nnamespace scoring { int average(int a, int b, int c) { return (a + b + c) / 3; } }",
      explanation: "宣言と定義の引数の数と型は一致させます。3科目の平均を求める仕様なので、3つの引数を合計して3で割ります。",
    },
  },
];
