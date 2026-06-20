import { firstSuperuser, firstSuperuserPassword } from "../config.ts"
import { expect, test } from "../fixtures/auth.ts"
import { LoginPage } from "../pages/login.page.ts"
import { randomPassword } from "../utils/random.ts"

// Auth intent: guest-only login/logout behavior; always start anonymous.
test.use({ guestAuth: true })

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test("Inputs are visible, empty, editable and required", async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.verifyEmptyInput("Email", true)
    await loginPage.verifyEmptyInput("Password", true)
  })

  test("Log In button is visible", async ({ page }) => {
    const loginPage = new LoginPage(page)

    await expect(loginPage.submitButton).toBeVisible()
  })

  test("Forgot Password link is visible", async ({ page }) => {
    const loginPage = new LoginPage(page)

    await expect(loginPage.forgotPasswordLink).toBeVisible()
  })

  test("Log in with valid email and password ", async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.logIn(firstSuperuser, firstSuperuserPassword)
    await page.waitForURL("/")

    await loginPage.expectWelcomeMessage()
  })

  test("Log in with invalid email", async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.fillForm("invalidemail", firstSuperuserPassword)
    await loginPage.submit()

    await expect(page.getByText("Invalid email address")).toBeVisible()
  })

  test("Log in with invalid password", async ({ page }) => {
    const password = randomPassword()

    const loginPage = new LoginPage(page)

    await loginPage.fillForm(firstSuperuser, password)
    await loginPage.submit()

    await expect(page.getByText("Incorrect email or password")).toBeVisible()
  })

  test("Successful log out", async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.logIn(firstSuperuser, firstSuperuserPassword)
    await page.waitForURL("/")

    await loginPage.expectWelcomeMessage()

    await loginPage.logOut()
    await page.waitForURL("/login")
  })

  test("Logged-out user cannot access protected routes", async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.logIn(firstSuperuser, firstSuperuserPassword)
    await page.waitForURL("/")

    await loginPage.expectWelcomeMessage()

    await loginPage.logOut()
    await page.waitForURL("/login")

    await page.goto("/settings")
    await page.waitForURL("/login")
  })
})

test("Redirects to /login when token is wrong", async ({ page }) => {
  const loginPage = new LoginPage(page)

  await page.goto("/settings")
  await loginPage.setInvalidToken()
  await page.goto("/settings")
  await page.waitForURL("/login")
  await expect(page).toHaveURL("/login")
})
