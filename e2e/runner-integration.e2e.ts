import { expect, test } from "@playwright/test";

test("workspace submits C++ to the isolated runner and displays its server-side grade", async ({ page }) => {
  test.setTimeout(60_000);
  const token = process.env.CPP_RUNNER_E2E_TOKEN ?? "ci-runner-token-0123456789-abcdef0123456789";

  await page.goto("settings/");
  await page.getByLabel("実行ワーカーのURL").fill("http://127.0.0.1:8081");
  await page.getByRole("button", { name: "URLを保存" }).click();
  await expect(page.getByText("実行ワーカーURLをこのブラウザーに保存しました。")).toBeVisible();
  await page.getByLabel("実行ワーカーのアクセストークン").fill(token);
  await page.getByRole("button", { name: "トークンを保存" }).click();
  await expect(page.getByText("実行ワーカーのトークンをこのブラウザーへ保存しました。")).toBeVisible();

  await page.goto("workspace/");
  const editor = page.locator(".monaco-editor").first();
  await expect(editor).toBeVisible();
  await editor.click({ position: { x: 300, y: 70 } });
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText('#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!\\n";\n    return 0;\n}\n');
  await expect(page.locator(".view-lines")).toContainText('std::cout << "Hello, C++!\\n";');

  await page.getByRole("button", { name: "コンパイルして採点" }).click();
  await expect(page.getByText("公開テストと非公開テストにすべて通りました。")).toBeVisible({ timeout: 50_000 });
  await expect(page.getByText("一致").first()).toBeVisible();
  const submissionHistory = page.locator(".problem-links");
  await expect(submissionHistory).toContainText("1 回提出済み");

  await page.reload();
  await expect(page.locator(".problem-links")).toContainText("1 回提出済み");
});
