import { getApiApp } from '@/server/api-app'

// The whole API (`/api/v1/*`) is a Hono app from packages/api. Next.js only forwards requests,
// so the API can move to a standalone server later without code changes.
const handler = (request: Request) => getApiApp().fetch(request)

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
