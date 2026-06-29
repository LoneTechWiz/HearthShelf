ALTER TABLE "book" ADD COLUMN IF NOT EXISTS "seriesName" text;--> statement-breakpoint
ALTER TABLE "book" ADD COLUMN IF NOT EXISTS "seriesPosition" integer;--> statement-breakpoint
ALTER TABLE "book" ADD COLUMN IF NOT EXISTS "seriesTotal" integer;
