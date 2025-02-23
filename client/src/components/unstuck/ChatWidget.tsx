"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUnstuck } from "@/contexts/UnstuckContext";
import { parseGemini } from "@/lib/extract";
import { getSitemap } from "@/utils/siteMetadata";
import { MessageCircle, Phone, X } from "lucide-react";
import { useCallback, useState } from "react";
import * as ReactDOM from "react-dom/client";
import { WorkflowCreator } from "@/components/WorkflowCreator";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
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

        const rawGeminiResponse = data.result;
        const messages = data.messages;

        const parsedGemini = parseGemini(rawGeminiResponse);

        console.log(
          "parsedGemini: ",
          parsedGemini.actions,
          parsedGemini.narration,
          parsedGemini.reasoning
        );

        // Ok now do the actions
        if (parsedGemini.actions.length > 0) {
          const firstAction = parsedGemini.actions[0];
          console.log("firstAction: ", firstAction);
          // Create a promise that resolves when the workflow is complete
          const workflowPromise = new Promise<void>((resolve) => {
            // Create a temporary div to mount the WorkflowCreator
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
          
          // Wait for the workflow to complete
          await workflowPromise;
        }

        previousMessages = messages;
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
      console.log("Finished agent loop: ", taskAccomplished);
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
    <div
      className="fixed bottom-8 right-8 z-50 flex flex-col items-end"
      id="chat-widget"
    >
      <div
        className={`
        transform transition-all duration-300 ease-out origin-bottom-right w-full
        ${
          isOpen
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0 pointer-events-none"
        }
      `}
      >
        <Card className="w-[350px] shadow-xl bg-white rounded-2xl overflow-hidden">
          <div className="py-2 px-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600" />
              <h3 className="text-sm font-medium">Unstuck AI</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-purple-50"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex-1 p-6 space-y-4 max-h-[500px] overflow-y-auto">
            {chatMessages.length === 0 && (
              <div className="text-center space-y-6">
                <p className="text-gray-500 text-sm px-8">
                  Tell us what you need and we will guide you through it
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={startCall}
                    variant="ghost"
                    size="lg"
                    className="rounded-full px-8 py-6 bg-purple-50 hover:bg-purple-100 text-purple-600 font-medium gap-2 transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    Start a call instead
                  </Button>
                </div>
              </div>
            )}
            {chatMessages.map((message, i) => (
              <div
                key={i}
                className={`
                  flex transform transition-all duration-300 ease-out
                  animate-in slide-in-from-bottom-4 fade-in
                  ${message.role === "user" ? "justify-end" : "justify-start"}
                `}
              >
                <div
                  className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex justify-start animate-in slide-in-from-bottom-4 fade-in">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for help..."
                disabled={isAnalyzing}
                className="flex-1 rounded-full border-purple-200 focus-visible:ring-purple-400"
              />
              <Button
                type="submit"
                disabled={isAnalyzing || !input.trim()}
                className="rounded-full bg-purple-100 hover:bg-purple-200 text-purple-600 font-medium px-6"
                variant="ghost"
                size="sm"
              >
                Send
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div
        className={`
        transform transition-all duration-200 ease-out absolute bottom-0 right-0
        ${
          !isOpen
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0 pointer-events-none"
        }
      `}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-12 pl-4 pr-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg flex items-center gap-2"
        >
          <MessageCircle className="h-5 w-5 text-white" />
          <span className="text-white font-medium">Need help?</span>
        </Button>
      </div>
    </div>
  );
}