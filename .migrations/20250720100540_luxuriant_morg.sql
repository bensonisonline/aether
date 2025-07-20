ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD COLUMN "model" varchar DEFAULT 'llama3-70b-8192' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;