import { z } from 'zod';
import { EMBEDDING_DIMENSIONS } from '../../config/embedding.ts';

type Audio = {
  bytes: Uint8Array;
  filename: string;
  mimeType: string;
};

export type EmbeddingTask = 'document' | 'query';

export interface AiProvider {
  transcribe(audio: Audio): Promise<string>;
  embed(text: string, task: EmbeddingTask): Promise<{ space: string; values: number[] }>;
  answer(question: string, excerpts: string[]): Promise<string>;
}

export const textOutput = z.string().trim().min(1);
export const vectorOutput = z
  .array(z.number())
  .length(EMBEDDING_DIMENSIONS)
  .refine((values) => values.some((value) => value !== 0), 'Embedding cannot be all zeros');

export function answerPrompt(question: string, excerpts: string[]) {
  return [
    'Responda em português usando apenas o contexto abaixo. Se a resposta não estiver no contexto, diga que não sabe.',
    `Contexto:\n${excerpts.join('\n\n')}`,
    `Pergunta: ${question}`,
  ].join('\n\n');
}
