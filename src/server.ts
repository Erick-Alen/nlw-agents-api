import fastifyCors from '@fastify/cors';
import fastify from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from './config/env.ts';
import { getRoomsRoute } from './http/routes/get-rooms.ts';

const app  =fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, {
  origin: 'http://localhost:5173',

})


app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.get('/health', () => {
  return { status: 'ok' };
})

app.register(getRoomsRoute)

app.listen({
  port: env.PORT,
}).then(() => {
  console.log('HTTP server running on http://localhost:3333');
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
