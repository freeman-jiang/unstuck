"use client";

import { WorkflowCreator } from "@/components/WorkflowCreator";
import { useUnstuck } from "@/contexts/UnstuckContext";
import { parseGemini } from "@/lib/extract";
import { getSitemap } from "@/utils/siteMetadata";
import { useMicVAD } from "@ricky0123/vad-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as ReactDOM from "react-dom/client";
import { MaximizedChat } from "./MaximizedChat";
import { MinimizedChat } from "./MinimizedChat";
import { NeedHelpButton } from "./NeedHelpButton";
import { ChatMessage, ChatState, ErrorState, LoadingState } from "./types";

export function ChatWidget() {
  const [chatState, setChatState] = useState<ChatState>("closed");
  const [isWorkflowActive, setIsWorkflowActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<ErrorState | undefined>();
  const [loading, setLoading] = useState<LoadingState | undefined>();
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isCallActive, setIsCallActive] = useState(false);
  const { getCurrentContext, setUserQuery, apiKey, serverUrl } = useUnstuck();
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const successMessages = [
    "Looks like we found what you were looking for. Let me know if you need anything else!",
    "Perfect! We've reached your destination. Need help with anything else?",
    "Mission accomplished! What else can I help you with?",
    "We made it! Feel free to ask me about anything else.",
    "Success! Is there anything else you'd like to explore?",
    "There we go! Don't hesitate to ask if you need more guidance.",
    "All set! I'm here if you need any other assistance.",
  ];

  // Voice activity detection setup
  const vad = useMicVAD({
    onSpeechEnd: async (audio) => {
      // Convert Float32Array audio samples to WAV format
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = audioContext.createBuffer(1, audio.length, 16000);
      audioBuffer.getChannelData(0).set(audio);

      // Create MediaRecorder to encode as WebM
      const mediaStream = audioContext.createMediaStreamDestination();
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(mediaStream);

      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(mediaStream.stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      recorder.ondataavailable = (e) => chunks.push(e.data);

      const blob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () =>
          resolve(new Blob(chunks, { type: "audio/webm" }));
        sourceNode.start();
        recorder.start();
        sourceNode.addEventListener("ended", () => recorder.stop());
      });
      const reader = new FileReader();

      reader.onloadend = async () => {
        if (typeof reader.result === "string") {
          try {
            setLoading({
              isLoading: true,
              message: "Transcribing audio...",
            });

            const response = await fetch(`${serverUrl}/asr`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": apiKey,
              },
              body: JSON.stringify({
                audio_data: reader.result,
                language: "en",
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to transcribe audio");
            }

            const data = await response.json();
            if (data.text) {
              await handleHelp(data.text);
            } else {
              showError("No transcription received");
            }
          } catch (error) {
            console.error("Error transcribing audio:", error);
            showError(
              error instanceof Error
                ? error.message
                : "Failed to transcribe audio"
            );
          } finally {
            setLoading(undefined);
          }
        }
      };

      reader.readAsDataURL(blob);
    },
    onVADMisfire: () => {
      if (isCallActive) {
        showError("No speech detected. Try speaking again.");
      }
    },
    startOnLoad: false, // Start paused
    onSpeechStart: () => {
      // Optional: Show some feedback that we detected speech starting
      console.log("Speech detected, listening...");
    },
  });

  // Helper to show errors
  const showError = (message: string) => {
    setError({
      message,
      timestamp: Date.now(),
    });
    // Clear error after 5 seconds
    setTimeout(() => setError(undefined), 5000);
  };

  const playTextToSpeech = async (text: string) => {
    // Skip TTS if voice is disabled
    if (!isVoiceEnabled) return;

    try {
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      const response = await fetch(`${serverUrl}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("TTS Error:", errorData);
        showError(errorData.error || "Failed to play audio message");
        return;
      }

      const audioBlob = await response.blob();
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("No audio data received");
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      // Clean up the URL after playback
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error("Error playing text-to-speech:", error);
      showError("Failed to play audio message");
    }
  };

  const startCall = useCallback(async () => {
    try {
      setIsCallActive(true);
      setChatState("open");
      console.log("vad starting");
      await vad.start();
    } catch (error) {
      console.error("Error starting call:", error);
      showError("Failed to start voice detection");
      setIsCallActive(false);
    }
  }, [vad]);

  // Use a ref to track component mount state
  const isMounted = useRef(true);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (isCallActive) {
        console.log("pausing vad due to unmount");
        vad.pause();
        setIsCallActive(false);
      }
    };
  }, []);

  // Handle chat state changes separately
  useEffect(() => {
    if (isMounted.current && isCallActive && chatState !== "open") {
      console.log("pausing vad due to chat state change");
      vad.pause();
      setIsCallActive(false);
    }
  }, [chatState, isCallActive, vad]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();

        reader.onloadend = async () => {
          if (typeof reader.result === "string") {
            try {
              setLoading({
                isLoading: true,
                message: "Transcribing audio...",
              });

              const response = await fetch(`${serverUrl}/asr`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-API-Key": apiKey,
                },
                body: JSON.stringify({
                  audio_data: reader.result,
                  language: "en",
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to transcribe audio");
              }

              const data = await response.json();
              // Instead of setting input, immediately handle the transcribed text
              if (data.text) {
                await handleHelp(data.text);
              } else {
                showError("No transcription received");
              }
              setLoading(undefined);
            } catch (error) {
              console.error("Error transcribing audio:", error);
              showError(
                error instanceof Error
                  ? error.message
                  : "Failed to transcribe audio"
              );
              setLoading(undefined);
            }
          }
        };

        reader.readAsDataURL(blob);

        // Clean up the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      showError("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleHelp = async (userQuery: string) => {
    setError(undefined); // Clear any existing errors
    const sitemap = await getSitemap();
    console.log("sitemap: ", sitemap);
    setIsAnalyzing(true);
    setChatMessages((prev) => [...prev, { role: "user", content: userQuery }]);
    setLoading({
      isLoading: true,
      message: "Thinking...",
    });

    console.log("starting agent loop");
    let taskAccomplished = false;
    let iterations = 0;
    let previousMessages = [];
    let isGeneralResponse = false;
    try {
      while (!taskAccomplished) {
        const { domString, screenshot } = await getCurrentContext();
        console.log("Iteration: ", iterations);
        console.log("previousMessages: ", previousMessages);

        const response = await fetch(`${serverUrl}/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify({
            userQuery,
            screenshot,
            domString,
            previousMessages,
            sitemap,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze your request");
        }

        const data = await response.json();
        const parsedGemini = parseGemini(data.result);
        console.log("parsedGemini: ", parsedGemini);

        if (
          parsedGemini.taskAccomplished &&
          parsedGemini.actions.length === 0
        ) {
          break;
        }

        const assistantMessage =
          parsedGemini.generalResponse ||
          parsedGemini.narration ||
          parsedGemini.reasoning ||
          "I'll help you with that.";

        // Clear loading state before showing the message
        setLoading(undefined);

        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: assistantMessage,
          },
        ]);

        // Play text-to-speech for assistant message
        await playTextToSpeech(assistantMessage);

        if (parsedGemini.generalResponse) {
          isGeneralResponse = true;
          break;
        }

        if (parsedGemini.actions && parsedGemini.actions.length > 0) {
          const firstAction = parsedGemini.actions[0];
          setIsWorkflowActive(true);
          setChatState("minimized");

          const workflowPromise = new Promise<void>((resolve) => {
            const container = document.createElement("div");
            document.body.appendChild(container);

            const root = ReactDOM.createRoot(container);
            root.render(
              <WorkflowCreator
                elementId={firstAction}
                onComplete={() => {
                  // Defer cleanup to next frame to avoid React unmounting warning
                  requestAnimationFrame(() => {
                    root.unmount();
                    if (container.parentNode) {
                      container.parentNode.removeChild(container);
                    }
                    resolve();
                  });
                }}
                autoStart={true}
              />
            );
          });

          await workflowPromise;
        }

        previousMessages = data.messages;
        iterations++;
        taskAccomplished = parsedGemini.taskAccomplished;

        if (!taskAccomplished) {
          // Only set loading state if we're continuing the loop
          setLoading({
            isLoading: true,
            message: "Thinking...",
          });
        }
      }

      setIsWorkflowActive(false);

      const randomMessage =
        successMessages[Math.floor(Math.random() * successMessages.length)];
      if (!isGeneralResponse) {
        await playTextToSpeech(randomMessage);
      }
    } catch (error) {
      console.error("Error analyzing page:", error);
      showError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      setIsWorkflowActive(false);
      setChatState("open");
    } finally {
      setIsAnalyzing(false);
      setLoading(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAnalyzing) return;

    const query = input;
    setInput("");
    await handleHelp(query);
  };

  return (
    <div
      className="fixed bottom-8 right-8 z-[999] pointer-events-none"
      id="chat-widget"
    >
      {/* Minimized view */}
      <div
        className={`
          transform transition-all duration-300 ease-out origin-bottom-right absolute bottom-0 right-0
          ${
            chatState === "minimized"
              ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
              : "translate-y-4 opacity-0 scale-95"
          }
        `}
      >
        <MinimizedChat
          isWorkflowActive={isWorkflowActive}
          latestMessage={chatMessages[chatMessages.length - 1]?.content}
          error={error}
          loading={loading}
          onMaximize={() => setChatState("open")}
        />
      </div>

      {/* Main chat widget */}
      <div
        className={`
          transform transition-all duration-300 ease-out origin-bottom-right absolute bottom-0 right-0
          ${
            chatState !== "minimized"
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-4 opacity-0 scale-95"
          }
        `}
      >
        {/* Expanded chat view */}
        <div
          className={`
            transform transition-all duration-300 ease-out origin-bottom-right
            ${
              chatState === "open"
                ? "scale-100 opacity-100 pointer-events-auto"
                : "scale-95 opacity-0"
            }
          `}
        >
          <MaximizedChat
            messages={chatMessages}
            isAnalyzing={isAnalyzing}
            input={input}
            error={error}
            loading={loading}
            isVoiceEnabled={isVoiceEnabled}
            isRecording={isRecording}
            isCallActive={isCallActive}
            onVoiceToggle={() => setIsVoiceEnabled(!isVoiceEnabled)}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onMinimize={() => setChatState("minimized")}
            onClose={() => setChatState("closed")}
            onStartCall={startCall}
          />
        </div>

        {/* Need help button */}
        <div
          className={`
            transform transition-all duration-200 ease-out absolute bottom-0 right-0
            ${
              chatState === "closed"
                ? "scale-100 opacity-100 pointer-events-auto"
                : "scale-95 opacity-0"
            }
          `}
        >
          <NeedHelpButton onClick={() => setChatState("open")} />
        </div>
      </div>
    </div>
  );
}
