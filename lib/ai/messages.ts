import type { UIMessage } from "ai";

export function getLastUserText(messages: UIMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "";

  return lastUser.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
}

export function toSimpleHistory(messages: UIMessage[]) {
  const history: { role: "user" | "assistant"; content: string }[] = [];

  for (const msg of messages) {
    if (msg.role !== "user" && msg.role !== "assistant") continue;
    const text = msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
    if (text) history.push({ role: msg.role, content: text });
  }

  if (history.length === 0) return [];
  const last = history[history.length - 1];
  if (last.role === "user") return history.slice(0, -1);
  return history;
}
