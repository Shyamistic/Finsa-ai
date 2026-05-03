/**
 * Amazon Polly Neural TTS Service
 * Uses Kajal (Hindi/English Indian female neural voice) for natural-sounding speech
 * Kajal is Amazon's best Indian English + Hindi voice — sounds like a real person
 *
 * NOTE: We use plain text (not SSML) for all inputs.
 * Polly's neural engine handles prosody naturally — SSML is not needed and causes
 * InvalidSsmlException when text contains apostrophes, Devanagari, or Hinglish.
 */
import { PollyClient, SynthesizeSpeechCommand, Engine, OutputFormat, VoiceId } from '@aws-sdk/client-polly';
import { logger } from '../lib/logger';

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export type TTSLanguage = 'en' | 'hi';

/**
 * Synthesize speech using Amazon Polly neural voices
 * - English: Kajal (Indian English, neural) — warm, professional female voice
 * - Hindi: Kajal (Hindi, neural) — same voice, switches language
 * Returns MP3 audio as Buffer
 */
export async function synthesizeSpeech(
  text: string,
  language: TTSLanguage = 'en'
): Promise<Buffer> {
  const voiceId: VoiceId = 'Kajal';
  const languageCode = language === 'hi' ? 'hi-IN' : 'en-IN';

  // Always use plain text — Polly neural handles prosody naturally.
  // SSML causes InvalidSsmlException with apostrophes, Devanagari, or Hinglish.
  const cleanText = text.replace(/<[^>]*>/g, '').trim();

  try {
    const command = new SynthesizeSpeechCommand({
      Text: cleanText,
      TextType: 'text',
      VoiceId: voiceId,
      LanguageCode: languageCode,
      Engine: Engine.NEURAL,
      OutputFormat: OutputFormat.MP3,
    });

    const response = await pollyClient.send(command);

    if (!response.AudioStream) {
      throw new Error('No audio stream returned from Polly');
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.AudioStream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    const audioBuffer = Buffer.concat(chunks);
    logger.info({
      event: 'polly_tts_success',
      language,
      voice: voiceId,
      text_length: text.length,
      audio_bytes: audioBuffer.length,
    });

    return audioBuffer;
  } catch (err) {
    logger.error({ event: 'polly_tts_error', err, language });
    throw err;
  }
}

/**
 * Check if Polly is available (for graceful fallback to browser TTS)
 */
export async function checkPollyAvailable(): Promise<boolean> {
  try {
    const testBuffer = await synthesizeSpeech('Test', 'en');
    return testBuffer.length > 0;
  } catch {
    return false;
  }
}
