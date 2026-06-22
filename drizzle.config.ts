import { config } from "dotenv";
import { existsSync } from "fs";
import { defineConfig } from "drizzle-kit";

if (existsSync(".env.local")) config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error(
    "\n❌ DATABASE_URL 未设置。请在 .env.local 填入 Neon 连接串后再运行 db:push\n"
  );
  process.exit(1);
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
