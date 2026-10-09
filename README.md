# C++ Mastery

ゲームプログラマーを目指す学習者向けの、日本語C++実践カリキュラムです。Next.js App Routerを静的サイトとしてビルドし、GitHub Pagesで公開します。

## 開発環境

- Node.js 24
- pnpm 11.25
- Windows 11 / macOS / Linux

```powershell
pnpm install
pnpm dev
```

ブラウザーで `http://localhost:3000` を開きます。開発時の記録とコード下書きは、そのブラウザーのIndexedDBに保存されます。

## ビルド・確認

```powershell
pnpm lint
pnpm test
pnpm build
pnpm verify:public-bundle
```

Chromiumブラウザーでバックアップ・復元を確認するE2Eテストは、初回のみブラウザーをインストールしてから実行します。

```powershell
pnpm exec playwright install chromium
pnpm test:e2e
```

実runnerにブラウザーから提出し、実際のC++コンパイルとサーバー採点まで確認するE2Eは、Docker sandboxとrunner APIを起動してから実行します。CIではrunner用ワークフローがこの一連のテストを準備・実行します。

```powershell
$env:GITHUB_REPOSITORY = 'xero711/cpp-mastery'
$env:NEXT_TELEMETRY_DISABLED = '1'
pnpm build
$env:CPP_RUNNER_E2E_TOKEN = '<runner .env.private と同じトークン>'
pnpm test:e2e:runner
```

`pnpm build` は静的サイトを `out/` に出力します。GitHub Actionsもこの出力をPagesへ公開します。

WindowsでVisual Studio C++ Build Toolsが使える場合は、作成済みの56レッスン（Week 1〜8）の模範解答を実コンパイルし、110件の公開テストと73件のrunner専用テストを照合できます。教材データを編集したときは `pnpm generate:lessons` を先に実行してください。

```powershell
pnpm verify:lessons
```

## GitHub Pagesで公開する

1. このフォルダーをGitHubリポジトリへpushします。既定ブランチは `main` を想定しています。
2. GitHubの **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選びます。
3. `main` へpushするか、Actionsから `Deploy C++ Mastery to GitHub Pages` を手動実行します。
4. Actionsの `github-pages` 環境に表示される公開URLを開きます。

プロジェクトページのURL接頭辞はActions実行時のリポジトリ名から設定されます。`owner.github.io` リポジトリの場合はルート公開としてビルドします。

## C++コード実行について

GitHub PagesはHTML/CSS/JavaScriptを配信するため、C++コンパイラやサーバーAPIは動かせません。現状、未設定時の採点画面は「実行ワーカー未設定」と表示します。ホストPC上で提出コードを無制限に実行するフォールバックはありません。

自分のWindows PCで使う場合は、Docker DesktopのLinuxコンテナを起動し、[runner READMEのローカル手順](services/runner/README.md#local-development)でAPIを開始します。GitHub Pagesの設定画面に `http://127.0.0.1:8081` とrunnerトークンを登録すると、そのブラウザーのコードだけをPC内のrunnerへ送れます。HTTP URLはlocalhost/loopbackに限定され、APIは `127.0.0.1` だけで待ち受けます。[Chromeのローカルネットワーク許可](https://developer.chrome.com/blog/local-network-access)が表示された場合は、自分のPC上のrunnerへ接続するときだけ許可してください。

別のHTTPSホストにrunnerを用意する場合は、そのURLをGitHubリポジトリの **Settings → Secrets and variables → Actions → Variables** に `CPP_RUNNER_URL` として設定すると、Pagesのビルドへ接続先が含まれます。ブラウザーごとのURL設定はビルドURLを上書きできます。利用者は設定画面で各自のアクセストークンを登録します。`/v1/grade` はlesson IDとコードを受け取り、runner内の公開・非公開ケースで採点します。選択式クイズは事前教材で採点でき、runnerが未設定でも進捗を保存します。模範解答・デバッグ修正は明示操作後に `/v1/reveal` から取得し、Pagesの配信物には含めません。サービスには認証、送信元Originの許可、ソース・時間・CPU・メモリ・プロセス・出力制限が必要です。[runnerの実装と起動条件](services/runner/README.md)、[アーキテクチャ](docs/ARCHITECTURE.md)、[セキュリティ](docs/SECURITY.md) を参照してください。

## 学習データとプライバシー

- 進捗、回答、提出コード、設定はブラウザーのIndexedDBに保存します。
- アカウントや自動クラウド同期はありません。ブラウザーを切り替える前に設定画面からJSONをエクスポートしてください。
- GitHub Pagesの公開ファイルにAPIキーや個人データを入れないでください。
- AI講師はサーバー側のAI連携を追加するまで利用できません。APIキーをブラウザーへ置かない設計です。

## 実装状況

現在の機能・未実装項目・検証結果は [進捗](docs/PROGRESS.md) と [次の作業](docs/NEXT_STEPS.md) に記録しています。Week 1〜8 の日別教材が使えます。Week 9〜104 は週単位の計画と日別の学習枠があり、詳細教材は未制作です。
