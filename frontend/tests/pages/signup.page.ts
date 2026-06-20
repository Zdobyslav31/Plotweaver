import { expect, type Locator, type Page } from "@playwright/test"

export class SignupPage {
  readonly page: Page
  readonly signupForm: Locator
  readonly fullNameInput!: Locator
  readonly emailInput!: Locator
  readonly passwordInput!: Locator
  readonly confirmPasswordInput!: Locator
  readonly submitButton!: Locator
  readonly loginLink: Locator

  constructor(page: Page) {
    this.page = page
    this.signupForm = page.locator("form")
    this.fullNameInput = this.signupForm.getByLabel("Full Name")
    this.emailInput = this.signupForm.getByLabel("Email")
    this.passwordInput = this.signupForm.getByLabel("Password", { exact: true })
    this.confirmPasswordInput = this.signupForm.getByLabel("Confirm Password", {
      exact: true,
    })
    this.submitButton = this.signupForm.getByRole("button", {
      name: "Sign Up",
    })
    this.loginLink = page.getByRole("link", { name: "Log In" })
  }

  async goto() {
    await this.page.goto("/signup")
  }

  async fillForm(
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) {
    await this.fullNameInput.fill(fullName)
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.confirmPasswordInput.fill(confirmPassword)
  }

  async verifyEmptyInput(label: string) {
    const input = this.signupForm.getByLabel(label, { exact: true })
    await expect(input).toBeVisible()
    await expect(input).toHaveValue("")
    await expect(input).toBeEditable()
    await expect(input).toHaveAttribute("required", "")
  }
}
