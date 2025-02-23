import WebSocket from 'ws';

// ElevenLabs Config
const voiceId = 'Xb7hH8MSUJpSbSDYk0k2'; // Your chosen voice
const model = 'eleven_flash_v2_5';

interface AudioSession {
  clientWs: WebSocket;
  elevenLabsWs: WebSocket | null;
  apiKey: string;
  buffer: string[];
  isGenerating: boolean;
}

interface WebSocketMessage {
  data: string | ArrayBuffer;
}

interface ElevenLabsMessage {
  audio?: string;
  error?: string;
}

// WebSocket handler for audio streaming
async function handleElevenLabsStream(clientWs: WebSocket, apiKey: string) {
  const session: AudioSession = {
    clientWs,
    elevenLabsWs: null,
    apiKey,
    buffer: [],
    isGenerating: false
  };

  // Accept the client connection
  session.clientWs.accept();

  // Handle messages from the client
  session.clientWs.addEventListener('message', async (event: WebSocketMessage) => {
    try {
      const { text } = JSON.parse(event.data as string);
      
      // If already generating, add to buffer
      if (session.isGenerating) {
        session.buffer.push(text);
        session.clientWs.send(JSON.stringify({ status: 'queued' }));
        return;
      }

      await generateAudio(session, text);
    } catch (error) {
      console.error('Error processing message:', error);
      session.clientWs.send(JSON.stringify({ error: 'Failed to process message' }));
    }
  });

  // Handle client disconnection
  session.clientWs.addEventListener('close', () => {
    console.log('Client disconnected');
    if (session.elevenLabsWs) {
      session.elevenLabsWs.close();
    }
  });

  // Handle client errors
  session.clientWs.addEventListener('error', (error: Event) => {
    console.error('Client WebSocket error:', error);
  });

  return session;
}

// Function to generate audio for a given text
async function generateAudio(session: AudioSession, text: string) {
  try {
    session.isGenerating = true;
    
    // Create a new WebSocket pair for ElevenLabs
    const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${model}`;
    const [client, server] = Object.values(new WebSocketPair());
    session.elevenLabsWs = client;

    // Accept the ElevenLabs connection
    server.accept();

    // Handle audio chunks from ElevenLabs
    session.elevenLabsWs.addEventListener('message', (event: WebSocketMessage) => {
      try {
        const data = JSON.parse(event.data as string) as ElevenLabsMessage;
        if (data.audio) {
          // Forward audio chunk to client
          session.clientWs.send(data.audio);
        }
      } catch (error) {
        console.error('Error processing audio chunk:', error);
        session.clientWs.send(JSON.stringify({ error: 'Failed to process audio chunk' }));
      }
    });

    // Handle ElevenLabs connection close
    session.elevenLabsWs.addEventListener('close', async () => {
      console.log('ElevenLabs connection closed');
      session.isGenerating = false;
      
      // Process next item in buffer if any
      if (session.buffer.length > 0) {
        const nextText = session.buffer.shift();
        if (nextText) {
          await generateAudio(session, nextText);
        }
      }
    });

    // Handle ElevenLabs errors
    session.elevenLabsWs.addEventListener('error', () => {
      session.clientWs.send(JSON.stringify({ error: 'Failed to connect to audio service' }));
      session.isGenerating = false;
    });

    // Send initial configuration
    server.send(JSON.stringify({
      text: ' ',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        use_speaker_boost: false,
      },
      generation_config: { chunk_length_schedule: [120, 160, 250, 290] },
    }));

    // Send the actual text
    server.send(JSON.stringify({ text }));
    
    // Send end marker
    server.send(JSON.stringify({ text: '', flush: true }));

  } catch (error) {
    console.error('Error generating audio:', error);
    session.clientWs.send(JSON.stringify({ error: 'Failed to generate audio' }));
    session.isGenerating = false;
  }
}

export default handleElevenLabsStream;