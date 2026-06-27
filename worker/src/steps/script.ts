import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ScriptBeat = {
  text: string;
  visualQuery: string;
};

export type ScriptResult = {
  fullScript: string;
  beats: ScriptBeat[];
};

const SYSTEM_PROMPT = `You write short, punchy voiceover scripts for faceless short-form videos (TikTok/Reels/Shorts).
Rules:
- Spoken length must be 30-60 seconds (roughly 80-150 words total).
- Break the script into 4-8 short beats (sentences or clauses), each representing one visual scene.
- For each beat, also provide a 2-4 word visual search query describing what stock footage/photo should appear behind it.
- Respond with ONLY valid JSON, no markdown fences, matching this shape:
{"beats": [{"text": "...", "visualQuery": "..."}]}`;

export async function generateScript(topic: string): Promise<ScriptResult> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return text content");
  }

  const jsonText = textBlock.text
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/```\s*$/, "");

  const parsed = JSON.parse(jsonText) as { beats: ScriptBeat[] };

  if (!parsed.beats?.length) {
    throw new Error("Claude returned no script beats");
  }

  return {
    fullScript: parsed.beats.map((b) => b.text).join(" "),
    beats: parsed.beats,
  };
}
