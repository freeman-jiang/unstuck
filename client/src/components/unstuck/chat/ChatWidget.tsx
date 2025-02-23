"use client";

import { useUnstuck } from "@/contexts/UnstuckContext";
import { parseGemini } from "@/lib/extract";
import { getSitemap } from "@/utils/siteMetadata";
import { useCallback, useState } from "react";
import * as ReactDOM from "react-dom/client";
import { WorkflowCreator } from "@/components/WorkflowCreator";
import { ChatState, ChatMessage } from "./types";
import { MinimizedChat } from "./MinimizedChat";
import { MaximizedChat } from "./MaximizedChat";
import { NeedHelpButton } from "./NeedHelpButton";

export function ChatWidget() {
  const [chatState, setChatState] = useState<ChatState>('closed');
  const [isWorkflowActive, setIsWorkflowActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const { getCurrentContext, setUserQuery } = useUnstuck();

  const startCall = useCallback(async () => {
    console.log("starting call");
  }, []);

  const handleHelp = async (userQuery: string) => {
    const sitemap = await getSitemap(); // todo use this in the context
    setIsAnalyzing(true);
    setChatMessages((prev) => [...prev, { role: "user", content: userQuery }]);

    console.log("starting agent loop");
    let taskAccomplished = false;
    let iterations = 0;
    let previousMessages = [];
    try {
      while (!taskAccomplished) {
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

        const data = await response.json();
        const parsedGemini = parseGemini(data.result);
        
        if (parsedGemini.actions.length > 0) {
          const firstAction = parsedGemini.actions[0];
          setIsWorkflowActive(true);
          setChatState('minimized');
          
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
          console.log("domString: ", domString);
          
          await workflowPromise;
        }

        previousMessages = data.messages;
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              parsedGemini.narration ||
              parsedGemini.reasoning ||
              "I'll help you with that.",
          },
        ]);

        iterations++;
        taskAccomplished = parsedGemini.taskAccomplished;
      }
      
      // Only after the entire task is complete
      setIsWorkflowActive(false);
      setChatState('open');
    } catch (error) {
      console.error("Error analyzing page:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered an error while processing your request.",
        },
      ]);
      setIsWorkflowActive(false);
      setChatState('open');
    } finally {
      setIsAnalyzing(false);
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
    <div className="fixed bottom-8 right-8 z-50" id="chat-widget">
      {/* Minimized view */}
      <div
        className={`
          transform transition-all duration-300 ease-out origin-bottom-right absolute bottom-0 right-0
          ${chatState === 'minimized' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'}
        `}
      >
        <MinimizedChat
          isWorkflowActive={isWorkflowActive}
          latestMessage={chatMessages[chatMessages.length - 1]?.content}
          onMaximize={() => setChatState('open')}
        />
      </div>

      {/* Main chat widget */}
      <div
        className={`
          transform transition-all duration-300 ease-out origin-bottom-right absolute bottom-0 right-0
          ${chatState !== 'minimized' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'}
        `}
      >
        {/* Expanded chat view */}
        <div
          className={`
          transform transition-all duration-300 ease-out origin-bottom-right
          ${chatState === 'open' ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}
        `}
        >
          <MaximizedChat
            messages={chatMessages}
            isAnalyzing={isAnalyzing}
            input={input}
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
          ${chatState === 'closed' ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}
        `}
        >
          <NeedHelpButton onClick={() => setChatState('open')} />
        </div>
      </div>
    </div>
  );
} 