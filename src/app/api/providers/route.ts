import { NextResponse } from "next/server";
import { availableProviders } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  const providers = availableProviders();
  return NextResponse.json({
    providers,
    geminiConfigured: providers.includes("gemini"),
    // never expose the key itself
  });
}