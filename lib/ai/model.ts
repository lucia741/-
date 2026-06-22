import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { AI_CONFIG } from "./config";

let _model: ReturnType<
  ReturnType<typeof createOpenAICompatible>
> | null = null;

/** 阿里云百炼（DashScope OpenAI 兼容模式） */
export function getAiModel() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY is not set");
  }

  if (!_model) {
    const provider = createOpenAICompatible({
      name: "dashscope",
      apiKey,
      baseURL:
        process.env.DASHSCOPE_BASE_URL ??
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
    _model = provider(AI_CONFIG.model);
  }

  return _model;
}
