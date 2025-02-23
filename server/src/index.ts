import { Hono } from "hono";
import { cors } from "hono/cors";
import { processQuery, type AnalyzeRequest } from "./services/gemini";
import handleElevenLabsStream from "./services/11labs";

// Define environment bindings type
type Bindings = {
  GEMINI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
};

interface ElevenLabsError {
  message?: string;
  detail?: string;
}

const VOICE_ID = "iP95p4xoKVk53GoZ742B"
const app = new Hono<{ Bindings: Bindings }>();

// Add CORS middleware
app.use("/*", cors());

// WebSocket upgrade handler
app.get("/ws", async (c) => {
  const upgradeHeader = c.req.header("Upgrade");
  
  if (upgradeHeader !== "websocket") {
    return c.text("Expected websocket", 400);
  }

  const [client, server] = Object.values(new WebSocketPair());
  
  // Initialize the audio session with the server WebSocket
  await handleElevenLabsStream(server, c.env.ELEVENLABS_API_KEY);

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
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
      return c.json({ 
        error: "Failed to generate speech", 
        details: errorData 
      }, response.status as 400 | 401 | 403 | 404 | 429 | 500);
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return c.json({ error: errorMessage }, 500);
  }
});

// Start call endpoint - returns WebSocket connection info
app.post('/start-call', async (c) => {
  try {
    const wsProtocol = c.req.url.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${c.req.header('host')}/ws`;

    console.log('wsUrl', wsUrl);
    
    return c.json({ 
      message: 'Call started',
      wsUrl
    }, 200);
  } catch (error) {
    console.error('Error starting call:', error);
    return c.json({ error: 'Failed to start call' }, 500);
  }
});

export default app;
