import type { LessonSeed } from "../lesson-source.ts";

type Draft = Omit<LessonSeed, "quiz" | "debug"> & {
  quiz: LessonSeed["quiz"];
  debug: LessonSeed["debug"];
};

const makeLesson = (draft: Draft): LessonSeed => draft;

export const week12LessonSeeds: LessonSeed[] = [
  makeLesson({
    title: "std::stringの長さと文字アクセス",
    goal: "文字列の長さを取得し、範囲内の位置から文字を安全に読む。",
    minutes: 35,
    explanation: "`std::string` は可変長の文字列を管理する標準ライブラリ型です。`size()` は保持している文字数を返し、`empty()` は長さが0かを調べます。\n\n`text[i]` で位置を指定できますが、正しい位置は0以上 `text.size()` 未満です。`text.size()` 自体は末尾の次を表すため、文字アクセスには使えません。\n\nここでいう文字数は `std::string` が保持する `char` の要素数です。UTF-8の日本語では、見た目の文字数とバイト数が一致しない場合があります。",
    example: `#include <iostream>
#include <string>

int main() {
    const std::string text{"C++"};
    std::cout << "text: " << text << std::endl;
    std::cout << "length: " << text.size() << std::endl;
    std::cout << "first: " << text[0] << std::endl;
}`,
    exampleOutput: "text: C++\nlength: 3\nfirst: C",
    commonMistake: "最後の文字の位置を `text.size()` にする。末尾の位置は `text.size() - 1` ですが、空文字列では先に empty() を調べます。",
    quiz: { question: "長さが4の文字列で、最後の要素の位置は？", choices: ["3", "4", "5"], answer: 0, explanation: "位置は0から始まり、長さ4なら有効な位置は0〜3です。" },
    prompt: "1語を読み、`text: <文字列>` と `length: <長さ>` を表示します。空文字列は入力されない前提です。長さは `std::string::size()` で求めてください。",
    solution: `#include <iostream>
#include <string>

int main() {
    std::string text;
    std::cin >> text;
    std::cout << "text: " << text << std::endl;
    std::cout << "length: " << text.size() << std::endl;
    return 0;
}`,
    input: "hello\n",
    tests: [
      { input: "hello\n", output: "text: hello\nlength: 5" },
      { input: "CPlusPlus\n", output: "text: CPlusPlus\nlength: 9" },
      { input: "game\n", output: "text: game\nlength: 4" },
    ],
    hiddenTests: [{ input: "x\n", output: "text: x\nlength: 1" }],
    hints: ["入力先を std::string にします。", "文字列全体はそのまま std::cout に渡せます。", "長さは text.size() の戻り値を表示します。"],
    debug: { code: "std::cout << text[text.size()];", fix: "if (!text.empty()) std::cout << text[text.size() - 1];", explanation: "size() は末尾の次の位置です。最後の文字は size()-1 ですが、空ならその位置もありません。" },
  }),
  makeLesson({
    title: "findで文字列を検索する",
    goal: "std::string::findの戻り値を使い、見つかった位置と未発見を区別する。",
    minutes: 40,
    explanation: "`std::string::find` は部分文字列が最初に見つかった位置を返します。見つからないときは `std::string::npos` です。位置0も有効な結果なので、戻り値を `if (position)` のような真偽値として扱ってはいけません。\n\n`npos` との比較で見つかったかを判定し、見つかった場合にだけ位置を表示します。`find` の位置も0から始まります。",
    example: `#include <iostream>
#include <string>

int main() {
    const std::string text{"C++ strings"};
    const std::size_t position = text.find("strings");
    if (position == std::string::npos) {
        std::cout << "missing" << std::endl;
    } else {
        std::cout << "found at: " << position << std::endl;
    }
}`,
    exampleOutput: "found at: 4",
    commonMistake: "findの結果を整数の0/1だけで判定する。先頭位置の0と未発見のnposを別々に比較します。",
    quiz: { question: "findが文字列の先頭で一致したときの戻り値は？", choices: ["0", "1", "std::string::npos"], answer: 0, explanation: "先頭のインデックスは0です。未発見を表すnposとは異なります。" },
    prompt: "本文と検索語をそれぞれ1行で読みます。見つかったら `found at: <位置>`、見つからなければ `missing` と表示します。",
    solution: `#include <iostream>
#include <string>

int main() {
    std::string text;
    std::string query;
    std::getline(std::cin, text);
    std::getline(std::cin, query);
    const std::size_t position = text.find(query);
    if (position == std::string::npos) {
        std::cout << "missing" << std::endl;
    } else {
        std::cout << "found at: " << position << std::endl;
    }
    return 0;
}`,
    input: "learn C++ strings\nC++\n",
    tests: [
      { input: "learn C++ strings\nC++\n", output: "found at: 6" },
      { input: "C++ is useful\nC++\n", output: "found at: 0" },
      { input: "string search\nvector\n", output: "missing" },
    ],
    hiddenTests: [{ input: "empty query\n\n", output: "found at: 0" }],
    hints: ["本文と検索語をgetlineで読みます。", "text.find(query) の戻り値をstd::string::nposと比較します。", "nposでない場合は位置をそのまま表示します。"],
    debug: { code: "if (text.find(query)) std::cout << \"found\";", fix: "if (text.find(query) != std::string::npos) std::cout << \"found\";", explanation: "位置0はfalseのように扱われ、未発見のnposは真になります。nposと明示比較します。" },
  }),
  makeLesson({
    title: "vectorへ要素を追加する",
    goal: "可変長配列vectorへpush_backで値を追加し、sizeと走査で確認する。",
    minutes: 40,
    explanation: "`std::vector<T>` は同じ型の要素を順番に保持する可変長コンテナです。空のvectorへ `push_back(value)` を呼ぶと末尾に要素が追加され、`size()` が要素数を返します。\n\n配列のように最大要素数を先に決めなくても、必要に応じて追加できます。要素数が変わるため、追加前に覚えた位置や参照の有効性は後の週で詳しく扱います。\n\nこの課題では入力数に上限を設け、負数や大きすぎる件数を拒否します。",
    example: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> values;
    values.push_back(8);
    values.push_back(3);
    std::cout << "size: " << values.size() << std::endl;
    std::cout << "last: " << values.back() << std::endl;
}`,
    exampleOutput: "size: 2\nlast: 3",
    commonMistake: "capacityとsizeを同じものと考える。size()は実際に入っている要素数を表します。",
    quiz: { question: "空のvectorへpush_backを3回呼んだ後、size()はいくつ？", choices: ["0", "3", "確保容量と同じ"], answer: 1, explanation: "push_backを呼ぶたびに要素が1つ増え、sizeは3になります。" },
    prompt: "整数の件数 n と続く n 個の整数を読み、vectorへ順にpush_backで追加します。nが0〜100なら `size: <件数>` と `values:` の後に値を表示し、範囲外なら `invalid` と表示します。",
    solution: `#include <iostream>
#include <vector>

int main() {
    int count{};
    std::cin >> count;
    if (count < 0 || count > 100) {
        std::cout << "invalid" << std::endl;
        return 0;
    }

    std::vector<int> values;
    for (int i = 0; i < count; ++i) {
        int value{};
        std::cin >> value;
        values.push_back(value);
    }

    std::cout << "size: " << values.size() << std::endl;
    std::cout << "values:";
    for (const int value : values) std::cout << " " << value;
    std::cout << std::endl;
    return 0;
}`,
    input: "3\n5 8 -2\n",
    tests: [
      { input: "3\n5 8 -2\n", output: "size: 3\nvalues: 5 8 -2" },
      { input: "0\n", output: "size: 0\nvalues:" },
      { input: "2\n9 1\n", output: "size: 2\nvalues: 9 1" },
    ],
    hiddenTests: [{ input: "-1\n", output: "invalid" }],
    hints: ["最初に件数が0〜100か確認します。", "空のvector<int>を作り、入力ごとにpush_backします。", "size()で要素数を表示してから、範囲forで値を表示します。"],
    debug: { code: "std::vector<int> values(100); values.push_back(value);", fix: "std::vector<int> values; values.push_back(value);", explanation: "vector<int>(100)は100個の要素を持つvectorを作ります。空から追加するなら引数なしで作ります。" },
  }),
  makeLesson({
    title: "vectorの範囲を確認して読む",
    goal: "要素数とインデックスを比較し、範囲外アクセスを行わない。",
    minutes: 40,
    explanation: "vectorの有効なインデックスは0から `size() - 1` までです。要素数が0なら有効な位置はありません。\n\n`values[index]` は範囲外かどうかを実行時に確認しません。アクセスする前に負の位置と、要素数以上の位置を調べます。負の整数を符号なしのsize_typeへ変換する前に確認することも大切です。",
    example: `#include <iostream>
#include <vector>

int main() {
    const std::vector<int> values{4, 7, 9};
    const int index{2};
    if (index < 0 || static_cast<std::size_t>(index) >= values.size()) {
        std::cout << "out of range" << std::endl;
    } else {
        std::cout << "value: " << values[index] << std::endl;
    }
}`,
    exampleOutput: "value: 9",
    commonMistake: "条件を `index > values.size()` と書き、sizeと同じ位置を許可する。境界は `index >= size()` です。",
    quiz: { question: "要素数が3のvectorでindex=3は有効？", choices: ["有効", "無効", "空の要素を指す"], answer: 1, explanation: "有効な位置は0、1、2です。indexがsizeと等しい場合は範囲外です。" },
    prompt: "件数、要素、読み取り位置を読みます。件数が1〜100ならvectorに値を読み、位置が0以上size未満なら `value: <値>`、そうでなければ `out of range` と表示します。件数が範囲外なら `invalid` と表示します。",
    solution: `#include <iostream>
#include <vector>

int main() {
    int count{};
    std::cin >> count;
    if (count < 1 || count > 100) {
        std::cout << "invalid" << std::endl;
        return 0;
    }

    std::vector<int> values;
    for (int i = 0; i < count; ++i) {
        int value{};
        std::cin >> value;
        values.push_back(value);
    }

    int index{};
    std::cin >> index;
    if (index < 0 || static_cast<std::size_t>(index) >= values.size()) {
        std::cout << "out of range" << std::endl;
    } else {
        std::cout << "value: " << values[index] << std::endl;
    }
    return 0;
}`,
    input: "4\n8 5 12 3\n2\n",
    tests: [
      { input: "4\n8 5 12 3\n2\n", output: "value: 12" },
      { input: "2\n4 7\n-1\n", output: "out of range" },
      { input: "2\n4 7\n2\n", output: "out of range" },
    ],
    hiddenTests: [{ input: "1\n9\n0\n", output: "value: 9" }],
    hints: ["vectorを作り、件数分の値を追加します。", "位置が負ならsize_typeへ変換する前に拒否します。", "位置がsize()以上か調べてからvalues[index]を読みます。"],
    debug: { code: "if (index > values.size()) std::cout << values[index];", fix: "if (index < 0 || static_cast<std::size_t>(index) >= values.size()) std::cout << \"out of range\"; else std::cout << values[index];", explanation: "負の値もsize()と同じ位置も範囲外です。アクセス前に両方を確認します。" },
  }),
  makeLesson({
    title: "範囲forでコンテナを走査する",
    goal: "vectorの全要素を範囲forで読み取り、インデックス管理の誤りを減らす。",
    minutes: 35,
    explanation: "範囲forはコンテナの先頭から末尾まで要素ごとに処理します。インデックスの初期化や終了条件を書かずに済み、境界を一つ間違える問題を避けやすくなります。\n\n読み取りだけなら `const` を付けた参照で要素を受け取れます。小さなintなら値で受け取っても構いません。要素を書き換える場合はconstを外し、どの変更がコンテナへ反映されるかを意識します。",
    example: `#include <iostream>
#include <string>
#include <vector>

int main() {
    const std::vector<std::string> names{"Mira", "Ren", "Kai"};
    for (const std::string& name : names) {
        std::cout << name << std::endl;
    }
}`,
    exampleOutput: "Mira\nRen\nKai",
    commonMistake: "範囲forのループ変数を値で受け取り、変更が元の要素にも反映されると思う。読み取り目的を型で示します。",
    quiz: { question: "vectorの要素を変更せず読むときのループ変数として適切なのは？", choices: ["const T&", "T*を必ず使う", "サイズだけ"], answer: 0, explanation: "const参照はコピーを避け、読み取り専用であることを示します。" },
    prompt: "件数 n と n 個の名前を読みvectorに保存します。`count: <件数>` の後に、入力順のまま `1: <名前>` から番号を付けて表示します。件数は0〜100です。",
    solution: `#include <iostream>
#include <string>
#include <vector>

int main() {
    int count{};
    std::cin >> count;
    if (count < 0 || count > 100) {
        std::cout << "invalid" << std::endl;
        return 0;
    }

    std::vector<std::string> names;
    for (int i = 0; i < count; ++i) {
        std::string name;
        std::cin >> name;
        names.push_back(name);
    }

    std::cout << "count: " << names.size() << std::endl;
    int number{1};
    for (const std::string& name : names) {
        std::cout << number << ": " << name << std::endl;
        ++number;
    }
    return 0;
}`,
    input: "3\nMira Ren Kai\n",
    tests: [
      { input: "3\nMira Ren Kai\n", output: "count: 3\n1: Mira\n2: Ren\n3: Kai" },
      { input: "0\n", output: "count: 0" },
      { input: "2\nA B\n", output: "count: 2\n1: A\n2: B" },
    ],
    hiddenTests: [{ input: "1\nSolo\n", output: "count: 1\n1: Solo" }],
    hints: ["件数を確認してから名前をvectorへ追加します。", "件数はnames.size()で得られます。", "範囲forで名前を読み、別の整数カウンターを表示用に増やします。"],
    debug: { code: "for (const std::string name : names) name += \"!\";", fix: "for (const std::string& name : names) std::cout << name << std::endl;", explanation: "値コピーへ追加しても元の要素は変わりません。この課題は読み取りなのでconst参照を表示に使います。" },
  }),
  makeLesson({
    title: "sortとfindで基本アルゴリズムを使う",
    goal: "標準アルゴリズムへコンテナ範囲を渡し、整列と検索を行う。",
    minutes: 45,
    explanation: "標準ライブラリには、コンテナの範囲を処理するアルゴリズムがあります。`std::sort(first, last)` はfirstからlastの直前までを昇順に整列します。`std::find(first, last, value)` は一致要素を探し、見つからなければlastを返します。\n\nvectorの範囲は `begin()` と `end()` で渡せます。アルゴリズムを自分で書く前に、標準ライブラリに目的に合う処理があるか調べる習慣を付けます。",
    example: `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{8, 2, 5, 2};
    std::sort(values.begin(), values.end());
    std::cout << "sorted:";
    for (const int value : values) std::cout << " " << value;
    const auto found = std::find(values.begin(), values.end(), 5);
    std::cout << std::endl << "has 5: " << (found != values.end()) << std::endl;
}`,
    exampleOutput: "sorted: 2 2 5 8\nhas 5: 1",
    commonMistake: "アルゴリズムの範囲終端を最後の要素として渡す。end()は末尾の次の位置です。",
    quiz: { question: "std::findが値を見つけなかったときに返すものは？", choices: ["渡したend iterator", "0", "新しい空要素"], answer: 0, explanation: "見つからないときは探索範囲の終端iteratorを返します。" },
    prompt: "件数 n と n 個の整数、検索値を読みます。nが0〜100なら昇順に整列し、`sorted:` に値を表示します。検索値があれば `result: found`、なければ `result: missing` と表示してください。",
    solution: `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int count{};
    std::cin >> count;
    if (count < 0 || count > 100) {
        std::cout << "invalid" << std::endl;
        return 0;
    }

    std::vector<int> values;
    for (int i = 0; i < count; ++i) {
        int value{};
        std::cin >> value;
        values.push_back(value);
    }
    int target{};
    std::cin >> target;

    std::sort(values.begin(), values.end());
    std::cout << "sorted:";
    for (const int value : values) std::cout << " " << value;
    std::cout << std::endl;

    const auto found = std::find(values.begin(), values.end(), target);
    std::cout << "result: " << (found == values.end() ? "missing" : "found") << std::endl;
    return 0;
}`,
    input: "5\n8 2 8 1 4\n8\n",
    tests: [
      { input: "5\n8 2 8 1 4\n8\n", output: "sorted: 1 2 4 8 8\nresult: found" },
      { input: "4\n6 3 9 1\n7\n", output: "sorted: 1 3 6 9\nresult: missing" },
      { input: "0\n5\n", output: "sorted:\nresult: missing" },
    ],
    hiddenTests: [{ input: "3\n-4 0 2\n-4\n", output: "sorted: -4 0 2\nresult: found" }],
    hints: ["読み込んだ値をvectorに追加します。", "std::sortにbegin()とend()を渡します。", "std::findの結果がend()と等しいかで見つかったかを判定します。"],
    debug: { code: "std::sort(values.begin(), values.end() - 1);", fix: "const auto first = values.begin();\nconst auto last = values.end();\nstd::sort(first, last);", explanation: "end()は範囲の末尾の次を表すため、終端iteratorをそのまま渡します。" },
  }),
  makeLesson({
    title: "統合：単語リストを整列して数える",
    goal: "vector<string>、範囲for、sort、countを組み合わせて小さな単語リストを処理する。",
    minutes: 50,
    explanation: "標準コンテナとアルゴリズムを組み合わせると、データ構造と処理を分けて書けます。vectorは値を保持し、sortは順序を整え、countは指定値の出現回数を数えます。\n\nこの課題では単語をvectorへ保存し、辞書順に表示した後、検索語の個数を数えます。重複がある場合もすべて数えます。件数を制限し、空のリストでは整列と検索範囲が空になることを確認します。",
    example: `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> words{"red", "blue", "red"};
    std::sort(words.begin(), words.end());
    std::cout << "words:";
    for (const std::string& word : words) std::cout << " " << word;
    std::cout << std::endl;
    std::cout << std::count(words.begin(), words.end(), "red") << std::endl;
}`,
    exampleOutput: "words: blue red red\n2",
    commonMistake: "検索語が一度でも見つかったかだけを数え、重複出現を無視する。countは範囲内の一致数を返します。",
    quiz: { question: "同じ値がvectorに3つあるとき、std::countは何を返す？", choices: ["3", "1", "trueだけ"], answer: 0, explanation: "countは範囲内にある一致要素の個数を返します。" },
    prompt: "件数 n、n 個の単語、検索語を読みます。nが0〜100なら単語を辞書順に整列し、`words:` に並べて表示します。次の行に `matches: <出現数>` を表示してください。",
    solution: `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    int count{};
    std::cin >> count;
    if (count < 0 || count > 100) {
        std::cout << "invalid" << std::endl;
        return 0;
    }

    std::vector<std::string> words;
    for (int i = 0; i < count; ++i) {
        std::string word;
        std::cin >> word;
        words.push_back(word);
    }
    std::string query;
    std::cin >> query;

    std::sort(words.begin(), words.end());
    std::cout << "words:";
    for (const std::string& word : words) std::cout << " " << word;
    std::cout << std::endl;
    std::cout << "matches: " << std::count(words.begin(), words.end(), query) << std::endl;
    return 0;
}`,
    input: "3\nred blue red\nred\n",
    tests: [
      { input: "3\nred blue red\nred\n", output: "words: blue red red\nmatches: 2" },
      { input: "2\nkiwi apple\norange\n", output: "words: apple kiwi\nmatches: 0" },
      { input: "0\nanything\n", output: "words:\nmatches: 0" },
    ],
    hiddenTests: [{ input: "4\nC++ STL C++ vector\nC++\n", output: "words: C++ C++ STL vector\nmatches: 2" }],
    hints: ["単語をstd::vector<std::string>へ順に追加します。", "std::sortで並べ、範囲forでwords:の後に表示します。", "std::count(begin, end, query)をmatchesとして表示します。"],
    debug: { code: "std::cout << std::count(words.begin(), words.end(), query);", fix: "std::sort(words.begin(), words.end());\nstd::cout << std::count(words.begin(), words.end(), query);", explanation: "数える処理だけでは出力順は整いません。表示前にsortも呼びます。" },
  }),
];
