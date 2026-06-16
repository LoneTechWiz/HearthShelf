import { test, expect } from "@playwright/test"

test("Google is the primary sign-in option, GitHub is secondary", async ({
  browser,
}) => {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  })
  const page = await context.newPage()
  await page.goto("/")

  const buttons = page.getByRole("button", { name: /sign in with/i })
  await expect(buttons).toHaveCount(2)
  await expect(buttons.nth(0)).toHaveText(/Sign in with Google/)
  await expect(buttons.nth(1)).toHaveText(/Sign in with GitHub/)

  await context.close()
})
