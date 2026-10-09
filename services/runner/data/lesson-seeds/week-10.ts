import type { LessonSeed } from "../lesson-source.ts";

type Draft = Omit<LessonSeed, "quiz" | "debug"> & {
  quiz: LessonSeed["quiz"];
  debug: LessonSeed["debug"];
};

const makeLesson = (draft: Draft): LessonSeed => draft;

export const week10LessonSeeds: LessonSeed[] = [
  makeLesson({
    title: "classで状態と操作をまとめる",
    goal: "クラスを独自の型として使い、データと関連する処理をまとめる。",
    minutes: 35,
    explanation: "クラス（class）は、値と関連する処理をまとめて新しい型を作ります。クラスから作った値をオブジェクト、またはインスタンスと呼びます。\n\nclass のメンバーは指定子を書くまでは private です。外部から直接扱えないデータを public の関数を通して公開すれば、利用側の操作を制限できます。struct は既定で public、class は既定で private です。\n\nこの例では hitPoints_ を直接公開せず、hitPoints() から読みます。末尾のアンダースコアはメンバー変数を見分ける命名慣習です。",
    example: '#include <iostream>\nclass Player { public: int hitPoints() const { return hitPoints_; } private: int hitPoints_{100}; };\nint main() { const Player player{}; std::cout << "hp: " << player.hitPoints() << std::endl; }\n',
    exampleOutput: "hp: 100",
    commonMistake: "状態をすべて public にする。公開操作を絞ると内部表現を変更しやすくなります。",
    quiz: { question: "class の既定アクセスは？", choices: ["private", "public", "static"], answer: 0, explanation: "class は既定で private、struct は既定で public です。" },
    prompt: "private な score_ を持つ Score クラスを作ります。set(int) で設定し、value() で読みます。整数を読み、score: <値> と表示してください。",
    solution: '#include <iostream>\nclass Score { public: void set(int value) { score_ = value; } int value() const { return score_; } private: int score_{}; };\nint main() { int input{}; std::cin >> input; Score score{}; score.set(input); std::cout << "score: " << score.value() << std::endl; return 0; }\n',
    input: "42\n",
    tests: [{ input: "42\n", output: "score: 42" }, { input: "0\n", output: "score: 0" }, { input: "-8\n", output: "score: -8" }],
    hiddenTests: [{ input: "135\n", output: "score: 135" }],
    hints: ["public と private の区画を作ります。", "set と value は public、score_ は private に置きます。", "入力値を set に渡し、value() の戻り値を表示します。"],
    debug: { code: "class Score { int value_{10}; }; int main() { Score s; return s.value_; }", fix: "class Score { public: int value() const { return value_; } private: int value_{10}; }; int main() { Score s; return s.value(); }", explanation: "value_ は private なので外から直接読めません。公開メンバー関数を通して値を読みます。" },
  }),
  makeLesson({
    title: "メンバー関数でオブジェクトの状態を変える",
    goal: "メンバー関数が呼び出し元オブジェクトの状態を変更することを確かめる。",
    minutes: 35,
    explanation: "メンバー関数は、そのクラスのオブジェクトから呼び出します。counter.add(3) は counter の値を更新します。同じ関数を別のオブジェクトから呼んでも、通常はそれぞれのメンバー変数が更新されます。\n\nオブジェクトを2つ作って別々に変更すれば、状態が混ざらないことを確認できます。関連するデータと処理をクラス内に置くと、操作の目的を追いやすくなります。",
    example: '#include <iostream>\nclass Counter { public: void add(int n) { value_ += n; } int value() const { return value_; } private: int value_{}; };\nint main() { Counter first{}, second{}; first.add(3); second.add(8); std::cout << first.value() << " " << second.value() << std::endl; }\n',
    exampleOutput: "3 8",
    commonMistake: "同じクラスのオブジェクトが一つの値を共有すると考える。通常の非 static メンバー変数はオブジェクトごとに存在します。",
    quiz: { question: "first.add(3) が変更する値は？", choices: ["first の value_", "Counter 全体の共有値", "main の戻り値"], answer: 0, explanation: "通常のメンバー関数は呼び出し元オブジェクトのメンバーを扱います。" },
    prompt: "value_、add(int)、value() を持つ Counter を作ります。2個に入力された初期値と変更量を加え、first: <値> と second: <値> を表示してください。入力は4整数です。",
    solution: '#include <iostream>\nclass Counter { public: void add(int n) { value_ += n; } int value() const { return value_; } private: int value_{}; };\nint main() { int a{}, da{}, b{}, db{}; std::cin >> a >> da >> b >> db; Counter first{}, second{}; first.add(a); first.add(da); second.add(b); second.add(db); std::cout << "first: " << first.value() << std::endl << "second: " << second.value() << std::endl; return 0; }\n',
    input: "10 5 20 -3\n",
    tests: [{ input: "10 5 20 -3\n", output: "first: 15\nsecond: 17" }, { input: "0 0 0 0\n", output: "first: 0\nsecond: 0" }, { input: "-2 7 4 6\n", output: "first: 5\nsecond: 10" }],
    hiddenTests: [{ input: "100 -40 -5 2\n", output: "first: 60\nsecond: -3" }],
    hints: ["Counter は値を一つ持ち、add のたびに更新します。", "first と second を別々に作ります。", "初期値と変更量を加え、value() を表示します。"],
    debug: { code: "void add(int amount) { value_ = amount; }", fix: "void add(int amount) { value_ += amount; }", explanation: "代入では前の状態を上書きします。加算操作なら現在値へ変更量を足します。" },
  }),
  makeLesson({
    title: "コンストラクターで有効な初期状態を作る",
    goal: "コンストラクターとメンバー初期化子リストで生成時の状態を設定する。",
    minutes: 40,
    explanation: "コンストラクターはオブジェクト生成時に呼ばれる特別なメンバー関数です。戻り値型を書かず、クラスと同じ名前を使います。引数を受け取れば必要な値をそろえてオブジェクトを作れます。\n\nメンバー初期化子リストは、関数名の後のコロンから本体の前に書きます。メンバーはクラス内で宣言された順に初期化されるため、リストも宣言順にそろえると読みやすくなります。本体で代入する方法と異なり、初期化子リストなら最初から指定した値でメンバーを構築できます。",
    example: '#include <iostream>\n#include <string>\nclass Weapon { public: Weapon(const std::string& n, int p) : name_(n), power_(p) {} const std::string& name() const { return name_; } int power() const { return power_; } private: std::string name_; int power_{}; };\nint main() { const Weapon w{"Iron", 12}; std::cout << w.name() << ": " << w.power() << std::endl; }\n',
    exampleOutput: "Iron: 12",
    commonMistake: "コンストラクターを戻り値型付きの関数として書く、または初期化順がメンバー宣言順と違うことを見落とす。",
    quiz: { question: "Weapon クラスのコンストラクター名は？", choices: ["Weapon", "void", "createWeapon"], answer: 0, explanation: "コンストラクターはクラスと同じ名前で、戻り値型を書きません。" },
    prompt: "name と attack を private に持つ Weapon を作ります。コンストラクターの初期化子リストで設定し、入力された名前と攻撃力を weapon: <名前>、attack: <値> と表示してください。",
    solution: '#include <iostream>\n#include <string>\nclass Weapon { public: Weapon(const std::string& n, int a) : name_(n), attack_(a) {} const std::string& name() const { return name_; } int attack() const { return attack_; } private: std::string name_; int attack_{}; };\nint main() { std::string n; int a{}; std::cin >> n >> a; const Weapon w{n, a}; std::cout << "weapon: " << w.name() << std::endl << "attack: " << w.attack() << std::endl; return 0; }\n',
    input: "Bronze 9\n",
    tests: [{ input: "Bronze 9\n", output: "weapon: Bronze\nattack: 9" }, { input: "Laser 120\n", output: "weapon: Laser\nattack: 120" }, { input: "Stick 0\n", output: "weapon: Stick\nattack: 0" }],
    hiddenTests: [{ input: "Claw 37\n", output: "weapon: Claw\nattack: 37" }],
    hints: ["Weapon と同じ名前の関数をクラス内に書きます。", "引数をコロンの後で name_ と attack_ に対応させます。", "入力2値で Weapon を初期化します。"],
    debug: { code: "Weapon(std::string name, int power) { name_ = name; power_ = power; }", fix: "Weapon(const std::string& name, int power) : name_(name), power_(power) {}", explanation: "初期化子リストなら、本体へ入る前にメンバーを初期化できます。" },
  }),
  makeLesson({
    title: "アクセス制御で不変条件を守る",
    goal: "private な状態を公開操作で変更し、無効な操作をクラス内で拒否する。",
    minutes: 40,
    explanation: "データを private にすると、呼び出し側が値を無制限に変更するのを防げます。public な操作を通して状態を変えると、クラス自身が入力を検査できます。\n\n常に成り立ってほしい条件を不変条件（invariant）と呼びます。在庫数を負にしない、HPを最大値より大きくしない、といった条件です。条件を呼び出し側に任せずクラス内で守ると、利用箇所が変わっても状態を保ちやすくなります。",
    example: `#include <iostream>

class Inventory {
public:
    explicit Inventory(int n) : stock_(n < 0 ? 0 : n) {}

    bool remove(int n) {
        if (n < 0 || n > stock_) return false;
        stock_ -= n;
        return true;
    }

    int stock() const { return stock_; }

private:
    int stock_{};
};

int main() {
    Inventory items{5};
    const bool ok = items.remove(2);
    std::cout << (ok ? "ok " : "rejected ") << items.stock() << std::endl;
}`,
    exampleOutput: "ok 3",
    commonMistake: "在庫を public にして呼び出し側で毎回確認する。検査を忘れると不正状態を作れます。",
    quiz: { question: "在庫を超える要求を受けたとき、適切な動作は？", choices: ["失敗を返し在庫を保つ", "在庫を負数にする", "オブジェクトを作り直す"], answer: 0, explanation: "不変条件を守るため、操作を拒否して既存状態を保ちます。" },
    prompt: "private な stock_、remove(int)、stock() を持つ Inventory を作ります。初期在庫と要求数を読みます。成功時は ok <残数>、負数または在庫超過なら rejected <残数> と表示してください。",
    solution: '#include <iostream>\nclass Inventory { public: explicit Inventory(int n) : stock_(n < 0 ? 0 : n) {} bool remove(int n) { if (n < 0 || n > stock_) return false; stock_ -= n; return true; } int stock() const { return stock_; } private: int stock_{}; };\nint main() { int n{}, request{}; std::cin >> n >> request; Inventory items{n}; bool ok = items.remove(request); std::cout << (ok ? "ok " : "rejected ") << items.stock() << std::endl; return 0; }\n',
    input: "12 5\n",
    tests: [{ input: "12 5\n", output: "ok 7" }, { input: "3 8\n", output: "rejected 3" }, { input: "10 -2\n", output: "rejected 10" }],
    hiddenTests: [{ input: "0 0\n", output: "ok 0" }],
    hints: ["stock_ を private にし、コンストラクターで初期値を受け取ります。", "remove の先頭で負数と在庫超過を調べます。", "成功したときだけ在庫を減らし、結果と残数を表示します。"],
    debug: { code: "bool remove(int n) { stock_ -= n; return true; }", fix: "bool remove(int n) {\n    if (n < 0 || n > stock_) return false;\n    stock_ -= n;\n    return true;\n}", explanation: "先に減算すると無効な要求で不正な残数になります。成功時だけ状態を変えます。" },
  }),
  makeLesson({
    title: "constメンバー関数で読み取りを表す",
    goal: "状態を変えないメンバー関数に const を付け、const オブジェクトから呼び出す。",
    minutes: 35,
    explanation: "メンバー関数の閉じ括弧の後ろに const を付けると、通常のメンバー変数を書き換えないことを表します。引数を const にする記法とは位置が異なります。\n\nconst オブジェクトから呼び出せるのは const メンバー関数です。読み取り関数に const を付ければ、読み取り専用であることを型システムが確認します。変更操作と読み取り操作を分けると、関数の型から意図を読み取れます。",
    example: '#include <iostream>\n#include <string>\nclass Player { public: Player(const std::string& n, int h) : name_(n), hp_(h) {} const std::string& name() const { return name_; } bool alive() const { return hp_ > 0; } private: std::string name_; int hp_{}; };\nint main() { const Player p{"Luna", 0}; std::cout << p.name() << (p.alive() ? " alive" : " out") << std::endl; }\n',
    exampleOutput: "Luna out",
    commonMistake: "読み取り関数に const を付け忘れて const オブジェクトから呼べなくする。または状態を変更する関数に const を付ける。",
    quiz: { question: "メンバー関数末尾の const が表すものは？", choices: ["通常のメンバー状態を変更しない", "戻り値が必ず0", "オブジェクトを破棄する"], answer: 0, explanation: "末尾の const は通常の状態変更をしないことを表します。" },
    prompt: "name_ と hp_ を持つ Player を作ります。コンストラクターで初期化し、name() と alive() を const メンバー関数にします。名前とHPを読み、<名前>: alive または <名前>: out と表示してください。",
    solution: '#include <iostream>\n#include <string>\nclass Player { public: Player(const std::string& n, int h) : name_(n), hp_(h) {} const std::string& name() const { return name_; } bool alive() const { return hp_ > 0; } private: std::string name_; int hp_{}; };\nint main() { std::string n; int h{}; std::cin >> n >> h; const Player p{n, h}; std::cout << p.name() << (p.alive() ? ": alive" : ": out") << std::endl; return 0; }\n',
    input: "Mira 80\n",
    tests: [{ input: "Mira 80\n", output: "Mira: alive" }, { input: "Ghost 0\n", output: "Ghost: out" }, { input: "Slime -2\n", output: "Slime: out" }],
    hiddenTests: [{ input: "Knight 1\n", output: "Knight: alive" }],
    hints: ["name と hp を private にし、コンストラクターで設定します。", "name() と alive() の括弧の後ろに const を付けます。", "const Player を作り、読み取り関数で出力します。"],
    debug: { code: "bool alive() { return hp_ > 0; }", fix: "bool alive() const {\n    return hp_ > 0;\n}", explanation: "const オブジェクトから呼ぶ読み取り関数には、メンバー関数末尾の const が必要です。" },
  }),
  makeLesson({
    title: "オーバーロードと委譲コンストラクター",
    goal: "複数のコンストラクターを使い分け、共通の初期化を一箇所にまとめる。",
    minutes: 40,
    explanation: "同じクラスに引数の数や型が異なる複数のコンストラクターを定義できます。呼び出し時に引数に合うものが選ばれます。\n\nあるコンストラクターから同じクラスの別コンストラクターを呼ぶ構文を委譲コンストラクターと呼びます。整数1個の版から名前と回復量を受け取る版へ委譲すれば、共通の初期化を重複させずに済みます。\n\n1引数コンストラクターに explicit を付けると、整数から Potion への意図しない暗黙変換を防げます。",
    example: '#include <iostream>\n#include <string>\nclass Potion { public: explicit Potion(int n) : Potion("Potion", n) {} Potion(const std::string& name, int n) : name_(name), amount_(n) {} const std::string& name() const { return name_; } int amount() const { return amount_; } private: std::string name_; int amount_{}; };\nint main() { const Potion p{25}; std::cout << p.name() << ": " << p.amount() << std::endl; }\n',
    exampleOutput: "Potion: 25",
    commonMistake: "委譲をコンストラクター本体に書き、一時オブジェクトを作るだけで終わる。委譲先は初期化子リストに書きます。",
    quiz: { question: "Potion(int n) : Potion(\"Potion\", n) {} は何をする？", choices: ["同じクラスの別コンストラクターへ委譲する", "Potion を継承する", "n を static にする"], answer: 0, explanation: "クラス名を初期化子として書くと、同じクラスの別コンストラクターを呼びます。" },
    prompt: "Potion に2種類のコンストラクターを作ります。整数1つなら名前を Potion とし、名前と回復量なら両方を保存します。1引数版から2引数版へ委譲してください。入力が default なら回復量、custom なら名前と回復量が続きます。<名前>: <回復量> を表示します。",
    solution: '#include <iostream>\n#include <string>\nclass Potion { public: explicit Potion(int n) : Potion("Potion", n) {} Potion(const std::string& name, int n) : name_(name), amount_(n) {} const std::string& name() const { return name_; } int amount() const { return amount_; } private: std::string name_; int amount_{}; };\nint main() { std::string mode; std::cin >> mode; if (mode == "default") { int n{}; std::cin >> n; const Potion p{n}; std::cout << p.name() << ": " << p.amount() << std::endl; } else { std::string name; int n{}; std::cin >> name >> n; const Potion p{name, n}; std::cout << p.name() << ": " << p.amount() << std::endl; } return 0; }\n',
    input: "default 20\n",
    tests: [{ input: "default 20\n", output: "Potion: 20" }, { input: "custom Mega 60\n", output: "Mega: 60" }, { input: "custom Tiny 1\n", output: "Tiny: 1" }],
    hiddenTests: [{ input: "default 0\n", output: "Potion: 0" }],
    hints: ["1引数と2引数のコンストラクターを定義します。", "1引数版の初期化子リストから Potion(\"Potion\", n) を呼びます。", "mode に応じて対応するコンストラクターを選びます。"],
    debug: { code: "Potion(int n) { Potion(\"Potion\", n); }", fix: "explicit Potion(int n) : Potion(\"Potion\", n) {}", explanation: "本体で別の Potion を作っても現在のオブジェクトは初期化されません。委譲は初期化子リストに書きます。" },
  }),
  makeLesson({
    title: "総合：状態を守るCharacterクラス",
    goal: "private 状態、コンストラクター、const アクセサー、妥当性を守る操作を組み合わせる。",
    minutes: 50,
    explanation: "Character に名前、最大HP、現在HPをまとめます。生成時にHP範囲を整え、damage と heal を通して状態を変更します。呼び出し側が現在HPを直接書き換えられないため、操作のたびに範囲を守れます。\n\nメンバー変数はクラス内の宣言順に初期化されるため、初期化子リストも name_、max_、hp_ の順にします。最大HPは1以上、現在HPは0以上最大HP以下という条件を生成時と各操作で保ちます。\n\n読み取り関数は const、状態変更関数は非 const に分けます。呼び出し側はクラスの公開操作を通してキャラクターを扱います。",
    example: '#include <iostream>\n#include <string>\nclass Character { public: Character(const std::string& n, int m, int h) : name_(n), max_(m > 0 ? m : 1), hp_(h < 0 ? 0 : (h > max_ ? max_ : h)) {} void damage(int n) { if (n > 0) hp_ = n >= hp_ ? 0 : hp_ - n; } void heal(int n) { if (n > 0) hp_ = n > max_ - hp_ ? max_ : hp_ + n; } const std::string& name() const { return name_; } int hp() const { return hp_; } int maxHp() const { return max_; } private: std::string name_; int max_{}; int hp_{}; };\nint main() { Character c{"Mira", 100, 80}; c.damage(30); c.heal(10); std::cout << c.name() << std::endl << "hp: " << c.hp() << "/" << c.maxHp() << std::endl; }\n',
    exampleOutput: "Mira\nhp: 60/100",
    commonMistake: "HPの範囲チェックを呼び出し側へ散らす。または回復量を足してから上限を調べ、整数オーバーフローの余地を作る。",
    quiz: { question: "HP範囲を守る責任を置く場所は？", choices: ["Character のコンストラクターと公開操作", "main の表示文だけ", "コメント"], answer: 0, explanation: "クラスが生成時と変更時に条件を守れば、利用箇所が変わっても不変条件を保てます。" },
    prompt: "name、maxHp、hp を持つ Character を実装します。maxHp は1以上、hp は0〜maxHpへ補正します。damage はHPを0で止め、heal は最大HPで止めます。名前、最大HP、初期HP、ダメージ、回復量を読み、name: <名前> と hp: <現在>/<最大> を表示してください。",
    solution: '#include <iostream>\n#include <string>\nclass Character { public: Character(const std::string& n, int m, int h) : name_(n), max_(m > 0 ? m : 1), hp_(h < 0 ? 0 : (h > max_ ? max_ : h)) {} void damage(int n) { if (n > 0) hp_ = n >= hp_ ? 0 : hp_ - n; } void heal(int n) { if (n > 0) hp_ = n > max_ - hp_ ? max_ : hp_ + n; } const std::string& name() const { return name_; } int hp() const { return hp_; } int maxHp() const { return max_; } private: std::string name_; int max_{}; int hp_{}; };\nint main() { std::string name; int m{}, h{}, d{}, recovery{}; std::cin >> name >> m >> h >> d >> recovery; Character c{name, m, h}; c.damage(d); c.heal(recovery); std::cout << "name: " << c.name() << std::endl << "hp: " << c.hp() << "/" << c.maxHp() << std::endl; return 0; }\n',
    input: "Mira 100 80 30 10\n",
    tests: [{ input: "Mira 100 80 30 10\n", output: "name: Mira\nhp: 60/100" }, { input: "Slime 40 10 50 12\n", output: "name: Slime\nhp: 12/40" }, { input: "Knight 60 80 0 20\n", output: "name: Knight\nhp: 60/60" }],
    hiddenTests: [{ input: "Ghost 30 15 15 0\n", output: "name: Ghost\nhp: 0/30" }],
    hints: ["メンバーを private にし、生成時にHPを範囲内に整えます。", "damage は下限0、heal は maxHp - hp と比較して上限を守ります。", "変更後は const アクセサーで名前と最終HPを表示します。"],
    debug: { code: "void heal(int n) { hp_ += n; }", fix: "void heal(int n) {\n    if (n <= 0) return;\n    hp_ = n > max_ - hp_ ? max_ : hp_ + n;\n}", explanation: "無条件の加算は負数や最大HP超過を許します。正の量だけ受け付け、加算前に上限を確認します。" },
  }),
];
