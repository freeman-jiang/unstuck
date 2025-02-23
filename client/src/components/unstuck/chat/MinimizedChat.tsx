import { Card } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { MinimizedChatProps } from "./types";

export const MinimizedChat = ({
  isWorkflowActive,
  latestMessage,
  error,
  loading,
  onMaximize,
}: MinimizedChatProps) => (
  <Card
    onClick={onMaximize}
    className={`
      w-[300px] shadow-lg bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden 
      ${
        error
          ? "border-red-300 hover:border-red-400"
          : loading?.isLoading
          ? "border-purple-300 hover:border-purple-400"
          : "border-purple-100 hover:border-purple-200"
      } 
      transition-colors cursor-pointer
    `}
  >
    <div className="p-3 flex items-center gap-3">
      <div className="flex-shrink-0">
        {error ? (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        ) : loading?.isLoading ? (
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        ) : (
          <div
            className={`w-2 h-2 rounded-full bg-purple-500 ${
              isWorkflowActive ? "animate-pulse" : ""
            }`}
          />
        )}
      </div>
      <p
        className={`text-sm flex-1 line-clamp-2 ${
          error
            ? "text-red-600"
            : loading?.isLoading
            ? "text-purple-600"
            : "text-gray-700"
        }`}
      >
        {error
          ? error.message
          : loading?.isLoading
          ? loading.message || "Processing your request..."
          : latestMessage ||
            (isWorkflowActive
              ? "Guiding you through the process..."
              : "Chat minimized")}
      </p>
      {isWorkflowActive && !error && !loading?.isLoading && (
        <div className="text-xs text-gray-400 animate-pulse flex items-center gap-1">
          press <kbd className="px-1 py-0.5 bg-gray-100 rounded">enter</kbd> to
          continue
          <ArrowRight className="h-3 w-3" />
        </div>
      )}
      {error && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
      {loading?.isLoading && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
          {loading.progress !== undefined && (
            <span className="text-xs text-purple-500">
              {Math.round(loading.progress * 100)}%
            </span>
          )}
        </div>
      )}
    </div>
  </Card>
);
