import { test, expect } from "@playwright/test";
test("game moves residents, switches new spirit models and supports direct control", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(".game-name")).toHaveCount(12);
  await expect
    .poll(() => page.locator("#world").getAttribute("data-moving"))
    .not.toBe("0");
  await page.locator("[data-character=jaehwan]").click();
  await expect(page.locator("#player-name")).toHaveText("김재환");
  await expect(page.locator("#player-design")).toHaveText("꼬마 촛불 정령");
  await page.locator("#theme").click();
  await expect(page.locator("#day-time")).toContainText("반딧불");
  await page.keyboard.down("w");
  await page.waitForTimeout(600);
  await page.keyboard.up("w");
  await expect(page.locator("#auto-walk")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.locator("#pause").click();
  await expect(page.locator("#paused-label")).toBeVisible();
  await page.locator("#resume").click();
  await page.locator("#player-detail").click();
  await expect(page.locator("dialog")).toContainText(
    "시주는 추정하지 않았습니다",
  );
  await page.locator("#close-modal").click();
  expect(errors).toEqual([]);
});
test("meeting produces actual hearts and gifts after the characters approach", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#speed").click();
  await page.locator("#meet-target").selectOption("jaehwan");
  await page.locator("#action-talk").click();
  await expect(page.locator("#action-status")).toContainText("걸어가고");
  await expect(page.locator(".speech-bubble.heart").first()).toBeVisible({
    timeout: 25000,
  });
  await page.screenshot({ path: "tests/hearts.png" });
  await page.locator("#action-gift").click();
  await expect(page.locator("#gift-count")).toHaveText("1 / 1", {
    timeout: 25000,
  });
  await expect(page.locator("#event-list")).toContainText("마음을 건넸어요");
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Object.entries(localStorage).some(
          ([k, v]) =>
            k.startsWith("ungyeol-play-v2") &&
            JSON.parse(v).discovered.length > 0,
        ),
      ),
    )
    .toBe(true);
});
test("festival gathers villagers and starts a visible dance state", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#speed").click();
  await page.locator("#festival").click();
  await expect(page.locator("#festival")).toBeDisabled();
  await expect
    .poll(() => page.locator(".game-name[data-state=dancing]").count(), {
      timeout: 18000,
    })
    .toBeGreaterThan(5);
});
test("all pair graph, filters, evidence and ranking sorting", async ({
  page,
}) => {
  await page.goto("/?view=map");
  await expect(page.locator(".graph-person")).toHaveCount(12);
  await expect(page.locator(".graph-line")).toHaveCount(11);
  await page.locator(".map-relation").first().click();
  await expect(page.locator("dialog")).toContainText("이 관계를 만든 근거");
  await page.locator("details").first().click();
  await expect(page.locator("details[open]")).toHaveCount(1);
  await page.locator("#close-modal").click();
  await page.locator('[data-filter="귀인 동행"]').click();
  await expect(page.locator('[data-filter="귀인 동행"]')).toHaveClass(/active/);
  await page.locator('[data-view="ranking"]').click();
  await expect(page.locator(".rank-row")).toHaveCount(66);
  await page.locator("#sort").selectOption("tension");
  const nums = await page.locator(".rank-row>strong").allTextContents();
  expect(nums.map(Number)).toEqual(nums.map(Number).sort((a, b) => b - a));
});
test("resident search, invalid chart rejected, addition persists with 78 pairs", async ({
  page,
}) => {
  await page.goto("/?view=residents");
  await page.locator("#search").fill("시냇물");
  await expect(page.locator(".person-card")).toHaveCount(1);
  await expect(page.locator(".person-card")).toContainText("도윤");
  await page.locator("#add").click();
  await page.locator("[name=name]").fill("테스트 이웃");
  for (const [k, v] of Object.entries({ p0: "갑축", p1: "계미", p2: "임오" }))
    await page.locator(`[name=${k}]`).fill(v);
  await page.locator("button[type=submit]").click();
  await expect(page.locator("#form-error")).toContainText("유효한 간지");
  await page.locator("[name=p0]").fill("경진");
  await page.locator("button[type=submit]").click();
  await expect(page.locator("dialog")).not.toBeVisible();
  await page.reload();
  await page.locator('[data-view="ranking"]').click();
  await expect(page.locator(".rank-row")).toHaveCount(78);
});
test("mobile pages and dialog do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const view of ["village", "map", "ranking", "residents"]) {
    await page.goto("/?view=" + view);
    if (view === "village") {
      await expect(page.locator("#action-talk")).toBeVisible();
      await expect(page.locator(".resident-choice").first()).toBeVisible();
      const bounds = await page.locator(".character-switcher").boundingBox();
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
    } else await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  }
  await page.locator(".person-card").first().click();
  await expect(page.locator("dialog")).toBeVisible();
  expect(
    await page.locator("dialog").evaluate((e) => e.scrollWidth > e.clientWidth),
  ).toBe(false);
});
test("export and import round trip preserves source charts", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#manage").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export").click();
  const download = await downloadPromise;
  const path = await download.path();
  await page.locator("#import-file").setInputFiles(path);
  await expect(page.locator("#toast")).toContainText("새 마을을 불러왔어요");
  await expect(page.locator(".game-name")).toHaveCount(12);
  await page.reload();
  await expect(page.locator(".game-name")).toHaveCount(12);
});

test("compact mobile game keeps movement and character controls on screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/");
  for (const selector of [
    "#action-talk",
    ".character-switcher",
    "#player-detail",
  ]) {
    const bounds = await page.locator(selector).boundingBox();
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(640);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(360);
  }
  await page.locator("#meet-target").selectOption("jaehwan");
  await page.locator("#action-talk").click();
  await expect(page.locator("#action-status")).toContainText("걸어가고");
});
