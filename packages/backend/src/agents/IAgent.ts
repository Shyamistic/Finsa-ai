export type AgentStatus = 'idle' | 'initialising' | 'running' | 'completed' | 'error';

export interface IAgent {
  agentId: string;
  init(sessionId: string): Promise<void>;
  start(): Promise<void>;
  getStatus(): AgentStatus;
  shutdown(): Promise<void>;
}
