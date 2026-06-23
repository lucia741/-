import { validateImportFile } from "@/lib/import/rules";
import { readImportFileContent } from "@/lib/import/read-file";
import { generateNoteDraftObject } from "./note-draft-ai";
import type { NoteDraft } from "./note-draft-ai";

export { noteDraftSchema } from "./note-draft-ai";
export type { NoteDraft } from "./note-draft-ai";
export { IMPORT_MAX_TEXT_BYTES as IMPORT_MAX_FILE_BYTES } from "@/lib/import/rules";

export function assertImportableFile(file: File) {
  const err = validateImportFile(file);
  if (err) throw new Error(err);
}

/** @deprecated use readImportFileContent from lib/import/read-file */
export async function readFileAsText(file: File): Promise<string> {
  return readImportFileContent(file);
}

export async function compileFileToNoteDraft(
  file: File,
  rawText: string,
  userInstruction: string
): Promise<NoteDraft> {
  const instruction = userInstruction.trim();
  if (!instruction) {
    throw new Error("请先描述你想如何整理这份文件");
  }

  const object = await generateNoteDraftObject(
    [
      "任务：根据用户指令，将上传文件整理为笔记草稿。",
      "",
      `文件名：${file.name}`,
      "",
      "文件内容：",
      "---",
      rawText,
      "---",
    ].join("\n"),
    instruction
  );

  return {
    ...object,
    sourceFileName: file.name,
    sourceFileSize: file.size,
    userInstruction: instruction,
  };
}
