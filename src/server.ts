import fastifyCors from '@fastify/cors';
import fastify from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from './config/env.ts';
import { getRoomsRoute } from './http/routes/get-rooms.ts';
import { createRoomRoute } from './http/routes/create-room.ts';
import { getRoomQuestionsRoute } from './http/routes/get-room-questions.ts';
import { createQuestionRoute } from './http/routes/create-question.ts';
import { uploadAudioRoute } from './http/routes/upload-audio.ts';
import fastifyMultipart from '@fastify/multipart';

const app  =fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, {
  origin: 'http://localhost:5173',

})

// setting schema validations
app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

// registering plugins
// enable multipart support for file uploads into fastify
app.register(fastifyMultipart)

app.get('/health', () => {
  return { status: 'ok' };
})

app.register(getRoomsRoute)
app.register(createRoomRoute)
app.register(getRoomQuestionsRoute)
app.register(createQuestionRoute);
app.register(uploadAudioRoute);

app.listen({
  port: env.PORT,
}).then(() => {
  console.log('HTTP server running on http://localhost:3333');
}).catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
