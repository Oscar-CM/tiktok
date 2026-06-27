import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { parseBuffer } from "music-metadata";
import { uploadToR2 } from "../storage";

export type VoiceoverResult = {
  url: string;
  durationMs: number;
};

const ELEVENLABS_DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // "Rachel"

async function generateWithElevenLabs(script: string): Promise<Buffer> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || ELEVENLABS_DEFAULT_VOICE_ID;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${errorText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function generateWithEdgeTts(script: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(
    "en-US-GuyNeural",
    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
  );

  const { audioStream } = tts.toStream(script);
  const chunks: Buffer[] = [];

  for await (const chunk of audioStream) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks);
}

export async function generateVoiceover(
  script: string
): Promise<VoiceoverResult> {
  const buffer = process.env.ELEVENLABS_API_KEY
    ? await generateWithElevenLabs(script)
    : await generateWithEdgeTts(script);

  const metadata = await parseBuffer(buffer, "audio/mpeg");
  const durationMs = Math.round((metadata.format.duration ?? 0) * 1000);

  const url = await uploadToR2(buffer, "mp3", "audio/mpeg");

  return { url, durationMs };
}
