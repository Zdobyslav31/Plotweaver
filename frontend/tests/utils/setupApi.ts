import { ApiError } from "../../src/client"

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
