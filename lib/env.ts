import { z } from 'zod'

const envSchema = z.object({
  SETLISTFM_API_KEY: z.string().optional(),
  ARCHIVE_API_KEY: z.string().optional(),
  MUSICBRAINZ_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
