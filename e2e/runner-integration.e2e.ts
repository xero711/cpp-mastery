import { expect, test, type Page } from "@playwright/test";

const runnerToken = process.env.CPP_RUNNER_E2E_TOKEN ?? "ci-runner-token-0123456789-abcdef0123456789";

async function configureRunner(page: Page) {
  await page.goto("settings/");
  await page.getByLabel("実行ワーカーのURL").fill("http://127.0.0.1:8081");
  await page.getByRole("button", { name: "URLを保存", exact: true }).click();
  await expect(page.getByText("実行ワーカーURLをこのブラウザーに保存しました。")).toBeVisible();
  await page.getByLabel("実行ワーカーのアクセストークン").fill(runnerToken);
  await page.getByRole("button", { name: "トークンを保存", exact: true }).click();
  await expect(page.getByText("実行ワーカーのトークンをこのブラウザーへ保存しました。")).toBeVisible();
}

async function writeHelloProgram(page: Page) {
  const editor = page.locator(".monaco-editor").first();
  await expect(editor).toBeVisible();
  await editor.click({ position: { x: 300, y: 70 } });
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText('#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!\\n";\n    return 0;\n}\n');
  await expect(page.locator(".view-lines")).toContainText('std::cout << "Hello, C++!\\n";');
}

test("workspace submits C++ to the isolated runner and displays its server-side grade", async ({ page }) => {
  test.setTimeout(60_000);
  await configureRunner(page);

  await page.goto("workspace/");
  await writeHelloProgram(page);

  await page.getByRole("button", { name: "コンパイルして採点" }).click();
  await expect(page.getByText("公開テストと非公開テストにすべて通りました。")).toBeVisible({ timeout: 50_000 });
  await expect(page.getByText("一致").first()).toBeVisible();
  const submissionHistory = page.locator(".problem-links");
  await expect(submissionHistory).toContainText("1 回提出済み");

  await page.reload();
  await expect(page.locator(".problem-links")).toContainText("1 回提出済み");

  await page.goto("learn/1/1/");
  await page.getByRole("button", { name: "模範解答を見る" }).click();
  await expect(page.locator(".solution-reveal")).toContainText("return 0;");

  const debugging = page.locator(".debug-section");
  await debugging.getByRole("button", { name: "解説を確認" }).click();
  await expect(debugging.locator(".answer-reveal")).toContainText("std::cout");
});

test("a missed quiz becomes due and advances only after the learner passes both review checks", async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.install({ time: new Date("2026-10-09T03:00:00.000Z") });
  await configureRunner(page);

  await page.goto("learn/1/1/");
  await page.getByRole("button", { name: /B キーボード/ }).click();
  await expect(page.getByText(/もう一度考えてみよう/)).toBeVisible();

  await page.goto("review/");
  await expect(page.locator(".practice-count strong")).toHaveText("0");
  await expect(page.locator(".review-card")).toContainText("あと1日");

  await page.clock.fastForward(24 * 60 * 60 * 1_000);
  await page.goto("review/");
  await expect(page.locator(".practice-count strong")).toHaveText("1");
  await expect(page.locator(".review-card")).toContainText("今日が期限");
  await page.getByRole("link", { name: /再挑戦/ }).click();
  await page.getByRole("button", { name: /A コンパイラ/ }).click();
  await expect(page.getByText(/正解/)).toBeVisible();

  await page.goto("workspace/");
  await writeHelloProgram(page);
  await page.getByRole("button", { name: "コンパイルして採点" }).click();
  await expect(page.getByText("公開テストと非公開テストにすべて通りました。")).toBeVisible({ timeout: 50_000 });

  await page.goto("review/");
  const reviewCard = page.locator(".review-card");
  await expect(page.locator(".practice-count strong")).toHaveText("0");
  await expect(reviewCard).toContainText("あと3日");
  await expect(reviewCard).toContainText("間隔 3日");
  await expect(reviewCard).toContainText("定着確認 1回");
  await page.reload();
  await expect(page.locator(".review-card")).toContainText("定着確認 1回");
});
