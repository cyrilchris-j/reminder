// ============================================
// MindFlow — AI Summarize API Route
// ============================================
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text || text.length < 20) {
      return NextResponse.json({ error: "Text too short" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback: simple extractive summary
      const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
      const summary = sentences.slice(0, 5).map((s: string) => `• ${s.trim()}`).join("\n");
      return NextResponse.json({ summary: summary || "No summary available." });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant. Summarize the following text into concise bullet points. Include key insights and action items if any. Be concise but comprehensive." },
          { role: "user", content: text.slice(0, 8000) },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const data = await res.json();
    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary.";
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
