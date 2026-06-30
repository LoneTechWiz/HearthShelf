CREATE TABLE "itemReview" (
	"id" text PRIMARY KEY NOT NULL,
	"lendableItemId" text NOT NULL,
	"userId" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "itemReview_userId_lendableItemId_unique" UNIQUE("userId","lendableItemId")
);
--> statement-breakpoint
ALTER TABLE "itemReview" ADD CONSTRAINT "itemReview_lendableItemId_lendableItem_id_fk" FOREIGN KEY ("lendableItemId") REFERENCES "public"."lendableItem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itemReview" ADD CONSTRAINT "itemReview_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;