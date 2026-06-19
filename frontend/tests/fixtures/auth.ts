import fs from "node:fs"
import { test as base, expect } from "@playwright/test"

import { firstSuperuser, firstSuperuserPassword } from "../config"
import { createUser } from "../utils/privateApi"
import { randomPassword } from "../utils/random"
import {
  annotateTestAccount,
  buildRunScopedEmail,
  getTestRunId,
} from "../utils/testIdentity"

type TestAccount = {
  email: string
  password: string
  runId: string
}

type AuthFixtures = {
  guestAuth: boolean
  superuserAccount: TestAccount
  regularUserAccount: TestAccount
  freshUserAccount: TestAccount
}

type StorageStateValue =
  | string
  | {
      cookies: { name: string; value: string; domain: string; path: string }[]
      origins: {
        origin: string
        localStorage: { name: string; value: string }[]
      }[]
    }

type OverrideFixtures = {
  storageState: StorageStateValue
}

export const test = base.extend<AuthFixtures & OverrideFixtures>({
  guestAuth: [false, { option: true }],

  storageState: async ({ storageState: baseStorageState, guestAuth }, use) => {
    if (guestAuth) {
      await use({ cookies: [], origins: [] })
    } else {
      await use(baseStorageState)
    }
  },

  superuserAccount: async ({ browserName: _browserName }, use, testInfo) => {
    const account = {
      email: firstSuperuser,
      password: firstSuperuserPassword,
      runId: getTestRunId(),
    }

    await annotateTestAccount({
      testInfo,
      email: account.email,
      purpose: "superuser",
    })

    await use(account)
  },

  regularUserAccount: async ({ browserName: _browserName }, use, testInfo) => {
    let credentials: { email: string; password: string }

    try {
      const data = fs.readFileSync(
        "playwright/.auth/regular_user_credentials.json",
        "utf-8",
      )
      credentials = JSON.parse(data)
    } catch {
      // Fallback: create a new user if setup hasn't been run
      const password = randomPassword()
      const email = `e2e.regular-user.${getTestRunId()}.w${testInfo.workerIndex}.${Math.random().toString(36).slice(2, 8)}@example.com`
      await createUser({ email, password })
      credentials = { email, password }

      // Best-effort: persist credentials so subsequent tests can reuse this account.
      try {
        fs.mkdirSync("playwright/.auth", { recursive: true })
        fs.writeFileSync(
          "playwright/.auth/regular_user_credentials.json",
          JSON.stringify(credentials),
          "utf-8",
        )
      } catch {
        // Ignore persistence errors (e.g. read-only FS).
      }
    }

    await annotateTestAccount({
      testInfo,
      email: credentials.email,
      purpose: "regular-user",
    })

    await use({
      email: credentials.email,
      password: credentials.password,
      runId: getTestRunId(),
    })
  },

  freshUserAccount: async ({ browserName: _browserName }, use, testInfo) => {
    const password = randomPassword()
    const email = buildRunScopedEmail({ testInfo, purpose: "fresh-user" })

    await createUser({ email, password })

    await annotateTestAccount({
      testInfo,
      email,
      purpose: "fresh-user",
    })

    await use({ email, password, runId: getTestRunId() })
  },
})

export { expect }
