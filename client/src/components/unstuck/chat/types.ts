export type ChatState = 'open' | 'minimized' | 'closed';
export type ChatMessage = { role: "user" | "assistant"; content: string };

export interface ErrorState {
  message: string;
  timestamp: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface MinimizedChatProps {
  isWorkflowActive: boolean;
  latestMessage?: string;
  error?: ErrorState;
  loading?: LoadingState;
  onMaximize: () => void;
}

export interface NeedHelpButtonProps {
  onClick: () => void;
}

export interface MaximizedChatProps {
  messages: ChatMessage[];
  isAnalyzing: boolean;
  input: string;
  error?: ErrorState;
  loading?: LoadingState;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onMinimize: () => void;
  onClose: () => void;
  onStartCall: () => void;
} 