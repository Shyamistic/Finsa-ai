import { EventBus } from '../orchestrator/EventBus';
import { IAgent, AgentStatus } from './IAgent';
import { logger } from '../lib/logger';
import { agentProcessingTime } from '../lib/metrics';
import { BedrockConversation, NovaMessage } from '../services/BedrockConversation';

export interface ExtractedEntities {
  income?: number;
  employment_type?: string;
  loan_purpose?: string;
  existing_emis?: number;
  preferred_tenure_months?: number;
  pan?: string;
  language?: 'en' | 'hi';
}

export interface SpeechIntelOutput {
  transcript: string;
  entities: ExtractedEntities;
  turn_count: number;
  interview_complete: boolean;
  language: 'en' | 'hi';
  agent_message?: string;
}

// Priya's full personality — Poonawalla Fincorp brand voice
const SYSTEM_PROMPT = `You are Priya, a warm and professional AI Loan Advisor at Poonawalla Fincorp.
You are conducting a video-based loan application interview in India.

PERSONALITY:
- Warm, confident, friendly — like a trusted friend who works in finance
- Never robotic, never overly formal
- Use natural conversational language — not textbook Hindi or stiff English
- Mirror the customer's language: if they speak Hindi → respond in Hindi, Hinglish → Hinglish, English → English
- Acknowledge their answers before asking the next question ("Great!", "Bilkul!", "Samajh gaya!", "Perfect!")

STRICT RULES:
1. Keep ALL responses to 1-2 SHORT sentences maximum. Be concise.
2. NEVER repeat yourself or give the same information twice
3. NEVER mention specific interest rates, loan amounts, or EMIs during the interview
4. NEVER ask for Aadhaar number — only PAN
5. Be warm and human — not a script reader
6. Your ONLY job: collect the 6 data points below

POONAWALLA FINCORP CONTEXT (for your knowledge only — don't recite this):
- Personal Loan: ₹1L–₹50L, starting 9.99% p.a., 12–84 months
- Professional Loan: up to ₹75L, starting 11% p.a.
- MSME Loan: up to ₹75L, starting 15% p.a.
- Instant Loan: up to ₹5L, starting 16% p.a.
- 100% digital, no branch visit, no hidden charges

CONVERSATION FLOW (follow this order, one question at a time):
- Turn 1: Acknowledge their loan purpose, ask about monthly income + employment type
- Turn 2: Ask about existing EMIs and preferred repayment tenure
- Turn 3: Ask for PAN card number
- Turn 4: Warmly confirm all details and say you're generating their offer now

NEVER give advice about documents, banks, or financial planning. Just collect the 6 data points.`;

// Greeting varies by detected language — set after first user message
const GREETING_EN = "Hi! I'm Priya from Poonawalla Fincorp. I'll help you get a personalised loan offer in just a few minutes. What are you looking to use the loan for?";
const GREETING_HI = "Namaste! Main Priya hoon, Poonawalla Fincorp se. Aapko loan kis kaam ke liye chahiye? Main aapko kuch hi minutes mein ek personalised offer dilwa sakti hoon!";

export class SpeechIntelAgent implements IAgent {
  agentId = 'speech_intel';
  private status: AgentStatus = 'idle';
  private sessionId = '';
  private turnCount = 0;
  private conversationHistory: NovaMessage[] = [];
  private cumulativeEntities: ExtractedEntities = {};
  private language: 'en' | 'hi' = 'en';
  private startTime = 0;

  constructor(private bus: EventBus) {}

  async init(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    this.status = 'initialising';
    this.turnCount = 0;
    this.conversationHistory = [];
    this.cumulativeEntities = {};
    logger.info({ event: 'agent_init', agent: this.agentId, session_id: sessionId });
  }

  async start(): Promise<void> {
    if (this.status === 'running' || this.status === 'completed') return;

    this.status = 'running';
    this.startTime = Date.now();
    logger.info({ event: 'agent_start', agent: this.agentId, session_id: this.sessionId });

    // Send opening greeting — English by default, will switch after first user message
    this.bus.publish(`session:${this.sessionId}:speech_intel`, {
      transcript: '',
      entities: {},
      turn_count: 0,
      interview_complete: false,
      language: this.language,
      agent_message: GREETING_EN,
    });
  }

