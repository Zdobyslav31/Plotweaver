import { expect, test } from "./fixtures/auth"
import { logInUser } from "./utils/privateApi"
import { randomEmail, randomPassword } from "./utils/random"

// Auth intent: mixed.
// Admin paths always use explicit superuser login.
test.describe("Admin basic access", () => {
  test.use({ guestAuth: true })

  test.beforeEach(async ({ page, superuserAccount }) => {
    await logInUser(page, superuserAccount.email, superuserAccount.password)
    await page.goto("/admin")
  })

  test("Admin page is accessible and shows correct title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible()
    await expect(
      page.getByText("Manage user accounts and permissions"),
    ).toBeVisible()
  })

  test("Add User button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Add User" })).toBeVisible()
  })
})

test.describe("Admin user management", () => {
  test.use({ guestAuth: true })

  test.beforeEach(async ({ page, superuserAccount }) => {
    await logInUser(page, superuserAccount.email, superuserAccount.password)
    await page.goto("/admin")
  })

  test("Create a new user successfully", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    const fullName = "Test User Admin"

    await page.getByRole("button", { name: "Add User" }).click()

    await page.getByPlaceholder("Email").fill(email)
    await page.getByPlaceholder("Full name").fill(fullName)
    await page.getByPlaceholder("Password").first().fill(password)
    await page.getByPlaceholder("Password").last().fill(password)

    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("User created successfully")).toBeVisible()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    await expect(userRow).toBeVisible()
  })

  test("Create a superuser", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()

    await page.getByRole("button", { name: "Add User" }).click()

    await page.getByPlaceholder("Email").fill(email)
    await page.getByPlaceholder("Password").first().fill(password)
    await page.getByPlaceholder("Password").last().fill(password)
    await page.getByLabel("Is superuser?").check()
    await page.getByLabel("Is active?").check()

    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("User created successfully")).toBeVisible()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    await expect(userRow.getByText("Superuser")).toBeVisible()
  })

  test("Edit a user successfully", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    const originalName = "Original Name"
    const updatedName = "Updated Name"

    await page.getByRole("button", { name: "Add User" }).click()
    await page.getByPlaceholder("Email").fill(email)
    await page.getByPlaceholder("Full name").fill(originalName)
    await page.getByPlaceholder("Password").first().fill(password)
    await page.getByPlaceholder("Password").last().fill(password)
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("User created successfully")).toBeVisible()
    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    await userRow.getByRole("button").click()

    await page.getByRole("menuitem", { name: "Edit User" }).click()

    await page.getByLabel("Full name").fill(updatedName)
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("User updated successfully")).toBeVisible()
    await expect(page.getByLabel("Full name")).toHaveValue(updatedName)
  })

  test("Delete a user successfully", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()

    await page.getByRole("button", { name: "Add User" }).click()
    await page.getByPlaceholder("Email").fill(email)
    await page.getByPlaceholder("Password").first().fill(password)
    await page.getByPlaceholder("Password").last().fill(password)
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("User created successfully")).toBeVisible()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    await userRow.getByRole("button").click()

    await page.getByRole("menuitem", { name: "Delete User" }).click()

    await page.getByRole("button", { name: "Delete" }).click()

    await expect(
      page.getByText("The user was deleted successfully"),
    ).toBeVisible()

    await expect(
      page.getByRole("row").filter({ hasText: email }),
    ).not.toBeVisible()
  })

  test("Cancel user creation", async ({ page }) => {
    await page.getByRole("button", { name: "Add User" }).click()
    await page.getByPlaceholder("Email").fill("test@example.com")

    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Email is required and must be valid", async ({ page }) => {
    await page.getByRole("button", { name: "Add User" }).click()

    await page.getByPlaceholder("Email").fill("invalid-email")
    await page.getByPlaceholder("Email").blur()

    await expect(page.getByText("Invalid email address")).toBeVisible()
  })

  test("Password must be at least 8 characters", async ({ page }) => {
    await page.getByRole("button", { name: "Add User" }).click()

    await page.getByPlaceholder("Email").fill(randomEmail())
    await page.getByPlaceholder("Password").first().fill("short")
    await page.getByPlaceholder("Password").last().fill("short")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible()
  })

  test("Passwords must match", async ({ page }) => {
    await page.getByRole("button", { name: "Add User" }).click()

    await page.getByPlaceholder("Email").fill(randomEmail())
    await page.getByPlaceholder("Password").first().fill(randomPassword())
    await page.getByPlaceholder("Password").last().fill("different12345")
    await page.getByPlaceholder("Password").last().blur()

    await expect(page.getByText("The passwords don't match")).toBeVisible()
  })
})

test.describe("Admin page access control", () => {
  test.use({ guestAuth: true })

  test("Non-superuser cannot access admin page", async ({
    page,
    freshUserAccount,
  }) => {
    await logInUser(page, freshUserAccount.email, freshUserAccount.password)

    await page.goto("/admin")

    await expect(page.getByRole("heading", { name: "Users" })).not.toBeVisible()
    await expect(page).not.toHaveURL(/\/admin/)
  })

  test("Superuser can access admin page", async ({
    page,
    superuserAccount,
  }) => {
    await logInUser(page, superuserAccount.email, superuserAccount.password)

    await page.goto("/admin")

    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible()
  })
})
