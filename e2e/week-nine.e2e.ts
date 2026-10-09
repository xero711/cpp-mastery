import { expect, test } from "@playwright/test";

test("Week 9 lessons are available from the curriculum and render their authored content", async ({ page }) => {
  await page.goto("curriculum/");
  const weekNine = page.locator(".week-row").filter({ hasText: "W09" });
  await weekNine.locator("summary").click();
  await expect(weekNine.getByText("この週は学習教材・例題・課題を利用できます。")).toBeVisible();

  await page.goto("learn/9/1/");
  await expect(page.getByRole("heading", { name: "宣言と定義を見分ける" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "概念を理解する" })).toBeVisible();
  await expect(page.getByText("公開テスト 3 件")).toBeVisible();
});
