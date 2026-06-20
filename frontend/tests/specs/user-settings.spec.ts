import { expect, test } from "../fixtures/auth"
import { randomEmail, randomPassword } from "../utils/random"
import { logInUser } from "../utils/setupAuthApi"
import { logInUser as logInUserUi, logOutUser } from "../utils/user"

// Auth intent: mixed.
// Top-level settings/theme checks use a reusable regular user account.
// Profile/password mutation flows override to anonymous and create fresh users.
const tabs = ["My profile", "Password", "Danger zone"]

test.describe("Settings basic access", () => {
  test.use({ guestAuth: true })

  test.beforeEach(async ({ page, regularUserAccount }) => {
    await logInUser(page, regularUserAccount.email, regularUserAccount.password)
    await page.goto("/settings")
  })

  test("My profile tab is active by default", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "My profile" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  })

  test("All tabs are visible", async ({ page }) => {
    for (const tab of tabs) {
      await expect(page.getByRole("tab", { name: tab })).toBeVisible()
    }
  })

  test("Appearance button is visible in sidebar", async ({ page }) => {
    await expect(page.getByTestId("theme-button")).toBeVisible()
  })

  test("User can switch between theme modes", async ({ page }) => {
    await page.getByTestId("theme-button").click()
    await page.getByTestId("dark-mode").click()
    await expect(page.locator("html")).toHaveClass(/dark/)

    await expect(page.getByTestId("dark-mode")).not.toBeVisible()

    await page.getByTestId("theme-button").click()
    await page.getByTestId("light-mode").click()
    await expect(page.locator("html")).toHaveClass(/light/)
  })

  test("Selected mode is preserved across sessions", async ({
    page,
    regularUserAccount,
  }) => {
    await page.getByTestId("theme-button").click()
    if (
      await page.evaluate(() =>
        document.documentElement.classList.contains("dark"),
      )
    ) {
      await page.getByTestId("light-mode").click()
      await page.getByTestId("theme-button").click()
    }

    const isLightMode = await page.evaluate(() =>
      document.documentElement.classList.contains("light"),
    )
    expect(isLightMode).toBe(true)

    await page.getByTestId("theme-button").click()
    await page.getByTestId("dark-mode").click()
    let isDarkMode = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    )
    expect(isDarkMode).toBe(true)

    await logOutUser(page)
    await logInUserUi(
      page,
      regularUserAccount.email,
      regularUserAccount.password,
    )

    isDarkMode = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    )
    expect(isDarkMode).toBe(true)
  })
})

test.describe("Edit user profile", () => {
  test.use({ guestAuth: true })

  test.beforeEach(async ({ page, freshUserAccount }) => {
    await logInUser(page, freshUserAccount.email, freshUserAccount.password)
    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
  })

  test("Form inputs are disabled by default", async ({ page }) => {
    await expect(page.locator("form").getByLabel("Full name")).toBeDisabled()
    await expect(page.locator("form").getByLabel("Email")).toBeDisabled()
  })

  test("Edit user name with a valid name", async ({ page }) => {
    const updatedName = "Test User 2"

    await page.locator("form").getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Full name").fill(updatedName)
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("User updated successfully")).toBeVisible()
    await expect(page.locator("form").getByLabel("Full name")).toHaveValue(
      updatedName,
    )
  })

  test("Edit user email with an invalid email shows error", async ({
    page,
  }) => {
    await page.locator("form").getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Email").fill("")
    await page.locator("body").click()

    await expect(page.getByText("Invalid email address")).toBeVisible()
  })
})

test.describe("Edit user email", () => {
  test.use({ guestAuth: true })

  test.beforeEach(async ({ page, freshUserAccount }) => {
    await logInUser(page, freshUserAccount.email, freshUserAccount.password)
    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
  })

  test("Edit user email with a valid email", async ({ page }) => {
    const updatedEmail = randomEmail()

    await page.locator("form").getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Email").fill(updatedEmail)
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("User updated successfully")).toBeVisible()
    await expect(page.locator("form").getByLabel("Email")).toHaveValue(
      updatedEmail,
    )
  })
})

test.describe("Cancel edit actions", () => {
  test.use({ guestAuth: true })

  test("Cancel edit action restores original name", async ({
    page,
    freshUserAccount,
  }) => {
    await logInUserUi(page, freshUserAccount.email, freshUserAccount.password)
    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
    await page.locator("form").getByRole("button", { name: "Edit" }).click()
    const originalName = await page.getByLabel("Full name").inputValue()
    await page.getByLabel("Full name").fill("New Name")
    await page.locator("form").getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByLabel("Full name")).toHaveValue(originalName)
  })

  test("Cancel edit action restores original email", async ({
    page,
    freshUserAccount,
  }) => {
    await logInUserUi(page, freshUserAccount.email, freshUserAccount.password)
    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
    await page.locator("form").getByRole("button", { name: "Edit" }).click()
    const editedEmail = randomEmail()
    await page.getByLabel("Email").fill(editedEmail)
    await page.locator("form").getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByLabel("Email")).toHaveValue(freshUserAccount.email)
    await expect(page.getByLabel("Email")).toBeDisabled()
  })
})

test.describe("Change password", () => {
  test.use({ guestAuth: true })

  test("Update password successfully", async ({ page, freshUserAccount }) => {
    const password = freshUserAccount.password
    const newPassword = randomPassword()

    await logInUserUi(page, freshUserAccount.email, password)

    await page.goto("/settings")
    await page.getByRole("tab", { name: "Password" }).click()
    await page.getByTestId("current-password-input").fill(password)
    await page.getByTestId("new-password-input").fill(newPassword)
    await page.getByTestId("confirm-password-input").fill(newPassword)
    await page.getByRole("button", { name: "Update Password" }).click()

    await expect(page.getByText("Password updated successfully")).toBeVisible()

    await logOutUser(page)
    await logInUserUi(page, freshUserAccount.email, newPassword)
  })
})

test.describe("Change password validation", () => {
  test.use({ guestAuth: true })

  test.beforeEach(async ({ page, freshUserAccount }) => {
    await logInUser(page, freshUserAccount.email, freshUserAccount.password)
    await page.goto("/settings")
    await page.getByRole("tab", { name: "Password" }).click()
  })

  test("Update password with weak passwords", async ({
    page,
    freshUserAccount,
  }) => {
    const weakPassword = "weak"

    await page
      .getByTestId("current-password-input")
      .fill(freshUserAccount.password)
    await page.getByTestId("new-password-input").fill(weakPassword)
    await page.getByTestId("confirm-password-input").fill(weakPassword)
    await page.getByRole("button", { name: "Update Password" }).click()

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible()
  })

  test("New password and confirmation password do not match", async ({
    page,
    freshUserAccount,
  }) => {
    await page
      .getByTestId("current-password-input")
      .fill(freshUserAccount.password)
    await page.getByTestId("new-password-input").fill(randomPassword())
    await page.getByTestId("confirm-password-input").fill(randomPassword())
    await page.getByRole("button", { name: "Update Password" }).click()

    await expect(page.getByText("The passwords don't match")).toBeVisible()
  })

  test("Current password and new password are the same", async ({
    page,
    freshUserAccount,
  }) => {
    await page
      .getByTestId("current-password-input")
      .fill(freshUserAccount.password)
    await page.getByTestId("new-password-input").fill(freshUserAccount.password)
    await page
      .getByTestId("confirm-password-input")
      .fill(freshUserAccount.password)
    await page.getByRole("button", { name: "Update Password" }).click()

    await expect(
      page.getByText("New password cannot be the same as the current one"),
    ).toBeVisible()
  })
})
