// Note: the `PrivateService` is only available when generating the client
// for local environments
import type { Page } from "@playwright/test"
import { LoginService, PrivateService } from "../../src/client"
import { runSetupApiCall, setSetupApiBaseUrl } from "./setupApiCore"

export const createUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  const baseUrl = setSetupApiBaseUrl()

  return await runSetupApiCall(
    {
      operation: "createUser",
      baseUrl,
      identifier: email,
    },
    () =>
      PrivateService.createUser({
        requestBody: {
          email,
          password,
          is_verified: true,
          full_name: "Test User",
        },
      }),
  )
}

export const logInUser = async (
  page: Page,
  email: string,
  password: string,
) => {
  const baseUrl = setSetupApiBaseUrl()
  const response = await runSetupApiCall(
    {
      operation: "loginAccessToken",
      baseUrl,
      identifier: email,
    },
    () =>
      LoginService.loginAccessToken({
        formData: {
          username: email,
          password,
        },
      }),
  )

  await page.goto("/")
  await page.evaluate((token) => {
    localStorage.setItem("access_token", token)
  }, response.access_token)
}
