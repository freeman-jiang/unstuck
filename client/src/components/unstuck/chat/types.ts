export type ChatState = 'closed' | 'minimized' | 'open';
export type ChatMessage = { role: "user" | "assistant"; content: string };

export interface MinimizedChatProps {
  isWorkflowActive: boolean;
  latestMessage?: string;
  onMaximize: () => void;
}

export interface NeedHelpButtonProps {
  onClick: () => void;
}

export interface MaximizedChatProps {
  messages: ChatMessage[];
  isAnalyzing: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onMinimize: () => void;
  onClose: () => void;
  onStartCall: () => void;
} 