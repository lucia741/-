import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "智记 ZhiNote API",
  description: "AI 智能笔记知识库 — 后端 API",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
