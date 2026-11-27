import { GoogleGenAI } from '@google/genai';
import { EMBEDDING_DIMENSIONS } from '../../config/embedding.ts';
import type { GeminiConfig } from './config.ts';
import { answerPrompt, textOutput, vectorOutput, type AiProvider } from './provider.ts';

export function createGeminiProvider(config: GeminiConfig): AiProvider {
  const gemini = new GoogleGenAI({ apiKey: config.GEMINI_APIKEY });
  const embeddingModel = config.GEMINI_EMBEDDING_MODEL;

  return {
    async transcribe({ bytes, mimeType }) {
      const response = await gemini.models.generateContent({
        model: config.GEMINI_GENERATION_MODEL,
        contents: [
          { text: 'Transcreva este áudio em português do Brasil, com pontuação adequada.' },
          { inlineData: { mimeType, data: Buffer.from(bytes).toString('base64') } },
        ],
      });
      return textOutput.parse(response.text);
    },

    async embed(text, task) {
      const legacyModel = embeddingModel === 'text-embedding-004';
      const response = await gemini.models.embedContent({
        model: embeddingModel,
        contents: [{ text }],
        config: {
          taskType: task === 'query' && !legacyModel ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
          outputDimensionality: EMBEDDING_DIMENSIONS,
        },
      });
      return {
        space: `gemini:${embeddingModel}`,
        values: vectorOutput.parse(response.embeddings?.[0]?.values),
      };
    },

    async answer(question, excerpts) {
      const response = await gemini.models.generateContent({
        model: config.GEMINI_GENERATION_MODEL,
        contents: [{ text: answerPrompt(question, excerpts) }],
      });
      return textOutput.parse(response.text);
    },
  };
}
