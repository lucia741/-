import { generateObject } from "ai";
import { z } from "zod";
import { getAiModel } from "./model";
import {
  buildFormatRules,
  contentSchemaHint,
  finalizeContent,
  inferContentFormat,
} from "./instruction-style";

export const noteDraftSchema = z.object({
  title: z.string().describe("简洁准确的笔记标题"),
  content: z.string().describe("笔记正文"),
  tags: z.array(z.string()).max(8).describe("3-6 个相关标签"),
  summary: z.string().describe("一句话说明如何按用户需求整理"),
});

export type NoteDraft = z.infer<typeof noteDraftSchema> & {
  sourceFileName: string;
  sourceFileSize: number;
  userInstruction: string;
};

function buildDraftSchema(format: ReturnType<typeof inferContentFormat>) {
  return z.object({
    title: z.string().describe("简洁准确的笔记标题"),
    content: z.string().describe(contentSchemaHint(format)),
    tags: z.array(z.string()).max(8).describe("3-6 个相关标签"),
    summary: z.string().describe("一句话说明如何按用户需求完成整理"),
  });
}

export function buildDraftPromptSections(
  userInstruction: string,
  priorInstruction?: string
) {
  const format = inferContentFormat(userInstruction, priorInstruction);
  return {
    format,
    sections: [
      "## 最高优先级：用户指令（必须完整执行，不可忽略）",
      userInstruction.trim(),
      "",
      buildFormatRules(format),
      "",
      "若用户要求去除符号 / AI 痕迹 / 改为纯文本，必须重写 content，不可保留原 Markdown 标记。",
    ].join("\n"),
  };
}

export async function generateNoteDraftObject(
  promptBody: string,
  userInstruction: string,
  priorInstruction?: string
) {
  const { format, sections } = buildDraftPromptSections(
    userInstruction,
    priorInstruction
  );
  const schema = buildDraftSchema(format);

  const { object } = await generateObject({
    model: getAiModel(),
    schema,
    schemaName: "NoteDraft",
    schemaDescription: "Structured note draft",
    prompt: [
      "你是智记笔记助手。请严格以 JSON 对象格式输出，包含 title、content、tags、summary 字段。",
      "",
      sections,
      "",
      promptBody,
    ].join("\n"),
  });

  return {
    ...object,
    content: finalizeContent(object.content, userInstruction, priorInstruction),
  };
}
