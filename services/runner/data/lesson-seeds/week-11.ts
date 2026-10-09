import type { LessonSeed } from "../lesson-source.ts";

type Draft = Omit<LessonSeed, "quiz" | "debug"> & {
  quiz: LessonSeed["quiz"];
  debug: LessonSeed["debug"];
};

const makeLesson = (draft: Draft): LessonSeed => draft;

export const week11LessonSeeds: LessonSeed[] = [
  makeLesson({
    title: "デストラクタとスコープの寿命",
    goal: "自動変数がスコープを離れるときにデストラクタが呼ばれることを確認する。",
    minutes: 35,
    explanation: "デストラクタはオブジェクトの寿命が終わるときに呼ばれる特別なメンバー関数です。名前はクラス名の前に `~` を付け、引数と戻り値を持ちません。\n\n関数内で作った自動変数は、宣言されたブロックを抜けると破棄されます。コンストラクタで準備した状態をデストラクタで片付けると、開始と終了をオブジェクトの寿命に結び付けられます。\n\nこの仕組みを利用する設計を RAII と呼びます。デストラクタを直接呼ぶのではなく、オブジェクトのスコープを終えて通常の破棄を行います。",
    example: `#include <iostream>
#include <string>

class Guard {
public:
    explicit Guard(const std::string& name) : name_(name) {
        std::cout << "enter " << name_ << std::endl;
    }

    ~Guard() {
        std::cout << "leave " << name_ << std::endl;
    }

private:
    std::string name_;
};

int main() {
    Guard guard{"lesson"};
    std::cout << "inside" << std::endl;
}`,
    exampleOutput: "enter lesson\ninside\nleave lesson",
    commonMistake: "デストラクタを自分で呼び、同じオブジェクトを二度破棄する。通常はスコープ終了に任せます。",
    quiz: { question: "ローカルオブジェクトのデストラクタが呼ばれる通常のタイミングは？", choices: ["宣言したブロックを抜けるとき", "次の入力を読むとき", "メンバー関数を定義したとき"], answer: 0, explanation: "自動変数はスコープを離れると自動的に破棄されます。" },
    prompt: "名前を保存する Guard を作ります。構築時に `start <名前>`、破棄時に `finish <名前>` を表示してください。名前を1語読み、Guard の内側で `work <名前>` を表示します。",
    solution: `#include <iostream>
#include <string>

class Guard {
public:
    explicit Guard(const std::string& name) : name_(name) {
        std::cout << "start " << name_ << std::endl;
    }

    ~Guard() {
        std::cout << "finish " << name_ << std::endl;
    }

    const std::string& name() const { return name_; }

private:
    std::string name_;
};

int main() {
    std::string name;
    std::cin >> name;
    Guard guard{name};
    std::cout << "work " << guard.name() << std::endl;
    return 0;
}`,
    input: "compile\n",
    tests: [
      { input: "compile\n", output: "start compile\nwork compile\nfinish compile" },
      { input: "lesson\n", output: "start lesson\nwork lesson\nfinish lesson" },
      { input: "session\n", output: "start session\nwork session\nfinish session" },
    ],
    hiddenTests: [{ input: "scope\n", output: "start scope\nwork scope\nfinish scope" }],
    hints: ["Guard に名前を保存するメンバー変数を用意します。", "コンストラクタと `~Guard()` の両方で名前を表示します。", "main のローカル変数として作り、最後はスコープ終了で破棄します。"],
    debug: { code: "~Guard() { std::cout << name_; }", fix: "~Guard() { std::cout << \"finish \" << name_ << std::endl; }", explanation: "破棄の順序は合っています。表示形式を課題の指定どおりに整えます。" },
  }),
  makeLesson({
    title: "同じスコープでは逆順に破棄する",
    goal: "同じブロックで作った複数のオブジェクトが宣言の逆順に破棄されることを確かめる。",
    minutes: 35,
    explanation: "同じスコープに複数の自動変数を宣言すると、後から構築されたオブジェクトから先に破棄されます。最後に作ったものから片付けると、後のオブジェクトが先のオブジェクトを使っていても依存関係を保ちやすくなります。\n\n内側のブロックを抜けると、そのブロックのオブジェクトだけが先に破棄されます。外側のオブジェクトは外側のスコープが終わるまで残ります。",
    example: `#include <iostream>
#include <string>

class Marker {
public:
    explicit Marker(const std::string& name) : name_(name) {}
    ~Marker() { std::cout << "destroy " << name_ << std::endl; }

private:
    std::string name_;
};

int main() {
    Marker first{"first"};
    {
        Marker second{"second"};
        std::cout << "middle" << std::endl;
    }
    Marker third{"third"};
    std::cout << "done" << std::endl;
}`,
    exampleOutput: "middle\ndestroy second\ndone\ndestroy third\ndestroy first",
    commonMistake: "変数名の並びやクラスの定義順で破棄されると考える。実際は各スコープでの構築順を見ます。",
    quiz: { question: "first、second の順に作った同一スコープのオブジェクトはどちらが先に破棄される？", choices: ["second", "first", "同時で順序はない"], answer: 0, explanation: "構築の逆順なので、後に作った second が先です。" },
    prompt: "Log のデストラクタで `destroy <名前>` を表示します。2つの名前を読み、first、second の順に作ります。`body` を表示した後、破棄メッセージが逆順になることを確認してください。",
    solution: `#include <iostream>
#include <string>

class Log {
public:
    explicit Log(const std::string& name) : name_(name) {}
    ~Log() { std::cout << "destroy " << name_ << std::endl; }

private:
    std::string name_;
};

int main() {
    std::string firstName;
    std::string secondName;
    std::cin >> firstName >> secondName;
    Log first{firstName};
    Log second{secondName};
    std::cout << "body" << std::endl;
    return 0;
}`,
    input: "alpha beta\n",
    tests: [
      { input: "alpha beta\n", output: "body\ndestroy beta\ndestroy alpha" },
      { input: "outer inner\n", output: "body\ndestroy inner\ndestroy outer" },
      { input: "one two\n", output: "body\ndestroy two\ndestroy one" },
    ],
    hiddenTests: [{ input: "first last\n", output: "body\ndestroy last\ndestroy first" }],
    hints: ["Log に名前を保存します。", "デストラクタはその Log の name_ を表示します。", "first を宣言してから second を宣言し、その後に body を出力します。"],
    debug: { code: "~Log() { std::cout << name_ << std::endl; }", fix: "~Log() { std::cout << \"destroy \" << name_ << std::endl; }", explanation: "破棄順は逆順になります。各メッセージに `destroy ` の接頭辞も付けます。" },
  }),
  makeLesson({
    title: "メンバーオブジェクトも寿命に従う",
    goal: "包含するオブジェクトのデストラクタとメンバーの破棄順を説明する。",
    minutes: 40,
    explanation: "クラスが別のクラスのオブジェクトをメンバーとして持つ形を合成と呼びます。外側のオブジェクトを破棄すると、まず外側のデストラクタ本体が実行され、その後メンバーが宣言と逆の順序で破棄されます。\n\nコンストラクタではメンバーが宣言順に初期化されます。破棄はその逆順です。メンバー同士が依存する場合は、宣言順と破棄順の両方を考慮します。",
    example: `#include <iostream>
#include <string>

class Part {
public:
    explicit Part(const std::string& name) : name_(name) {}
    ~Part() { std::cout << "destroy " << name_ << std::endl; }

private:
    std::string name_;
};

class Machine {
public:
    ~Machine() { std::cout << "destroy machine" << std::endl; }

private:
    Part engine_{"engine"};
    Part battery_{"battery"};
};

int main() {
    Machine machine{};
    std::cout << "running" << std::endl;
}`,
    exampleOutput: "running\ndestroy machine\ndestroy battery\ndestroy engine",
    commonMistake: "外側のデストラクタ本体より先にメンバーが破棄されると思い込む。メンバーは本体の実行後です。",
    quiz: { question: "engine_、battery_ の順で宣言したとき、外側のデストラクタ本体の後にどちらを先に破棄する？", choices: ["battery_", "engine_", "外側のクラス"], answer: 0, explanation: "メンバーは宣言順の逆、battery_ から破棄されます。" },
    prompt: "Part は破棄時に `part <名前>`、Vehicle はデストラクタ本体で `vehicle` を表示します。エンジン名と車輪名を読み、メンバーを engine、wheel の順に宣言してください。走行メッセージの後の終了順を確認します。",
    solution: `#include <iostream>
#include <string>

class Part {
public:
    explicit Part(const std::string& name) : name_(name) {}
    ~Part() { std::cout << "part " << name_ << std::endl; }

private:
    std::string name_;
};

class Vehicle {
public:
    Vehicle(const std::string& engine, const std::string& wheel)
        : engine_(engine), wheel_(wheel) {}
    ~Vehicle() { std::cout << "vehicle" << std::endl; }

private:
    Part engine_;
    Part wheel_;
};

int main() {
    std::string engine;
    std::string wheel;
    std::cin >> engine >> wheel;
    Vehicle vehicle{engine, wheel};
    std::cout << "drive" << std::endl;
    return 0;
}`,
    input: "motor rubber\n",
    tests: [
      { input: "motor rubber\n", output: "drive\nvehicle\npart rubber\npart motor" },
      { input: "electric tire\n", output: "drive\nvehicle\npart tire\npart electric" },
      { input: "engine wheel\n", output: "drive\nvehicle\npart wheel\npart engine" },
    ],
    hiddenTests: [{ input: "core outer\n", output: "drive\nvehicle\npart outer\npart core" }],
    hints: ["Part に名前を保存し、破棄時の表示を実装します。", "Vehicle のデストラクタ本体はメンバーの破棄より先に動きます。", "engine_ を先に宣言し wheel_ を後に宣言すると、wheel_ が先に破棄されます。"],
    debug: { code: "~Vehicle() { std::cout << \"vehicle\" << std::endl; std::cout << \"part engine\" << std::endl; }", fix: "~Vehicle() { std::cout << \"vehicle\" << std::endl; }", explanation: "メンバーの破棄はVehicle自身が手作業で行いません。デストラクタ本体の後に自動で逆順に破棄されます。" },
  }),
  makeLesson({
    title: "RAIIでファイルを確実に閉じる",
    goal: "ファイルストリームのスコープ終了がリソース解放につながることを実際に確かめる。",
    minutes: 40,
    explanation: "ファイルやロックなどのリソースは、使い始めた後に確実な解放が必要です。標準ライブラリの `std::ofstream` はファイルを開き、オブジェクトの破棄時に閉じます。\n\nファイルストリームを短いブロック内で使うと、そのブロックを抜けた時点でファイルが閉じます。閉じた後に読み直す実験を通じて、スコープとリソースの寿命が結び付く様子を確かめます。\n\nファイルを開けない場合など、外部環境による失敗もありえます。実務コードではストリームの状態を確認し、成功・失敗を区別します。",
    example: `#include <fstream>
#include <iostream>
#include <string>

int main() {
    {
        std::ofstream output{"sample.txt"};
        output << "saved text";
    }

    std::ifstream input{"sample.txt"};
    std::string text;
    std::getline(input, text);
    std::cout << text << std::endl;
}`,
    exampleOutput: "saved text",
    commonMistake: "ファイルが閉じる前に別のストリームから読み、書き込み完了を前提にする。スコープを閉じてから確認します。",
    quiz: { question: "std::ofstream のローカル変数を含むブロックを抜けると通常どうなる？", choices: ["ストリームのデストラクタが動きファイルが閉じる", "ファイルが必ず削除される", "プログラム全体が終了する"], answer: 0, explanation: "ストリームの寿命が終わると、そのデストラクタが管理中のファイルを閉じます。" },
    prompt: "入力された1行を `note.txt` に書き込みます。ofstream を内側のスコープで使い、スコープを抜けた後に ifstream で同じファイルを読み直します。`saved: <内容>` を表示してください。",
    solution: `#include <fstream>
#include <iostream>
#include <string>

int main() {
    std::string text;
    std::getline(std::cin, text);
    {
        std::ofstream output{"note.txt"};
        if (!output) return 1;
        output << text;
    }

    std::ifstream input{"note.txt"};
    if (!input) return 1;
    std::string saved;
    std::getline(input, saved);
    std::cout << "saved: " << saved << std::endl;
    return 0;
}`,
    input: "resource closed\n",
    tests: [
      { input: "resource closed\n", output: "saved: resource closed" },
      { input: "file lifetime\n", output: "saved: file lifetime" },
      { input: "RAII works\n", output: "saved: RAII works" },
    ],
    hiddenTests: [{ input: "scope exit\n", output: "saved: scope exit" }],
    hints: ["入力は getline で1行読みます。", "ofstream を波括弧の内側で作り、行を書き込みます。", "そのブロックの後に ifstream で読み、保存内容を表示します。"],
    debug: { code: "std::ofstream output{\"note.txt\"}; output << text; std::ifstream input{\"note.txt\"};", fix: "{ std::ofstream output{\"note.txt\"}; output << text; } std::ifstream input{\"note.txt\"};", explanation: "書き込み用ストリームを内側のスコープで閉じてから、読み込み用ストリームを開きます。" },
  }),
  makeLesson({
    title: "Rule of Zeroで標準ライブラリに任せる",
    goal: "所有するメンバーが自分で寿命管理する型では、独自デストラクタを避ける理由を説明する。",
    minutes: 35,
    explanation: "`std::string` のようにリソースを管理する標準ライブラリ型をメンバーに持たせると、その型自身がコピーや破棄を正しく処理します。\n\n自分のクラスがこうしたメンバーだけを組み合わせているなら、デストラクタを手書きしなくてもコンパイラが生成する処理を利用できます。この方針を Rule of Zero と呼びます。\n\n独自デストラクタだけを書くと、コピーや代入時の扱いを別途考えなければならない場合があります。必要な処理がメンバー型ですでに実装されているかを先に確認します。",
    example: `#include <iostream>
#include <string>

class Profile {
public:
    Profile(const std::string& name, int level) : name_(name), level_(level) {}
    const std::string& name() const { return name_; }
    int level() const { return level_; }

private:
    std::string name_;
    int level_{};
};

int main() {
    Profile original{"Mira", 5};
    Profile copy = original;
    std::cout << copy.name() << " " << copy.level() << std::endl;
}`,
    exampleOutput: "Mira 5",
    commonMistake: "std::string の内部メモリを手動で解放する。所有する標準ライブラリ型にはその責任がすでにあります。",
    quiz: { question: "std::string をメンバーに持つ単純なクラスで Rule of Zero を使う利点は？", choices: ["コピーや破棄の管理を標準ライブラリとコンパイラに任せられる", "デストラクタが一度も呼ばれなくなる", "全メンバーが自動的にpublicになる"], answer: 0, explanation: "管理済みのメンバーを使うと、所有権処理を重複実装せずに済みます。" },
    prompt: "Record は名前と点数を保存します。独自デストラクタを書かずに実装し、Record をコピーして元とコピーの両方の内容を表示してください。入力は名前と点数です。",
    solution: `#include <iostream>
#include <string>

class Record {
public:
    Record(const std::string& name, int score) : name_(name), score_(score) {}
    const std::string& name() const { return name_; }
    int score() const { return score_; }

private:
    std::string name_;
    int score_{};
};

int main() {
    std::string name;
    int score{};
    std::cin >> name >> score;
    Record original{name, score};
    Record copy = original;
    std::cout << "original: " << original.name() << " " << original.score() << std::endl;
    std::cout << "copy: " << copy.name() << " " << copy.score() << std::endl;
    return 0;
}`,
    input: "Mira 88\n",
    tests: [
      { input: "Mira 88\n", output: "original: Mira 88\ncopy: Mira 88" },
      { input: "Rin 0\n", output: "original: Rin 0\ncopy: Rin 0" },
      { input: "Kai -4\n", output: "original: Kai -4\ncopy: Kai -4" },
    ],
    hiddenTests: [{ input: "Unit 100\n", output: "original: Unit 100\ncopy: Unit 100" }],
    hints: ["Record は std::string と int をメンバーにします。", "コンストラクタと読み取り関数だけを定義し、デストラクタは追加しません。", "`Record copy = original;` でコピーし、両方のアクセサーを表示します。"],
    debug: { code: "~Record() { name_.clear(); }", fix: "class Record { std::string name_; int score_{}; };", explanation: "std::string は自分の寿命終了時に内部資源を解放します。手動で変更するデストラクタは不要です。" },
  }),
  makeLesson({
    title: "一時オブジェクトの寿命を読む",
    goal: "一時オブジェクトが作られる場所と破棄される位置を出力から特定する。",
    minutes: 35,
    explanation: "名前付きのローカルオブジェクトはスコープの終わりまで残ります。一方、一時オブジェクトは通常、それを含む式の評価が終わる全式の末尾で破棄されます。\n\n破棄ログを出すと、スコープ内で名前付きオブジェクトが残っている間に、一時オブジェクトだけが早く破棄されることを観察できます。寿命の範囲を推測ではなく、構築場所とスコープから追います。",
    example: `#include <iostream>
#include <string>

class Trace {
public:
    explicit Trace(const std::string& label) : label_(label) {
        std::cout << "create " << label_ << std::endl;
    }
    ~Trace() { std::cout << "destroy " << label_ << std::endl; }

private:
    std::string label_;
};

int main() {
    Trace named{"named"};
    Trace{"temporary"};
    std::cout << "after expression" << std::endl;
}`,
    exampleOutput: "create named\ncreate temporary\ndestroy temporary\nafter expression\ndestroy named",
    commonMistake: "一時オブジェクトも名前付き変数と同じブロック末尾まで残ると思う。式の末尾で破棄されます。",
    quiz: { question: "`Trace{\"temporary\"};` の一時オブジェクトは通常いつ破棄される？", choices: ["その式の末尾", "main の開始前", "次に作るオブジェクトの破棄後"], answer: 0, explanation: "名前を付けていない一時オブジェクトは、通常その全式の末尾で寿命を終えます。" },
    prompt: "Trace は構築時に `create <名前>`、破棄時に `destroy <名前>` を表示します。名前付きオブジェクトを作り、次に一時オブジェクトを一つ作ってから `after` を表示してください。入力は名前付きオブジェクトの名前です。",
    solution: `#include <iostream>
#include <string>

class Trace {
public:
    explicit Trace(const std::string& name) : name_(name) {
        std::cout << "create " << name_ << std::endl;
    }
    ~Trace() { std::cout << "destroy " << name_ << std::endl; }

private:
    std::string name_;
};

int main() {
    std::string name;
    std::cin >> name;
    Trace named{name};
    Trace{"temporary"};
    std::cout << "after" << std::endl;
    return 0;
}`,
    input: "named\n",
    tests: [
      { input: "named\n", output: "create named\ncreate temporary\ndestroy temporary\nafter\ndestroy named" },
      { input: "outer\n", output: "create outer\ncreate temporary\ndestroy temporary\nafter\ndestroy outer" },
      { input: "object\n", output: "create object\ncreate temporary\ndestroy temporary\nafter\ndestroy object" },
    ],
    hiddenTests: [{ input: "scope\n", output: "create scope\ncreate temporary\ndestroy temporary\nafter\ndestroy scope" }],
    hints: ["Trace のコンストラクタとデストラクタに別のメッセージを置きます。", "名前付き変数の後に `Trace{\"temporary\"};` を書きます。", "一時オブジェクトの破棄メッセージは after より前に出ます。"],
    debug: { code: "Trace temporary{\"temporary\"};", fix: "Trace{\"temporary\"};", explanation: "変数名を付けると一時オブジェクトではなく名前付きオブジェクトになり、スコープ末尾まで残ります。" },
  }),
  makeLesson({
    title: "統合：寿命に沿って状態を管理する",
    goal: "private状態、コンストラクタ、変更操作、constアクセサー、デストラクタを一つのクラスにまとめる。",
    minutes: 50,
    explanation: "オブジェクトの寿命は、状態の開始から片付けまでを一貫して考える境界です。コンストラクタで初期状態を整え、公開操作で状態を変更し、constメンバー関数で読み取り、デストラクタで終了を示せます。\n\nこの課題では Ticket が残り回数を保持します。使用回数を負にせず、0を下回らないよう制限します。スコープを抜けると終了ログを一度だけ出します。",
    example: `#include <iostream>
#include <string>

class Ticket {
public:
    Ticket(const std::string& name, int count)
        : name_(name), remaining_(count > 0 ? count : 0) {}
    ~Ticket() { std::cout << "close " << name_ << std::endl; }

    void use(int count) {
        if (count > 0) remaining_ = count >= remaining_ ? 0 : remaining_ - count;
    }

    int remaining() const { return remaining_; }

private:
    std::string name_;
    int remaining_{};
};

int main() {
    Ticket ticket{"museum", 5};
    ticket.use(2);
    std::cout << "remaining: " << ticket.remaining() << std::endl;
}`,
    exampleOutput: "remaining: 3\nclose museum",
    commonMistake: "残り回数が0でも減算し続け、負数にする。状態変更をクラス内で制限します。",
    quiz: { question: "Ticket の残り回数を0以上に保つ責任を置く場所は？", choices: ["コンストラクタと use の実装", "呼び出し側の表示文だけ", "デストラクタだけ"], answer: 0, explanation: "生成時と変更時にクラスが条件を保てば、すべての利用箇所で安全です。" },
    prompt: "Ticket は名前と残り回数を private に保存します。初期回数は0以上、use(int) は正の数だけ使い、残りを0未満にしません。const アクセサーで残数を読みます。終了時は `close <名前>` を表示します。名前・初期回数・使用数を読み、残数と終了行を表示してください。",
    solution: `#include <iostream>
#include <string>

class Ticket {
public:
    Ticket(const std::string& name, int count)
        : name_(name), remaining_(count > 0 ? count : 0) {}
    ~Ticket() { std::cout << "close " << name_ << std::endl; }

    void use(int count) {
        if (count > 0) remaining_ = count >= remaining_ ? 0 : remaining_ - count;
    }

    const std::string& name() const { return name_; }
    int remaining() const { return remaining_; }

private:
    std::string name_;
    int remaining_{};
};

int main() {
    std::string name;
    int initial{};
    int used{};
    std::cin >> name >> initial >> used;
    Ticket ticket{name, initial};
    ticket.use(used);
    std::cout << "name: " << ticket.name() << std::endl;
    std::cout << "remaining: " << ticket.remaining() << std::endl;
    return 0;
}`,
    input: "Apples 8 3\n",
    tests: [
      { input: "Apples 8 3\n", output: "name: Apples\nremaining: 5\nclose Apples" },
      { input: "Token 4 8\n", output: "name: Token\nremaining: 0\nclose Token" },
      { input: "Card -2 -3\n", output: "name: Card\nremaining: 0\nclose Card" },
    ],
    hiddenTests: [{ input: "Gem 0 0\n", output: "name: Gem\nremaining: 0\nclose Gem" }],
    hints: ["Ticket に名前と残り回数を保存します。", "初期値と use の両方で負数を受け付けず、残数を0で止めます。", "remaining() は const にし、main の終わりでデストラクタが閉じるログを出します。"],
    debug: { code: "void use(int n) { remaining_ -= n; }", fix: "void use(int n) { if (n > 0) remaining_ = n >= remaining_ ? 0 : remaining_ - n; }", explanation: "負の使用数は無視し、残りより大きい使用数では0に止めます。" },
  }),
];
