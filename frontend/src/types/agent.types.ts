export type AgentState =
  | 'IDLE'
  | 'LISTENING'
  | 'UNDERSTANDING'
  | 'THINKING'
  | 'PLANNING'
  | 'CONFIRMING'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'SUCCESS'
  | 'ERROR';

export type PersonalityMode =
  | 'PROFESSIONAL'
  | 'FRIENDLY'
  | 'WARM'
  | 'PLAYFUL'
  | 'SWEET'
  | 'LIGHTLY_FLIRTY'
  | 'FOCUSED';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolExecuted?: {
    toolName: string;
    summary?: string;
    success: boolean;
  };
}

export interface TaskStep {
  id: string;
  title: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export interface ActiveTask {
  id: string;
  title: string;
  progress: number;
  steps: TaskStep[];
  status: 'RUNNING' | 'WAITING_CONFIRMATION' | 'COMPLETED' | 'FAILED';
}

export interface ConfirmationRequest {
  toolName: string;
  token: string;
  riskLevel?: string;
  description?: string;
}
