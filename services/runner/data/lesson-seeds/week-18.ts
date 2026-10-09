import type { LessonSeed } from "../lesson-source.ts";

type Draft = Omit<LessonSeed, "quiz" | "debug"> & {
  quiz: LessonSeed["quiz"];
  debug: LessonSeed["debug"];
};

const makeLesson = (draft: Draft): LessonSeed => draft;

const bufferClass = `class Buffer {
public:
    explicit Buffer(std::size_t size)
        : data_{size == 0 ? nullptr : new int[size]{}}, size_{size} {}
    ~Buffer() { delete[] data_; }
    Buffer(const Buffer& other) : Buffer{other.size_} {
        for (std::size_t i = 0; i < size_; ++i) data_[i] = other.data_[i];
    }
    Buffer& operator=(const Buffer& other) {
        if (this != &other) {
            Buffer copy{other};
            swap(copy);
        }
        return *this;
    }
    Buffer(Buffer&& other) noexcept : data_{other.data_}, size_{other.size_} {
        other.data_ = nullptr;
        other.size_ = 0;
    }
    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            size_ = other.size_;
            other.data_ = nullptr;
            other.size_ = 0;
        }
        return *this;
    }
    std::size_t size() const { return size_; }
    int get(std::size_t index) const { return data_[index]; }
    void set(std::size_t index, int value) { data_[index] = value; }
private:
    void swap(Buffer& other) noexcept {
        int* data = data_;
        data_ = other.data_;
        other.data_ = data;
        std::size_t size = size_;
        size_ = other.size_;
        other.size_ = size;
    }
    int* data_{};
    std::size_t size_{};
};`;

const bufferProgram = (body: string) => `#include <cstddef>\n#include <iostream>\n#include <utility>\n\n${bufferClass}\n\nvoid show(const char* label, const Buffer& buffer) {\n    std::cout << label << ':';\n    for (std::size_t i = 0; i < buffer.size(); ++i) {\n        std::cout << ' ' << buffer.get(i);\n    }\n    std::cout << '\\n';\n}\n\n${body}`;

