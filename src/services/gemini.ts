import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.ts';

const gemini = new GoogleGenAI({
  apiKey: env.GEMINI_APIKEY,
});
const model = 'gemini-2.5-flash';

export async function transcribeAudio(audioAsBase64: string, mimeType: string) {
  const response = await gemini.models.generateContent({
    model,
    contents: [
      {
        text: 'transcreva o áudio para portuguẽs do brasil. Seja preciso e natural na transcrição. Mantenhha a pontuação adequeada e divida o texto em parágrafos quando for apropriado',
      },
      {
        inlineData: {
          mimeType,
          data: audioAsBase64,
        },
      },
    ],
  });

  if (!response.text) {
    throw new Error('Failed to transcribe audio');
  }
  return response.text;
}

export const generateEmbeddings = async (text: string) => {
  const response = await gemini.models.embedContent({
    model: 'text-embedding-004',
    contents: [{ text }],
    config: {
      taskType: 'RETRIEVAL_DOCUMENT',
    },
  });

  if (
    !response.embeddings ||
    response.embeddings.length === 0 ||
    !response.embeddings?.[0].values
  ) {
    throw new Error('Failed to generate embeddings');
  }

  return response.embeddings[0].values;
};

export async function generateAnswer(
  question: string,
  transcriptions: string[]
) {
  const context = transcriptions.join(',');
  const response = await gemini.models.generateContent({
    model,
    contents: [
      {
        text: `Responda a pergunta de forma direta e objetiva, utilizando o
        contexto fornecido. Se a resposta não estiver no contexto, diga que
        não sabe. Contexto: ${context}. Pergunta: ${question}`.trim(),
      },
      {
        text: question,
      },
    ],
  });

  if (!response.text) {
    throw new Error('Failed to generate answer');
  }

  return response.text;
}
