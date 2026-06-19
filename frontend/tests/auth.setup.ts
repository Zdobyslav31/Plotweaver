import fs from "node:fs"
import { test as setup } from "@playwright/test"
import { firstSuperuser, firstSuperuserPassword } from "./config.ts"
import { createUser } from "./utils/privateApi"
import { randomPassword } from "./utils/random"

// Auth intent: bootstrap shared authenticated states for default project runs.
const authDir = "playwright/.auth"

setup("authenticate as superuser", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true })
  await page.goto("/login")
  await page.getByTestId("email-input").fill(firstSuperuser)
  await page.getByTestId("password-input").fill(firstSuperuserPassword)
  await page.getByRole("button", { name: "Log In" }).click()
  await page.waitForURL("/")
  await page.context().storageState({ path: `${authDir}/user.json` })
})

setup("authenticate as regular user", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true })
  const email = `e2e.regular-user.${process.env.PW_TEST_RUN_ID ?? "local"}@example.com`
  const password = randomPassword()

  await createUser({ email, password })

  await page.goto("/login")
  await page.getByTestId("email-input").fill(email)
  await page.getByTestId("password-input").fill(password)
  await page.getByRole("button", { name: "Log In" }).click()
  await page.waitForURL("/")
  await page.context().storageState({ path: `${authDir}/regular_user.json` })

  fs.writeFileSync(
    `${authDir}/regular_user_credentials.json`,
    JSON.stringify({ email, password }),
    "utf-8",
  )
})
