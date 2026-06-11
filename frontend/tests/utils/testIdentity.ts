import type { TestInfo } from "@playwright/test"

type BuildEmailInput = {
  testInfo: TestInfo
  purpose: string
}

type AnnotateAccountInput = {
  testInfo: TestInfo
  email: string
  purpose: string
}

const slugifySegment = (value: string, maxLength: number) => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (!slug) return "na"
  return slug.slice(0, maxLength)
}

const fileStem = (filePath: string) => {
  const name = filePath.split("/").pop() ?? filePath
  return name.replace(/\.[^/.]+$/, "")
}

export const getTestRunId = () => process.env.PW_TEST_RUN_ID ?? "local"

export const buildRunScopedEmail = ({ testInfo, purpose }: BuildEmailInput) => {
  const runId = slugifySegment(getTestRunId(), 20)
  const spec = slugifySegment(fileStem(testInfo.file), 14)
  const testName = slugifySegment(testInfo.title, 18)
  const purposeSlug = slugifySegment(purpose, 12)
  const worker = `w${testInfo.workerIndex}`
  const suffix = Math.random().toString(36).slice(2, 8)
  const uniqueTail = `${worker}.${suffix}`

  const maxLocalPartLength = 64
  const prefixBudget = maxLocalPartLength - uniqueTail.length - 1
  const prefix = ["e2e", runId, purposeSlug, spec, testName]
    .filter(Boolean)
    .join(".")
    .slice(0, prefixBudget)
    .replace(/\.+$/g, "")

  const localPart = `${prefix}.${uniqueTail}`

  return `${localPart}@example.com`
}

export const annotateTestAccount = async ({
  testInfo,
  email,
  purpose,
}: AnnotateAccountInput) => {
  const runId = getTestRunId()

  testInfo.annotations.push({
    type: "account",
    description: email,
  })

  await testInfo.attach("account", {
    body: Buffer.from(
      JSON.stringify(
        {
          runId,
          email,
          purpose,
          test: testInfo.title,
          workerIndex: testInfo.workerIndex,
        },
        null,
        2,
      ),
    ),
    contentType: "application/json",
  })
}
