import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Phone, X, Minimize2 } from "lucide-react";
import { MaximizedChatProps } from "./types";

export const MaximizedChat = ({
  messages,
  isAnalyzing,
  input,
  onInputChange,
  onSubmit,
  onMinimize,
  onClose,
  onStartCall
}: MaximizedChatProps) => (
  <Card className="w-[350px] shadow-xl bg-white rounded-2xl overflow-hidden">
    <div className="py-2 px-3 border-b flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600" />
        <h3 className="text-sm font-medium">Unstuck AI</h3>
      </div>
      <div className="flex items-center gap-1">
        {isAnalyzing && (
          <div className="text-xs text-gray-400 animate-pulse mr-2">
            press <kbd className="px-1 py-0.5 bg-gray-100 rounded">tab</kbd> to continue
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-purple-50"
          onClick={onMinimize}
        >
          <Minimize2 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-purple-50"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>

    <div className="flex-1 p-6 space-y-4 max-h-[500px] overflow-y-auto">
      {messages.length === 0 && (
        <div className="text-center space-y-6">
          <p className="text-gray-500 text-sm px-8">
            Tell us what you need and we will guide you through it
          </p>
          <div className="flex justify-center">
            <Button
              onClick={onStartCall}
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
      {messages.map((message, i) => (
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

    <form onSubmit={onSubmit} className="p-4 border-t">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
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
); 