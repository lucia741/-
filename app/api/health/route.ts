import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "zhinote-api",
    ai: isAiConfigured(),
    timestamp: new Date().toISOString(),
  });
}
