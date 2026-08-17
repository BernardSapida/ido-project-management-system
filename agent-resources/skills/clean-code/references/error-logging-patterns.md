---
id: error-logging-patterns
title: Error Logging Patterns
---

# Error Logging Patterns

Project-specific patterns for logging errors on the server and client in a way that makes production errors traceable — you should always know *what broke*, *where*, *who triggered it*, and *which request it came from*.

---

## The Core Problem

Without structured logging, production errors look like:
```
Error: Something went wrong
```

With these patterns, they look like:
```json
{
  "level": "error",
  "message": "Failed to update user profile",
  "requestId": "req_abc123",
  "userId": "usr_xyz789",
  "operation": "user.updateProfile",
  "error": "Unique constraint failed on email",
  "timestamp": "2026-04-25T08:32:11.042Z"
}
```

The `requestId` is the key — it links the server log to the client action that triggered it.

---

## 1. Logger Utility

Create once, import everywhere. In development: readable. In production: structured JSON.

```ts
// src/lib/logger.ts
import { env } from '@/env'

type LogLevel = 'info' | 'warn' | 'error'

interface LogPayload {
  message: string
  requestId?: string
  userId?: string
  operation?: string
  error?: string
  stack?: string
  [key: string]: unknown
}

function log(level: LogLevel, payload: LogPayload) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  }

  if (env.NODE_ENV === 'development') {
    const { message, ...rest } = entry
    console[level](`[${level.toUpperCase()}] ${message}`, Object.keys(rest).length ? rest : '')
  } else {
    // Structured JSON — parseable by log aggregators (Logtail, Datadog, etc.)
    console[level](JSON.stringify(entry))
  }
}

export const logger = {
  info: (message: string, payload?: Omit<LogPayload, 'message'>) =>
    log('info', { message, ...payload }),
  warn: (message: string, payload?: Omit<LogPayload, 'message'>) =>
    log('warn', { message, ...payload }),
  error: (message: string, payload?: Omit<LogPayload, 'message'>) =>
    log('error', { message, ...payload }),
}
```

---

## 2. Correlation / Request IDs

A `requestId` ties together every log line from a single client action. Generate it in middleware and thread it through.

### Generate in middleware

```ts
// src/integrations/trpc/init.ts
import { initTRPC, TRPCError } from '@trpc/server'
import { logger } from '@/lib/logger'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const requestId = opts.headers.get('x-request-id') ?? crypto.randomUUID()
  return { requestId }
}

const t = initTRPC.context<typeof createTRPCContext>().create()

// Log every tRPC error with requestId automatically
const errorLogger = t.middleware(async ({ path, next, ctx }) => {
  const result = await next()
  if (!result.ok) {
    logger.error(`tRPC error on ${path}`, {
      requestId: ctx.requestId,
      operation: path,
      error: result.error.message,
      code: result.error.code,
    })
  }
  return result
})

export const publicProcedure = t.procedure.use(errorLogger)
export const protectedProcedure = t.procedure.use(errorLogger).use(authMiddleware)
```

### Send requestId from client

```ts
// src/integrations/trpc/react.ts — add header to every request
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'

function makeRequestId() {
  return `req_${crypto.randomUUID().slice(0, 8)}`
}

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchStreamLink({
      url: '/api/trpc',
      headers() {
        return { 'x-request-id': makeRequestId() }
      },
    }),
  ],
})
```

Now every client request carries an ID. The server logs it. When a user reports an error, they can give you the `requestId` from the toast (see client patterns below).

---

## 3. Server-Side Patterns

### tRPC procedure

```ts
// src/features/user/api/user.router.ts
import { logger } from '@/lib/logger'
import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/prisma'

export const userRouter = router({
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const { requestId, session } = ctx
      const userId = session.user.id

      try {
        const user = await prisma.user.update({
          where: { id: userId },
          data: input,
        })

        logger.info('User profile updated', { requestId, userId, operation: 'user.updateProfile' })
        return user
      } catch (error) {
        logger.error('Failed to update user profile', {
          requestId,
          userId,
          operation: 'user.updateProfile',
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })

        // Rethrow as TRPCError — never expose raw DB errors to client
        if (isPrismaUniqueError(error)) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Email already in use' })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update profile' })
      }
    }),
})
```

### createServerFn

