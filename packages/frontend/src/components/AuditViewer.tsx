import { CheckCircle, XCircle, Link, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

export interface AuditEntry {
  seq: number;
  event_type: string;
  timestamp_ms: number;
  payload_hash: string;
  prev_hash: string;
  payload?: Record<string, unknown>;
}

export interface VerifyResult {
  valid: boolean;
  chain_length: number;
  broken_at?: number;
}

interface AuditViewerProps {
  entries: AuditEntry[];
  verifyResult: VerifyResult | null;
  solanaTx?: string | null;
}

const EVENT_COLORS: Record<string, string> = {
  consent_captured: 'text-blue-600',
  session_started: 'text-indigo-600',
  liveness_result: 'text-purple-600',
  ocr_result: 'text-teal-600',
  fraud_score_computed: 'text-orange-600',
  bureau_result: 'text-yellow-600',
  persona_classified: 'text-cyan-600',
  offer_generated: 'text-green-600',
  offer_accepted: 'text-emerald-600',
  session_rejected: 'text-red-600',
  on_chain_anchored: 'text-violet-600',
};

export default function AuditViewer({ entries, verifyResult, solanaTx }: AuditViewerProps) {
  return (
    <div className="space-y-3">
      {/* Chain integrity banner */}
      {verifyResult && (
        <div className={clsx(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
          verifyResult.valid
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        )}>
          {verifyResult.valid
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <XCircle className="w-4 h-4 flex-shrink-0" />
          }
          <span>
            Chain Integrity: {verifyResult.valid ? 'VALID' : `BROKEN at entry #${verifyResult.broken_at}`}
            {' '}— {verifyResult.chain_length} events
          </span>
        </div>
      )}

      {/* Solana anchor */}
      {solanaTx && (
        <a
          href={`https://explorer.solana.com/tx/${solanaTx}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-sm hover:bg-violet-100 transition-colors"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">On-chain anchor: {solanaTx.slice(0, 24)}...</span>
        </a>
      )}

      {/* Entries */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">No audit entries yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {entries.map((entry, i) => {
              const isBroken = verifyResult && !verifyResult.valid && verifyResult.broken_at === i;
              return (
                <div
                  key={entry.seq}
                  className={clsx('px-4 py-3', isBroken && 'bg-red-50')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400 w-6">#{entry.seq}</span>
                      <span className={clsx('text-sm font-medium', EVENT_COLORS[entry.event_type] ?? 'text-gray-700')}>
                        {entry.event_type.replace(/_/g, ' ')}
                      </span>
                      {isBroken && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                          CHAIN BROKEN
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(entry.timestamp_ms).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Hash chain visualization */}
                  <div className="flex items-center gap-1.5 mt-1">
                    {i > 0 && (
                      <>
                        <Link className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        <span className="text-xs font-mono text-gray-300 truncate max-w-[100px]">
                          {entry.prev_hash.slice(0, 10)}…
                        </span>
                        <span className="text-gray-300 text-xs">→</span>
                      </>
                    )}
                    <span className="text-xs font-mono text-gray-400 truncate max-w-[120px]">
                      {entry.payload_hash.slice(0, 12)}…
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
