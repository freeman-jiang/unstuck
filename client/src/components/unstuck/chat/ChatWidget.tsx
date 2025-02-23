"use client";

import { useUnstuck } from "@/contexts/UnstuckContext";
import { parseGemini } from "@/lib/extract";
import { getSitemap } from "@/utils/siteMetadata";
import { useCallback, useState } from "react";
import * as ReactDOM from "react-dom/client";
import { WorkflowCreator } from "@/components/WorkflowCreator";
import { ChatState, ChatMessage, ErrorState, LoadingState } from "./types";
import { MinimizedChat } from "./MinimizedChat";
import { MaximizedChat } from "./MaximizedChat";
import { NeedHelpButton } from "./NeedHelpButton";

export function ChatWidget() {
  const [chatState, setChatState] = useState<ChatState>('closed');
  const [isWorkflowActive, setIsWorkflowActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<ErrorState | undefined>();
  const [loading, setLoading] = useState<LoadingState | undefined>();
  const { getCurrentContext, setUserQuery } = useUnstuck();

  // Helper to show errors
  const showError = (message: string) => {
    setError({
      message,
      timestamp: Date.now()
    });
    // Clear error after 5 seconds
    setTimeout(() => setError(undefined), 5000);
  };

  const playTextToSpeech = async (text: string) => {
    try {
      setLoading({
        isLoading: true,
        message: "Generating audio response..."
      });

      const response = await fetch("http://localhost:8787/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      
      // Clean up the URL after playback
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setLoading(undefined);
      };

      setLoading({
        isLoading: true,
        message: "Playing audio response..."
      });

      await audio.play();
    } catch (error) {
      console.error("Error playing text-to-speech:", error);
      showError("Failed to play audio message");
    } finally {
      setLoading(undefined);
    }
  };

  const startCall = useCallback(async () => {
    console.log("starting call");
  }, []);

  const handleHelp = async (userQuery: string) => {
    setError(undefined); // Clear any existing errors
    const sitemap = await getSitemap();
    setIsAnalyzing(true);
    setChatMessages((prev) => [...prev, { role: "user", content: userQuery }]);

    console.log("starting agent loop");
    let taskAccomplished = false;
    let iterations = 0;
    let previousMessages = [];
    try {
      while (!taskAccomplished) {
        setLoading({
          isLoading: true,
          message: "Analyzing your request...",
          progress: iterations === 0 ? 0.2 : iterations / (iterations + 1)
        });

        const { domString, screenshot } = await getCurrentContext();
        console.log("Iteration: ", iterations);
        console.log("previousMessages: ", previousMessages);

        const response = await fetch("http://localhost:8787/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userQuery,
            screenshot,
            domString,
            previousMessages,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze your request");
        }

        const data = await response.json();
        const parsedGemini = parseGemini(data.result);

        const assistantMessage = parsedGemini.narration || parsedGemini.reasoning || "I'll help you with that.";
        
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: assistantMessage,
          },
        ]);

        // Play text-to-speech for assistant message
        await playTextToSpeech(assistantMessage);

        if (parsedGemini.actions.length > 0) {
          const firstAction = parsedGemini.actions[0];
          setIsWorkflowActive(true);
          setChatState('minimized');
          
          setLoading({
            isLoading: true,
            message: "Setting up workflow...",
            progress: 0.8
          });

          const workflowPromise = new Promise<void>((resolve) => {
            const container = document.createElement('div');
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

        if (taskAccomplished) {
          setLoading({
            isLoading: true,
            message: "Finalizing...",
            progress: 1
          });
          // Add a small delay to show the completion state
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setIsWorkflowActive(false);
      setChatState('open');
    } catch (error) {
      console.error("Error analyzing page:", error);
      showError(error instanceof Error ? error.message : "An unexpected error occurred");
      setIsWorkflowActive(false);
      setChatState('open');
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
    <div className="fixed bottom-8 right-8 z-[999] pointer-events-none" id="chat-widget">
      {/* Minimized view */}
      <div
        className={`
          transform transition-all duration-300 ease-out origin-bottom-right absolute bottom-0 right-0
          ${chatState === 'minimized' 
            ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto' 
            : 'translate-y-4 opacity-0 scale-95'
          }
        `}
      >
        <MinimizedChat
          isWorkflowActive={isWorkflowActive}
          latestMessage={chatMessages[chatMessages.length - 1]?.content}
          error={error}
          loading={loading}
          onMaximize={() => setChatState('open')}
        />
      </div>

      {/* Main chat widget */}
      <div
        className={`
          transform transition-all duration-300 ease-out origin-bottom-right absolute bottom-0 right-0
          ${chatState !== 'minimized' 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-4 opacity-0 scale-95'
          }
        `}
      >
        {/* Expanded chat view */}
        <div
          className={`
            transform transition-all duration-300 ease-out origin-bottom-right
            ${chatState === 'open' 
              ? 'scale-100 opacity-100 pointer-events-auto' 
              : 'scale-95 opacity-0'
            }
          `}
        >
          <MaximizedChat
            messages={chatMessages}
            isAnalyzing={isAnalyzing}
            input={input}
            error={error}
            loading={loading}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onMinimize={() => setChatState('minimized')}
            onClose={() => setChatState('closed')}
            onStartCall={startCall}
          />
        </div>

        {/* Need help button */}
        <div
          className={`
            transform transition-all duration-200 ease-out absolute bottom-0 right-0
            ${chatState === 'closed' 
              ? 'scale-100 opacity-100 pointer-events-auto' 
              : 'scale-95 opacity-0'
            }
          `}
        >
          <NeedHelpButton onClick={() => setChatState('open')} />
        </div>
      </div>
    </div>
  );
} 