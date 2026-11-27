import { pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core'
import { EMBEDDING_DIMENSIONS } from '../../config/embedding.ts'
import { rooms } from './rooms.ts'

export const audioChunks = pgTable('audio_chunks', {
  id: uuid().primaryKey().defaultRandom(),
  roomId: uuid()
    .references(() => rooms.id)
    .notNull(),
  transcription: text().notNull(),
  embeddingModel: text().notNull(),
  embeddings: vector({ dimensions: EMBEDDING_DIMENSIONS }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
})
