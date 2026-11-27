import { aiConfig } from './config.ts';
import { createGeminiProvider } from './gemini.ts';
import { createCompatibleProvider } from './openai-compatible.ts';

export const ai =
  aiConfig.AI_PROVIDER === 'gemini'
    ? createGeminiProvider(aiConfig)
    : createCompatibleProvider(aiConfig);
