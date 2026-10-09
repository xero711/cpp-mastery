import type { LessonSeed } from "../lesson-source.ts";

type Draft = Omit<LessonSeed, "quiz" | "debug"> & {
  quiz: LessonSeed["quiz"];
  debug: LessonSeed["debug"];
};

const makeLesson = (draft: Draft): LessonSeed => draft;

const tempFileClass = `class TempFile {
public:
    explicit TempFile(const std::string& label)
        : label_{label}, file_{std::tmpfile()} {
        if (file_ != nullptr) std::cout << "opened: " << label_ << '\\n';
    }
    ~TempFile() {
        if (file_ != nullptr) {
            std::fclose(file_);
            std::cout << "closed: " << label_ << '\\n';
        }
    }
    bool valid() const { return file_ != nullptr; }
    bool write(const std::string& text) {
        return file_ != nullptr && std::fwrite(text.data(), 1, text.size(), file_) == text.size();
    }
private:
    std::string label_;
    std::FILE* file_{};
};`;

export const week17LessonSeeds: LessonSeed[] = [
  makeLesson({
    title: "RAIIで取得と解放をオブジェクトの寿命に結び付ける",
    goal: "一時ファイルを管理するクラスを作り、コンストラクターで取得した資源をデストラクターで解放する。",
    minutes: 45,
    explanation: "RAIIはResource Acquisition Is Initializationの略です。資源をオブジェクトの初期化と一緒に取得し、そのオブジェクトが破棄されるときに解放します。C++のローカルオブジェクトはスコープを抜けると自動で破棄されるため、通常の処理だけでなく早期returnなどでも解放処理を実行できます。\n\nこの例ではstd::tmpfile()がC標準ライブラリの一時ファイルを開き、std::FILE*を返します。TempFileはそのハンドルを所有し、デストラクターでstd::fclose()を呼びます。取得に失敗した場合はnullptrなので、利用前にvalid()を確認します。ハンドルを自分で使う場所に散らさず、所有者の型に取得と解放をまとめるのが要点です。",
    example: `#include <cstdio>\n#include <iostream>\n#include <string>\n\n${tempFileClass}\n\nint main() {\n    TempFile file{\"save\"};\n    if (!file.valid()) {\n        std::cout << \"unavailable\\n\";\n        return 0;\n    }\n    if (!file.write(\"hello\")) {\n        std::cout << \"write error\\n\";\n        return 0;\n    }\n    std::cout << \"saved: hello\\n\";\n}`,
    exampleOutput: "opened: save\nsaved: hello\nclosed: save",
    commonMistake: "取得したFILE*を使い終えた場所ごとに手動でfclose()しようとする。returnの追加などで閉じ忘れや二重解放が起きやすくなります。ハンドルを一つの所有者オブジェクトに持たせ、スコープ終了時に解放します。",
    quiz: { question: "TempFileが一時ファイルを解放する場所はどこ？", choices: ["TempFileのデストラクター", "呼び出し側すべてのreturn文", "mainの先頭"], answer: 0, explanation: "所有者のデストラクターがFILE*を閉じるため、呼び出し側は通常のスコープ規則に沿って使えます。" },
    prompt: "std::tmpfile()で一時ファイルを開くTempFileを作ります。成功時は opened: <名前> を表示し、write()で文字列を書き込みます。デストラクターはfclose()の後にclosed: <名前> を表示します。名前と内容を読み、保存に成功したら saved: <内容> を表示し、開けない場合は unavailable、書き込み失敗は write error と表示してください。",
    solution: `#include <cstdio>\n#include <iostream>\n#include <string>\n\n${tempFileClass}\n\nint main() {\n    std::string label;\n    std::string text;\n    if (!(std::cin >> label >> text)) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    TempFile file{label};\n    if (!file.valid()) {\n        std::cout << \"unavailable\\n\";\n        return 0;\n    }\n    if (!file.write(text)) {\n        std::cout << \"write error\\n\";\n        return 0;\n    }\n    std::cout << \"saved: \" << text << '\\n';\n    return 0;\n}`,
    input: "save hello\n",
    tests: [
      { input: "save hello\n", output: "opened: save\nsaved: hello\nclosed: save" },
      { input: "backup ready\n", output: "opened: backup\nsaved: ready\nclosed: backup" },
      { input: "draft done\n", output: "opened: draft\nsaved: done\nclosed: draft" },
    ],
    hiddenTests: [{ input: "checkpoint stored\n", output: "opened: checkpoint\nsaved: stored\nclosed: checkpoint" }],
    hints: ["FILE*を取得する場所とfclose()を呼ぶ場所をTempFileにまとめます。", "file_がnullptrなら取得失敗なので、書き込み前にvalid()で確認します。", "TempFileのデストラクターでfclose()した後、ラベルを表示します。"],
    debug: { code: "TempFile::~TempFile() { }", fix: "TempFile::~TempFile() { if (file_) std::fclose(file_); }", explanation: "TempFileがFILE*を所有するなら、そのデストラクターにfclose()を置いて解放責任を一か所へ集めます。" },
  }),
  makeLesson({
    title: "ブロックを抜けると資源が解放される",
    goal: "ブロックの終了によってローカルオブジェクトが破棄され、資源が解放される順序を確認する。",
    minutes: 40,
    explanation: "自動記憶域期間のローカルオブジェクトは、宣言されたブロックを抜けると破棄されます。RAIIの所有者はこの言語の寿命規則を利用するので、利用側が明示的なclose呼び出しを覚えておく必要がありません。\n\n内側のブロックで作ったTempFileは、そのブロックを抜けた直後に閉じます。資源を使う範囲にブロックを合わせれば、解放時点も明確になります。",
    example: `#include <cstdio>\n#include <iostream>\n#include <string>\n\n${tempFileClass}\n\nint main() {\n    std::cout << \"before\\n\";\n    {\n        TempFile file{\"report\"};\n        if (!file.valid()) {\n            std::cout << \"unavailable\\n\";\n            return 0;\n        }\n        std::cout << \"inside\\n\";\n    }\n    std::cout << \"after\\n\";\n}`,
    exampleOutput: "before\nopened: report\ninside\nclosed: report\nafter",
    commonMistake: "明示的にclose()を呼ぶまで資源が残ると思い、使い終わった後も大きなスコープに所有者を置いておく。使う範囲にブロックを合わせると解放時点も明確になります。",
    quiz: { question: "内側のブロックにあるTempFileは、いつ破棄される？", choices: ["内側のブロックを抜けた直後", "mainが終わるまで必ず残る", "次にstd::coutを呼んだとき"], answer: 0, explanation: "自動記憶域期間のオブジェクトは宣言されたブロックを抜けると破棄されます。" },
    prompt: "外側ブロックで before を表示し、内側ブロックで名前の付いたTempFileを作ります。資源が使える場合は inside を表示してください。内側ブロックの後に after を表示します。出力の順序から、閉じる時点が内側ブロックの終了直後であることを確かめます。",
    solution: `#include <cstdio>\n#include <iostream>\n#include <string>\n\n${tempFileClass}\n\nint main() {\n    std::string label;\n    if (!(std::cin >> label)) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    std::cout << \"before\\n\";\n    {\n        TempFile file{label};\n        if (!file.valid()) {\n            std::cout << \"unavailable\\n\";\n            return 0;\n        }\n        std::cout << \"inside\\n\";\n    }\n    std::cout << \"after\\n\";\n    return 0;\n}`,
    input: "report\n",
    tests: [
      { input: "report\n", output: "before\nopened: report\ninside\nclosed: report\nafter" },
      { input: "cache\n", output: "before\nopened: cache\ninside\nclosed: cache\nafter" },
      { input: "level\n", output: "before\nopened: level\ninside\nclosed: level\nafter" },
    ],
    hiddenTests: [{ input: "temporary\n", output: "before\nopened: temporary\ninside\nclosed: temporary\nafter" }],
    hints: ["TempFileの宣言位置が、そのオブジェクトのスコープ開始です。", "内側の波括弧を閉じると、その中のTempFileが破棄されます。", "closedの出力はafterより前に現れます。"],
    debug: { code: "TempFile file{label};\nstd::cout << \"after\\n\";\n// fileのスコープが続く", fix: "{ TempFile file{label}; }\nstd::cout << \"after\\n\";", explanation: "使い終わる位置を内側のブロックの終わりにすれば、所有する資源をそこですぐ解放できます。" },
  }),
  makeLesson({
    title: "早期returnでも所有者が資源を解放する",
    goal: "関数の途中でreturnしても、すでに作られたローカル所有者のデストラクターが呼ばれることを確認する。",
    minutes: 40,
    explanation: "ローカル所有者を作った後でreturnすると、関数から戻る前にスコープを抜けるため、所有者は通常どおり破棄されます。複数のreturn経路それぞれにfclose()を書く必要はありません。\n\nこの保証はソースコード上のreturn位置に依存せず、C++の自動記憶域期間とデストラクター呼び出し規則によるものです。取得に失敗した場合はTempFile自身が無効状態を表し、デストラクターはnullptrに対してfclose()を呼びません。",
    example: `#include <cstdio>\n#include <iostream>\n#include <string>\n\n${tempFileClass}\n\nvoid process(bool stop) {\n    TempFile file{\"job\"};\n    if (!file.valid()) {\n        std::cout << \"unavailable\\n\";\n        return;\n    }\n    std::cout << \"work\\n\";\n    if (stop) {\n        std::cout << \"early return\\n\";\n        return;\n    }\n    std::cout << \"continue\\n\";\n}\n\nint main() {\n    process(false);\n    return 0;\n}`,
    exampleOutput: "opened: job\nwork\ncontinue\nclosed: job",
    commonMistake: "returnの直前にfclose()を足し、別のreturn経路では閉じ忘れる。資源の所有者に解放を任せれば、経路ごとの後片付けを重複させずに済みます。",
    quiz: { question: "TempFileを作った後の早期returnで起きることは？", choices: ["returnの前にTempFileのデストラクターが呼ばれる", "デストラクターはmain終了まで延期される", "returnするとfclose()は実行できない"], answer: 0, explanation: "returnでブロックを抜けると、そのブロック内で構築済みのローカルオブジェクトが破棄されます。" },
    prompt: "整数を読み、TempFile jobを作るprocess()を書きます。入力が1なら work と early return を表示してreturnし、それ以外なら work と continue を表示します。どちらの経路でも最後に closed: job が一度だけ表示されることを確認してください。",
    solution: `#include <cstdio>\n#include <iostream>\n#include <string>\n\n${tempFileClass}\n\nvoid process(bool stop) {\n    TempFile file{\"job\"};\n    if (!file.valid()) {\n        std::cout << \"unavailable\\n\";\n        return;\n    }\n    std::cout << \"work\\n\";\n    if (stop) {\n        std::cout << \"early return\\n\";\n        return;\n    }\n    std::cout << \"continue\\n\";\n}\n\nint main() {\n    int stop{};\n    if (!(std::cin >> stop) || (stop != 0 && stop != 1)) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    process(stop == 1);\n    return 0;\n}`,
    input: "1\n",
    tests: [
      { input: "1\n", output: "opened: job\nwork\nearly return\nclosed: job" },
      { input: "0\n", output: "opened: job\nwork\ncontinue\nclosed: job" },
      { input: "2\n", output: "invalid" },
    ],
    hiddenTests: [{ input: "-1\n", output: "invalid" }],
    hints: ["process()のローカル変数としてTempFileを作ります。", "stopがtrueなら明示的にfclose()せずreturnします。", "returnでprocess()のスコープを抜けるとfileのデストラクターが動きます。"],
    debug: { code: "if (stop) return;\nstd::fclose(file);", fix: "if (stop) return; // TempFileのデストラクターが閉じる", explanation: "所有者が解放を担当する設計では、呼び出し側で手動のfclose()を重ねません。" },
  }),
  makeLesson({
    title: "例外によるスタック巻き戻しでも解放する",
    goal: "例外が関数から呼び出し元へ伝わる途中で、ローカル所有者が破棄されることを確かめる。",
    minutes: 45,
    explanation: "例外が投げられると、catchに到達する前に、例外発生地点から抜けるスコープのローカルオブジェクトが破棄されます。この処理をスタック巻き戻し（stack unwinding）と呼びます。RAIIならreturnだけでなく例外経路でもデストラクターが資源を解放します。\n\nTempFileの後で例外を投げると、catchブロックが実行されるより先にTempFileが閉じます。例外を使わないプログラムでも同じ寿命規則が成り立ちますが、例外安全性を考えるときに特に重要です。",
    example: `#include <cstdio>\n#include <iostream>\n#include <stdexcept>\n#include <string>\n\n${tempFileClass}\n\nvoid run(bool fail) {\n    TempFile file{\"task\"};\n    if (!file.valid()) {\n        std::cout << \"unavailable\\n\";\n        return;\n    }\n    std::cout << \"work\\n\";\n    if (fail) throw std::runtime_error{\"failed\"};\n    std::cout << \"done\\n\";\n}\n\nint main() {\n    try {\n        run(true);\n    } catch (const std::runtime_error&) {\n        std::cout << \"caught\\n\";\n    }\n}`,
    exampleOutput: "opened: task\nwork\nclosed: task\ncaught",
    commonMistake: "catchブロックだけにfclose()を書く。例外がcatchへ届く時点では、例外を投げた関数のローカル所有者はすでに破棄されています。所有者のデストラクターで解放します。",
    quiz: { question: "run()内で例外が投げられたとき、catchより前にTempFileが閉じる理由は？", choices: ["スタック巻き戻しでrun()のローカルオブジェクトが破棄される", "catchが自動でFILE*を探して閉じる", "例外を投げると全てのファイルがOSにより閉じる"], answer: 0, explanation: "例外がスコープを抜けるとき、構築済みのローカルオブジェクトのデストラクターが呼ばれます。" },
    prompt: "0または1を読み、run()でTempFile taskを作ってworkを表示します。1ならruntime_errorを投げ、catchでcaughtを表示します。0ならdoneを表示します。例外経路ではcaughtより先にclosed: taskが出ることをテストします。",
    solution: `#include <cstdio>\n#include <iostream>\n#include <stdexcept>\n#include <string>\n\n${tempFileClass}\n\nvoid run(bool fail) {\n    TempFile file{\"task\"};\n    if (!file.valid()) {\n        std::cout << \"unavailable\\n\";\n        return;\n    }\n    std::cout << \"work\\n\";\n    if (fail) throw std::runtime_error{\"failed\"};\n    std::cout << \"done\\n\";\n}\n\nint main() {\n    int fail{};\n    if (!(std::cin >> fail) || (fail != 0 && fail != 1)) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    try {\n        run(fail == 1);\n    } catch (const std::runtime_error&) {\n        std::cout << \"caught\\n\";\n    }\n    return 0;\n}`,
    input: "1\n",
    tests: [
      { input: "1\n", output: "opened: task\nwork\nclosed: task\ncaught" },
      { input: "0\n", output: "opened: task\nwork\ndone\nclosed: task" },
      { input: "3\n", output: "invalid" },
    ],
    hiddenTests: [{ input: "-1\n", output: "invalid" }],
    hints: ["例外を投げる前にTempFileをローカル変数として作ります。", "run()の例外が呼び出し元へ出ると、run()のスコープを抜けます。", "catchはrun()のローカル変数が破棄された後に実行されます。"],
    debug: { code: "try { run(); } catch (...) { std::fclose(file); }", fix: "try { run(); } catch (...) { /* run内のTempFileが解放済み */ }", explanation: "catchへ到達する前のスタック巻き戻しで、例外を投げた関数のTempFileが解放を済ませます。" },
  }),
  makeLesson({
    title: "メンバーとして持つ資源も自動で解放する",
    goal: "別のオブジェクトが資源所有者をメンバーとして持ち、メンバーの寿命へ解放を委ねる。",
    minutes: 40,
    explanation: "RAIIの所有者をメンバーにすると、外側のオブジェクトの寿命に合わせて資源を管理できます。外側のクラスでデストラクターを書かなくても、メンバー自身のデストラクターが呼ばれます。\n\nメンバーはクラス内の宣言順に構築され、外側のオブジェクトが破棄されると逆順で破棄されます。ArchiveはprimaryとbackupのTempFileを所有します。Archiveの利用側は個々のFILE*やfclose()を知らず、オブジェクトの作成と使用だけを行います。",
    example: `#include <cstdio>\n#include <iostream>\n#include <string>\n\n${tempFileClass}\n\nclass Archive {\npublic:\n    Archive(const std::string& primary, const std::string& backup)\n        : primary_{primary}, backup_{backup} {}\n    bool ready() const { return primary_.valid() && backup_.valid(); }\nprivate:\n    TempFile primary_;\n    TempFile backup_;\n};\n\nint main() {\n    Archive archive{\"primary\", \"backup\"};\n    if (!archive.ready()) return 0;\n    std::cout << \"archive ready\\n\";\n}`,
    exampleOutput: "opened: primary\nopened: backup\narchive ready\nclosed: backup\nclosed: primary",
    commonMistake: "Archiveのデストラクターにも各FILE*のfclose()を書き、TempFileのデストラクターと二重に閉じる。メンバーに所有者を持たせたら、メンバー自身の寿命管理へ任せます。",
    quiz: { question: "ArchiveがTempFileメンバーを持つ場合、どのオブジェクトがfclose()する？", choices: ["それぞれのTempFileのデストラクター", "Archiveの利用側が毎回手動で呼ぶ", "Archiveのメンバー変数をすべてpublicにして呼ぶ"], answer: 0, explanation: "所有者をメンバーにすると、メンバーのデストラクターが自分の資源を解放します。" },
    prompt: "Archiveクラスにprimaryとbackupという順番でTempFileメンバーを持たせます。2つの名前を読み、両方の一時ファイルが有効なら archive ready、そうでなければ unavailable と表示します。Archive自身にfclose()を書く必要はありません。破棄時はbackup、primaryの順にclosedが表示されます。",
    solution: `#include <cstdio>\n#include <iostream>\n#include <string>\n\n${tempFileClass}\n\nclass Archive {\npublic:\n    Archive(const std::string& primary, const std::string& backup)\n        : primary_{primary}, backup_{backup} {}\n    bool ready() const { return primary_.valid() && backup_.valid(); }\nprivate:\n    TempFile primary_;\n    TempFile backup_;\n};\n\nint main() {\n    std::string primary;\n    std::string backup;\n    if (!(std::cin >> primary >> backup)) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    Archive archive{primary, backup};\n    if (!archive.ready()) {\n        std::cout << \"unavailable\\n\";\n        return 0;\n    }\n    std::cout << \"archive ready\\n\";\n    return 0;\n}`,
    input: "primary backup\n",
    tests: [
      { input: "primary backup\n", output: "opened: primary\nopened: backup\narchive ready\nclosed: backup\nclosed: primary" },
      { input: "save copy\n", output: "opened: save\nopened: copy\narchive ready\nclosed: copy\nclosed: save" },
      { input: "world local\n", output: "opened: world\nopened: local\narchive ready\nclosed: local\nclosed: world" },
    ],
    hiddenTests: [{ input: "main mirror\n", output: "opened: main\nopened: mirror\narchive ready\nclosed: mirror\nclosed: main" }],
    hints: ["ArchiveのメンバーにTempFileを置きます。", "メンバーの初期化順は宣言順です。", "Archiveが破棄されるとbackup、primaryの順にメンバーが破棄されます。"],
    debug: { code: "~Archive() { std::fclose(primaryHandle_); std::fclose(backupHandle_); }", fix: "class Archive { TempFile primary_; TempFile backup_; };", explanation: "資源所有者をメンバーに持てば、メンバーのデストラクターがそれぞれ解放します。外側で同じ資源を二重解放しません。" },
  }),
  makeLesson({
    title: "標準ライブラリの型にメモリ管理を任せる",
    goal: "std::stringとstd::vectorが所有する動的メモリを、明示的な解放なしで利用する。",
    minutes: 40,
    explanation: "std::stringやstd::vectorは内部で必要な動的メモリを管理し、オブジェクトが破棄されると自動で解放します。これらもRAIIを採用する標準ライブラリの型です。普段のコードでは、確立された所有者型を使い、new/deleteやmalloc/freeを直接組み合わせる場所を減らします。\n\nこの課題では入力された文字列をvectorへ追加し、内容を表示します。vectorの要素数が変わると内部バッファを再確保する場合がありますが、利用側はその確保や解放を手動で追跡しません。コンテナの操作と値の扱いに集中できます。",
    example: "#include <iostream>\n#include <string>\n#include <vector>\n\nint main() {\n    std::vector<std::string> words{\"red\", \"blue\"};\n    words.emplace_back(\"green\");\n    std::cout << \"items: \" << words.size() << '\\n';\n    for (const std::string& word : words) {\n        std::cout << word << ' ';\n    }\n    std::cout << '\\n';\n}",
    exampleOutput: "items: 3\nred blue green",
    commonMistake: "vectorやstringの内部バッファに対してdeleteを呼ぼうとする。標準ライブラリ型が所有するメモリは、その型自身に管理を任せます。",
    quiz: { question: "std::vectorが内部バッファに使ったメモリは、通常いつ解放される？", choices: ["vectorオブジェクトの寿命が終わるとき", "各要素を表示するたび", "利用側がdata()へdeleteを呼んだとき"], answer: 0, explanation: "vectorは自分が所有するバッファを管理し、破棄時に解放します。data()が返すポインタは所有権を渡すものではありません。" },
    prompt: "個数n（0〜5）とn個の単語を読み、std::vector<std::string>へ格納します。items: n を1行目に表示し、2行目に単語を入力順で空白区切りに表示してください。個数が範囲外か入力が不足している場合は invalid と表示します。new/deleteは使わず、コンテナの寿命に管理を任せます。",
    solution: "#include <iostream>\n#include <string>\n#include <vector>\n\nint main() {\n    int count{};\n    if (!(std::cin >> count) || count < 0 || count > 5) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    std::vector<std::string> words;\n    for (int i = 0; i < count; ++i) {\n        std::string word;\n        if (!(std::cin >> word)) {\n            std::cout << \"invalid\\n\";\n            return 0;\n        }\n        words.push_back(word);\n    }\n    std::cout << \"items: \" << words.size() << '\\n';\n    for (std::size_t i = 0; i < words.size(); ++i) {\n        if (i > 0) std::cout << ' ';\n        std::cout << words[i];\n    }\n    std::cout << '\\n';\n    return 0;\n}",
    input: "3 red blue green\n",
    tests: [
      { input: "3 red blue green\n", output: "items: 3\nred blue green" },
      { input: "1 amber\n", output: "items: 1\namber" },
      { input: "0\n", output: "items: 0\n" },
    ],
    hiddenTests: [
      { input: "5 a b c d e\n", output: "items: 5\na b c d e" },
      { input: "6 a b c d e f\n", output: "invalid" },
    ],
    hints: ["入力個数を検証してからvectorを作ります。", "読み取った単語をpush_back()で追加します。", "size()と添字アクセスで表示し、手動のメモリ解放は書きません。"],
    debug: { code: "std::vector<int> values{1, 2};\ndelete values.data();", fix: "std::vector<int> values(2, 0);\nvalues[0] = 1;\nvalues[1] = 2;", explanation: "data()はvector所有の領域を指します。利用側がdeleteすると、vector破棄時にも解放されて二重解放になります。vectorに値を保持させ、明示的な解放をしません。" },
  }),
  makeLesson({
    title: "所有者のコピーを禁止して二重解放を防ぐ",
    goal: "独自の資源所有クラスが誤ってコピーされないようにし、所有権の境界を設計する。",
    minutes: 45,
    explanation: "FILE*のように一つだけ閉じるべきハンドルを、単純にコピーすると、二つのオブジェクトが同じハンドルを所有したと思い込み、両方のデストラクターが閉じる危険があります。この初歩の所有者では、コピーコンストラクターとコピー代入演算子をdelete指定して、コピーをコンパイル時に禁止します。\n\n外側のSaveSessionはTempFileをメンバーに持ち、書き込み操作を委譲します。SaveSession自身に解放コードは不要です。コピーを禁止した型はムーブ可能にもできますが、ムーブの仕組みやRule of Fiveは次週に学びます。ここでは「誰が資源を所有し、コピーできるか」を明確にするところまで扱います。",
    example: `#include <cstdio>\n#include <iostream>\n#include <string>\n#include <type_traits>\n\nclass TempFile {\npublic:\n    explicit TempFile(const std::string& label)\n        : label_{label}, file_{std::tmpfile()} {\n        if (file_ != nullptr) std::cout << "opened: " << label_ << '\\n';\n    }\n    ~TempFile() {\n        if (file_ != nullptr) {\n            std::fclose(file_);\n            std::cout << "closed: " << label_ << '\\n';\n        }\n    }\n    TempFile(const TempFile&) = delete;\n    TempFile& operator=(const TempFile&) = delete;\n    bool valid() const { return file_ != nullptr; }\n    bool write(const std::string& text) {\n        return file_ != nullptr && std::fwrite(text.data(), 1, text.size(), file_) == text.size();\n    }\nprivate:\n    std::string label_;\n    std::FILE* file_{};\n};\n\nstatic_assert(!std::is_copy_constructible_v<TempFile>);\n\nclass SaveSession {\npublic:\n    explicit SaveSession(const std::string& label) : file_{label} {}\n    bool ready() const { return file_.valid(); }\n    bool save(const std::string& text) { return file_.write(text); }\nprivate:\n    TempFile file_;\n};\n\nint main() {\n    SaveSession session{\"slot\"};\n    if (session.ready() && session.save(\"data\")) {\n        std::cout << \"saved\\n\";\n    }\n}`,
    exampleOutput: "opened: slot\nsaved\nclosed: slot",
    commonMistake: "FILE*を保持するクラスのデフォルトコピーを許可し、同じハンドルを二つのオブジェクトから閉じる。単一所有の型ではコピーを禁止するか、明確な所有権移転を設計します。",
    quiz: { question: "TempFileでコピーコンストラクターをdelete指定する主な理由は？", choices: ["同じFILE*を複数のオブジェクトが閉じる二重解放を防ぐ", "tmpfile()を呼べなくする", "std::stringのコピーも禁止する"], answer: 0, explanation: "FILE*のような単一所有資源をデフォルトコピーすると、二つの所有者が同じハンドルを解放し得ます。" },
    prompt: "TempFileは一時ファイルを所有します。コピーコンストラクターとコピー代入演算子をdelete指定し、std::is_copy_constructible_vでコピー不可をstatic_assertしてください。SaveSessionはTempFileをメンバーとして持ち、ready()とsave()を委譲します。入力された名前と内容を保存し、成功時はsavedを表示します。オブジェクトのスコープ終了で資源が一度だけ閉じられます。",
    solution: `#include <cstdio>\n#include <iostream>\n#include <string>\n#include <type_traits>\n\nclass TempFile {\npublic:\n    explicit TempFile(const std::string& label)\n        : label_{label}, file_{std::tmpfile()} {\n        if (file_ != nullptr) std::cout << "opened: " << label_ << '\\n';\n    }\n    ~TempFile() {\n        if (file_ != nullptr) {\n            std::fclose(file_);\n            std::cout << "closed: " << label_ << '\\n';\n        }\n    }\n    TempFile(const TempFile&) = delete;\n    TempFile& operator=(const TempFile&) = delete;\n    bool valid() const { return file_ != nullptr; }\n    bool write(const std::string& text) {\n        return file_ != nullptr && std::fwrite(text.data(), 1, text.size(), file_) == text.size();\n    }\nprivate:\n    std::string label_;\n    std::FILE* file_{};\n};\n\nstatic_assert(!std::is_copy_constructible_v<TempFile>);\n\nclass SaveSession {\npublic:\n    explicit SaveSession(const std::string& label) : file_{label} {}\n    bool ready() const { return file_.valid(); }\n    bool save(const std::string& text) { return file_.write(text); }\nprivate:\n    TempFile file_;\n};\n\nint main() {\n    std::string label;\n    std::string text;\n    if (!(std::cin >> label >> text)) {\n        std::cout << \"invalid\\n\";\n        return 0;\n    }\n    SaveSession session{label};\n    if (!session.ready()) {\n        std::cout << \"unavailable\\n\";\n        return 0;\n    }\n    if (!session.save(text)) {\n        std::cout << \"write error\\n\";\n        return 0;\n    }\n    std::cout << \"saved\\n\";\n    return 0;\n}`,
    input: "slot data\n",
    tests: [
      { input: "slot data\n", output: "opened: slot\nsaved\nclosed: slot" },
      { input: "profile state\n", output: "opened: profile\nsaved\nclosed: profile" },
      { input: "checkpoint ready\n", output: "opened: checkpoint\nsaved\nclosed: checkpoint" },
    ],
    hiddenTests: [{ input: "backup snapshot\n", output: "opened: backup\nsaved\nclosed: backup" }],
    hints: ["コピーコンストラクターとコピー代入演算子をpublic節に宣言し、= deleteを付けます。", "static_assertでTempFileがコピー構築できないことをコンパイル時に確かめます。", "SaveSessionのメンバーにTempFileを置き、操作を委譲して解放はメンバーに任せます。"],
    debug: { code: "TempFile(const TempFile&) = default;", fix: "= delete;", explanation: "単一所有のFILE*をコピーすると複数のデストラクターが同じハンドルを閉じるため、この段階ではコピーを禁止します。" },
  }),
];
