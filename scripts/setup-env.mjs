#!/usr/bin/env node
/**
 * 初始化 .env.local：生成 SESSION_SECRET，保留已有变量
 */
import { randomBytes } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env.local");
const examplePath = join(process.cwd(), ".env.example");

let content = "";
if (existsSync(envPath)) {
  content = readFileSync(envPath, "utf8");
} else if (existsSync(examplePath)) {
  content = readFileSync(examplePath, "utf8");
}

if (!/^SESSION_SECRET=.+$/m.test(content) || /SESSION_SECRET=\s*$/.test(content)) {
  const secret = randomBytes(32).toString("hex");
  if (/SESSION_SECRET=/.test(content)) {
    content = content.replace(
      /SESSION_SECRET=.*/,
      `SESSION_SECRET=${secret}`
    );
  } else {
    content += `\nSESSION_SECRET=${secret}\n`;
  }
  console.log("✓ 已生成 SESSION_SECRET");
} else {
  console.log("· SESSION_SECRET 已存在，跳过");
}

if (!existsSync(envPath)) {
  writeFileSync(envPath, content.trim() + "\n");
  console.log("✓ 已创建 .env.local");
} else {
  writeFileSync(envPath, content.trim() + "\n");
}

if (!/^DATABASE_URL=postgres/m.test(content)) {
  console.log("\n⚠ 请在 .env.local 中填入 Neon 的 DATABASE_URL");
}
if (!/^DASHSCOPE_API_KEY=sk-/m.test(content)) {
  console.log("⚠ 请在 .env.local 中填入 DASHSCOPE_API_KEY");
}

console.log("\n下一步:");
console.log("  npm run db:push");
console.log("  npm run dev");
