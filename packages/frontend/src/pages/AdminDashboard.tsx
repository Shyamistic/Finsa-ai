import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../lib/i18n';
import { CheckCircle, XCircle, ExternalLink, Download, Shield, Clock, LogOut } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface Session {
  id: string;
  status: string;
  pan_masked: string | null;
  persona: string | null;
  risk_band: string | null;
  fraud_score: number | null;
  language: string;
  solana_tx_signature: string | null;
  created_at: string;
  completed_at: string | null;
}

interface AuditEntry {
  seq: number;
  event_type: string;
  timestamp_ms: number;
  payload_hash: string;
  prev_hash: string;
}

interface VerifyResult {
  valid: boolean;
  chain_length: number;
  broken_at?: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (sessionStorage.getItem('admin_authenticated') !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  const adminKey = sessionStorage.getItem('admin_key') || 'admin-key-loanwizard-2026-secure';
  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_key');
    navigate('/admin/login');
  };

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would use admin auth
    // For demo, we show mock data
    setSessions([
      {
        id: 'demo-session-1',
        status: 'offer_delivered',
        pan_masked: 'ABCDE****F',
        persona: 'Salaried-Urban',
        risk_band: 'Low',
        fraud_score: 5,
        language: 'en',
        solana_tx_signature: '3xK9mPqR7vNsLwYtBcDfGhJkMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz',
        created_at: new Date(Date.now() - 300000).toISOString(),
        completed_at: new Date(Date.now() - 210000).toISOString(),
      },
      {
        id: 'demo-session-2',
        status: 'rejected',
        pan_masked: 'PQRST****U',
        persona: null,
        risk_band: 'High',
        fraud_score: 85,
        language: 'en',
        solana_tx_signature: null,
        created_at: new Date(Date.now() - 600000).toISOString(),
        completed_at: new Date(Date.now() - 540000).toISOString(),
      },
    ]);
    setLoading(false);
  }, []);

  const loadAudit = async (sessionId: string) => {
    setSelectedSession(sessionId);
    // Mock audit entries for demo
    setAuditEntries([
      { seq: 0, event_type: 'consent_captured', timestamp_ms: Date.now() - 90000, payload_hash: 'a'.repeat(64), prev_hash: '0'.repeat(64) },
      { seq: 1, event_type: 'session_started', timestamp_ms: Date.now() - 89000, payload_hash: 'b'.repeat(64), prev_hash: 'a'.repeat(64) },
      { seq: 2, event_type: 'liveness_result', timestamp_ms: Date.now() - 75000, payload_hash: 'c'.repeat(64), prev_hash: 'b'.repeat(64) },
      { seq: 3, event_type: 'bureau_result', timestamp_ms: Date.now() - 65000, payload_hash: 'd'.repeat(64), prev_hash: 'c'.repeat(64) },
      { seq: 4, event_type: 'fraud_score_computed', timestamp_ms: Date.now() - 55000, payload_hash: 'e'.repeat(64), prev_hash: 'd'.repeat(64) },
      { seq: 5, event_type: 'persona_classified', timestamp_ms: Date.now() - 45000, payload_hash: 'f'.repeat(64), prev_hash: 'e'.repeat(64) },
      { seq: 6, event_type: 'offer_generated', timestamp_ms: Date.now() - 30000, payload_hash: 'g'.repeat(64), prev_hash: 'f'.repeat(64) },
      { seq: 7, event_type: 'on_chain_anchored', timestamp_ms: Date.now() - 15000, payload_hash: 'h'.repeat(64), prev_hash: 'g'.repeat(64) },
    ]);
    setVerifyResult({ valid: true, chain_length: 8 });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      offer_delivered: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      in_progress: 'bg-blue-100 text-blue-700',
      initiated: 'bg-gray-100 text-gray-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('admin.title', 'en')}</h1>
          <p className="text-sm text-gray-500">Poonawalla Fincorp — Finsa · Key: {adminKey.slice(0, 12)}...</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('admin.sessions', 'en')}</h2>
          <div className="space-y-3">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => loadAudit(session.id)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedSession === session.id ? 'border-blue-500 shadow-md' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-mono text-gray-500">{session.id.slice(0, 16)}...</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(session.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(session.status)}`}>
                    {session.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">PAN</p>
                    <p className="font-medium">{session.pan_masked ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Persona</p>
                    <p className="font-medium">{session.persona ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Fraud Score</p>
                    <p className={`font-bold ${(session.fraud_score ?? 0) >= 70 ? 'text-red-600' : 'text-green-600'}`}>
                      {session.fraud_score ?? 'N/A'}
                    </p>
                  </div>
                </div>
                {session.solana_tx_signature && (
                  <a
                    href={`https://explorer.solana.com/tx/${session.solana_tx_signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-blue-500 text-xs mt-2 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {t('admin.solana', 'en')}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Audit log viewer */}
        {selectedSession && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('admin.audit', 'en')}</h2>
              {verifyResult && (
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  verifyResult.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {verifyResult.valid
                    ? <><CheckCircle className="w-3 h-3" /> {t('admin.chain_valid', 'en')}</>
                    : <><XCircle className="w-3 h-3" /> {t('admin.chain_invalid', 'en')}</>
                  }
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {auditEntries.map((entry, i) => (
                  <div key={entry.seq} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400">#{entry.seq}</span>
                        <span className="text-sm font-medium text-gray-700">{entry.event_type}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(entry.timestamp_ms).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {i > 0 && (
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-mono text-gray-400 truncate max-w-[120px]">
                            {entry.prev_hash.slice(0, 12)}...
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-gray-300">→</span>
                      <span className="text-xs font-mono text-gray-400 truncate max-w-[120px]">
                        {entry.payload_hash.slice(0, 12)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={`${API_URL}/sessions/${selectedSession}/vcip-pdf`}
              className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('admin.vcip', 'en')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
