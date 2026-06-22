/** AI 模型与上下文限制，可通过环境变量覆盖 */
export const AI_CONFIG = {
  model: process.env.AI_MODEL ?? "qwen-plus",
  maxContextChars: Number(process.env.AI_MAX_CONTEXT_CHARS ?? 12000),
  maxNotes: Number(process.env.AI_MAX_NOTES ?? 30),
} as const;

export function isAiConfigured(): boolean {
  return Boolean(process.env.DASHSCOPE_API_KEY);
}
