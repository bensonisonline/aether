CREATE TABLE "profiles" (
	"id" varchar(50) PRIMARY KEY DEFAULT '01K0QGDDM4PAVRZ2H69W1Y4DRP' NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"username" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"bio" text,
	"type" varchar DEFAULT 'student' NOT NULL,
	"school" varchar(100),
	"department" varchar(100),
	"level" varchar(100),
	"matric_number" varchar(100),
	"organization" varchar(100),
	"industry" varchar(100),
	"role" varchar(100),
	"is_private" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profiles_userId_unique" UNIQUE("user_id"),
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "username_changes" (
	"id" varchar(50) PRIMARY KEY DEFAULT '01K0QGDDM6MA5Y5SE81RQVF5MT' NOT NULL,
	"profile_id" uuid NOT NULL,
	"old_username" varchar(32) NOT NULL,
	"new_username" varchar(32) NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(50) PRIMARY KEY DEFAULT '01K0QGDDMFZYKB9BR8X5CHZQNF' NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"fingerprint" text NOT NULL,
	"platform" varchar NOT NULL,
	"provider" varchar DEFAULT 'local' NOT NULL,
	"last_login" timestamp with time zone,
	"login_attempts" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(50) PRIMARY KEY DEFAULT '01K0QGDDM06SVRXXJEGPPDZETM' NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_super_user" boolean DEFAULT false,
	"gender" varchar,
	"date_of_birth" timestamp with time zone,
	"status" varchar DEFAULT 'active' NOT NULL,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "otp_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" varchar NOT NULL,
	"channel" varchar NOT NULL,
	"event" varchar NOT NULL,
	"ip" varchar,
	"user_agent" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar(50) PRIMARY KEY DEFAULT '01K0QGDDMWNQ66HE16RNQ658F4' NOT NULL,
	"session_id" varchar(50) NOT NULL,
	"role" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" varchar(50) PRIMARY KEY DEFAULT '01K0QGDDMWPE9Q00YAV280Y31H' NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"prompt_key" text NOT NULL,
	"model" varchar DEFAULT 'llama3-70b-8192' NOT NULL,
	"title" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_prompts" (
	"id" varchar(50) PRIMARY KEY DEFAULT '01K0QGDDN4HMGBMADY64BAFYVH' NOT NULL,
	"key" varchar(30) DEFAULT 'TUTOR' NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"model" varchar(100) DEFAULT 'llama3-70b-8192' NOT NULL,
	"capability" varchar(100) NOT NULL,
	"output_type" text DEFAULT 'text' NOT NULL,
	"prompt" jsonb NOT NULL,
	"is_user_editable" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ai_prompts_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "username_idx" ON "profiles" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "user_fingerprint_idx" ON "sessions" USING btree ("user_id","fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email");