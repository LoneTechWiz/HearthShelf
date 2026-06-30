CREATE TABLE "contactRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"requesterId" text NOT NULL,
	"recipientId" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"respondedAt" timestamp,
	CONSTRAINT "contactRequest_requesterId_recipientId_unique" UNIQUE("requesterId","recipientId")
);
--> statement-breakpoint
ALTER TABLE "contactRequest" ADD CONSTRAINT "contactRequest_requesterId_user_id_fk" FOREIGN KEY ("requesterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactRequest" ADD CONSTRAINT "contactRequest_recipientId_user_id_fk" FOREIGN KEY ("recipientId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;