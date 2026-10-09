import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("learner backup restores quiz progress without exporting runner settings", async ({ page }) => {
  const token = "e2e-test-runner-token-not-a-real-secret-0123456789";
  const runnerUrl = "http://127.0.0.1:8081";

  await page.goto("settings/");
  await page.getByLabel("実行ワーカーのURL").fill(runnerUrl);
  await page.getByRole("button", { name: "URLを保存" }).click();
  await expect(page.getByText("実行ワーカーURLをこのブラウザーに保存しました。")).toBeVisible();
  await expect(page.getByText("URL設定済み · トークン未登録")).toBeVisible();
  await page.getByLabel("実行ワーカーのアクセストークン").fill(token);
  await page.getByRole("button", { name: "トークンを保存" }).click();
  await expect(page.getByText("実行ワーカーのトークンをこのブラウザーへ保存しました。")).toBeVisible();
  await expect(page.getByText("URL設定済み · トークン登録済み")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("実行ワーカーのURL")).toHaveValue(runnerUrl);
  await expect(page.getByText("このブラウザーに保存済み").first()).toBeVisible();

  await page.goto("learn/1/1/");
  await page.getByRole("button", { name: /B キーボード/ }).click();
  await expect(page.getByText(/もう一度考えてみよう/)).toBeVisible();

  await page.goto("settings/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSONを書き出す" }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).not.toBeNull();

  const backupText = await readFile(backupPath!, "utf8");
  expect(backupText).not.toContain(token);
  expect(backupText).not.toContain(runnerUrl);
  const backup = JSON.parse(backupText) as {
    format: string;
    state: { lessons: Record<string, { quizChoice?: number; quizCorrect?: boolean }> };
  };
  expect(backup.format).toBe("cpp-mastery-backup");
  expect(backup.state.lessons["w1-d1"]).toMatchObject({ quizChoice: 1, quizCorrect: false });

  await page.goto("learn/1/1/");
  await page.getByRole("button", { name: /A コンパイラ/ }).click();
  await expect(page.getByText(/正解/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/正解/)).toBeVisible();

  await page.goto("settings/");
  await page.locator('input[type="file"]').setInputFiles(backupPath!);
  await expect(page.getByText("バックアップを復元しました。現在の端末データを置き換えています。")).toBeVisible();

  await page.goto("learn/1/1/");
  await page.reload();
  await expect(page.getByText(/もう一度考えてみよう/)).toBeVisible();
  await page.goto("settings/");
  await page.reload();
  await expect(page.getByLabel("実行ワーカーのURL")).toHaveValue(runnerUrl);
  await expect(page.getByText("このブラウザーに保存済み").first()).toBeVisible();
});
