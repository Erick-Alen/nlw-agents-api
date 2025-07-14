import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  GEMINI_APIKEY: z.string(),
  DATABASE_URL: z.string().startsWith('postgresql://'),
});
export const env = envSchema.parse(process.env);
