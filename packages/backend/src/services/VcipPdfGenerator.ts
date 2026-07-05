import PDFDocument from 'pdfkit';
import { queryOne } from '../db/db';
import { AuditLog } from './AuditLog';

interface SessionRecord {
  id: string;
  status: string;
  pan_masked: string | null;
  persona: string | null;
  risk_band: string | null;
  fraud_score: number | null;
  offer: unknown;
  language: string;
  geo_country: string | null;
  bandwidth_tier: string | null;
  solana_tx_signature: string | null;
  created_at: string | Date | null;
  completed_at: string | Date | null;
}

interface ConsentRecord {
  consented_at: string | Date | null;
  consent_version: string;
  customer_ip: string | null;
  purpose: string;
  retention_days: number;
}

/** Safely format a date that may be a string, Date, or null */
function safeDate(val: string | Date | null | undefined): string {
  if (!val) return 'N/A';
  try {
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toISOString();
  } catch {
    return String(val);
  }
}

export const VcipPdfGenerator = {
  async generate(sessionId: string): Promise<Buffer> {
    const session = await queryOne<SessionRecord>('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const consent = await queryOne<ConsentRecord>(
      'SELECT * FROM dpdp_consent_trail WHERE session_id = $1 ORDER BY consented_at ASC LIMIT 1',
      [sessionId]
    );

    const auditEntries = await AuditLog.getEntries(sessionId);
    const verifyResult = await AuditLog.verify(sessionId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ──────────────────────────────────────────────────────────
      doc.fontSize(20).font('Helvetica-Bold').text('V-CIP Compliance Record', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Finsa AI — Finsa', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#666').text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
      doc.fillColor('black').moveDown(1.5);

      const section = (title: string) => {
        doc.fontSize(13).font('Helvetica-Bold').fillColor('black').text(title);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
        doc.moveDown(0.4);
        doc.fontSize(10).font('Helvetica').fillColor('black');
      };

      const row = (label: string, value: string) => {
        doc.text(`${label}: ${value}`);
      };

      // ── Session Details ──────────────────────────────────────────────────
      section('Session Details');
      row('Session ID', session.id);
      row('Status', session.status);
      row('Created', safeDate(session.created_at));
      row('Completed', safeDate(session.completed_at));
      row('Language', session.language === 'hi' ? 'Hindi' : 'English');
      row('Geo Country', session.geo_country ?? 'IN');
      row('Bandwidth Tier', session.bandwidth_tier ?? 'N/A');
      doc.moveDown(0.8);

      // ── Customer Identification ──────────────────────────────────────────
      section('Customer Identification');
      row('PAN (masked)', session.pan_masked ?? 'N/A');
      row('Persona', session.persona ?? 'N/A');
      row('Risk Band', session.risk_band ?? 'N/A');
      row('Fraud Score', session.fraud_score != null ? String(session.fraud_score) : 'N/A');
      doc.moveDown(0.8);

      // ── DPDP Consent ─────────────────────────────────────────────────────
      section('DPDP Consent Record');
      if (consent) {
        row('Consent Version', consent.consent_version);
        row('Consented At', safeDate(consent.consented_at));
        row('Customer IP', consent.customer_ip ?? 'N/A');
        row('Purpose', consent.purpose);
        row('Retention', `${consent.retention_days} days`);
      } else {
        doc.text('No consent record found.');
      }
      doc.moveDown(0.8);

      // ── Audit Log ────────────────────────────────────────────────────────
      section('Audit Log Summary');
      row('Total Events', String(auditEntries.length));
      row('Chain Integrity', verifyResult.valid
        ? 'VALID — all hashes verified'
        : `BROKEN at entry ${verifyResult.broken_at}`);
      doc.moveDown(0.4);

      for (const entry of auditEntries.slice(0, 25)) {
        doc.fontSize(8).fillColor('#444')
          .text(`[${entry.seq}] ${entry.event_type}  ${safeDate(new Date(entry.timestamp_ms))}  hash:${entry.payload_hash.slice(0, 12)}...`);
      }
      if (auditEntries.length > 25) {
        doc.text(`... and ${auditEntries.length - 25} more events`);
      }
      doc.fillColor('black').moveDown(0.8);

      // ── On-Chain Anchor ──────────────────────────────────────────────────
      if (session.solana_tx_signature) {
        section('On-Chain Audit Anchor (Solana Devnet)');
        row('TX Signature', session.solana_tx_signature);
        row('Explorer', `https://explorer.solana.com/tx/${session.solana_tx_signature}?cluster=devnet`);
        doc.moveDown(0.8);
      }

      // ── Loan Offer ───────────────────────────────────────────────────────
      if (session.offer) {
        const offer = session.offer as Record<string, unknown>;
        section('Loan Offer Details');
        row('Amount', offer.amount ? `INR ${Number(offer.amount).toLocaleString('en-IN')}` : 'N/A');
        row('Rate p.a.', offer.rate_pa ? `${offer.rate_pa}%` : 'N/A');
        row('Recommended Tenure', offer.recommended_tenure_months ? `${offer.recommended_tenure_months} months` : 'N/A');
        row('Monthly EMI', offer.emi ? `INR ${Number(offer.emi).toLocaleString('en-IN')}` : 'N/A');
        doc.moveDown(0.8);
      }

      // ── Footer ───────────────────────────────────────────────────────────
      doc.fontSize(7).fillColor('#999').text(
        'This document is an auto-generated V-CIP compliance record per RBI Master Direction on KYC 2016 (Para 19). ' +
        'All personal data is stored in India (AWS ap-south-1). No PII is stored on-chain. ' +
        'Audit hash anchored on Solana Devnet for tamper-proof verification.',
        { align: 'center' }
      );

      doc.end();
    });
  },
};
