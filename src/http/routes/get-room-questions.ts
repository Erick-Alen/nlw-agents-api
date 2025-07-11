import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod';
import { db } from '../../db/connection.ts';
import { schema } from '../../db/schema/index.ts';
import { desc, eq } from 'drizzle-orm';
export const getRoomQuestionsRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/rooms/:roomId/questions',
    {
      schema: {
        params: z.object({
          roomId: z.string(),
        }),
      },
    },
    async (request, _) => {
      const { roomId } = request.params;
      const results = await db
        .select({
          id: schema.questions.id,
          question: schema.questions.question,
          answer: schema.questions.answer,
          createdAt: schema.questions.createdAt,
        })
        .from(schema.questions)
        .where(eq(schema.questions.roomId, roomId))
        .orderBy(desc(schema.questions.createdAt));
      return results;
      // return reply.status(200).send(results);
    }
  );
};
