import { Card } from "@/components/ui/card";
import { MinimizedChatProps } from "./types";

export const MinimizedChat = ({ isWorkflowActive, latestMessage, onMaximize }: MinimizedChatProps) => (
  <Card 
    onClick={onMaximize}
    className="w-[300px] shadow-lg bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-100 hover:border-purple-200 transition-colors cursor-pointer"
  >
    <div className="p-3 flex items-center gap-3">
      <div className="flex-shrink-0">
        <div className={`w-2 h-2 rounded-full bg-purple-500 ${isWorkflowActive ? 'animate-pulse' : ''}`} />
      </div>
      <p className="text-sm text-gray-700 flex-1 line-clamp-2">
        {latestMessage || (isWorkflowActive ? "Guiding you through the process..." : "Chat minimized")}
      </p>
    </div>
  </Card>
); 