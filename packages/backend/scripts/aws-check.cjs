const path = require('path');
const dotenv = require('dotenv');
const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function cleanSecret(value) {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^['"]|['"]$/g, '');
}

function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function getCredentials() {
  const accessKeyId = cleanSecret(process.env.AWS_ACCESS_KEY_ID);
  const secretAccessKey = cleanSecret(process.env.AWS_SECRET_ACCESS_KEY);
  const sessionToken = cleanSecret(process.env.AWS_SESSION_TOKEN);
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required in .env');
  }
  return {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {}),
  };
}

async function testPolly(credentials, region) {
  const client = new PollyClient({ region, credentials });
  const command = new SynthesizeSpeechCommand({
    Text: 'Namaste, yeh Kajal voice test hai.',
    TextType: 'text',
    VoiceId: 'Kajal',
    LanguageCode: 'hi-IN',
    Engine: 'neural',
    OutputFormat: 'mp3',
  });

  const response = await withTimeout(client.send(command), 15000, 'Polly test');
  if (!response.AudioStream) throw new Error('Polly returned no audio stream');

  const chunks = [];
  for await (const chunk of response.AudioStream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  if (buffer.length < 100) throw new Error(`Polly audio too small: ${buffer.length} bytes`);
  console.log(`POLLY_OK bytes=${buffer.length}`);
}

async function testBedrock(credentials, region, modelId) {
  const client = new BedrockRuntimeClient({ region, credentials });
  const body = {
    messages: [{ role: 'user', content: [{ text: 'Reply with ONLY: OK' }] }],
    inferenceConfig: { maxTokens: 10, temperature: 0 },
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(body),
  });

  const response = await withTimeout(client.send(command), 20000, 'Bedrock test');
  const parsed = JSON.parse(Buffer.from(response.body).toString());
  const text = String(parsed?.output?.message?.content?.[0]?.text || '').trim();
  console.log(`BEDROCK_OK response=${JSON.stringify(text)}`);
}

async function main() {
  const region = process.env.AWS_REGION || 'us-east-1';
  const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';

  try {
    const credentials = getCredentials();
    await testPolly(credentials, region);
    await testBedrock(credentials, region, modelId);
    console.log('AWS_SMOKE_OK');
  } catch (err) {
    console.error('AWS_SMOKE_FAIL', err.name || 'Error', err.message || String(err));
    process.exit(1);
  }
}

main();
