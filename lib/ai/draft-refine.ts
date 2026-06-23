import { generateNoteDraftObject } from "./note-draft-ai";

export async function refineNoteDraft(params: {
  title: string;
  content: string;
  tags: string[];
  summary: string;
  instruction: string;
  sourceText?: string;
  sourceFileName?: string;
  priorInstruction?: string;
}): Promise<{
  title: string;
  content: string;
  tags: string[];
  summary: string;
  userInstruction: string;
}> {
  const instruction = params.instruction.trim();
  if (!instruction) {
    throw new Error("请输入修改需求");
  }

  const object = await generateNoteDraftObject(
    [
      "任务：用户在预览界面提出了新的修改需求。请在当前草稿基础上重写，使结果完全符合新需求。",
      "不要只做表面微调；若用户要求去符号、去 AI 痕迹或改纯文本，必须整体重写 content。",
      "",
      "当前草稿：",
      `标题：${params.title}`,
      `标签：${params.tags.join(", ") || "（无）"}`,
      `摘要：${params.summary || "（无）"}`,
      "正文：",
      "---",
      params.content,
      "---",
      "",
      params.priorInstruction
        ? `此前整理需求：${params.priorInstruction}`
        : null,
      params.sourceFileName && params.sourceText
        ? [
            `原始文件（${params.sourceFileName}）供参考：`,
            "---",
            params.sourceText.slice(0, 12000),
            params.sourceText.length > 12000 ? "…（已截断）" : "",
            "---",
          ].join("\n")
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
    instruction,
    params.priorInstruction
  );

  return {
    ...object,
    userInstruction: instruction,
  };
}
