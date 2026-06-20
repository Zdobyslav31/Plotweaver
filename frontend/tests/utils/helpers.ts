import { expect, type Locator } from "@playwright/test"

/**
 * Verify that an input is visible, empty, editable, and optionally required.
 *
 * @param locator - The Playwright Locator for the input element.
 * @param required - If true, asserts the input has the `required` HTML attribute.
 */
export async function verifyEmptyInput(locator: Locator, required?: boolean) {
  await expect(locator).toBeVisible()
  await expect(locator).toHaveValue("")
  await expect(locator).toBeEditable()

  if (required) {
    await expect(locator).toHaveAttribute("required", "")
  }
}
