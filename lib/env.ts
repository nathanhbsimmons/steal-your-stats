import { z } from 'zod'

const envSchema = z.object({
  SETLISTFM_API_KEY: z.string().min(1, 'Setlist.fm API key is required').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Parse environment variables with better error handling
let env: z.infer<typeof envSchema>
try {
  env = envSchema.parse(process.env)
} catch (error) {
  console.error('Environment validation failed:', error)
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SETLIST')))
  throw error
}

export { env }

export type Env = z.infer<typeof envSchema>
