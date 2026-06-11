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
  guestAuth: undefined
  freshUserAccount: TestAccount
}

type WorkerAuthFixtures = {
  superuserAccount: TestAccount
  regularUserAccount: TestAccount
}

export const test = base.extend<AuthFixtures, WorkerAuthFixtures>({
  guestAuth: async ({ browserName: _browserName }, use, testInfo) => {
    testInfo.annotations.push({ type: "auth", description: "guest" })
    await use(undefined)
  },

  superuserAccount: [
    async ({ browserName: _browserName }, use) => {
      const account = {
        email: firstSuperuser,
        password: firstSuperuserPassword,
        runId: getTestRunId(),
      }

      await use(account)
    },
    { scope: "worker" },
  ],

  regularUserAccount: [
    async ({ browserName: _browserName }, use, workerInfo) => {
      const password = randomPassword()
      const suffix = Math.random().toString(36).slice(2, 8)
      const email = `e2e.${getTestRunId()}.regular-user.w${workerInfo.parallelIndex}.${suffix}@example.com`

      await createUser({ email, password })

      await use({ email, password, runId: getTestRunId() })
    },
    { scope: "worker" },
  ],

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
