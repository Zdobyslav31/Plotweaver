import { ApiError, OpenAPI } from "../../src/client"

type SetupApiCallContext = {
  operation: string
  baseUrl: string
  identifier?: string
}

const serializeBody = (body: unknown): string => {
  if (typeof body === "string") {
    return body
  }

  try {
    return JSON.stringify(body)
  } catch {
    return String(body)
  }
}

const formatUnknownError = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }

  return String(error)
}

const withCause = (message: string, cause: unknown): Error => {
  const wrappedError = new Error(message) as Error & { cause?: unknown }
  wrappedError.cause = cause
  return wrappedError
}

const formatIdentifier = (identifier?: string): string =>
  identifier ? ` for ${identifier}` : ""

const formatMessage = (parts: Array<string | undefined>): string =>
  parts.filter((part): part is string => Boolean(part)).join(" | ")

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

export const setSetupApiBaseUrl = (): string => {
  const fromPlaywright = process.env.PLAYWRIGHT_API_URL
  const fromVite = process.env.VITE_API_URL
  const candidate = fromPlaywright ?? fromVite ?? "http://localhost:8000"

  if (!candidate.trim()) {
    OpenAPI.BASE = "http://localhost:8000"
    return OpenAPI.BASE
  }

  try {
    OpenAPI.BASE = normalizeApiBaseUrl(candidate)
    return OpenAPI.BASE
  } catch {
    throw new Error(
      `Invalid API base URL for Playwright tests: "${candidate}". Set PLAYWRIGHT_API_URL or VITE_API_URL to an absolute URL, e.g. http://localhost:8000`,
    )
  }
}

export const runSetupApiCall = async <T>(
  context: SetupApiCallContext,
  run: () => Promise<T>,
): Promise<T> => {
  try {
    return await run()
  } catch (error) {
    if (error instanceof ApiError) {
      throw withCause(
        formatMessage([
          `${context.operation} failed${formatIdentifier(context.identifier)}`,
          `base=${context.baseUrl}`,
          `endpoint=${error.request.url}`,
          `requestUrl=${error.url}`,
          `status=${error.status} ${error.statusText}`,
          `response=${serializeBody(error.body)}`,
        ]),
        error,
      )
    }

    throw withCause(
      formatMessage([
        `${context.operation} failed${formatIdentifier(context.identifier)}`,
        `base=${context.baseUrl}`,
        `error=${formatUnknownError(error)}`,
      ]),
      error,
    )
  }
}
