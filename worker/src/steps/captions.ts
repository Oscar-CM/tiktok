import OpenAI from "openai";
import type { CaptionWord } from "../../../types/job";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCaptions(
  voiceoverUrl: string
): Promise<CaptionWord[]> {
  const res = await fetch(voiceoverUrl);
  const buffer = Buffer.from(await res.arrayBuffer());
  const file = new File([buffer], "voiceover.mp3", { type: "audio/mpeg" });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
  });

  const words = (transcription as unknown as {
    words?: { word: string; start: number; end: number }[];
  }).words;

  if (!words?.length) {
    throw new Error("Whisper returned no word timestamps");
  }

  return words.map((w) => ({
    word: w.word,
    startMs: Math.round(w.start * 1000),
    endMs: Math.round(w.end * 1000),
  }));
}
