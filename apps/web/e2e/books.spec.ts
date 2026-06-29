import { test, expect } from "@playwright/test"

test("create a book and see it on the shelf", async ({ page }) => {
  const title = `E2E Book ${Date.now()}`
  await page.goto("/books/new")
  await page.locator("#title").fill(title)
  await page.locator("#authors").fill("Test Author")
  await page.getByRole("button", { name: "Add Book" }).click()
  await expect(page).toHaveURL(/\/shelf\?type=books(&|$)/)
  await expect(page.getByText(title)).toBeVisible()
})
