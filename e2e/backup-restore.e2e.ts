import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("learner backup restores quiz progress without exporting the runner token", async ({ page }) => {
  const token = "e2e-test-runner-token-not-a-real-secret-0123456789";

  await page.goto("/settings/");
  await page.getByLabel("実行ワーカーのアクセストークン").fill(token);
  await page.getByRole("button", { name: "トークンを保存" }).click();
  await expect(page.getByText("このブラウザーに保存済み")).toBeVisible();

  await page.goto("/learn/1/1/");
  await page.getByRole("button", { name: /B キーボード/ }).click();
  await expect(page.getByText(/もう一度考えてみよう/)).toBeVisible();

  await page.goto("/settings/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSONを書き出す" }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).not.toBeNull();

  const backupText = await readFile(backupPath!, "utf8");
  expect(backupText).not.toContain(token);
  const backup = JSON.parse(backupText) as {
    format: string;
    state: { lessons: Record<string, { quizChoice?: number; quizCorrect?: boolean }> };
  };
  expect(backup.format).toBe("cpp-mastery-backup");
  expect(backup.state.lessons["w1-d1"]).toMatchObject({ quizChoice: 1, quizCorrect: false });

  await page.goto("/learn/1/1/");
  await page.getByRole("button", { name: /A コンパイラ/ }).click();
  await expect(page.getByText(/正解/)).toBeVisible();

  await page.goto("/settings/");
  await page.locator('input[type="file"]').setInputFiles(backupPath!);
  await expect(page.getByText("バックアップを復元しました。現在の端末データを置き換えています。")).toBeVisible();

  await page.goto("/learn/1/1/");
  await expect(page.getByText(/もう一度考えてみよう/)).toBeVisible();
  await page.goto("/settings/");
  await expect(page.getByText("このブラウザーに保存済み")).toBeVisible();
});
