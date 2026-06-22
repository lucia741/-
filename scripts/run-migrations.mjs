#!/usr/bin/env node
/** 在 Neon SQL Editor 执行 drizzle/0001_features.sql，或运行 npm run db:push */
import { readFileSync } from "fs";
import { join } from "path";
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL 未设置");
  process.exit(1);
}

const sql = neon(url);
const migration = readFileSync(
  join(process.cwd(), "drizzle", "0001_features.sql"),
  "utf8"
);

const statements = migration
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  await sql(`${stmt};`);
  console.log("✓", stmt.slice(0, 60).replace(/\n/g, " ") + "…");
}

console.log("\n迁移完成");
