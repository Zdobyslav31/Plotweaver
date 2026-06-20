import type { Locator, Page } from "@playwright/test"

export abstract class BasePage {
  readonly page: Page
  readonly userMenu: Locator

  constructor(page: Page) {
    this.page = page
    this.userMenu = page.getByTestId("user-menu")
  }

  async logOut() {
    await this.userMenu.click()
    await this.page.getByRole("menuitem", { name: "Log out" }).click()
  }

  async setInvalidToken() {
    await this.page.evaluate(() => {
      localStorage.setItem("access_token", "invalid_token")
    })
  }
}
