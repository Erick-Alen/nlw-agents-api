import { z } from 'zod';
import { EMBEDDING_DIMENSIONS } from '../../config/embedding.ts';

const modelName = z.string().trim().min(1);
const endpoint = z.url({ protocol: /^https?$/ }).refine((value) => {
  const url = new URL(value);
  return !url.username && !url.password;
}, 'Use an API key variable for credentials');

const geminiConfig = z.object({
  AI_PROVIDER: z.literal('gemini'),
  GEMINI_APIKEY: z.string().trim().min(1),
  GEMINI_GENERATION_MODEL: modelName.default('gemini-2.5-flash'),
  GEMINI_EMBEDDING_MODEL: modelName.default('gemini-embedding-001'),
});

const compatibleConfig = z.object({
  AI_PROVIDER: z.literal('openai-compatible'),
  AI_CHAT_URL: endpoint,
  AI_CHAT_API_KEY: modelName.optional(),
  AI_CHAT_MODEL: modelName,
  AI_EMBEDDING_URL: endpoint,
  AI_EMBEDDING_API_KEY: modelName.optional(),
  AI_EMBEDDING_DIMENSIONS: z.coerce.number().pipe(z.literal(EMBEDDING_DIMENSIONS)).optional(),
  AI_EMBEDDING_MODEL: modelName,
  AI_EMBEDDING_SPACE: modelName.optional(),
  AI_EMBEDDING_FORMAT: z.enum(['plain', 'embeddinggemma']).default('plain'),
  AI_TRANSCRIPTION_URL: endpoint,
  AI_TRANSCRIPTION_FORMAT: z.enum(['multipart', 'base64-json']).default('multipart'),
  AI_TRANSCRIPTION_API_KEY: modelName.optional(),
  AI_TRANSCRIPTION_MODEL: modelName.default('whisper-1'),
});

export type GeminiConfig = z.infer<typeof geminiConfig>;
export type CompatibleConfig = z.infer<typeof compatibleConfig>;

export const aiConfig = z
  .discriminatedUnion('AI_PROVIDER', [geminiConfig, compatibleConfig])
  .parse({ ...process.env, AI_PROVIDER: process.env.AI_PROVIDER ?? 'gemini' });
