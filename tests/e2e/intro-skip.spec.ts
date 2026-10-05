import { test, expect } from "@playwright/test";

/**
 * Regression: the homepage intro could not be skipped.
 *
 * components/brand/IntroAnimation.tsx declared
 * `const [skipReady, setSkipReady] = useState(false)` and rendered the Skip
 * button on `skipReady && phase >= 4`, but setSkipReady was never called
 * anywhere in the file. The state was dead, so the button could never appear
 * and the only way past the intro was to sit through all 3.6s of it.
 *
 * Found while inspecting the intro overlay for bug #1, not on purpose.
 */

test("the homepage intro offers a Skip control once it has played", async ({ page }) => {
  // Cold session: sessionStorage is empty, so IntroAnimation mounts.
  await page.goto("/");

  const skip = page.getByRole("button", { name: /skip intro/i });

  // It should not be offered before the animation has had a chance to finish.
  await expect(skip).toBeHidden();

  // Phase 4 completes around 3.2s; Skip becomes available shortly after.
  await expect(skip).toBeVisible({ timeout: 8_000 });
});

test("Skip dismisses the intro and records the session", async ({ page }) => {
  await page.goto("/");

  const skip = page.getByRole("button", { name: /skip intro/i });
  await expect(skip).toBeVisible({ timeout: 8_000 });
  await skip.click();

  // The intro overlay is gone, and the flag is set so /readings/* is not
  // covered by a veil on the next navigation.
  await expect(
    page.locator(".fixed.inset-0.z-50.bg-deepnight.flex.flex-col")
  ).toHaveCount(0);

  await expect
    .poll(async () =>
      page.evaluate(() => sessionStorage.getItem("velora_intro_played"))
    )
    .toBe("true");
});

test("a returning session is not shown the intro at all", async ({ page }) => {
  await page.goto("/");
  const skip = page.getByRole("button", { name: /skip intro/i });
  await expect(skip).toBeVisible({ timeout: 8_000 });
  await skip.click();

  // Second visit: the flag is set, so nothing should mount.
  await page.goto("/");
  await page.waitForTimeout(2_000);

  await expect(
    page.locator(".fixed.inset-0.z-50.bg-deepnight.flex.flex-col")
  ).toHaveCount(0);
});