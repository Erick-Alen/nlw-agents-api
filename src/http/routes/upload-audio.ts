import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod';
import { generateEmbeddings, transcribeAudio } from '../../services/gemini.ts';
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
      // audio transcription

      const audioAsBase64 = (await audio.toBuffer()).toString('base64');

      const transcriptedAudio = await transcribeAudio(
        audioAsBase64,
        audio.mimetype
      );

      // generate the semantic vector/embeddings

      const embeddings = await generateEmbeddings(transcriptedAudio);

      // store the vector in the database

      const result = await db
        .insert(schema.audioChunks)
        .values({
          roomId,
          transcription: transcriptedAudio,
          embeddings,
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
