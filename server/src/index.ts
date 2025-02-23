import { Hono } from "hono";
import { cors } from "hono/cors";
import { processQuery, type AnalyzeRequest } from "./services/gemini";
import { fal } from "@fal-ai/client";

// Define environment bindings type
type Bindings = {
  GEMINI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  FAL_API_KEY: string;
};

interface ElevenLabsError {
  message?: string;
  detail?: string;
}

type WizperLanguage = 
  | "af" | "am" | "ar" | "as" | "az" | "ba" | "be" | "bg" | "bn" | "bo" 
  | "br" | "bs" | "ca" | "cs" | "cy" | "da" | "de" | "el" | "en" | "es" 
  | "et" | "eu" | "fa" | "fi" | "fo" | "fr" | "gl" | "gu" | "ha" | "haw" 
  | "he" | "hi" | "hr" | "ht" | "hu" | "hy" | "id" | "is" | "it" | "ja" 
  | "jw" | "ka" | "kk" | "km" | "kn" | "ko" | "la" | "lb" | "ln" | "lo" 
  | "lt" | "lv" | "mg" | "mi" | "mk" | "ml" | "mn" | "mr" | "ms" | "mt" 
  | "my" | "ne" | "nl" | "nn" | "no" | "oc" | "pa" | "pl" | "ps" | "pt" 
  | "ro" | "ru" | "sa" | "sd" | "si" | "sk" | "sl" | "sn" | "so" | "sq" 
  | "sr" | "su" | "sv" | "sw" | "ta" | "te" | "tg" | "th" | "tk" | "tl" 
  | "tr" | "tt" | "uk" | "ur" | "uz" | "vi" | "yi" | "yo" | "yue" | "zh";

interface ASRRequest {
  audio_data: string; // base64 data URI
  language?: WizperLanguage;
}

const VOICE_ID = "iP95p4xoKVk53GoZ742B";
const app = new Hono<{ Bindings: Bindings }>();

// Add CORS middleware
app.use("/*", cors());

// Configure fal client
app.use("/*", async (c, next) => {
  fal.config({
    credentials: c.env.FAL_API_KEY,
    requestMiddleware: async (request) => {
      if (request.headers) {
        request.headers['Authorization'] = `Key ${c.env.FAL_API_KEY}`;
      }
      return request;
    }
  });
  await next();
});

// ASR endpoint
app.post("/asr", async (c) => {
  try {
    const { audio_data, language = "en" } = await c.req.json<ASRRequest>();

    if (!audio_data) {
      return c.json({ error: "Audio data is required" }, 400);
    }

    console.log("Starting ASR with FAL API...");

    // Convert base64 to binary data
    const binaryStr = atob(audio_data.replace(/^data:audio\/\w+;base64,/, ''));
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Create a blob from the binary data
    const audioBlob = new Blob([bytes], { type: 'audio/webm' });
    
    // Upload to FAL storage
    console.log("Uploading audio to FAL storage...");
    const audioUrl = await fal.storage.upload(audioBlob);
    console.log("Audio uploaded, URL:", audioUrl);

    // Call fal-ai/wizper API with the stored file URL
    const result = await fal.subscribe("fal-ai/wizper", {
      input: {
        audio_url: audioUrl,
        task: "transcribe",
        language,
        chunk_level: "segment",
        version: "3"
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("ASR Progress:", update.logs.map((log) => log.message));
        }
      },
    });

    console.log("FAL API response received");
    
    return c.json({
      text: result.data.text,
      chunks: result.data.chunks,
      requestId: result.requestId
    });
  } catch (error) {
    console.error("Error in ASR endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process audio";
    return c.json({ error: errorMessage }, 500);
  }
});

// Route to analyze user query with multiple modalities
app.post("/analyze", async (c) => {
  try {
    const request = await c.req.json<AnalyzeRequest>();
    const response = await processQuery(request, c.env.GEMINI_API_KEY);
    return c.json(response);
  } catch (error) {
    console.error("Error analyzing query:", error);
    return c.json({ error: "Failed to analyze query" }, 500);
  }
});

// Text to speech endpoint
app.post("/tts", async (c) => {
  try {
    const { text } = await c.req.json<{ text: string }>();

    if (!text) {
      return c.json({ error: "Text is required" }, 400);
    }

    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/" + VOICE_ID,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": c.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("ElevenLabs API error:", errorData);
      return c.json(
        {
          error: "Failed to generate speech",
          details: errorData,
        },
        response.status as 400 | 401 | 403 | 404 | 429 | 500
      );
    }

    const audioBuffer = await response.arrayBuffer();

    // Verify we actually got audio data
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return c.json({ error: "No audio data received" }, 500);
    }

    c.header("Content-Type", "audio/mpeg");
    c.header("Content-Length", audioBuffer.byteLength.toString());
    return c.body(audioBuffer);
  } catch (error: unknown) {
    console.error("Error in TTS endpoint:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return c.json({ error: errorMessage }, 500);
  }
});

export default app;
