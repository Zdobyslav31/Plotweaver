// Note: the `PrivateService` is only available when generating the client
// for local environments
import type { Page } from "@playwright/test"
import { LoginService, OpenAPI, PrivateService } from "../../src/client"
import { runSetupApiCall } from "./setupApi"

const normalizeApiBaseUrl = (value: string): string => {
  const trimmed = value.trim()
  const normalized = trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed

  const parsed = new URL(normalized)
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(
      `Unsupported API URL protocol "${parsed.protocol}". Expected http or https.`,
    )
  }

  return parsed.origin
}

const apiBaseUrl = (): string => {
  const fromPlaywright = process.env.PLAYWRIGHT_API_URL
  const fromVite = process.env.VITE_API_URL
  const candidate = fromPlaywright ?? fromVite ?? "http://localhost:8000"

  if (!candidate.trim()) {
    return "http://localhost:8000"
  }

  try {
    return normalizeApiBaseUrl(candidate)
  } catch {
    throw new Error(
      `Invalid API base URL for Playwright tests: "${candidate}". Set PLAYWRIGHT_API_URL or VITE_API_URL to an absolute URL, e.g. http://localhost:8000`,
    )
  }
}

export const createUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  OpenAPI.BASE = apiBaseUrl()

  return await runSetupApiCall(
    {
      operation: "createUser",
      baseUrl: OpenAPI.BASE,
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
  OpenAPI.BASE = apiBaseUrl()
  const response = await runSetupApiCall(
    {
      operation: "loginAccessToken",
      baseUrl: OpenAPI.BASE,
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
