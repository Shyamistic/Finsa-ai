const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const baseArg = process.argv.find((arg) => arg.startsWith('--base-url='));
const baseUrl = (baseArg ? baseArg.split('=')[1] : process.env.SMOKE_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const apiKey = process.env.API_KEY || 'demo-key-finsa-2026';

function withTimeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms));
}

async function requestJson(url, options = {}, timeoutMs = 15000) {
  const response = await Promise.race([
    fetch(url, options),
    withTimeout(timeoutMs),
  ]);

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} ${JSON.stringify(json)}`);
  }
  return json;
}

async function requestAudio(url, options = {}, timeoutMs = 20000) {
  const response = await Promise.race([
    fetch(url, options),
    withTimeout(timeoutMs),
  ]);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText} ${text}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return {
    bytes: arrayBuffer.byteLength,
    contentType: response.headers.get('content-type') || '',
  };
}

async function main() {
  const authHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  console.log(`SMOKE_BASE_URL ${baseUrl}`);

  const health = await requestJson(`${baseUrl}/health`);
  console.log('HEALTH_OK', health.status, `uptime=${health.uptime_s}s`);

  const deps = await requestJson(`${baseUrl}/health/dependencies`);
  console.log('DEPENDENCIES_OK', deps.status, `db=${deps.db.ok} redis=${deps.redis.ok} aws=${deps.aws.ok}`);

  const tts = await requestAudio(`${baseUrl}/tts/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Namaste, Kajal Hindi smoke test.', language: 'hi' }),
  });
  console.log('TTS_OK', `contentType=${tts.contentType}`, `bytes=${tts.bytes}`);

  const created = await requestJson(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ language: 'hi' }),
  });
  const sessionId = created.session_id;
  if (!sessionId) throw new Error('session_id missing from create session response');
  console.log('SESSION_CREATED', sessionId);

  await requestJson(`${baseUrl}/sessions/${sessionId}/consent`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      consent_version: '1.0',
      data_categories: ['video', 'audio', 'pan'],
      purpose: 'Loan origination',
      retention_days: 2555,
    }),
  });
  console.log('CONSENT_OK');

  await requestJson(`${baseUrl}/sessions/${sessionId}/start`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({}),
  });
  console.log('SESSION_START_OK');

  await requestJson(`${baseUrl}/sessions/${sessionId}/transcript`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ transcript: 'Namaste Priya, mujhe ghar banane ke liye loan chahiye.' }),
  });
  console.log('TRANSCRIPT_OK');

  const session = await requestJson(`${baseUrl}/sessions/${sessionId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  console.log('SESSION_FETCH_OK', `status=${session.status}`);

  console.log('SMOKE_FLOW_OK');
}

main().catch((err) => {
  console.error('SMOKE_FLOW_FAIL', err.message || String(err));
  process.exit(1);
});
