import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod';
import { schema } from '../../db/schema/index.ts';
import { ai } from '../../services/ai/index.ts';
import { and, cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import { db } from '../../db/connection.ts';

export const createQuestionRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/rooms/:roomId/questions',
    {
      schema: {
        params: z.object({
          roomId: z.string(),
        }),
        body: z.object({
          question: z.string().min(1, 'Question is required'),
        }),
      },
    },
    async (request, reply) => {
      const { roomId } = request.params;
      const { question } = request.body;

      const { space, values } = await ai.embed(question, 'query');
      const similarity = sql<number>`1 - (${cosineDistance(schema.audioChunks.embeddings, values)})`;
      const chunks = await db
        .select({ transcription: schema.audioChunks.transcription })
        .from(schema.audioChunks)
        .where(
          and(
            eq(schema.audioChunks.roomId, roomId),
            eq(schema.audioChunks.embeddingModel, space),
            gt(similarity, 0.7)
          )
        )
        .orderBy(desc(similarity))
        .limit(5);

      if (chunks.length === 0) {
        return reply.status(404).send({
          message: 'No similar audio chunks found',
        });
      }

      const answer = await ai.answer(question, chunks.map((chunk) => chunk.transcription));
      const result = await db
        .insert(schema.questions)
        .values({
          roomId,
          question,
          answer,
        })
        .returning();

      const insertedQuestion = result[0];
      if (!insertedQuestion) {
        throw new Error('Failed to create question');
      }

      return reply.status(201).send({
        question: insertedQuestion.id,
        answer,
      });
    }
  );
};
