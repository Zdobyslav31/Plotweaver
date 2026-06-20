import { expect, type Locator, type Page } from "@playwright/test"
import { verifyEmptyInput } from "../utils/helpers"
import { BasePage } from "./base.page"

export class LoginPage extends BasePage {
  readonly loginForm: Locator
  readonly emailInput!: Locator
  readonly passwordInput!: Locator
  readonly submitButton!: Locator
  readonly forgotPasswordLink: Locator
  readonly signupLink: Locator

  constructor(page: Page) {
    super(page)
    this.loginForm = page.locator("form")
    this.emailInput = this.loginForm.getByLabel("Email")
    this.passwordInput = this.loginForm.getByLabel("Password", { exact: true })
    this.submitButton = this.loginForm.getByRole("button", {
      name: "Log In",
    })
    this.forgotPasswordLink = page.getByRole("link", {
      name: "Forgot your password?",
    })
    this.signupLink = page.getByRole("link", { name: "Sign up" })
  }

  async goto() {
    await this.page.goto("/login")
  }

  async fillForm(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
  }

  async submit() {
    await this.submitButton.click()
  }

  async logIn(email: string, password: string) {
    await this.fillForm(email, password)
    await this.submit()
  }

  async verifyEmptyInput(label: string, required?: boolean) {
    const input = this.loginForm.getByLabel(label, { exact: true })
    await verifyEmptyInput(input, required)
  }

  async expectWelcomeMessage() {
    await expect(
      this.page.getByText("Welcome back, nice to see you again!"),
    ).toBeVisible()
  }
}
