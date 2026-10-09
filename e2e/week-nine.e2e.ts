import { expect, test } from "@playwright/test";

test("Weeks 9 through 18 lessons are available from the curriculum and render authored content", async ({ page }) => {
  for (const [week, title] of [[9, "宣言と定義を見分ける"], [10, "classで状態と操作をまとめる"], [11, "デストラクタとスコープの寿命"], [12, "std::stringの長さと文字アクセス"], [13, "stringの長さと検索をまとめて確認する"], [14, "クラスに一つの責務を持たせる"], [15, "public継承で共通の役割を受け継ぐ"], [16, "部品を持つ関係をメンバーとして表す"], [17, "RAIIで取得と解放をオブジェクトの寿命に結び付ける"], [18, "コピー構築で独立した値を作る"]] as const) {
    await page.goto("curriculum/");
    const weekLabel = "W" + String(week).padStart(2, "0");
    const row = page.locator(".week-row").filter({ has: page.getByText(weekLabel, { exact: true }) });
    await row.locator("summary").click();
    await expect(row.getByText("この週は学習教材・例題・課題を利用できます。")).toBeVisible();

    await page.goto("learn/" + week + "/1/");
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "概念を理解する" })).toBeVisible();
    await expect(page.getByText("公開テスト 3 件")).toBeVisible();
  }
});