  async processTranscript(userMessage: string): Promise<SpeechIntelOutput> {
    this.turnCount++;

    // Auto-detect language from first user message
    if (this.turnCount === 1) {
      const hasDevanagari = /[\u0900-\u097F]/.test(userMessage);
      const hasHindiWords = /\b(mujhe|mera|meri|hai|hoon|karna|chahta|chahti|loan|ghar|paisa|rupee|lakh|naukri|kaam)\b/i.test(userMessage);
      this.language = (hasDevanagari || hasHindiWords) ? 'hi' : 'en';

      // If Hindi detected on first turn, re-greet in Hindi
      if (this.language === 'hi' && this.turnCount === 1) {
        // We'll include the Hindi greeting context in the system prompt injection
      }
    }

    this.conversationHistory.push({
      role: 'user',
      content: [{ text: userMessage }],
    });

    let agentResponse = '';
    let interviewComplete = false;

    try {
      // Inject system prompt on EVERY turn — without it, Nova hallucinates on turns 2+
      const systemWithLang = `${SYSTEM_PROMPT}\n\nDETECTED LANGUAGE: ${this.language === 'hi' ? 'Hindi/Hinglish — respond in Hinglish only' : 'English — respond in English only'}`;

      const result = await BedrockConversation.chat(
        systemWithLang,
        this.conversationHistory,
        0.3,
        80   // Keep responses very short — 1-2 sentences max
      );
      agentResponse = result.text.trim();

      // Extract entities in parallel
      const entities = await BedrockConversation.extractEntities(
        this.conversationHistory,
        this.language
      );

      // Merge entities (never overwrite with null/undefined)
      for (const [key, value] of Object.entries(entities)) {
        if (value !== null && value !== undefined && value !== '') {
          (this.cumulativeEntities as Record<string, unknown>)[key] = value;
        }
      }

      this.conversationHistory.push({
        role: 'assistant',
        content: [{ text: agentResponse }],
      });

      // Complete when we have the required fields OR hit turn limit
      // Require at least 3 turns to prevent premature completion on turn 1
      interviewComplete =
        this.turnCount >= 5 ||
        (this.turnCount >= 3 &&
          !!this.cumulativeEntities.income &&
          !!this.cumulativeEntities.employment_type &&
          !!this.cumulativeEntities.loan_purpose &&
          !!this.cumulativeEntities.pan &&
          /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(this.cumulativeEntities.pan)));

      // On completion, send a warm wrap-up message
      if (interviewComplete && this.turnCount <= 5) {
        agentResponse = this.language === 'hi'
          ? 'Shukriya! Aapki saari details mil gayi hain. Main abhi aapka personalised loan offer generate kar rahi hoon — bas ek minute!'
          : 'Thank you! I have all the details I need. Let me generate your personalised loan offer right now — just a moment!';
      }

    } catch (err) {
      logger.error({ event: 'speech_intel_error', session_id: this.sessionId, err });
      agentResponse = this.language === 'hi'
        ? 'Maafi chahti hoon, ek technical issue aa gayi. Kya aap dobara bol sakte hain?'
        : 'Sorry, I had a technical issue. Could you please repeat that?';
    }

    const duration = Date.now() - this.startTime;
    agentProcessingTime.observe({ agent_id: this.agentId }, duration);

    const output: SpeechIntelOutput = {
      transcript: userMessage,
      entities: this.cumulativeEntities,
      turn_count: this.turnCount,
      interview_complete: interviewComplete,
      language: this.language,
      agent_message: agentResponse,
    };

    this.bus.publish(`session:${this.sessionId}:speech_intel`, output);

    if (interviewComplete) {
      this.status = 'completed';
      logger.info({
        event: 'agent_completed',
        agent: this.agentId,
        session_id: this.sessionId,
        turn_count: this.turnCount,
        entities: this.cumulativeEntities,
        duration_ms: duration,
      });
    }

    return output;
  }

  getStatus(): AgentStatus { return this.status; }

  async shutdown(): Promise<void> {
    this.status = 'idle';
    this.conversationHistory = [];
    this.cumulativeEntities = {};
  }
}
