import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface FraudSignals {
  geo_mismatch?: boolean;
  age_discrepancy?: boolean;
  pan_mismatch?: boolean;
  behavioural_anomaly?: boolean;
  device_fingerprint_mismatch?: boolean;
  multiple_applications?: boolean;
  income_inconsistency?: boolean;
}

interface Props {
  fraudScore: number;
  signals: FraudSignals;
}

const SIGNAL_META: { key: keyof FraudSignals; label: string; weight: number }[] = [
  { key: 'geo_mismatch', label: 'Geo Check', weight: 15 },
  { key: 'age_discrepancy', label: 'Age Verification', weight: 18 },
  { key: 'pan_mismatch', label: 'PAN Match', weight: 22 },
  { key: 'behavioural_anomaly', label: 'Behaviour', weight: 15 },
  { key: 'device_fingerprint_mismatch', label: 'Device', weight: 15 },
  { key: 'multiple_applications', label: 'Applications', weight: 20 },
  { key: 'income_inconsistency', label: 'Income', weight: 15 },
];

function scoreColor(score: number): string {
  if (score < 30) return '#10b981';
  if (score < 60) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score < 30) return 'Low Risk';
  if (score < 60) return 'Medium Risk';
  return 'High Risk';
}

// Circular progress SVG
function CircularProgress({ score, animated }: { score: number; animated: number }) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (animated / 100) * circumference;
  const color = scoreColor(score);

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28">
      {/* Background circle */}
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
      {/* Progress circle */}
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 6px ${color}60)` }}
      />
      {/* Score text */}
      <text x="50" y="46" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
        {animated}
      </text>
      <text x="50" y="60" textAnchor="middle" fill="#9ca3af" fontSize="8">
        /100
      </text>
    </svg>
  );
}

export default function FraudScoreVisualizer({ fraudScore, signals }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = fraudScore / 30;
    const timer = setInterval(() => {
      current += step;
      if (current >= fraudScore) {
        setAnimatedScore(fraudScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, 30);
    return () => clearInterval(timer);
  }, [fraudScore]);

  const color = scoreColor(fraudScore);
  const label = scoreLabel(fraudScore);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-400" />
        <h3 className="text-base font-bold text-white">Fraud Risk Score</h3>
      </div>

      {/* Circular gauge + label */}
      <div className="flex items-center gap-6">
        <CircularProgress score={fraudScore} animated={animatedScore} />
        <div>
          <p className="text-2xl font-bold" style={{ color }}>{label}</p>
          <p className="text-sm text-gray-400 mt-1">
            {fraudScore < 30
              ? 'All checks passed. Session approved.'
              : fraudScore < 60
              ? 'Some signals flagged. Manual review recommended.'
              : 'High fraud risk. Session rejected.'}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {fraudScore < 30 ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs text-gray-500">
              {Object.values(signals).filter(Boolean).length} of {SIGNAL_META.length} signals flagged
            </span>
          </div>
        </div>
      </div>

      {/* Signal bars */}
      <div className="space-y-2.5">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Signal Breakdown</p>
        {SIGNAL_META.map(({ key, label: signalLabel, weight }) => {
          const flagged = signals[key] === true;
          const barColor = flagged ? '#ef4444' : '#10b981';
          const barWidth = flagged ? 100 : 0;

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: flagged ? '#ef4444' : '#10b981' }}
                  />
                  <span className="text-xs text-gray-400">{signalLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">w:{weight}</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: flagged ? '#ef4444' : '#10b981',
                      backgroundColor: flagged ? '#ef444420' : '#10b98120',
                    }}
                  >
                    {flagged ? 'FLAGGED' : 'PASS'}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: barColor,
                    boxShadow: flagged ? `0 0 6px ${barColor}60` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
