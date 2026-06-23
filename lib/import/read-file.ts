import mammoth from "mammoth";
import { isDocxFile } from "@/lib/import/rules";

const MAX_TEXT_CHARS = 28_000;

function truncateText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return trimmed.length > MAX_TEXT_CHARS
    ? trimmed.slice(0, MAX_TEXT_CHARS) + "\n\n…（内容已截断）"
    : trimmed;
}

async function readDocxAsText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { value, messages } = await mammoth.extractRawText({ buffer });

  if (messages.length > 0) {
    console.warn("[import/docx]", file.name, messages);
  }

  const text = truncateText(value);
  if (!text) {
    throw new Error("无法从 Word 文档中提取有效文本，请确认文件未损坏或为空");
  }
  return text;
}

async function readPlainTextFile(file: File): Promise<string> {
  const text = truncateText(await file.text());
  if (!text) {
    throw new Error("无法从文件中读取有效文本");
  }
  return text;
}

/** 从上传文件提取可用于 AI 整理的纯文本 */
export async function readImportFileContent(file: File): Promise<string> {
  if (isDocxFile(file.name)) {
    return readDocxAsText(file);
  }
  return readPlainTextFile(file);
}
