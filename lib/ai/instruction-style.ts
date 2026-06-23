export type ContentFormat = "markdown" | "plain";

const PLAIN_INTENT =
  /纯文本|plain\s*text|去掉.*(#|markdown|符号|标记|格式)|去除.*(符号|markdown|标记|奇怪)|不要.*(markdown|符号|标题符号|#|\*)|无需.*markdown|奇怪.*符号|去.*ai.*痕|去除.*ai.*痕|像人写|自然.*语言|不要.*套话|去掉.*\*|清理.*格式/i;

const MARKDOWN_INTENT =
  /markdown|保留.*格式|用小标题|多级标题|列表格式/i;

/** 从用户指令推断正文应为纯文本还是 Markdown */
export function inferContentFormat(...instructions: (string | undefined)[]): ContentFormat {
  const combined = instructions.filter(Boolean).join(" ");
  if (!combined.trim()) return "markdown";
  if (PLAIN_INTENT.test(combined)) return "plain";
  if (MARKDOWN_INTENT.test(combined)) return "markdown";
  return "markdown";
}

export function buildFormatRules(format: ContentFormat): string {
  if (format === "plain") {
    return [
      "## 正文格式（必须遵守）",
      "- 输出纯文本，禁止出现 Markdown 或排版符号：# * ** - > ` --- 等",
      "- 用自然段落书写，像人工整理的工作笔记，不要机械分层",
      "- 删除 AI 套话（如「综上所述」「值得注意的是」「首先…其次…」）",
      "- 不要重复堆砌小标题；用空行分段即可",
      "- 保留全部实质信息，语言简洁直接",
    ].join("\n");
  }
  return [
    "## 正文格式",
    "- 可使用适度 Markdown，但避免过度嵌套列表和机械小标题",
    "- 不要堆砌 AI 套话",
  ].join("\n");
}

export function contentSchemaHint(format: ContentFormat): string {
  return format === "plain"
    ? "纯文本正文，不含 # * - > 等任何标记符号"
    : "整理后的正文，可适度使用 Markdown";
}

/** 将 Markdown 转为可读纯文本（模型未完全遵守时的兜底） */
export function cleanupPlainTextContent(content: string): string {
  let s = content;

  s = s.replace(/^#{1,6}\s+/gm, "");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/\*([^*\n]+)\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/_([^_\n]+)_/g, "$1");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/^-{3,}\s*$/gm, "");
  s = s.replace(/^\*{3,}\s*$/gm, "");
  s = s.replace(/^[\t ]*[-*+]\s+/gm, "");
  s = s.replace(/^[\t ]*\d+[.)]\s+/gm, "");
  s = s.replace(/^>\s?/gm, "");
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  const fluff: RegExp[] = [
    /综上所述[,，：:\s]*/g,
    /值得注意的是[,，：:\s]*/g,
    /总的来说[,，：:\s]*/g,
    /换言之[,，：:\s]*/g,
    /需要指出的是[,，：:\s]*/g,
    /从.*?角度来看[,，：:\s]*/g,
  ];
  for (const p of fluff) s = s.replace(p, "");

  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

export function finalizeContent(
  content: string,
  ...instructions: (string | undefined)[]
): string {
  const format = inferContentFormat(...instructions);
  if (format === "plain") {
    return cleanupPlainTextContent(content);
  }
  return content.trim();
}
