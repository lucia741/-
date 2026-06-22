const EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL ?? "text-embedding-v3";
const EMBEDDING_DIM = 1024;

export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey || !text.trim()) return null;

  try {
    const res = await fetch(
      `${process.env.DASHSCOPE_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1"}/embeddings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: text.slice(0, 8000),
          dimensions: EMBEDDING_DIM,
          encoding_format: "float",
        }),
      }
    );

    if (!res.ok) {
      console.error("[embeddings]", await res.text());
      return null;
    }

    const data = await res.json();
    return data.data?.[0]?.embedding ?? null;
  } catch (error) {
    console.error("[embeddings]", error);
    return null;
  }
}

export function noteEmbeddingInput(title: string, content: string): string {
  return `${title}\n\n${content}`.trim();
}
