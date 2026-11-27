import { extname } from 'node:path';
import { z } from 'zod';
import type { CompatibleConfig } from './config.ts';
import { answerPrompt, textOutput, vectorOutput, type AiProvider } from './provider.ts';

const audioFormat = z.enum(['wav', 'mp3', 'flac', 'm4a', 'ogg', 'webm', 'aac']);
const transcriptionResponse = z.object({ text: textOutput });
const embeddingResponse = z.object({
  data: z.tuple([z.object({ embedding: vectorOutput })]),
});
const chatResponse = z.object({
  choices: z.array(z.object({ message: z.object({ content: textOutput }) })).min(1),
});

async function request(
  url: string,
  operation: string,
  body: FormData | object,
  apiKey?: string
): Promise<unknown> {
  const headers = new Headers();
  if (apiKey) {
    headers.set('Authorization', `Bearer ${apiKey}`);
  }
  const multipart = body instanceof FormData;
  if (!multipart) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(120_000),
    headers,
    redirect: 'error',
    body: multipart ? body : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`AI ${operation} returned HTTP ${response.status}`);
  }
  return response.json();
}

export function createCompatibleProvider(config: CompatibleConfig): AiProvider {
  const format = config.AI_EMBEDDING_FORMAT;
  const embeddingEndpoint = new URL(config.AI_EMBEDDING_URL);
  const endpointIdentity =
    config.AI_EMBEDDING_SPACE ?? `${embeddingEndpoint.origin}${embeddingEndpoint.pathname}`;
  const space = `openai-compatible:${endpointIdentity}:${config.AI_EMBEDDING_MODEL}:${format}`;

  const transcriptionOptions = { model: config.AI_TRANSCRIPTION_MODEL, language: 'pt' };
  const prefixes = {
    document: 'title: none | text: ',
    query: 'task: search result | query: ',
  };

  return {
    async transcribe({ bytes, filename, mimeType }) {
      let body: FormData | object;
      if (config.AI_TRANSCRIPTION_FORMAT === 'base64-json') {
        const extension = audioFormat.parse(extname(filename).slice(1).toLowerCase());
        body = {
          ...transcriptionOptions,
          input_audio: { data: Buffer.from(bytes).toString('base64'), format: extension },
        };
      } else {
        const form = new FormData();
        form.set('file', new File([new Uint8Array(bytes)], filename, { type: mimeType }));
        form.set('model', transcriptionOptions.model);
        form.set('language', transcriptionOptions.language);
        form.set('response_format', 'json');
        body = form;
      }

      const response = await request(
        config.AI_TRANSCRIPTION_URL,
        'transcription',
        body,
        config.AI_TRANSCRIPTION_API_KEY
      );
      return transcriptionResponse.parse(response).text;
    },

    async embed(text, task) {
      const response = await request(
        config.AI_EMBEDDING_URL,
        'embedding',
        {
          model: config.AI_EMBEDDING_MODEL,
          input: format === 'embeddinggemma' ? prefixes[task] + text : text,
          dimensions: config.AI_EMBEDDING_DIMENSIONS,
        },
        config.AI_EMBEDDING_API_KEY
      );
      return { space, values: embeddingResponse.parse(response).data[0].embedding };
    },

    async answer(question, excerpts) {
      const response = await request(
        config.AI_CHAT_URL,
        'chat completion',
        {
          model: config.AI_CHAT_MODEL,
          messages: [{ role: 'user', content: answerPrompt(question, excerpts) }],
          stream: false,
        },
        config.AI_CHAT_API_KEY
      );
      return chatResponse.parse(response).choices[0].message.content;
    },
  };
}
