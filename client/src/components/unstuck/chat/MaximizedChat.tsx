import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Phone, X, Minimize2, AlertCircle, Volume2, VolumeX, Mic } from "lucide-react";
import { MaximizedChatProps } from "./types";

export const MaximizedChat = ({
  messages,
  isAnalyzing,
  input,
  error,
  loading,
  isVoiceEnabled,
  isRecording,
  isCallActive,
  onVoiceToggle,
  onInputChange,
  onSubmit,
  onStartRecording,
  onStopRecording,
  onMinimize,
  onClose,
  onStartCall
}: MaximizedChatProps) => (
  <Card className={`w-[350px] shadow-xl bg-white rounded-2xl overflow-hidden ${
    error ? 'border-red-300' : 
    isCallActive ? 'border-green-300' :
    loading?.isLoading ? 'border-purple-300' : ''
  }`}>
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
          onClick={onVoiceToggle}
          title={isVoiceEnabled ? "Disable voice" : "Enable voice"}
          disabled={isCallActive}
        >
          {isVoiceEnabled ? (
            <Volume2 className="h-3 w-3 text-purple-600" />
          ) : (
            <VolumeX className="h-3 w-3 text-gray-400" />
          )}
        </Button>
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

    {error && (
      <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    )}

    <div className="flex-1 p-6 space-y-4 max-h-[500px] overflow-y-auto">
      {(messages.length === 0 || isCallActive) && !loading?.isLoading && (
        <div className="text-center space-y-6">
          {isCallActive ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-purple-200 rounded-full animate-ping opacity-75" />
                <div className="relative w-4 h-4 bg-purple-500 rounded-full" />
              </div>
              <p className="text-purple-700 font-medium">
                Listening... Speak your request
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-sm px-8">
                Tell us what you need and we will guide you through it
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={onStartCall}
                  variant="ghost"
                  size="lg"
                  className="rounded-full px-8 py-6 font-medium gap-2 transition-colors bg-purple-50 hover:bg-purple-100 text-purple-600"
                  disabled={loading?.isLoading}
                >
                  <Phone className="h-5 w-5" />
                  Start a call instead
                </Button>
              </div>
            </>
          )}
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
      {loading?.isLoading && (
        <div className="flex justify-start animate-in slide-in-from-bottom-4 fade-in">
          <div className="flex items-center gap-1 text-purple-600">
            <span className="animate-bounce">•</span>
            <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>•</span>
            <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>•</span>
          </div>
        </div>
      )}
    </div>

    <form onSubmit={onSubmit} className="p-4 border-t">
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={
              isCallActive 
                ? "Voice call active - speak your request"
                : loading?.isLoading 
                  ? "Please wait..." 
                  : "Ask for help..."
            }
            disabled={loading?.isLoading || isRecording || isCallActive}
            className={`
              w-full rounded-full pr-10 border-purple-200 focus-visible:ring-purple-400
              ${error ? 'border-red-300 focus-visible:ring-red-400' : 
                loading?.isLoading ? 'border-purple-300 bg-purple-50' :
                isRecording ? 'border-red-300 bg-red-50' :
                isCallActive ? 'border-green-300 bg-green-50' : ''
              }
            `}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={`
              absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0
              ${isRecording 
                ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
                : isCallActive
                  ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                  : 'text-purple-500 hover:text-purple-600 hover:bg-purple-50'
              }
            `}
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={loading?.isLoading || isCallActive}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <div className="relative">
                <Mic className="h-3 w-3" />
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </div>
            ) : (
              <Mic className="h-3 w-3" />
            )}
          </Button>
        </div>
        <Button
          type="submit"
          disabled={loading?.isLoading || !input.trim() || isRecording || isCallActive}
          className={`rounded-full bg-purple-100 hover:bg-purple-200 text-purple-600 font-medium px-6 
            ${(loading?.isLoading || isRecording || isCallActive) ? 'opacity-50 cursor-not-allowed' : ''}`}
          variant="ghost"
          size="sm"
        >
          Send
        </Button>
      </div>
    </form>
  </Card>
); 