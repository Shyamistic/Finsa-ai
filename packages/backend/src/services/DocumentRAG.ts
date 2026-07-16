/**
 * PDF Document RAG Service
 * Uses Amazon Nova Pro (multimodal) to analyze uploaded documents
 * Supports: PAN card verification, income proof, bank statements
 * 
 * Architecture:
 * 1. PDF/image uploaded → converted to base64
 * 2. Nova Pro analyzes the document visually (multimodal)
 * 3. Extracted data cross-validated against session entities
 * 4. Verification result stored in audit log
 */
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { logger } from '../lib/logger';

const explicitAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  : undefined;

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(explicitAwsCredentials ? { credentials: explicitAwsCredentials } : {}),
});

export interface DocumentVerificationResult {
  document_type: 'pan_card' | 'aadhaar' | 'income_proof' | 'bank_statement' | 'unknown';
  extracted_data: {
    pan_number?: string;
    name?: string;
    dob?: string;
    income?: number;
    account_number_masked?: string;
  };
  verification_status: 'verified' | 'suspicious' | 'unreadable';
  confidence: number;
  flags: string[];
}

/**
 * Analyze a document image using Nova Pro multimodal
 * Extracts PAN, name, DOB, income data from uploaded documents
 */
export async function analyzeDocument(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf',
  sessionEntities: { pan?: string; name?: string; income?: number }
): Promise<DocumentVerificationResult> {
  const prompt = `You are a document verification system for a financial institution in India.
Analyze this document image and extract information. Output ONLY valid JSON.

Extract:
1. Document type (pan_card, aadhaar, income_proof, bank_statement, or unknown)
2. PAN number (format: ABCDE1234F)
3. Full name as printed
4. Date of birth (YYYY-MM-DD format)
5. Monthly income if visible
6. Any suspicious elements (tampering, blur, inconsistencies)

Output format:
{
  "document_type": "pan_card",
  "pan_number": null,
  "name": null,
  "dob": null,
  "income": null,
  "suspicious_flags": [],
  "confidence": 0.95
}

Be conservative — if you cannot clearly read a field, use null. Never guess.`;

  try {
    const body = {
      messages: [{
        role: 'user',
        content: [
          {
            image: {
              format: mimeType === 'image/png' ? 'png' : 'jpeg',
              source: { bytes: imageBase64 }
            }
          },
          { text: prompt }
        ]
      }],
      inferenceConfig: { maxTokens: 300, temperature: 0 },
    };

    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-pro-v1:0', // Nova Pro for multimodal
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await client.send(command);
    const result = JSON.parse(Buffer.from(response.body).toString());
    const text = result.output?.message?.content?.[0]?.text ?? '{}';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const extracted = JSON.parse(jsonMatch[0]);
    const flags: string[] = extracted.suspicious_flags ?? [];

    // Cross-validate with session entities
    if (sessionEntities.pan && extracted.pan_number) {
      const panMatch = extracted.pan_number.toUpperCase() === sessionEntities.pan.toUpperCase();
      if (!panMatch) flags.push('PAN_MISMATCH_WITH_STATED');
    }

    logger.info({
      event: 'document_analyzed',
      document_type: extracted.document_type,
      confidence: extracted.confidence,
      flags_count: flags.length,
    });

    return {
      document_type: extracted.document_type ?? 'unknown',
      extracted_data: {
        pan_number: extracted.pan_number,
        name: extracted.name,
        dob: extracted.dob,
        income: extracted.income,
      },
      verification_status: flags.length > 2 ? 'suspicious' : 'verified',
      confidence: extracted.confidence ?? 0.5,
      flags,
    };
  } catch (err) {
    logger.error({ event: 'document_analysis_error', err });
    return {
      document_type: 'unknown',
      extracted_data: {},
      verification_status: 'unreadable',
      confidence: 0,
      flags: ['ANALYSIS_FAILED'],
    };
  }
}
