ALTER TABLE "audio_chunks" ALTER COLUMN "room_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audio_chunks" ALTER COLUMN "transcription" SET DATA TYPE text;