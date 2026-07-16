import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { logger } from '../lib/logger';
import { getExplicitAwsCredentials } from '../lib/awsCredentials';

const explicitAwsCredentials = getExplicitAwsCredentials();

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(explicitAwsCredentials ? { credentials: explicitAwsCredentials } : {}),
});

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';

export interface NovaMessage {
  role: 'user' | 'assistant';
  content: Array<{ text: string }>;
}

export interface ConversationResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Hallucination protection strategy (used by top fintechs):
 * 1. System prompt constrains Nova to ONLY extract structured entities — never invent numbers
 * 2. All financial figures (rates, amounts, EMIs) come from PolicyEngine, not the LLM
 * 3. Nova outputs a strict JSON schema — any deviation is caught by Zod validation
 * 4. Temperature = 0 for entity extraction (deterministic)
 * 5. Conversation text uses temperature = 0.3 (natural but controlled)
 */
export const BedrockConversation = {
  async chat(
    systemPrompt: string,
    messages: NovaMessage[],
    temperature = 0.3,
    maxTokens = 512
  ): Promise<ConversationResult> {
    // Nova Lite: inject system prompt as first user message if no prior context
    // (Nova doesn't support top-level system array in all regions)
    let messagesWithSystem: NovaMessage[];
    if (systemPrompt && messages.length > 0 && messages[0].role === 'user') {
      messagesWithSystem = [
        { role: 'user', content: [{ text: `[INSTRUCTIONS]\n${systemPrompt}\n\n[USER]\n${messages[0].content[0].text}` }] },
        ...messages.slice(1),
      ];
    } else {
      messagesWithSystem = messages;
    }

    const body = {
      messages: messagesWithSystem,
      inferenceConfig: {
        maxTokens,
        temperature,
        topP: 0.9,
      },
    };

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await client.send(command);
    const result = JSON.parse(Buffer.from(response.body).toString());

    const text = result.output?.message?.content?.[0]?.text ?? '';
    const usage = result.usage ?? {};

    logger.info({
      event: 'bedrock_nova_call',
      model: MODEL_ID,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
    });

    return {
      text,
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    };
  },

  async extractEntities(
    conversationHistory: NovaMessage[],
    _language: 'en' | 'hi'
  ): Promise<Record<string, unknown>> {
    // Build a summary of the conversation for extraction
    const conversationText = conversationHistory
      .map(m => `${m.role.toUpperCase()}: ${m.content[0].text}`)
      .join('\n');

    const extractionMessage: NovaMessage = {
      role: 'user',
      content: [{ text: `Extract loan application data from this conversation. Output ONLY valid JSON, nothing else. NEVER invent or guess values — use null if the customer has not explicitly stated the value.

Fields to extract (all optional, use null if not mentioned):
- income: number (monthly income in INR, only if customer explicitly stated it)
- employment_type: string (one of: Salaried, Self-Employed, MSME-Owner, only if stated)
- loan_purpose: string (brief description, only if stated)
- existing_emis: number (monthly EMI amount in INR, only if stated)
- preferred_tenure_months: number (only if stated)
- pan: string (exactly 10 characters, format: 5 uppercase letters + 4 digits + 1 uppercase letter, ONLY if customer explicitly said their PAN number — do NOT infer or guess)

CRITICAL: The pan field must ONLY be populated if the customer explicitly stated their PAN card number in the conversation. Never invent a PAN.

Conversation:
${conversationText}

JSON output:` }],
    };

    const result = await this.chat('', [extractionMessage], 0, 200);

    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate PAN format strictly — reject if it doesn't match real PAN pattern
        if (parsed.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(parsed.pan))) {
          parsed.pan = null;
        }
        return parsed;
      }
    } catch {
      logger.warn({ event: 'entity_extraction_parse_error', text: result.text.substring(0, 100) });
    }
    return {};
  },
};
