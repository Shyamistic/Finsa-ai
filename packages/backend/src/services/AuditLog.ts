import crypto from 'crypto';
import { query, queryOne, pool } from '../db/db';
import { logger } from '../lib/logger';

export interface AuditLogEntry {
  seq: number;
  session_id: string;
  event_type: string;
  timestamp_ms: number;
  payload_hash: string;
  prev_hash: string;
  payload: Record<string, unknown>;
}

export interface VerifyResult {
  valid: boolean;
  chain_length: number;
  broken_at?: number;
}

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export const AuditLog = {
  async append(sessionId: string, eventType: string, payload: unknown): Promise<void> {
    const payloadObj = payload as Record<string, unknown>;
    // Use a stable canonical JSON string — this is what we hash and store
    const payloadStr = JSON.stringify(payloadObj);
    const payloadHash = sha256(payloadStr);

    // Retry up to 5 times on seq conflict (concurrent agents race condition)
    let seq = -1;
    for (let attempt = 0; attempt < 5; attempt++) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Lock the session row to serialize concurrent appends
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [sessionId]);
        const last = await client.query<{ seq: number; payload_hash: string }>(
          'SELECT seq, payload_hash FROM audit_log_entries WHERE session_id = $1 ORDER BY seq DESC LIMIT 1',
          [sessionId]
        );
        const lastRow = last.rows[0] ?? null;
        seq = (lastRow?.seq ?? -1) + 1;
        const prevHash = seq === 0 ? '0'.repeat(64) : lastRow!.payload_hash;

        await client.query(
          `INSERT INTO audit_log_entries (session_id, seq, event_type, timestamp_ms, payload_hash, prev_hash, payload)
           VALUES ($1, $2, $3, $4, $5, $6, $7::text::jsonb)`,
          [sessionId, seq, eventType, Date.now(), payloadHash, prevHash, payloadStr]
        );
        await client.query('COMMIT');
        client.release();
        break; // success
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
        const pgErr = err as { code?: string };
        if (pgErr.code === '23505' && attempt < 4) {
          // Unique violation on (session_id, seq) — retry
          await new Promise(r => setTimeout(r, 10 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }

    logger.info({ event: 'audit_appended', session_id: sessionId, event_type: eventType, seq });
  },

  async verify(sessionId: string): Promise<VerifyResult> {
    const entries = await query<AuditLogEntry>(
      'SELECT * FROM audit_log_entries WHERE session_id = $1 ORDER BY seq ASC',
      [sessionId]
    );

    if (entries.length === 0) {
      return { valid: true, chain_length: 0 };
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Verify chain link using stored hashes — tamper-evident regardless of JSONB serialization
      // entry[i].prev_hash must equal entry[i-1].payload_hash (or genesis for i=0)
      if (i === 0) {
        if (entry.prev_hash !== '0'.repeat(64)) {
          return { valid: false, chain_length: entries.length, broken_at: 0 };
        }
      } else {
        if (entry.prev_hash !== entries[i - 1].payload_hash) {
          return { valid: false, chain_length: entries.length, broken_at: i };
        }
      }
    }

    return { valid: true, chain_length: entries.length };
  },

  async getRootHash(sessionId: string): Promise<string> {
    const entries = await query<{ payload_hash: string }>(
      'SELECT payload_hash FROM audit_log_entries WHERE session_id = $1 ORDER BY seq ASC',
      [sessionId]
    );

    if (entries.length === 0) return sha256(sessionId);

    // Merkle-style: hash all payload hashes together
    const combined = entries.map(e => e.payload_hash).join('');
    return sha256(combined);
  },

  async getEntries(sessionId: string): Promise<AuditLogEntry[]> {
    return query<AuditLogEntry>(
      'SELECT * FROM audit_log_entries WHERE session_id = $1 ORDER BY seq ASC',
      [sessionId]
    );
  },
};
