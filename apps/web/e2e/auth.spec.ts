import { test, expect } from "@playwright/test"

test("unauthenticated visitor is redirected from /books to home", async ({
  browser,
}) => {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  })
  const page = await context.newPage()
  await page.goto("/books")
  await expect(page).toHaveURL(/localhost:\d+\/$/)
  await context.close()
})

test("seeded session can view the library", async ({ page }) => {
  await page.goto("/books")
  await expect(page).toHaveURL(/\/books$/)
  await expect(
    page.locator(".nav-desktop").getByRole("link", { name: "Books" })
  ).toBeVisible()
})
