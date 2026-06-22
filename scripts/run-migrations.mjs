#!/usr/bin/env node
import { readFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { existsSync } from "fs";
import { neon } from "@neondatabase/serverless";

if (existsSync(".env.local")) config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error(`
❌ DATABASE_URL 未设置

请在 .env.local 填入 Neon 连接串
`);
  process.exit(1);
}

const sql = neon(url);

const files = ["0000_init.sql", "0001_features.sql"];

for (const file of files) {
  console.log(`\n▶ 执行 ${file}`);
  const migration = readFileSync(join(process.cwd(), "drizzle", file), "utf8");
  const statements = migration
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    try {
      await sql.query(`${stmt};`);
      console.log("  ✓", stmt.slice(0, 55).replace(/\n/g, " ") + "…");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate") ||
        msg.includes("duplicate_object")
      ) {
        console.log("  · 已存在，跳过");
      } else {
        console.error("  ✗", msg);
        throw err;
      }
    }
  }
}

console.log("\n✅ 数据库迁移完成");
