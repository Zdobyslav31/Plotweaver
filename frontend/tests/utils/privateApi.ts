// Note: the `PrivateService` is only available when generating the client
// for local environments
import type { Page } from "@playwright/test"
import { LoginService, OpenAPI, PrivateService } from "../../src/client"

OpenAPI.BASE = `${process.env.VITE_API_URL}`

export const createUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  return await PrivateService.createUser({
    requestBody: {
      email,
      password,
      is_verified: true,
      full_name: "Test User",
    },
  })
}

export const logInUser = async (
  page: Page,
  email: string,
  password: string,
) => {
  const response = await LoginService.loginAccessToken({
    formData: {
      username: email,
      password,
    },
  })

  await page.goto("/")
  await page.evaluate((token) => {
    localStorage.setItem("access_token", token)
  }, response.access_token)
}
