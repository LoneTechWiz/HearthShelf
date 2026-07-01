CREATE TABLE "shelfEventItem" (
	"eventId" text NOT NULL,
	"lendableItemId" text NOT NULL,
	CONSTRAINT "shelfEventItem_eventId_lendableItemId_pk" PRIMARY KEY("eventId","lendableItemId")
);
--> statement-breakpoint
CREATE TABLE "shelfEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"startsAt" timestamp NOT NULL,
	"recurrence" text DEFAULT 'none' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shelfEventItem" ADD CONSTRAINT "shelfEventItem_eventId_shelfEvent_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."shelfEvent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shelfEventItem" ADD CONSTRAINT "shelfEventItem_lendableItemId_lendableItem_id_fk" FOREIGN KEY ("lendableItemId") REFERENCES "public"."lendableItem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shelfEvent" ADD CONSTRAINT "shelfEvent_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;