export const week18LessonSeeds: LessonSeed[] = [
  makeLesson({
    title: "コピー構築で独立した値を作る",
    goal: "値をコピーして別オブジェクトを作り、コピー後の変更が元の値に影響しないことを確認する。",
    minutes: 40,
    explanation: "コピーコンストラクターは、既存のオブジェクトから新しいオブジェクトを初期化します。std::vectorやstd::stringのような標準ライブラリ型は、コピー先が独立した値になるようにコピー操作を実装しています。\n\nコピーと同じオブジェクトへの別名参照は異なります。コピーしたvectorの要素を書き換えても、元のvectorの要素は変わりません。クラスが資源を所有するときは、この独立した値の性質を守るコピーコンストラクターを用意するか、コピーを禁止する必要があります。",
    example: "#include <iostream>\n#include <vector>\n\nint main() {\n    const std::vector<int> original{4, 7};\n    std::vector<int> copied{original};\n    copied[0] = 9;\n    std::cout << \"original: \" << original[0] << ' ' << original[1] << '\\n';\n    std::cout << \"copy: \" << copied[0] << ' ' << copied[1] << '\\n';\n}",
    exampleOutput: "original: 4 7\ncopy: 9 7",
    commonMistake: "コピーを元オブジェクトへの別名だと思い、片方の変更が常にもう片方へ伝わると考える。std::vectorのコピーは独立した要素列を作ります。",
    quiz: { question: "std::vector<int> copied{original}; の後、copied[0]を変更するとどうなる？", choices: ["original[0]はそのままでcopiedだけ変わる", "両方の要素が必ず同時に変わる", "vectorはコピーできない"], answer: 0, explanation: "vectorのコピーは独立した値を作り、片方の要素変更はもう片方へ伝わりません。" },
    prompt: "個数n（1〜5）と-10000〜10000の整数を読み、std::vector<int> originalへ格納します。originalからcopyをコピー構築し、copyの先頭要素へ1を足します。original: <値一覧> と copy: <値一覧> を2行で表示してください。",
    solution: "#include <iostream>\n#include <vector>\n\nvoid show(const char* label, const std::vector<int>& values) {\n    std::cout << label << ':';\n    for (int value : values) std::cout << ' ' << value;\n    std::cout << '\\n';\n}\n\nint main() {\n    int count{};\n    if (!(std::cin >> count) || count < 1 || count > 5) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    std::vector<int> original;\n    for (int i = 0; i < count; ++i) {\n        int value{};\n        if (!(std::cin >> value) || value < -10000 || value > 10000) {\n            std::cout << \"invalid\\n\";\n            return 0;\n        }\n        original.push_back(value);\n    }\n    std::vector<int> duplicate{original};\n    ++duplicate[0];\n    show(\"original\", original);\n    show(\"copy\", duplicate);\n    return 0;\n}",
    input: "2 4 7\n",
    tests: [
      { input: "2 4 7\n", output: "original: 4 7\ncopy: 5 7" },
      { input: "1 0\n", output: "original: 0\ncopy: 1" },
      { input: "3 -2 5 8\n", output: "original: -2 5 8\ncopy: -1 5 8" },
    ],
    hiddenTests: [{ input: "5 1 2 3 4 5\n", output: "original: 1 2 3 4 5\ncopy: 2 2 3 4 5" }],
    hints: ["originalへ整数を順番に追加します。", "元のvectorを初期化子として渡し、独立したvectorを新しく作ります。", "コピー側の先頭だけを変更し、2つのvectorを別々に表示します。"],
    debug: { code: "std::vector<int>& copy = original;\ncopy[0] = 9;", fix: "std::vector<int> copy{original};", explanation: "参照は同じvectorへの別名です。独立した値を作りたいときは参照ではなくコピー構築します。" },
  }),
  makeLesson({
    title: "コピー代入で既存の値を置き換える",
    goal: "すでに構築済みのオブジェクトへコピー代入し、自己代入と独立した値の扱いを区別する。",
    minutes: 40,
    explanation: "コピー代入演算子は、すでに存在する左辺オブジェクトへ右辺の値を代入します。初期化のときに呼ばれるコピーコンストラクターとは用途が異なります。std::vectorでは、右辺の要素内容を左辺へコピーし、左辺の古い内容を置き換えます。\n\n代入後に左辺を変更しても右辺は変わりません。自分自身への代入も有効な式であり、標準ライブラリ型は安全に扱います。資源を直接所有する型でコピー代入を実装するときは、既存資源の解放と新しい資源の取得を安全な順で行います。",
    example: "#include <iostream>\n#include <vector>\n\nint main() {\n    const std::vector<int> source{3, 8};\n    std::vector<int> target{0, 0, 0};\n    target = source;\n    target[1] = 6;\n    std::cout << \"source: \" << source[0] << ' ' << source[1] << '\\n';\n    std::cout << \"target: \" << target[0] << ' ' << target[1] << '\\n';\n}",
    exampleOutput: "source: 3 8\ntarget: 3 6",
    commonMistake: "構築済みの左辺へ代入しているのに、コピーコンストラクターが必ず呼ばれると思う。target = source; はコピー代入です。",
    quiz: { question: "std::vector<int> target{0}; target = source; の操作はどれ？", choices: ["コピー代入", "コピー構築", "ムーブ構築"], answer: 0, explanation: "targetはすでに存在するため、右辺の値を代入するコピー代入演算子が使われます。" },
    prompt: "整数を2つ読み、source vectorを作ります。別の初期内容を持つtargetを作り、target = source; でコピー代入します。targetの先頭だけを-1にして、sourceとtargetを2行で表示してください。両方の入力値が-1でない場合に限ります。",
    solution: "#include <iostream>\n#include <vector>\n\nint main() {\n    int first{};\n    int second{};\n    if (!(std::cin >> first >> second) || first == -1 || second == -1) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    const std::vector<int> source{first, second};\n    std::vector<int> target{99};\n    target = source;\n    target[0] = -1;\n    std::cout << \"source: \" << source[0] << ' ' << source[1] << '\\n';\n    std::cout << \"target: \" << target[0] << ' ' << target[1] << '\\n';\n    return 0;\n}",
    input: "3 8\n",
    tests: [
      { input: "3 8\n", output: "source: 3 8\ntarget: -1 8" },
      { input: "0 4\n", output: "source: 0 4\ntarget: -1 4" },
      { input: "-2 7\n", output: "source: -2 7\ntarget: -1 7" },
    ],
    hiddenTests: [{ input: "-1 4\n", output: "invalid" }],
    hints: ["sourceとtargetをそれぞれ別に構築します。", "target = source; は左辺が既存オブジェクトなのでコピー代入です。", "代入後にtarget[0]だけを変更し、sourceが保たれているか確認します。"],
    debug: { code: "std::vector<int> target{0};\nstd::vector<int> target = source;", fix: "target = source;", explanation: "代入対象targetがすでにある場合は再宣言せず、=で値をコピーします。" },
  }),
  makeLesson({
    title: "std::moveでムーブ構築を選ぶ",
    goal: "std::moveが値を直接移動する命令ではなく、ムーブ可能な右辺値として扱うためのキャストだと理解する。",
    minutes: 45,
    explanation: "std::moveはオブジェクトの中身をそれ自体で移動しません。式を右辺値として扱える形にし、ムーブコンストラクターやムーブ代入演算子を選べるようにします。実際に状態を移すかどうかは、選ばれた操作の実装次第です。\n\nstd::vectorのムーブ構築は通常、要素を一つずつコピーせず、内部バッファの所有を移します。移動元オブジェクトは有効ですが、その内容は規定されていません。移動先の値を使い、移動元の特定の要素やsizeを決めつけないようにします。",
    example: "#include <iostream>\n#include <utility>\n#include <vector>\n\nint main() {\n    std::vector<int> source{2, 5, 8};\n    std::vector<int> destination{std::move(source)};\n    std::cout << \"moved: \";\n    for (int value : destination) std::cout << value << ' ';\n    std::cout << '\\n';\n}",
    exampleOutput: "moved: 2 5 8",
    commonMistake: "std::move(source)の直後にsource.size()やsource[0]が特定値になると仮定する。移動元は有効ですが、標準ライブラリ型の内容は個別に規定されない限り未規定です。",
    quiz: { question: "std::move(source)自体が行うことはどれ？", choices: ["sourceの中身を必ずコピーする", "式を右辺値として扱える形にし、ムーブ操作を選択可能にする", "sourceを即座に破棄する"], answer: 1, explanation: "std::moveはキャストであり、実際の移動処理は選択されたムーブ操作が行います。" },
    prompt: "n（1〜5）個の整数でsource vectorを作り、std::vector<int> destination{std::move(source)}; でムーブ構築します。destinationの要素を moved: とともに入力順に表示してください。移動元sourceの要素やsizeは出力に使いません。",
    solution: "#include <iostream>\n#include <utility>\n#include <vector>\n\nint main() {\n    int count{};\n    if (!(std::cin >> count) || count < 1 || count > 5) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    std::vector<int> source;\n    for (int i = 0; i < count; ++i) {\n        int value{};\n        if (!(std::cin >> value)) {\n            std::cout << \"invalid\\n\";\n            return 0;\n        }\n        source.push_back(value);\n    }\n    std::vector<int> destination{std::move(source)};\n    std::cout << \"moved:\";\n    for (int value : destination) std::cout << ' ' << value;\n    std::cout << '\\n';\n    return 0;\n}",
    input: "3 2 5 8\n",
    tests: [
      { input: "3 2 5 8\n", output: "moved: 2 5 8" },
      { input: "1 -4\n", output: "moved: -4" },
      { input: "2 0 9\n", output: "moved: 0 9" },
    ],
    hiddenTests: [{ input: "5 1 3 5 7 9\n", output: "moved: 1 3 5 7 9" }],
    hints: ["sourceを先に必要な要素で構築します。", "<utility>をincludeしてstd::move(source)を使います。", "移動後はdestinationだけを読み、sourceの状態を仮定しません。"],
    debug: { code: "std::vector<int> moved{std::move(source)};\nstd::cout << source[0];", fix: "std::cout << moved[0];", explanation: "移動元のvectorは有効ですが、内容は決めつけられません。ムーブ構築後はdestinationの要素を使います。" },
  }),
  makeLesson({
    title: "ムーブ代入で既存の値を置き換える",
    goal: "構築済みの左辺へstd::moveした右辺を代入し、ムーブ構築との違いを整理する。",
    minutes: 40,
    explanation: "ムーブ代入は、すでに存在する左辺オブジェクトへ右辺値の資源や値を移します。左辺には以前の値があるので、その型は古い状態を適切に置き換えてから新しい状態を受け入れます。std::vectorは古い要素を処理し、右辺vectorの内容を引き継ぎます。\n\nムーブ構築の `T target{std::move(source)};` は新しいオブジェクトを作ります。一方 `target = std::move(source);` は既存のtargetを書き換えます。どちらも移動元の特定状態には依存せず、以後使う必要があるなら有効な操作だけを行います。",
    example: "#include <iostream>\n#include <utility>\n#include <vector>\n\nint main() {\n    std::vector<int> source{4, 6};\n    std::vector<int> target{99, 99, 99};\n    target = std::move(source);\n    std::cout << \"target: \";\n    for (int value : target) std::cout << value << ' ';\n    std::cout << '\\n';\n}",
    exampleOutput: "target: 4 6",
    commonMistake: "ムーブ代入をコピー代入と同じ構築操作だと思う。targetはすでに存在するため、既存状態を置き換えるムーブ代入が呼ばれます。",
    quiz: { question: "target = std::move(source); の左辺targetはどの状態？", choices: ["すでに構築済みのオブジェクト", "この式で初めて構築されるオブジェクト", "必ず破棄済みのオブジェクト"], answer: 0, explanation: "代入式の左辺targetは既存オブジェクトで、ムーブ代入演算子が状態を置き換えます。" },
    prompt: "個数n（1〜5）とn個の整数を読みます。source vectorへ格納し、targetを別の値で構築してからtarget = std::move(source); を実行してください。target: に続けて結果を表示します。sourceは読まないでください。",
    solution: "#include <iostream>\n#include <utility>\n#include <vector>\n\nint main() {\n    int count{};\n    if (!(std::cin >> count) || count < 1 || count > 5) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    std::vector<int> source;\n    for (int i = 0; i < count; ++i) {\n        int value{};\n        if (!(std::cin >> value)) {\n            std::cout << \"invalid\\n\";\n            return 0;\n        }\n        source.push_back(value);\n    }\n    std::vector<int> target{99, 99};\n    target = std::move(source);\n    std::cout << \"target:\";\n    for (int value : target) std::cout << ' ' << value;\n    std::cout << '\\n';\n    return 0;\n}",
    input: "2 4 6\n",
    tests: [
      { input: "2 4 6\n", output: "target: 4 6" },
      { input: "1 -2\n", output: "target: -2" },
      { input: "3 0 1 5\n", output: "target: 0 1 5" },
    ],
    hiddenTests: [{ input: "5 1 2 3 4 5\n", output: "target: 1 2 3 4 5" }],
    hints: ["sourceへ入力値を入れてからtargetを別に構築します。", "左辺targetは既存なので、=演算子によるムーブ代入になります。", "<utility>のstd::moveを使い、結果はtargetから表示します。"],
    debug: { code: "std::vector<int> target{std::move(source)};\ntarget = std::move(source);", fix: "= std::move(source)", explanation: "targetがすでに存在するなら、宣言し直さずムーブ代入だけを行います。" },
  }),
  makeLesson({
    title: "std::moveは右辺値参照を選ぶためのキャスト",
    goal: "名前付き変数は左辺値のままであり、std::moveの有無でオーバーロード選択が変わることを確認する。",
    minutes: 45,
    explanation: "名前を持つ変数は、型がT&&であっても式として使うと左辺値です。std::move(value)は、その式を右辺値として扱える形にするキャストです。これにより、左辺値参照版と右辺値参照版のオーバーロードがある場合に、右辺値版を選べます。\n\n右辺値参照を受け取る関数が必ず値を移すとは限りません。この例の関数はどちらも分類結果を表示するだけなので、std::move呼び出し後も文字列自体は変更されません。std::moveの意味と、ムーブ操作の実装を区別してください。",
    example: "#include <iostream>\n#include <string>\n#include <utility>\n\nvoid select(const std::string&) { std::cout << \"lvalue\\n\"; }\nvoid select(std::string&&) { std::cout << \"rvalue\\n\"; }\n\nint main() {\n    std::string name{\"Aoi\"};\n    select(name);\n    select(std::move(name));\n    std::cout << \"name: \" << name << '\\n';\n}",
    exampleOutput: "lvalue\nrvalue\nname: Aoi",
    commonMistake: "変数の型に&&が含まれているから、その名前付き変数の式も右辺値だと考える。名前を使った式は左辺値なので、必要なときstd::moveを明示します。",
    quiz: { question: "関数の引数 T&& value の中で、move(value)なしの式valueはどう分類される？", choices: ["左辺値", "右辺値", "必ずprvalue"], answer: 0, explanation: "名前付きの式は左辺値です。テンプレート型かどうかにかかわらず、std::moveなどで右辺値として扱います。" },
    prompt: "std::string用にselect(const std::string&)とselect(std::string&&)を用意し、それぞれ lvalue または rvalue と表示します。入力名を1回目はそのまま、2回目はstd::move(name)で渡してください。最後にnameの値も表示し、分類関数自体は文字列を変更しないことを示してください。",
    solution: "#include <iostream>\n#include <string>\n#include <utility>\n\nvoid select(const std::string&) { std::cout << \"lvalue\\n\"; }\nvoid select(std::string&&) { std::cout << \"rvalue\\n\"; }\n\nint main() {\n    std::string name;\n    if (!(std::cin >> name)) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    select(name);\n    select(std::move(name));\n    std::cout << \"name: \" << name << '\\n';\n    return 0;\n}",
    input: "Aoi\n",
    tests: [
      { input: "Aoi\n", output: "lvalue\nrvalue\nname: Aoi" },
      { input: "Kenta\n", output: "lvalue\nrvalue\nname: Kenta" },
      { input: "Ren\n", output: "lvalue\nrvalue\nname: Ren" },
    ],
    hiddenTests: [{ input: "Player42\n", output: "lvalue\nrvalue\nname: Player42" }],
    hints: ["通常のname式は左辺値です。", "<utility>をincludeして、右辺値参照版へ渡すときだけstd::move(name)を使います。", "分類関数は引数を表示するだけなので、最後にnameを読んでも値は残っています。"],
    debug: { code: "void use(std::string&& value) {\n    std::cout << value;\n}\nuse(name);", fix: "use(std::move(name));", explanation: "nameは名前付きの左辺値なので、右辺値参照を取る関数へ渡すときはstd::moveを使います。" },
  }),
  makeLesson({
    title: "Rule of Zeroで標準ライブラリへ所有権管理を任せる",
    goal: "stringやvectorをメンバーに持つクラスでは、不要な特殊メンバー関数を自作せず安全なコピーとムーブを得る。",
    minutes: 45,
    explanation: "Rule of Zeroは、クラスがstd::stringやstd::vectorなど、すでに寿命とコピーを正しく管理する型をメンバーとして使い、デストラクターやコピー・ムーブ操作を自作しない考え方です。コンパイラが生成する特殊メンバー関数が、各メンバーの適切な操作を呼び出します。\n\n管理対象のポインターを直接持たないため、解放漏れや浅いコピーの二重解放を避けやすくなります。Rule of Fiveは独自に資源を所有する必要がある型で、デストラクター、コピー構築・代入、ムーブ構築・代入の一式を意図的に設計する考え方です。通常のアプリケーション型ではまずRule of Zeroを選びます。",
    example: "#include <iostream>\n#include <string>\n#include <vector>\n\nclass SaveData {\npublic:\n    SaveData(std::string name, std::vector<int> scores)\n        : name_{name}, scores_{scores} {}\n    const std::string& name() const { return name_; }\n    const std::vector<int>& scores() const { return scores_; }\nprivate:\n    std::string name_;\n    std::vector<int> scores_;\n};\n\nint main() {\n    const SaveData original{\"Aoi\", {10, 20}};\n    SaveData copy{original};\n    std::cout << copy.name() << \" scores: \" << copy.scores()[0] << ' ' << copy.scores()[1] << '\\n';\n}",
    exampleOutput: "Aoi scores: 10 20",
    commonMistake: "Rule of Fiveをすべてのクラスに実装する規則だと考え、stringやvectorしか持たないクラスにも手書きのコピー処理を追加する。管理を標準ライブラリ型に任せればRule of Zeroを保てます。",
    quiz: { question: "std::stringとstd::vectorだけをメンバーに持つクラスで、最初に検討する設計は？", choices: ["特殊メンバー関数を書かないRule of Zero", "必ず全メンバー関数を手書きするRule of Five", "デストラクターから各要素をdeleteする"], answer: 0, explanation: "メンバー型がすでに所有権とコピーを管理するなら、その操作に任せて特殊メンバー関数を自作しません。" },
    prompt: "SaveDataに名前のstringと得点のvector<int>を持たせます。2つの得点を読み、SaveData originalを作ってcopy = original; とコピー代入します。copyの名前はそのまま、1つ目の得点だけを変更します。originalとcopyを別々の2行に表示してください。特殊メンバー関数は自作しません。",
    solution: "#include <iostream>\n#include <string>\n#include <vector>\n\nclass SaveData {\npublic:\n    SaveData(std::string name, std::vector<int> scores)\n        : name_{name}, scores_{scores} {}\n    const std::string& name() const { return name_; }\n    int score(std::size_t index) const { return scores_[index]; }\n    void setScore(std::size_t index, int value) { scores_[index] = value; }\nprivate:\n    std::string name_;\n    std::vector<int> scores_;\n};\n\nint main() {\n    std::string name;\n    int first{};\n    int second{};\n    if (!(std::cin >> name >> first >> second)) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    SaveData original{name, {first, second}};\n    SaveData copy{name, {0}};\n    copy = original;\n    copy.setScore(0, first + 1);\n    std::cout << \"original: \" << original.name() << ' ' << original.score(0) << ' ' << original.score(1) << '\\n';\n    std::cout << \"copy: \" << copy.name() << ' ' << copy.score(0) << ' ' << copy.score(1) << '\\n';\n    return 0;\n}",
    input: "Aoi 10 20\n",
    tests: [
      { input: "Aoi 10 20\n", output: "original: Aoi 10 20\ncopy: Aoi 11 20" },
      { input: "Ren 0 5\n", output: "original: Ren 0 5\ncopy: Ren 1 5" },
      { input: "Kai -3 8\n", output: "original: Kai -3 8\ncopy: Kai -2 8" },
    ],
    hiddenTests: [{ input: "Mira 100 100\n", output: "original: Mira 100 100\ncopy: Mira 101 100" }],
    hints: ["SaveDataのメンバーをstringとvectorにします。", "コピー代入を実行すると、各メンバーのコピー代入が使われます。", "copy.setScore()で値を変えた後、originalが保たれることを出力します。"],
    debug: { code: "~SaveData() { delete scores_.data(); }", fix: "~SaveData() = default;", explanation: "vectorは自身のメモリを破棄時に解放します。手動deleteを追加せず、Rule of Zeroではデストラクターも自作しません。" },
  }),
  makeLesson({
    title: "Rule of Fiveで独自所有クラスのコピーとムーブを揃える",
    goal: "独自にnew[]した配列を所有する型へ、デストラクターとコピー・ムーブ操作を正しく実装する。",
    minutes: 55,
    explanation: "独自資源を直接所有する型では、デストラクターを自作しただけでコピーが安全になるわけではありません。ポインターをそのままコピーすると、二つのオブジェクトが同じ配列を指し、二重deleteや変更の共有が起きます。深いコピーではコピー先用の配列を別に確保して要素を複製します。\n\nRule of Fiveでは、デストラクター、コピーコンストラクター、コピー代入演算子、ムーブコンストラクター、ムーブ代入演算子を一組として設計します。ムーブではポインターと要素数を移し、移動元を空状態に戻します。コピー代入は一時コピーを先に作ってからswapするため、確保に失敗した場合も元の左辺を保てます。",
    example: bufferProgram(`int main() {\n    Buffer original{3};\n    original.set(0, 4);\n    original.set(1, 7);\n    original.set(2, 9);\n    Buffer copy{original};\n    copy.set(0, 5);\n    Buffer assigned{1};\n    assigned = original;\n    Buffer moved{std::move(copy)};\n    assigned = std::move(moved);\n    show(\"original\", original);\n    show(\"assigned\", assigned);\n    return 0;\n}`),
    exampleOutput: "original: 4 7 9\nassigned: 5 7 9",
    commonMistake: "コピーコンストラクターでdata_ = other.data_とする。ポインター値だけを複製すると配列所有権を共有し、破棄時に二重解放します。コピー用の新しい配列を確保して各要素を複製します。",
    quiz: { question: "独自にnew[]した配列の深いコピーで必要なのは？", choices: ["別の配列を確保して要素を複製する", "ポインター値だけをコピーする", "コピー先のデストラクターをなくす"], answer: 0, explanation: "コピー先が独立して所有できるよう、新しい配列を用意して値を複製します。" },
    prompt: "Bufferにint配列をnew[]で所有させ、Rule of Fiveの5関数を実装します。入力されたn（1〜5）個の値をoriginalへ入れ、コピー構築したcopyの先頭だけを1増やします。assignedへoriginalをコピー代入し、その後copyをムーブ構築してからassignedへムーブ代入します。original: と assigned: の2行を表示してください。移動元の状態は読みません。",
    solution: bufferProgram(`int main() {\n    std::size_t count{};\n    if (!(std::cin >> count) || count < 1 || count > 5) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    Buffer original{count};\n    for (std::size_t i = 0; i < count; ++i) {\n        int value{};\n        if (!(std::cin >> value)) {\n            std::cout << \"invalid\\n\";\n            return 0;\n        }\n        original.set(i, value);\n    }\n    Buffer copy{original};\n    copy.set(0, copy.get(0) + 1);\n    Buffer assigned{1};\n    assigned = original;\n    Buffer moved{std::move(copy)};\n    assigned = std::move(moved);\n    show(\"original\", original);\n    show(\"assigned\", assigned);\n    return 0;\n}`),
    input: "3 4 7 9\n",
    tests: [
      { input: "3 4 7 9\n", output: "original: 4 7 9\nassigned: 5 7 9" },
      { input: "1 0\n", output: "original: 0\nassigned: 1" },
      { input: "2 -3 8\n", output: "original: -3 8\nassigned: -2 8" },
    ],
    hiddenTests: [
      { input: "5 1 2 3 4 5\n", output: "original: 1 2 3 4 5\nassigned: 2 2 3 4 5" },
      { input: "6 1 2 3 4 5 6\n", output: "invalid" },
    ],
    hints: ["Bufferのコピー構築は別配列を確保して各要素を複製します。", "コピー代入は一時コピーを作ってswapし、ムーブ代入は古い配列を解放して所有権を受け取ります。", "5つの特殊メンバー関数を確認し、移動元を空にしてから移動先だけを表示します。"],
    debug: { code: "Buffer(const Buffer& other) : data_{other.data_}, size_{other.size_} {}", fix: "data_ = new int[other.size_];", explanation: "ポインターをそのままコピーせず、コピー先が所有する新しい配列を確保して要素を複製します。" },
  }),
];
