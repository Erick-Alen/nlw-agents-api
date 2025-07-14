import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod';
import { schema } from '../../db/schema/index.ts';
import { generateAnswer, generateEmbeddings } from '../../services/gemini.ts';
import { and, eq, sql } from 'drizzle-orm';
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

      const embeddings = await generateEmbeddings(question);
      const stringifiedEmbeddings = `[${embeddings.join(',')}]`;
      // find similar audio chunks in the room by 70%
      const chunks = await db
        .select({
          id: schema.audioChunks.id,
          transcription: schema.audioChunks.transcription,
          similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${stringifiedEmbeddings}::vector)`,
        })
        .from(schema.audioChunks)
        .where(
          and(
            eq(schema.audioChunks.roomId, roomId),
            sql`1- (${schema.audioChunks.embeddings} <=> ${stringifiedEmbeddings}::vector) > 0.7`
          )
        )
        .orderBy(
          sql`1- (${schema.audioChunks.embeddings} <=> ${stringifiedEmbeddings}::vector) > 0.7`
        )
        .limit(5);
      let answer: string | null = null;
      if (chunks.length === 0) {
        return reply.status(404).send({
          message: 'No similar audio chunks found',
        });
      }
      const transcriptions = chunks.map((chunk) => chunk.transcription);
      answer = await generateAnswer(question, transcriptions);
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
