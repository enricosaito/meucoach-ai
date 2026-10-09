import { z } from 'zod'

// NEXT_PUBLIC_* values are inlined at build time, so they must be referenced literally.
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
})

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
})

if (!parsed.success) {
  throw new Error(
    `Invalid public environment variables (see .env.example, run \`pnpm env:setup\`):\n${z.prettifyError(parsed.error)}`,
  )
}

export const publicEnv = parsed.data
