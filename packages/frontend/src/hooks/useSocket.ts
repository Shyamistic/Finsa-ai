import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type AgentStatus = 'idle' | 'initialising' | 'running' | 'completed' | 'error';

export interface AgentStatusEvent {
  agentId: string;
  data: Record<string, unknown>;
}

export interface AgentState {
  status: AgentStatus;
  data: Record<string, unknown>;
  completedAt?: number;
  durationMs?: number;
}

export type AgentStates = Record<string, AgentState>;

const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function useSocket(sessionId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [agentStates, setAgentStates] = useState<AgentStates>({});
  const [sessionPhase, setSessionPhase] = useState<string>('idle');
  const [agentMessage, setAgentMessage] = useState<{ text: string; id: number }>({ text: '', id: 0 });

  useEffect(() => {
    if (!sessionId) return;

    const socket = io(WS_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_session', sessionId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('agent_status', ({ agentId, data }: AgentStatusEvent) => {
      const now = Date.now();
      setAgentStates(prev => {
        const existing = prev[agentId];
        const startedAt = existing?.status === 'running' ? (existing.data._startedAt as number) : now;
        return {
          ...prev,
          [agentId]: {
            status: 'completed',
            data: { ...data, _startedAt: startedAt },
            completedAt: now,
            durationMs: now - startedAt,
          },
        };
      });

      // Extract agent message for speech intel
      if (agentId === 'speech_intel' && (data as { agent_message?: string }).agent_message) {
        setAgentMessage(prev => ({ text: (data as { agent_message: string }).agent_message, id: prev.id + 1 }));
      }
    });

    socket.on('session_phase', ({ phase }: { phase: string }) => {
      setSessionPhase(phase);
      // Mark all agents as running when session starts
      if (phase === 'started') {
        const agentIds = ['visual_intel', 'speech_intel', 'fraud_detection', 'bureau_risk', 'persona', 'offer', 'compliance'];
        setAgentStates(prev => {
          const next = { ...prev };
          for (const id of agentIds) {
            if (!next[id] || next[id].status === 'idle') {
              next[id] = { status: 'running', data: { _startedAt: Date.now() } };
            }
          }
          return next;
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  const sendLivenessResult = useCallback((result: {
    passed: boolean;
    confidence: number;
    challenge: string;
    age_estimate: number | null;
    session_id: string;
  }) => {
    socketRef.current?.emit('liveness_result', result);
  }, []);

  const sendTranscript = useCallback((transcript: string) => {
    socketRef.current?.emit('transcript', { session_id: sessionId, transcript });
    // Also expose on window for SessionPage access
    (window as unknown as Record<string, unknown>)._lwSocket = socketRef.current;
  }, [sessionId]);

  return { connected, agentStates, sessionPhase, agentMessage, sendLivenessResult, sendTranscript, socket: socketRef.current };
}
