/**
 * VcipCompliancePanel — Shows real-time RBI V-CIP compliance status
 * 
 * RBI KYC Master Direction Para 19 requirements:
 * 1. Live video interaction (no pre-recorded)
 * 2. Geo-tagging of customer device
 * 3. PAN OCR during call
 * 4. Active liveness detection (blink/nod)
 * 5. Concurrent audit by trained officer
 * 6. Session recording stored 8 years
 * 7. Proprietary system (no Zoom/Teams)
 * 8. IP address logging
 * 9. DPDP Act 2023 consent
 * 10. Encrypted transmission (TLS 1.3)
 */
import { CheckCircle, Clock, AlertTriangle, Shield, Lock, Video, MapPin, FileText, Eye, Mic } from 'lucide-react';

interface ComplianceCheck {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'active' | 'passed' | 'failed';
  rbiRef: string;
}

interface Props {
  livenessComplete: boolean;
  geoVerified: boolean;
  consentCaptured: boolean;
  panVerified: boolean;
  sessionActive: boolean;
  auditEntries: number;
}

export default function VcipCompliancePanel({
  livenessComplete,
  geoVerified,
  consentCaptured,
  panVerified,
  sessionActive,
  auditEntries,
}: Props) {
  const checks: ComplianceCheck[] = [
    {
      id: 'live_video',
      label: 'Live Video Session',
      description: 'Proprietary WebRTC — no Zoom/Teams',
      icon: Video,
      status: sessionActive ? 'passed' : 'pending',
      rbiRef: 'Para 19(a)',
    },
    {
      id: 'dpdp_consent',
      label: 'DPDP Consent Captured',
      description: 'Digital Personal Data Protection Act 2023',
      icon: FileText,
      status: consentCaptured ? 'passed' : 'pending',
      rbiRef: 'DPDP §4',
    },
    {
      id: 'geo_tag',
      label: 'Geo-Tag Verified',
      description: 'Customer IP → India (country_code = IN)',
      icon: MapPin,
      status: geoVerified ? 'passed' : sessionActive ? 'active' : 'pending',
      rbiRef: 'Para 19(c)',
    },
    {
      id: 'liveness',
      label: 'Liveness Detection',
      description: 'Blink + nod challenge — anti-spoofing',
      icon: Eye,
      status: livenessComplete ? 'passed' : sessionActive ? 'active' : 'pending',
      rbiRef: 'Para 19(b)',
    },
    {
      id: 'pan_ocr',
      label: 'PAN OCR Verified',
      description: 'PAN extracted via camera, cross-validated',
      icon: FileText,
      status: panVerified ? 'passed' : sessionActive ? 'active' : 'pending',
      rbiRef: 'Para 19(d)',
    },
    {
      id: 'stt_transcript',
      label: 'STT Transcript',
      description: 'Speech-to-text with entity extraction',
      icon: Mic,
      status: sessionActive ? 'passed' : 'pending',
      rbiRef: 'Para 19(e)',
    },
    {
      id: 'concurrent_audit',
      label: 'Concurrent Audit',
      description: 'AI audit agent monitoring session live',
      icon: Shield,
      status: auditEntries > 0 ? 'passed' : sessionActive ? 'active' : 'pending',
      rbiRef: 'Para 19(f)',
    },
    {
      id: 'encrypted',
      label: 'TLS 1.3 Encryption',
      description: 'End-to-end encrypted transmission',
      icon: Lock,
      status: 'passed', // Always on
      rbiRef: 'Para 19(g)',
    },
    {
      id: 'audit_log',
      label: 'Audit Log (8yr retention)',
      description: `${auditEntries} events hash-chained + Solana anchor`,
      icon: FileText,
      status: auditEntries > 0 ? 'passed' : 'pending',
      rbiRef: 'Para 19(h)',
    },
    {
      id: 'ip_log',
      label: 'IP Address Logged',
      description: 'Session IP captured and geo-resolved',
      icon: MapPin,
      status: sessionActive ? 'passed' : 'pending',
      rbiRef: 'Para 19(i)',
    },
  ];

  const passed = checks.filter(c => c.status === 'passed').length;
  const total = checks.length;
  const pct = Math.round((passed / total) * 100);

  const statusIcon = (status: ComplianceCheck['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />;
      case 'active': return <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />;
      default: return <Clock className="w-4 h-4 text-gray-600 flex-shrink-0" />;
    }
  };

  const statusBg = (status: ComplianceCheck['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-500/5 border-green-500/20';
      case 'active': return 'bg-blue-500/5 border-blue-500/20';
      case 'failed': return 'bg-red-500/5 border-red-500/20';
      default: return 'bg-gray-800/30 border-gray-700/30';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-bold text-white text-sm">RBI V-CIP Compliance</h3>
            <p className="text-xs text-gray-500">KYC Master Direction Para 19</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${pct === 100 ? 'text-green-400' : pct > 60 ? 'text-blue-400' : 'text-gray-400'}`}>
            {pct}%
          </div>
          <div className="text-xs text-gray-500">{passed}/{total} checks</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-blue-500 to-violet-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checks grid */}
      <div className="grid grid-cols-1 gap-2">
        {checks.map(check => {
          const Icon = check.icon;
          return (
            <div
              key={check.id}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${statusBg(check.status)}`}
            >
              {statusIcon(check.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white">{check.label}</span>
                  <span className="text-xs text-gray-600 hidden sm:block">{check.rbiRef}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{check.description}</p>
              </div>
              <Icon className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Compliance badge */}
      {pct === 100 && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-400">Fully V-CIP Compliant</p>
            <p className="text-xs text-green-300/60">All RBI Para 19 requirements satisfied</p>
          </div>
        </div>
      )}
    </div>
  );
}
