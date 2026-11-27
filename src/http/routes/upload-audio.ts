import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod';
import { ai } from '../../services/ai/index.ts';
import { db } from '../../db/connection.ts';
import { schema } from '../../db/schema/index.ts';

export const uploadAudioRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/rooms/:roomId/audio',
    {
      schema: {
        params: z.object({
          roomId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { roomId } = request.params;
      const audio = await request.file();
      if (!audio) {
        throw new Error('Audio file is required');
      }
      const transcription = await ai.transcribe({
        bytes: await audio.toBuffer(),
        filename: audio.filename,
        mimeType: audio.mimetype,
      });
      const { space, values } = await ai.embed(transcription, 'document');

      const result = await db
        .insert(schema.audioChunks)
        .values({
          roomId,
          transcription,
          embeddingModel: space,
          embeddings: values,
        })
        .returning();
      const chunk = result[0];

      if (!chunk) {
        throw new Error('Failed to store audio chunk');
      }

      reply.status(201).send({
        chunkId: chunk.id,
        transcription: chunk.transcription,
        embeddings: chunk.embeddings,
      });
    }
  );
};
