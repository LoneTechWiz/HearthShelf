import { test, expect } from "@playwright/test"

test("theme toggle switches to dark and persists across reload", async ({
  page,
}) => {
  await page.goto("/books")
  const html = page.locator("html")
  await page.locator(".nav-desktop").getByRole("button", { name: /E2E User|Account/ }).click()
  const toggle = page.locator(".nav-desktop").getByRole("button", { name: /Switch to .* theme/ })

  // Default is System; cycle System -> Light -> Dark.
  await toggle.click()
  await toggle.click()
  await expect(html).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
})
