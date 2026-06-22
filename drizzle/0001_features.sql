CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "embedding" vector(1024);

CREATE TABLE IF NOT EXISTS "chat_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text DEFAULT '新对话' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "cited_notes" jsonb,
  "retrieval_strategy" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rate_limits" (
  "user_id" uuid NOT NULL,
  "endpoint" text NOT NULL,
  "window_start" timestamptz NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "rate_limits_pk" PRIMARY KEY("user_id","endpoint","window_start")
);

ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "notes_embedding_idx" ON "notes" USING hnsw ("embedding" vector_cosine_ops);
