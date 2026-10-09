import type { LessonSeed } from "../lesson-source.ts";

type Draft = Omit<LessonSeed, "quiz" | "debug"> & {
  quiz: LessonSeed["quiz"];
  debug: LessonSeed["debug"];
};

const makeLesson = (draft: Draft): LessonSeed => draft;

export const week13LessonSeeds: LessonSeed[] = [
  makeLesson({
    title: "stringの長さと検索をまとめて確認する",
    goal: "std::stringのsize、find、nposを使い、検索位置と未発見を区別する。",
    minutes: 35,
    explanation: "第1期の確認では、知識を単独で答えるだけでなく、複数の操作を順につなげられるかを見ます。まず本文を1行、検索語を次の1行で読み、本文の長さと検索結果を表示します。\n\n`size()` は保持するchar要素数を返します。UTF-8の日本語は見た目の文字数と一致しないことがあります。`find()` の結果は位置か `std::string::npos` です。位置0も有効なため、真偽値ではなく `npos` と比較します。",
    example: `#include <iostream>
#include <string>

int main() {
    const std::string text{"C++ practice"};
    const std::string query{"practice"};
    const std::size_t position = text.find(query);
    std::cout << "length: " << text.size() << std::endl;
    if (position == std::string::npos) {
        std::cout << "missing" << std::endl;
    } else {
        std::cout << "found at: " << position << std::endl;
    }
}`,
    exampleOutput: "length: 12\nfound at: 4",
    commonMistake: "findの戻り値をif(position)で判定する。位置0とnposを区別するには、nposと直接比較します。",
    quiz: { question: "検索語が本文の先頭で見つかったとき、findの戻り値は？", choices: ["0", "npos", "1"], answer: 0, explanation: "先頭の位置は0です。見つからない場合にだけnposが返ります。" },
    prompt: "本文と検索語をそれぞれ1行で読みます。`length: <size>` の後に、見つかったときは `found at: <位置>`、見つからないときは `missing` と表示してください。空行も本文として受け付けます。",
    solution: `#include <iostream>
#include <string>

int main() {
    std::string text;
    std::string query;
    std::getline(std::cin, text);
    std::getline(std::cin, query);

    const std::size_t position = text.find(query);
    std::cout << "length: " << text.size() << std::endl;
    if (position == std::string::npos) {
        std::cout << "missing" << std::endl;
    } else {
        std::cout << "found at: " << position << std::endl;
    }
    return 0;
}`,
    input: "C++ practice\npractice\n",
    tests: [
      { input: "C++ practice\npractice\n", output: "length: 12\nfound at: 4" },
      { input: "learn C++\nC++\n", output: "length: 9\nfound at: 6" },
      { input: "game dev\nC++\n", output: "length: 8\nmissing" },
    ],
    hiddenTests: [{ input: "\n\n", output: "length: 0\nfound at: 0" }],
    hints: ["本文と検索語はgetlineで読み取ります。", "findの結果をstd::string::nposと比較します。", "sizeと検索結果を、指定された順で表示します。"],
    debug: { code: "if (text.find(query)) std::cout << \"found\";", fix: "if (text.find(query) != std::string::npos) std::cout << \"found\";", explanation: "位置0はfalseのように扱われ、nposは非0です。真偽値にせずnposと比べます。" },
  }),
  makeLesson({
    title: "vectorの全要素を走査して集計する",
    goal: "入力値をvectorに保存し、範囲forで合計と正の値の個数を求める。",
    minutes: 40,
    explanation: "複数の値を扱うときは、件数を確認してからvectorへ順番に追加します。追加後は範囲forを使うと、添字の初期化や更新を書かずに全要素を走査できます。\n\nここでは合計と正の値の個数を別々に計算します。0は正の値ではありません。件数0の入力では空のvectorを安全に処理し、初期値の合計0と個数0を返します。",
    example: `#include <iostream>
#include <vector>

int main() {
    const std::vector<int> values{3, -2, 0, 7, 4};
    int sum{};
    int positiveCount{};
    for (const int value : values) {
        sum += value;
        if (value > 0) ++positiveCount;
    }
    std::cout << "sum: " << sum << std::endl;
    std::cout << "positive: " << positiveCount << std::endl;
}`,
    exampleOutput: "sum: 12\npositive: 3",
    commonMistake: "0を正の値として数える。条件はvalue > 0であり、value >= 0ではありません。",
    quiz: { question: "正の値の個数を数えるとき、0は含める？", choices: ["含める", "含めない", "入力ごとに変わる"], answer: 1, explanation: "正の整数は0より大きい値です。0は正でも負でもありません。" },
    prompt: "件数nと続くn個の整数を読み、vectorに保存します。nが0〜100なら `sum: <合計>` と `positive: <正の値の個数>` を表示し、範囲外なら `invalid` と表示してください。",
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

    int sum{};
    int positiveCount{};
    for (const int value : values) {
        sum += value;
        if (value > 0) ++positiveCount;
    }
    std::cout << "sum: " << sum << std::endl;
    std::cout << "positive: " << positiveCount << std::endl;
    return 0;
}`,
    input: "5\n3 -2 0 7 4\n",
    tests: [
      { input: "5\n3 -2 0 7 4\n", output: "sum: 12\npositive: 3" },
      { input: "0\n", output: "sum: 0\npositive: 0" },
      { input: "4\n5 5 -10 0\n", output: "sum: 0\npositive: 2" },
    ],
    hiddenTests: [{ input: "3\n-1 -2 -3\n", output: "sum: -6\npositive: 0" }],
    hints: ["件数が0〜100かを先に確認します。", "読み取った値をvectorへpush_backします。", "範囲forでsumを更新し、value > 0のときだけ個数を増やします。"],
    debug: { code: "if (value >= 0) ++positiveCount;", fix: "positiveCount += (value > 0 ? 1 : 0);", explanation: "0は正の値ではないため、0より大きい場合だけ個数へ加えます。" },
  }),
  makeLesson({
    title: "整列したvectorから値を検索する",
    goal: "std::sortとstd::findを組み合わせ、空のvectorも安全に処理する。",
    minutes: 40,
    explanation: "`std::sort` と `std::find` は、コンテナそのものではなく先頭と末尾の位置を受け取ります。vectorの末尾は `end()` で、最後の要素そのものではありません。\n\nsortを呼ぶと値が昇順に並び、findを呼ぶと一致した最初の位置か `end()` が返ります。空のvectorでも、`begin()` と `end()` の範囲は有効です。結果を位置として使わず、ここでは一致したかどうかだけを表示します。",
    example: `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{5, 1, 4, 2};
    std::sort(values.begin(), values.end());
    const auto found = std::find(values.begin(), values.end(), 4);
    std::cout << "sorted:";
    for (const int value : values) std::cout << ' ' << value;
    std::cout << std::endl;
    std::cout << "contains: " << (found != values.end() ? "yes" : "no") << std::endl;
}`,
    exampleOutput: "sorted: 1 2 4 5\ncontains: yes",
    commonMistake: "findの戻り値がend()でも要素だと思って使う。見つからない場合は必ずend()と比較します。",
    quiz: { question: "std::findが値を見つけなかったときの戻り値は？", choices: ["values.begin()", "values.end()", "0"], answer: 1, explanation: "検索範囲の末尾を表すend()が返ります。" },
    prompt: "件数n、n個の整数、検索する整数targetを読みます。nが0〜100なら値を昇順に整列し、`sorted:` の後に空白区切りで表示します。次の行に、値があれば `contains: yes`、なければ `contains: no` を表示してください。",
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
    const auto found = std::find(values.begin(), values.end(), target);
    std::cout << "sorted:";
    for (const int value : values) std::cout << ' ' << value;
    std::cout << std::endl;
    std::cout << "contains: " << (found != values.end() ? "yes" : "no") << std::endl;
    return 0;
}`,
    input: "4\n5 1 4 2\n4\n",
    tests: [
      { input: "4\n5 1 4 2\n4\n", output: "sorted: 1 2 4 5\ncontains: yes" },
      { input: "3\n9 3 7\n4\n", output: "sorted: 3 7 9\ncontains: no" },
      { input: "5\n2 2 1 2 1\n2\n", output: "sorted: 1 1 2 2 2\ncontains: yes" },
    ],
    hiddenTests: [{ input: "0\n6\n", output: "sorted:\ncontains: no" }],
    hints: ["読み込んだvectorのbegin()からend()までをsortへ渡します。", "findも同じ範囲を検索します。", "検索結果とend()を比較してyes/noを決めます。"],
    debug: { code: "if (found != values.end()) std::cout << *values.end();", fix: "if (found != values.end()) std::cout << *found;", explanation: "end()は末尾の次を表し、逆参照できません。見つけた位置foundを使います。" },
  }),
  makeLesson({
    title: "添字の境界バグをレビューする",
    goal: "範囲外アクセスの原因を見つけ、負の位置とsize以上の位置を拒否する。",
    minutes: 40,
    explanation: "コードレビューでは、正常な入力だけでなく、条件式が境界の値をどう扱うかを確認します。要素数が3なら使える添字は0、1、2です。3は範囲外で、-1も有効な添字ではありません。\n\n添字が符号付き整数のときは、負数を先に確認してからsizeとの比較に使います。空のvectorには有効な添字がないため、特別な添字処理を追加する必要はありません。",
    example: `#include <iostream>
#include <vector>

int main() {
    const std::vector<int> values{11, 22, 33};
    const int index{2};
    if (index < 0 || static_cast<std::size_t>(index) >= values.size()) {
        std::cout << "out of range" << std::endl;
    } else {
        std::cout << "value: " << values[static_cast<std::size_t>(index)] << std::endl;
    }
}`,
    exampleOutput: "value: 33",
    commonMistake: "index > size() と書き、index == size()を許可する。要素数と同じ添字も範囲外です。",
    quiz: { question: "sizeが4のvectorで、index=4を許可してよい？", choices: ["よい。末尾を指す", "だめ。末尾の次である", "空の要素なのでよい"], answer: 1, explanation: "有効な添字は0から3です。4は要素数と等しいため範囲外です。" },
    prompt: "件数n、n個の整数、読み取り位置indexを読みます。件数が0〜100なら、indexが0以上かつn未満のとき `value: <値>`、それ以外は `out of range` を表示します。件数が範囲外なら `invalid` と表示します。",
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
    int index{};
    std::cin >> index;

    if (index < 0 || static_cast<std::size_t>(index) >= values.size()) {
        std::cout << "out of range" << std::endl;
    } else {
        std::cout << "value: " << values[static_cast<std::size_t>(index)] << std::endl;
    }
    return 0;
}`,
    input: "3\n11 22 33\n2\n",
    tests: [
      { input: "3\n11 22 33\n2\n", output: "value: 33" },
      { input: "3\n11 22 33\n-1\n", output: "out of range" },
      { input: "3\n11 22 33\n3\n", output: "out of range" },
    ],
    hiddenTests: [{ input: "0\n0\n", output: "out of range" }],
    hints: ["件数が範囲内であることを確かめてからvectorへ読み込みます。", "添字が負か、size以上かを確認します。", "両方の条件を通過した後だけvalues[index]を使います。"],
    debug: { code: "for (std::size_t i = 0; i <= values.size(); ++i) std::cout << values[i];", fix: "for (std::size_t i = 0; i < values.size(); ++i) std::cout << values[i];", explanation: "size()と同じ添字は末尾の次です。条件はi < size()です。" },
  }),
  makeLesson({
    title: "空と単一要素を含むテストを設計する",
    goal: "vectorの境界を考慮し、最小値と最大値を安全に求める。",
    minutes: 40,
    explanation: "テストを作るときは、典型的な複数要素だけでなく、空、単一要素、同じ値、負の値を考えます。これらは、初期値や添字の誤りを見つけやすい条件です。\n\n空のvectorに対してfront()を呼ぶことはできません。最初に件数0を扱い、要素がある場合だけ先頭を初期値に使います。その後、範囲forで残りを含む全要素を比較します。",
    example: `#include <iostream>
#include <vector>

int main() {
    const std::vector<int> values{8, -4, 3, 8, 0};
    int minimum = values.front();
    int maximum = values.front();
    for (const int value : values) {
        if (value < minimum) minimum = value;
        if (value > maximum) maximum = value;
    }
    std::cout << "min: " << minimum << std::endl;
    std::cout << "max: " << maximum << std::endl;
}`,
    exampleOutput: "min: -4\nmax: 8",
    commonMistake: "空のvectorでもfront()を呼ぶ。要素数が0の場合は、先にempty扱いを返します。",
    quiz: { question: "空かもしれないvectorでfront()を使う前に確認するものは？", choices: ["capacity()が1より大きいこと", "empty()でないこと", "sort済みであること"], answer: 1, explanation: "要素がないvectorにfront()を呼ぶことはできません。" },
    prompt: "件数nと続くn個の整数を読みます。nが0〜100なら、nが0のとき `empty`、それ以外は最小値と最大値を `min: <値>`、`max: <値>` の2行で表示してください。範囲外の件数は `invalid` と表示します。",
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
    if (values.empty()) {
        std::cout << "empty" << std::endl;
        return 0;
    }

    int minimum = values.front();
    int maximum = values.front();
    for (const int value : values) {
        if (value < minimum) minimum = value;
        if (value > maximum) maximum = value;
    }
    std::cout << "min: " << minimum << std::endl;
    std::cout << "max: " << maximum << std::endl;
    return 0;
}`,
    input: "5\n8 -4 3 8 0\n",
    tests: [
      { input: "5\n8 -4 3 8 0\n", output: "min: -4\nmax: 8" },
      { input: "1\n-7\n", output: "min: -7\nmax: -7" },
      { input: "4\n6 6 6 6\n", output: "min: 6\nmax: 6" },
    ],
    hiddenTests: [{ input: "0\n", output: "empty" }],
    hints: ["件数が0なら、値を読まずにemptyを表示します。", "空でないと確認した後、先頭の値を最小値と最大値の初期値にします。", "範囲forで各値を比較し、必要なら両方を更新します。"],
    debug: { code: "int minimum = values.front();", fix: "if (values.empty()) { std::cout << \"empty\\n\"; return 0; }\nint minimum = values.front();", explanation: "空のvectorにfront()を呼べません。要素があることを先に確かめます。" },
  }),
  makeLesson({
    title: "得点一覧を整列して条件別に数える",
    goal: "vectorとsortを使い、しきい値以上の得点数を正しく集計する。",
    minutes: 45,
    explanation: "小さな一覧処理では、入力をvectorへ保存し、表示用に整列してから、条件を満たす値の数を数えることができます。整列は表示順を変えますが、得点の個数は変えません。\n\nここでは集計条件を明示したループで書き、しきい値と同じ得点も数えるため `score >= threshold` を使います。件数0のときも空の一覧と0件を表示します。",
    example: `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> scores{80, 50, 100, 50};
    const int threshold{60};
    std::sort(scores.begin(), scores.end());
    int qualified{};
    for (const int score : scores) {
        if (score >= threshold) ++qualified;
    }
    std::cout << "scores:";
    for (const int score : scores) std::cout << ' ' << score;
    std::cout << std::endl;
    std::cout << "at least: " << qualified << std::endl;
}`,
    exampleOutput: "scores: 50 50 80 100\nat least: 2",
    commonMistake: "しきい値と同じ得点を除外してしまう。以上の条件は>=を使います。",
    quiz: { question: "しきい値以上を数える比較演算子はどれ？", choices: [">", ">=", "=="], answer: 1, explanation: "以上には、しきい値と同じ値も含まれます。" },
    prompt: "件数n、n個の0〜100の得点、しきい値thresholdを読みます。nとthresholdがそれぞれ0〜100の範囲なら、得点を昇順にして `scores:` の後に並べ、次の行にthreshold以上の件数を `at least: <件数>` と表示します。範囲外なら `invalid` と表示してください。",
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

    std::vector<int> scores;
    for (int i = 0; i < count; ++i) {
        int score{};
        std::cin >> score;
        if (score < 0 || score > 100) {
            std::cout << "invalid" << std::endl;
            return 0;
        }
        scores.push_back(score);
    }
    int threshold{};
    std::cin >> threshold;
    if (threshold < 0 || threshold > 100) {
        std::cout << "invalid" << std::endl;
        return 0;
    }

    std::sort(scores.begin(), scores.end());
    int qualified{};
    for (const int score : scores) {
        if (score >= threshold) ++qualified;
    }
    std::cout << "scores:";
    for (const int score : scores) std::cout << ' ' << score;
    std::cout << std::endl;
    std::cout << "at least: " << qualified << std::endl;
    return 0;
}`,
    input: "4\n80 50 100 50\n60\n",
    tests: [
      { input: "4\n80 50 100 50\n60\n", output: "scores: 50 50 80 100\nat least: 2" },
      { input: "0\n100\n", output: "scores:\nat least: 0" },
      { input: "3\n0 50 100\n50\n", output: "scores: 0 50 100\nat least: 2" },
    ],
    hiddenTests: [{ input: "2\n100 100\n100\n", output: "scores: 100 100\nat least: 2" }],
    hints: ["件数を調べ、各得点が0〜100か確認しながらvectorへ追加します。", "しきい値を読み、sortで昇順にします。", "score >= thresholdのときだけ件数を増やします。"],
    debug: { code: "if (score > threshold) ++qualified;", fix: "qualified += (score >= threshold ? 1 : 0);", explanation: "しきい値以上なので、同じ値も集計に含めます。" },
  }),
  makeLesson({
    title: "総合評価：検索語を含む単語を整列する",
    goal: "string、vector、find、sort、範囲forを組み合わせ、境界を含む入力で検証する。",
    minutes: 55,
    explanation: "第1期の最後は、これまで扱った標準型と基本アルゴリズムをひとつの小さな処理へまとめます。複数の単語をvectorに保存し、辞書順に整列してから、検索語を含む単語を数えます。\n\n各単語の `find(query)` が `std::string::npos` でなければ、その単語に検索語が含まれています。大文字と小文字は区別します。件数0、重複語、検索語が見つからない場合を含むテストで動作を確認します。\n\nこの課題の採点は公開・非公開入力に対する出力と理解確認問題の結果を記録します。通過はこの課題の指定動作を満たした証拠であり、C++全体の習得度を単独で保証する評価ではありません。",
    example: `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> words{"red", "blue", "red"};
    const std::string query{"re"};
    std::sort(words.begin(), words.end());
    int matches{};
    for (const std::string& word : words) {
        if (word.find(query) != std::string::npos) ++matches;
    }
    std::cout << "words:";
    for (const std::string& word : words) std::cout << ' ' << word;
    std::cout << std::endl;
    std::cout << "matches: " << matches << std::endl;
}`,
    exampleOutput: "words: blue red red\nmatches: 2",
    commonMistake: "同じ単語を一度だけ数える。vector内の各要素を調べるため、重複した単語もそれぞれ数えます。",
    quiz: { question: "wordsに同じ単語が2つあり、両方に検索語が含まれる場合、matchesへ加える数は？", choices: ["1", "2", "0"], answer: 1, explanation: "vectorの各要素を数えるので、該当する重複語もそれぞれ数えます。" },
    prompt: "件数n、n個の空白を含まない単語、検索語queryを読みます。nが0〜100なら、単語を辞書順に整列して `words:` の後に表示し、検索語を含む単語の個数を `matches: <個数>` と表示してください。検索は大文字小文字を区別し、重複する単語も別々に数えます。件数が範囲外なら `invalid` と表示します。",
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
    int matches{};
    for (const std::string& word : words) {
        if (word.find(query) != std::string::npos) ++matches;
    }
    std::cout << "words:";
    for (const std::string& word : words) std::cout << ' ' << word;
    std::cout << std::endl;
    std::cout << "matches: " << matches << std::endl;
    return 0;
}`,
    input: "3\nred blue red\nre\n",
    tests: [
      { input: "3\nred blue red\nre\n", output: "words: blue red red\nmatches: 2" },
      { input: "4\napple banana apricot berry\nap\n", output: "words: apple apricot banana berry\nmatches: 2" },
      { input: "1\nGame\ngame\n", output: "words: Game\nmatches: 0" },
    ],
    hiddenTests: [{ input: "0\nx\n", output: "words:\nmatches: 0" }],
    hints: ["件数を確認してから単語をvector<string>へ追加します。", "sortで並べ替え、範囲forで各単語を調べます。", "findの戻り値がnposでない単語だけmatchesへ加えます。"],
    debug: { code: "if (word.find(query)) ++matches;", fix: "matches += (word.find(query) != std::string::npos ? 1 : 0);", explanation: "findは位置0やnposを返すため、真偽値のようには判定できません。" },
  }),
];
