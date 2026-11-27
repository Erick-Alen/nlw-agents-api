ALTER TABLE "audio_chunks"
  ADD COLUMN "embedding_model" text NOT NULL DEFAULT 'gemini:text-embedding-004';
--> statement-breakpoint
ALTER TABLE "audio_chunks" ALTER COLUMN "embedding_model" DROP DEFAULT;
