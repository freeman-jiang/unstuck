"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUnstuck } from "@/contexts/UnstuckContext";
import { parseGemini } from "@/lib/extract";
import { getSitemap } from "@/utils/siteMetadata";
import { MessageCircle, Phone, X, Minimize2 } from "lucide-react";
import { useCallback, useState } from "react";
import * as ReactDOM from "react-dom/client";
import { WorkflowCreator } from "@/components/WorkflowCreator";

type ChatState = 'closed' | 'minimized' | 'open';

export function ChatWidget() {
  const [chatState, setChatState] = useState<ChatState>('closed');
  const [isWorkflowActive, setIsWorkflowActive] = useState(false);
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
                  root.unmount();
                  document.body.removeChild(container);
                  resolve();
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
    <div
      className="fixed bottom-8 right-8 z-50"
      id="chat-widget"
    >
      {/* Minimized view */}
      <div
        className={`
          transform transition-all duration-300 ease-out origin-bottom-right absolute bottom-0 right-0 cursor-pointer
          ${chatState === 'minimized' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'}
        `}
        onClick={() => setChatState('open')}
      >
        <Card className="w-[300px] shadow-lg bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-100 hover:border-purple-200 transition-colors">
          <div className="p-3 flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={`w-2 h-2 rounded-full bg-purple-500 ${isWorkflowActive ? 'animate-pulse' : ''}`} />
            </div>
            <p className="text-sm text-gray-700 flex-1 line-clamp-2">
              {chatMessages[chatMessages.length - 1]?.content || 
                (isWorkflowActive ? "Guiding you through the process..." : "Chat minimized")}
            </p>
          </div>
        </Card>
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
          <Card className="w-[350px] shadow-xl bg-white rounded-2xl overflow-hidden">
            <div className="py-2 px-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600" />
                <h3 className="text-sm font-medium">Unstuck AI</h3>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-purple-50"
                  onClick={() => setChatState('minimized')}
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-purple-50"
                  onClick={() => setChatState('closed')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
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

        {/* Need help button */}
        <div
          className={`
          transform transition-all duration-200 ease-out absolute bottom-0 right-0
          ${chatState === 'closed' ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}
        `}
        >
          <Button
            onClick={() => setChatState('open')}
            size="lg"
            className="rounded-full h-12 pl-4 pr-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg flex items-center gap-2"
          >
            <MessageCircle className="h-5 w-5 text-white" />
            <span className="text-white font-medium">Need help?</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
