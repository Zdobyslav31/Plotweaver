import { expect, test } from "../fixtures/auth"
import { SignupPage } from "../pages/signup.page"
import { randomEmail, randomPassword } from "../utils/random"

// Auth intent: guest-only signup behavior; always start anonymous.
test.use({ guestAuth: true })

test.describe("Sign Up page", () => {
  test.beforeEach(async ({ page }) => {
    const signupPage = new SignupPage(page)
    await signupPage.goto()
  })

  test("Inputs are visible, empty and editable", async ({ page }) => {
    const signupPage = new SignupPage(page)

    await signupPage.verifyEmptyInput("Full Name")
    await signupPage.verifyEmptyInput("Email")
    await signupPage.verifyEmptyInput("Password")
    await signupPage.verifyEmptyInput("Confirm Password")
  })

  test("Sign Up button is visible", async ({ page }) => {
    const signupPage = new SignupPage(page)

    await expect(signupPage.submitButton).toBeVisible()
  })

  test("Log In link is visible", async ({ page }) => {
    const signupPage = new SignupPage(page)

    await expect(signupPage.loginLink).toBeVisible()
  })

  test("Sign up with valid name, email, and password", async ({ page }) => {
    const signupPage = new SignupPage(page)

    const full_name = "Test User"
    const email = randomEmail()
    const password = randomPassword()

    await signupPage.fillForm(full_name, email, password, password)
    await signupPage.submitButton.click()

    await page.waitForURL("**/login")
  })

  test("Sign up with invalid email", async ({ page }) => {
    const signupPage = new SignupPage(page)

    await signupPage.fillForm(
      "Playwright Test",
      "invalid-email",
      "changethis",
      "changethis",
    )
    await signupPage.submitButton.click()

    await expect(page.getByText("Invalid email address")).toBeVisible()
  })

  test("Sign up with existing email", async ({ page }) => {
    const signupPage = new SignupPage(page)

    const fullName = "Test User"
    const email = randomEmail()
    const password = randomPassword()

    await signupPage.fillForm(fullName, email, password, password)
    await Promise.all([
      page.waitForURL("**/login"),
      signupPage.submitButton.click(),
    ])

    await signupPage.goto()
    await expect(page).toHaveURL(/\/signup$/)

    await signupPage.fillForm(fullName, email, password, password)
    await signupPage.submitButton.click()

    const notifications = page.getByRole("region", { name: /Notifications/i })
    await expect(
      notifications.getByText(
        "The user with this email already exists in the system",
      ),
    ).toBeVisible()
  })

  test("Sign up with weak password", async ({ page }) => {
    const signupPage = new SignupPage(page)

    const fullName = "Test User"
    const email = randomEmail()
    const password = "weak"

    await signupPage.fillForm(fullName, email, password, password)
    await signupPage.submitButton.click()

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible()
  })

  test("Sign up with mismatched passwords", async ({ page }) => {
    const signupPage = new SignupPage(page)

    const fullName = "Test User"
    const email = randomEmail()
    const password = randomPassword()
    const password2 = randomPassword()

    await signupPage.fillForm(fullName, email, password, password2)
    await signupPage.submitButton.click()

    await expect(page.getByText("The passwords don't match")).toBeVisible()
  })

  test("Sign up with missing full name", async ({ page }) => {
    const signupPage = new SignupPage(page)

    const fullName = ""
    const email = randomEmail()
    const password = randomPassword()

    await signupPage.fillForm(fullName, email, password, password)
    await signupPage.submitButton.click()

    await expect(page.getByText("Full Name is required")).toBeVisible()
  })

  test("Sign up with missing email", async ({ page }) => {
    const signupPage = new SignupPage(page)

    const fullName = "Test User"
    const email = ""
    const password = randomPassword()

    await signupPage.fillForm(fullName, email, password, password)
    await signupPage.submitButton.click()

    await expect(page.getByText("Invalid email address")).toBeVisible()
  })

  test("Sign up with missing password", async ({ page }) => {
    const signupPage = new SignupPage(page)

    const fullName = ""
    const email = randomEmail()
    const password = ""

    await signupPage.fillForm(fullName, email, password, password)
    await signupPage.submitButton.click()

    await expect(page.getByText("Password is required")).toBeVisible()
  })
})
