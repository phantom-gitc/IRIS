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

export interface AgentStateEvent {
  state: AgentState;
  timestamp: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}
