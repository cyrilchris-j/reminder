// ============================================
// MindFlow — AI Extract Actions API Route
// Extracts actionable tasks from note content
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
      // Fallback: simple heuristic extraction
      const patterns = [
        /(?:need to|must|should|have to|todo|remind me to|don'?t forget to)\s+(.+?)(?:\.|$)/gi,
        /(?:buy|call|email|send|schedule|book|fix|create|update|finish|complete|prepare)\s+(.+?)(?:\.|$)/gi,
      ];
      const actions: string[] = [];
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const action = match[0].trim();
          if (action.length > 5 && action.length < 200 && !actions.includes(action)) {
            actions.push(action);
          }
        }
      }
      return NextResponse.json({ actions: actions.slice(0, 10) });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Extract actionable tasks from the following text. Return a JSON array of strings, each being a clear, concise task. Only include actual actionable items. Return at most 10 items. Return ONLY the JSON array, no other text.",
          },
          { role: "user", content: text.slice(0, 8000) },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "[]";

    try {
      const actions = JSON.parse(raw);
      return NextResponse.json({ actions: Array.isArray(actions) ? actions : [] });
    } catch {
      return NextResponse.json({ actions: [] });
    }
  } catch {
    return NextResponse.json({ error: "Failed to extract actions" }, { status: 500 });
  }
}