```ts
// src/features/user/api/user.functions.ts
import { createServerFn } from '@tanstack/react-start'
import { logger } from '@/lib/logger'

export const deleteAccount = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data, request }) => {
    const requestId = request?.headers.get('x-request-id') ?? crypto.randomUUID()

    try {
      await prisma.user.delete({ where: { id: data.userId } })
      logger.info('Account deleted', { requestId, userId: data.userId, operation: 'user.deleteAccount' })
    } catch (error) {
      logger.error('Failed to delete account', {
        requestId,
        userId: data.userId,
        operation: 'user.deleteAccount',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  })
```

### Prisma error helpers

```ts
// src/lib/prisma-errors.ts
import { Prisma } from '@prisma/client'

export function isPrismaUniqueError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export function isPrismaNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

// Usage:
// if (isPrismaUniqueError(error)) throw new TRPCError({ code: 'CONFLICT', ... })
// if (isPrismaNotFoundError(error)) throw new TRPCError({ code: 'NOT_FOUND', ... })
```

---

## 4. Client-Side Patterns

### tRPC mutation with onError

```ts
// In a component or custom hook
const utils = useTRPC()
const mutation = useMutation(
  utils.user.updateProfile.mutationOptions({
    onSuccess: () => {
      addToast({ title: 'Profile updated', color: 'success' })
    },
    onError: (error) => {
      // Log to console so it shows in browser devtools
      console.error('[mutation] user.updateProfile failed', {
        message: error.message,
        code: error.data?.code,
      })

      // Show user-facing message — include a reference ID if available
      addToast({
        title: 'Failed to update profile',
        description: error.message,
        color: 'danger',
      })
    },
  })
)
```

### Route error boundary (catches loader/render errors)

```tsx
// src/routes/settings.tsx
import type { ErrorComponentProps } from '@tanstack/react-router'

function SettingsError({ error, reset }: ErrorComponentProps) {
  // Log so it appears in browser console / any client-side error tracker
  console.error('[route:settings] render error', error)

  return (
    <div>
      <p>Something went wrong loading this page.</p>
      <button onClick={reset} type="button">Try again</button>
    </div>
  )
}

export const Route = createFileRoute('/settings')({
  errorComponent: SettingsError,
  // ...
})
```

### Global React error boundary (catches unhandled component errors)

```tsx
// src/components/feedback/GlobalErrorBoundary.tsx
import { Component, type ReactNode } from 'react'

interface State { hasError: boolean; error: Error | null }

export class GlobalErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[GlobalErrorBoundary]', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false, error: null })} type="button">
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

---

## 5. Traceability: Finding Where an Error Came From

When a user reports "I got an error", this is how you find it:

### What to capture in every server log

```ts
logger.error('Operation failed', {
  requestId,    // links this log to the client request
  userId,       // who triggered it
  operation,    // what they were trying to do (e.g. 'user.updateProfile')
  input: { id: data.id }, // relevant input — NEVER include passwords/tokens
  error: error.message,
  stack: error.stack,
})
```

### What the user sees (in the toast)

If you want users to give you an error reference:

```ts
onError: (error) => {
  const ref = error.data?.requestId ?? 'unknown'

  addToast({
    title: 'Something went wrong',
    description: `Error ref: ${ref}`, // user can copy this
    color: 'danger',
  })

  console.error('[client]', { ref, message: error.message })
}
```

Then you search your logs for `requestId: "req_abc123"` and see the full server trace.

### Return requestId from tRPC errors

```ts
// src/integrations/trpc/init.ts
const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error, ctx }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        requestId: ctx?.requestId, // attach to every error response
      },
    }
  },
})
```

---

## 6. What Never to Log

| Never log | Why |
|-----------|-----|
| Passwords, tokens, session secrets | Security — even in dev logs |
| Full request bodies | May contain PII |
| Credit card / payment data | Compliance (PCI) |
| Raw Prisma errors in client responses | Leaks DB schema |
| Stack traces to the client | Leaks implementation details |

Only log stack traces **server-side**. Client-facing error messages should be human-friendly and reveal nothing about internals.

---

## 7. DO / DON'T Summary

| DO | DON'T |
|----|-------|
| Log `requestId`, `userId`, `operation` on every server error | Log without context — bare `console.error(error)` |
| Rethrow as `TRPCError` with a safe message | Expose raw Prisma/DB error to the client |
| Use `logger.error()` (structured) on server | Use `console.log` for error-level events |
| Log in `onError` on the client | Silently swallow mutation errors |
| Include `requestId` in user-facing error toasts | Show raw error messages to users |
| Log what the user was *trying* to do (operation) | Log only the exception message with no context |
