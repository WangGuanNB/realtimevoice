import { respErr } from "@/lib/resp";

import OpenAI from "openai";

const DEMO_MAX_CHARS = 300;

const ALLOWED_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
type Voice = (typeof ALLOWED_VOICES)[number];

export async function POST(req: Request) {
  try {
    const { text, voice = "alloy", speed = 1.0 } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return respErr("Text is required");
    }

    if (text.length > DEMO_MAX_CHARS) {
      return respErr(`Text must be under ${DEMO_MAX_CHARS} characters`);
    }

    if (!ALLOWED_VOICES.includes(voice as Voice)) {
      return respErr("Invalid voice");
    }

    const clampedSpeed = Math.min(4.0, Math.max(0.25, Number(speed) || 1.0));

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as Voice,
      input: text.trim(),
      speed: clampedSpeed,
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'inline; filename="voice.mp3"',
      },
    });
  } catch (err) {
    console.error("gen audio failed:", err);
    return respErr("Failed to generate audio");
  }
}
