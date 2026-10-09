import type { LessonSeed } from "../lesson-source.ts";

type Draft = Omit<LessonSeed, "quiz" | "debug"> & {
  quiz: LessonSeed["quiz"];
  debug: LessonSeed["debug"];
};

const makeLesson = (draft: Draft): LessonSeed => draft;

export const week14LessonSeeds: LessonSeed[] = [
  makeLesson({
    title: "クラスに一つの責務を持たせる",
    goal: "状態と、それを扱う操作を同じオブジェクトの中へまとめる。",
    minutes: 40,
    explanation: "オブジェクト指向設計では、クラスを作ること自体を目的にしません。ひとつのオブジェクトが何を知り、何を担当するかを先に決めます。状態とその状態を扱う操作が近くにあると、利用する側が内部の更新方法を知る必要がなくなります。\n\nこの例のCounterは値を保持し、値を増やす操作を担当します。mainは入力を読み、Counterへ操作を依頼して結果を表示します。クラスの責務を説明するときは「何をするものか」を短く言えるか確認します。",
    example: `#include <iostream>

class Counter {
public:
    void add(const int amount) { value_ = value_ + amount; }
    int value() const { return value_; }

private:
    int value_{};
};

int main() {
    Counter counter;
    counter.add(3);
    counter.add(4);
    std::cout << "value: " << counter.value() << std::endl;
}`,
    exampleOutput: "value: 7",
    commonMistake: "Counterに画面表示、入力、ファイル保存まで詰め込む。値の管理という役割を保ち、入出力は利用側に任せます。",
    quiz: { question: "Counterクラスが主に担当する処理はどれ？", choices: ["値を保持し、増やす", "キーボード入力を監視する", "画面の色を変える"], answer: 0, explanation: "Counterは値の管理を担当し、入力や表示の仕組みは持ちません。" },
    prompt: "Counterクラスを作ります。整数nと続くn個の増減量（各-1000〜1000）を読み、Counterへ順に追加してください。nが0〜100なら `value: <合計>`、範囲外なら `invalid` と表示します。値の保持はprivateにし、addとvalueの操作を用意してください。",
    solution: `#include <iostream>

class Counter {
public:
    void add(int amount) { value_ += amount; }
    int value() const { return value_; }

private:
    int value_{};
};

int main() {
    int count{};
    std::cin >> count;
    if (count < 0 || count > 100) {
        std::cout << "invalid" << std::endl;
        return 0;
    }

    Counter counter;
    for (int i = 0; i < count; ++i) {
        int amount{};
        std::cin >> amount;
        counter.add(amount);
    }
    std::cout << "value: " << counter.value() << std::endl;
    return 0;
}`,
    input: "2\n3 4\n",
    tests: [
      { input: "2\n3 4\n", output: "value: 7" },
      { input: "0\n", output: "value: 0" },
      { input: "3\n-2 5 1\n", output: "value: 4" },
    ],
    hiddenTests: [{ input: "1\n0\n", output: "value: 0" }],
    hints: ["Counterに現在値を持たせます。", "値を変える操作をaddとしてpublicに用意します。", "mainは入力を読み、counter.addを呼び、value()で結果を取得します。"],
    debug: { code: "counter.value_ += amount;", fix: "counter.add(amount);", explanation: "利用側からprivateな状態を直接変更せず、Counter自身の操作へ依頼します。" },
  }),
  makeLesson({
    title: "オブジェクトの操作で不変条件を守る",
    goal: "HealthオブジェクトがHPの範囲を保つよう、状態変更をメソッドにまとめる。",
    minutes: 40,
    explanation: "不変条件は、オブジェクトがいつでも守るべき状態の条件です。HealthではHPを0以上最大HP以下に保ちます。利用側がフィールドを直接変更すると、負のHPや上限を超えた値を作れてしまいます。\n\nreceiveDamageに状態変更を任せれば、HPを減らした後に下限を確かめる場所を一つにできます。利用側はHPの保存方法を知らずに、ダメージを受ける操作だけを呼びます。",
    example: `#include <iostream>

class Health {
public:
    explicit Health(int maximum) : maximum_{maximum}, current_{maximum} {}
    void receiveDamage(int amount) {
        current_ -= amount;
        if (current_ < 0) current_ = 0;
    }
    int current() const { return current_; }

private:
    int maximum_{};
    int current_{};
};

int main() {
    Health health{10};
    health.receiveDamage(4);
    health.receiveDamage(4);
    std::cout << "hp: " << health.current() << std::endl;
}`,
    exampleOutput: "hp: 2",
    commonMistake: "ダメージ処理を呼び出すたびに、main側でもHPの下限処理を書く。状態を守るルールはHealthへ集めます。",
    quiz: { question: "HPを0未満にしないルールを置く場所として適切なのは？", choices: ["ダメージを受ける操作", "すべての呼び出し元に重複して書く", "出力ラベル"], answer: 0, explanation: "HPを変更するHealthの操作にルールを置くと、すべての利用者で同じ条件を守れます。" },
    prompt: "最大HPとn回分のダメージを読みます。Healthは最大HPで初期化し、ダメージを受けるたびにHPを減らします。HPは0未満にならないようにし、最後に `hp: <現在HP>` と表示してください。最大HPは1〜1000、nは0〜100、各ダメージは0〜10000です。範囲外の最大HPまたはnは `invalid` と表示します。",
    solution: `#include <iostream>

class Health {
public:
    explicit Health(int maximum) : maximum_{maximum}, current_{maximum} {}
    void receiveDamage(int amount) {
        current_ -= amount;
        if (current_ < 0) current_ = 0;
    }
    int current() const { return current_; }

private:
    int maximum_{};
    int current_{};
};

int main() {
    int maximum{};
    int count{};
    std::cin >> maximum >> count;
    if (maximum < 1 || maximum > 1000 || count < 0 || count > 100) {
        std::cout << "invalid" << std::endl;
        return 0;
    }

    Health health{maximum};
    for (int i = 0; i < count; ++i) {
        int damage{};
        std::cin >> damage;
        health.receiveDamage(damage);
    }
    std::cout << "hp: " << health.current() << std::endl;
    return 0;
}`,
    input: "10 2\n4 4\n",
    tests: [
      { input: "10 2\n4 4\n", output: "hp: 2" },
      { input: "5 1\n9\n", output: "hp: 0" },
      { input: "8 0\n", output: "hp: 8" },
    ],
    hiddenTests: [{ input: "1 3\n1 1 1\n", output: "hp: 0" }],
    hints: ["Healthにmaximumとcurrentをprivateで持たせます。", "receiveDamageでcurrentを減らし、0未満になったら0に直します。", "最後の値はcurrent()から読み取り、利用側でフィールドを変更しません。"],
    debug: { code: "current_ -= amount;", fix: "if (current_ < amount) current_ = 0; else current_ -= amount;", explanation: "減算後の値を確認するか、減算前に0を下回るか判定して下限を守ります。" },
  }),
  makeLesson({
    title: "問い合わせメソッドをconstにする",
    goal: "オブジェクトの状態を変えない問い合わせをconstメンバー関数として設計する。",
    minutes: 35,
    explanation: "メンバー関数の末尾にconstを付けると、その関数が通常の方法でメンバー状態を変更しないことを型で表せます。areaは幅と高さから面積を計算するだけなのでconstにできます。\n\n読み取り専用の参照からもconstメンバー関数は呼べます。状態を変更する操作と、状態を調べる操作を宣言から区別できるため、APIの使い方が読みやすくなります。",
    example: `#include <iostream>

class Rectangle {
public:
    Rectangle(int width, int height) : width_{width}, height_{height} {}
    int area() const { return width_ * height_; }

private:
    int width_{};
    int height_{};
};

int main() {
    const Rectangle panel{8, 3};
    std::cout << "area: " << panel.area() << std::endl;
}`,
    exampleOutput: "area: 24",
    commonMistake: "areaのように状態を読むだけの関数へconstを付けない。constオブジェクトから呼べず、読み取り専用の利用を妨げます。",
    quiz: { question: "const Rectangle objectから呼び出せるareaの宣言は？", choices: ["int area() const", "int area()", "void area()"], answer: 0, explanation: "constオブジェクトから呼ぶメンバー関数は、読み取り専用であることをconstで示します。" },
    prompt: "幅と高さを持つRectangleクラスを作り、面積を返すconstメソッドarea()を用意してください。幅と高さを読み、どちらも0〜10000なら `area: <面積>`、範囲外なら `invalid` と表示します。",
    solution: `#include <iostream>

class Rectangle {
public:
    Rectangle(int width, int height) : width_{width}, height_{height} {}
    int area() const { return width_ * height_; }

private:
    int width_{};
    int height_{};
};

int main() {
    int width{};
    int height{};
    std::cin >> width >> height;
    if (width < 0 || width > 10000 || height < 0 || height > 10000) {
        std::cout << "invalid" << std::endl;
        return 0;
    }
    const Rectangle rectangle{width, height};
    std::cout << "area: " << rectangle.area() << std::endl;
    return 0;
}`,
    input: "8 3\n",
    tests: [
      { input: "8 3\n", output: "area: 24" },
      { input: "0 7\n", output: "area: 0" },
      { input: "100 100\n", output: "area: 10000" },
    ],
    hiddenTests: [{ input: "10000 10000\n", output: "area: 100000000" }],
    hints: ["幅と高さをRectangleのprivateな状態として持たせます。", "area()は状態を変えないので、関数の末尾にconstを付けます。", "const Rectangleとして作った後でもarea()を呼べることを確認します。"],
    debug: { code: "int area() { return width_ * height_; }", fix: "int area() const", explanation: "メンバー関数の宣言へconstを加え、問い合わせが状態を変更しないことを示します。" },
  }),
  makeLesson({
    title: "オブジェクトの境界をpublic変数で破らない",
    goal: "利用側から内部状態を直接書き換えず、意味のある公開操作を用意する。",
    minutes: 40,
    explanation: "publicフィールドを公開すると、利用側が状態をどんな順番でも変更できます。値の検査や関連する更新が必要になったとき、すべての利用箇所を探して直さなければなりません。\n\nDoorの状態をprivateにしてopen、close、isOpenを公開すると、利用側はドアの実装方法ではなく、行いたい操作を表現できます。すでに開いているドアを再度開く操作のように、現在状態に応じた細部はDoorの中へ閉じ込められます。",
    example: `#include <iostream>

class Door {
public:
    void open() { open_ = true; }
    void close() { open_ = false; }
    bool isOpen() const { return open_; }

private:
    bool open_{};
};

int main() {
    Door door;
    door.open();
    std::cout << (door.isOpen() ? "open" : "closed") << std::endl;
}`,
    exampleOutput: "open",
    commonMistake: "door.open_ = trueのように内部表現を直接操作する。呼び出し側はDoorの公開APIを使います。",
    quiz: { question: "利用側がドアの状態を知るための公開操作は？", choices: ["door.open_を読む", "door.isOpen()を呼ぶ", "Doorのprivateを書き換える"], answer: 1, explanation: "状態を問い合わせる公開APIを用意すれば、内部の保存方法を隠せます。" },
    prompt: "Doorクラスを作り、最初は閉じた状態にします。Oならopen、Cならclose、?なら状態を `open` または `closed` と表示します。n個のコマンドを読み、状態はprivateにしてください。nが0〜100でない場合は `invalid` と表示します。",
    solution: `#include <iostream>

class Door {
public:
    void open() { open_ = true; }
    void close() { open_ = false; }
    bool isOpen() const { return open_; }

private:
    bool open_{};
};

int main() {
    int count{};
    std::cin >> count;
    if (count < 0 || count > 100) {
        std::cout << "invalid" << std::endl;
        return 0;
    }

    Door door;
    for (int i = 0; i < count; ++i) {
        char command{};
        std::cin >> command;
        if (command == 'O') door.open();
        else if (command == 'C') door.close();
        else if (command == '?') std::cout << (door.isOpen() ? "open" : "closed") << std::endl;
    }
    return 0;
}`,
    input: "5\n? O ? C ?\n",
    tests: [
      { input: "5\n? O ? C ?\n", output: "closed\nopen\nclosed" },
      { input: "3\nO O ?\n", output: "open" },
      { input: "2\nC ?\n", output: "closed" },
    ],
    hiddenTests: [{ input: "0\n", output: "" }],
    hints: ["Doorは開閉状態をprivateなboolで持ちます。", "OとCはDoorの操作を呼び、?はconst問い合わせを使います。", "入力の処理はmainに置き、状態の変更方法はDoorのAPIに任せます。"],
    debug: { code: "door.open_ = true;", fix: "door.open();", explanation: "private状態を直接書き換えず、Doorが公開する操作を呼び出します。" },
  }),
  makeLesson({
    title: "状態を持たない処理は関数にする",
    goal: "永続する状態を持たない計算と、状態を守るオブジェクトを使い分ける。",
    minutes: 35,
    explanation: "すべての処理にクラスが必要なわけではありません。入力値から結果を計算するだけで、過去の呼び出しを覚える必要がない処理は、独立した関数で十分なことがあります。\n\n一方、CounterやHealthのように複数回の操作を通して状態を保ち、条件を守る必要があるものはオブジェクトにまとめる理由があります。設計では「何をクラスにするか」だけでなく「クラスにしなくてよいものは何か」も考えます。",
    example: `#include <iostream>

int calculateDamage(int attack, int defense) {
    const int damage = attack - defense;
    return damage > 0 ? damage : 0;
}

int main() {
    std::cout << "damage: " << calculateDamage(10, 3) << std::endl;
}`,
    exampleOutput: "damage: 7",
    commonMistake: "一度の計算だけを行う型を作り、攻撃値や防御値を保存しないのにオブジェクトの状態として扱う。",
    quiz: { question: "現在の状態を保存せず、毎回引数だけから結果を返す計算に向くものは？", choices: ["自由関数", "必ず継承クラス", "グローバル変数"], answer: 0, explanation: "状態を保つ必要がなければ、入力と結果を明示する関数が簡潔です。" },
    prompt: "attackとdefenseを読みます。両方が0〜1000なら自由関数calculateDamageで `max(attack - defense, 0)` を計算し、`damage: <値>` と表示します。範囲外なら `invalid` と表示してください。状態を保持するクラスは作りません。",
    solution: `#include <iostream>

int calculateDamage(int attack, int defense) {
    const int damage = attack - defense;
    return damage > 0 ? damage : 0;
}

int main() {
    int attack{};
    int defense{};
    std::cin >> attack >> defense;
    if (attack < 0 || attack > 1000 || defense < 0 || defense > 1000) {
        std::cout << "invalid" << std::endl;
        return 0;
    }
    std::cout << "damage: " << calculateDamage(attack, defense) << std::endl;
    return 0;
}`,
    input: "10 3\n",
    tests: [
      { input: "10 3\n", output: "damage: 7" },
      { input: "5 8\n", output: "damage: 0" },
      { input: "0 0\n", output: "damage: 0" },
    ],
    hiddenTests: [{ input: "1000 1\n", output: "damage: 999" }],
    hints: ["attackとdefenseからdamageを返す関数をmainの外に定義します。", "負の差を返さないよう、差と0の大きい方を使います。", "この計算は過去の呼び出し状態を必要としないので、関数だけで表します。"],
    debug: { code: "int calculateDamage(int attack, int defense) { return attack - defense; }", fix: "return (attack <= defense) ? 0 : (attack - defense);", explanation: "防御値が攻撃値以上なら0、それ以外は攻撃から防御を引いた値を返します。" },
  }),
  makeLesson({
    title: "ドメインの状態と表示の責務を分ける",
    goal: "Playerにゲーム状態を持たせ、文字列表示は利用側の関数へ分ける。",
    minutes: 45,
    explanation: "Playerは名前やHPなど、ゲーム内の状態とその変更を担当します。画面へどの順番で文字を出すかは別の責務です。表示処理をクラスの状態変更に混ぜず、公開問い合わせを使う関数へ置くと、後でコンソール表示をUIへ置き換えるときに影響を限定できます。\n\n自動採点は表示結果を検証できますが、クラスの分け方を出力だけから完全には証明できません。模範解答を読み、Playerが表示先へ直接依存していないかも確認してください。",
    example: `#include <iostream>
#include <string>

class Player {
public:
    Player(std::string name, int hp) : name_{name}, hp_{hp} {}
    const std::string& name() const { return name_; }
    int hp() const { return hp_; }
    void receiveDamage(int amount) {
        hp_ -= amount;
        if (hp_ < 0) hp_ = 0;
    }

private:
    std::string name_;
    int hp_{};
};

void printStatus(const Player& player) {
    std::cout << player.name() << " hp: " << player.hp() << std::endl;
}

int main() {
    Player player{"Rin", 10};
    player.receiveDamage(3);
    printStatus(player);
}`,
    exampleOutput: "Rin hp: 7",
    commonMistake: "PlayerのreceiveDamageが画面へHPを表示する。状態を変える処理と表示を分けると、それぞれを別の方法で利用できます。",
    quiz: { question: "Playerの状態を使って表示を行う関数に適した引数は？", choices: ["Player&", "const Player&", "Playerをグローバル変数にする"], answer: 1, explanation: "表示関数は状態を変更しないので、const参照で受け取れます。" },
    prompt: "名前、初期HP、ダメージを読みます。Playerクラスに名前とHPをprivateで持たせ、receiveDamageでHPを0未満にしないようにします。printStatus(const Player&)関数が `名前 hp: <HP>` を表示します。名前は空白を含まない文字列、初期HPとダメージは0〜1000です。",
    solution: `#include <iostream>
#include <string>

class Player {
public:
    Player(std::string name, int hp) : name_{name}, hp_{hp} {}
    const std::string& name() const { return name_; }
    int hp() const { return hp_; }
    void receiveDamage(int amount) {
        hp_ -= amount;
        if (hp_ < 0) hp_ = 0;
    }

private:
    std::string name_;
    int hp_{};
};

void printStatus(const Player& player) {
    std::cout << player.name() << " hp: " << player.hp() << std::endl;
}

int main() {
    std::string name;
    int hp{};
    int damage{};
    std::cin >> name >> hp >> damage;
    if (hp < 0 || hp > 1000 || damage < 0 || damage > 1000) {
        std::cout << "invalid" << std::endl;
        return 0;
    }
    Player player{name, hp};
    player.receiveDamage(damage);
    printStatus(player);
    return 0;
}`,
    input: "Rin 10 3\n",
    tests: [
      { input: "Rin 10 3\n", output: "Rin hp: 7" },
      { input: "Mira 5 8\n", output: "Mira hp: 0" },
      { input: "Kai 0 0\n", output: "Kai hp: 0" },
    ],
    hiddenTests: [{ input: "Ren 1000 1\n", output: "Ren hp: 999" }],
    hints: ["Playerはnameとhpをprivateに持ちます。", "状態を変えるreceiveDamageと、状態を読むconstメソッドを用意します。", "表示はPlayerの外で、const Player&から得た情報だけを使います。"],
    debug: { code: "std::cout << name_ << \" hp: \" << hp_;", fix: "printStatus(player);", explanation: "Playerが表示へ直接依存しないよう、利用側の表示関数へ依頼します。" },
  }),
  makeLesson({
    title: "総合設計：容量を守るInventoryを作る",
    goal: "内部データを隠したInventoryの公開APIで追加と検索を行う。",
    minutes: 55,
    explanation: "小さなInventoryは、項目を保存する責務と最大容量を守る責務を持ちます。利用側にvectorを直接公開すると、容量を超える追加や内部順序の変更を防げません。add、contains、sizeのような操作を公開すれば、保存方法を後で変更しても利用側のコードを保ちやすくなります。\n\nこの課題では項目名を順番に追加し、満杯後の追加は拒否します。同じ名前の項目も個別に保存します。自動テストは追加・検索・容量の外から見える動作を検証し、設計意図は模範解答と説明で確認します。",
    example: `#include <iostream>
#include <string>
#include <vector>

class Inventory {
public:
    explicit Inventory(int capacity) : capacity_{capacity} {}
    bool add(const std::string& item) {
        if (items_.size() >= static_cast<std::size_t>(capacity_)) return false;
        items_.push_back(item);
        return true;
    }
    bool contains(const std::string& item) const {
        for (const std::string& saved : items_) {
            if (saved == item) return true;
        }
        return false;
    }
    std::size_t size() const { return items_.size(); }

private:
    int capacity_{};
    std::vector<std::string> items_;
};

int main() {
    Inventory inventory{2};
    inventory.add("potion");
    inventory.add("elixir");
    std::cout << "stored: " << inventory.size() << std::endl;
    std::cout << "contains elixir: " << (inventory.contains("elixir") ? "yes" : "no") << std::endl;
}`,
    exampleOutput: "stored: 2\ncontains elixir: yes",
    commonMistake: "Inventoryのvectorをpublicにする。利用側からitems_.push_backを呼ばれると、容量ルールを迂回できます。",
    quiz: { question: "容量上限の検査を一か所に集める公開操作は？", choices: ["add", "sizeだけ", "利用側からvectorを変更"], answer: 0, explanation: "追加のたびに呼ぶaddが容量を検査し、上限を守れます。" },
    prompt: "capacity、追加を試す件数n、n個の項目名、最後に検索する名前を読みます。capacityが0〜20、nが0〜100ならInventoryへ順番に追加してください。容量を超えた項目は拒否します。`stored: <保存数>`、`contains: yes/no`、`rejected: <拒否数>` を3行で表示します。範囲外のcapacityまたはnは `invalid` と表示します。",
    solution: `#include <iostream>
#include <string>
#include <vector>

class Inventory {
public:
    explicit Inventory(int capacity) : capacity_{capacity} {}
    bool add(const std::string& item) {
        if (items_.size() >= static_cast<std::size_t>(capacity_)) return false;
        items_.push_back(item);
        return true;
    }
    bool contains(const std::string& item) const {
        for (const std::string& saved : items_) {
            if (saved == item) return true;
        }
        return false;
    }
    std::size_t size() const { return items_.size(); }

private:
    int capacity_{};
    std::vector<std::string> items_;
};

int main() {
    int capacity{};
    int count{};
    std::cin >> capacity >> count;
    if (capacity < 0 || capacity > 20 || count < 0 || count > 100) {
        std::cout << "invalid" << std::endl;
        return 0;
    }

    Inventory inventory{capacity};
    int rejected{};
    for (int i = 0; i < count; ++i) {
        std::string item;
        std::cin >> item;
        if (!inventory.add(item)) ++rejected;
    }
    std::string query;
    std::cin >> query;
    std::cout << "stored: " << inventory.size() << std::endl;
    std::cout << "contains: " << (inventory.contains(query) ? "yes" : "no") << std::endl;
    std::cout << "rejected: " << rejected << std::endl;
    return 0;
}`,
    input: "2 3\npotion elixir herb elixir\n",
    tests: [
      { input: "2 3\npotion elixir herb elixir\n", output: "stored: 2\ncontains: yes\nrejected: 1" },
      { input: "0 2\na b missing\n", output: "stored: 0\ncontains: no\nrejected: 2" },
      { input: "4 3\nkey key map key\n", output: "stored: 3\ncontains: yes\nrejected: 0" },
    ],
    hiddenTests: [{ input: "1 3\na b c c\n", output: "stored: 1\ncontains: no\nrejected: 2" }],
    hints: ["Inventoryはcapacityとvectorをprivateに持ちます。", "addは満杯ならfalseを返し、追加できたときだけtrueを返します。", "保存数と検索はsize()、contains()を通して調べ、items_を外へ公開しません。"],
    debug: { code: "if (items_.size() > static_cast<std::size_t>(capacity_)) return false;", fix: "if (items_.size() == static_cast<std::size_t>(capacity_)) return false;", explanation: "このクラスではsizeがcapacityを超えないため、同じになった時点で追加を拒否できます。" },
  }),
];
