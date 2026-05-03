import { Language, t } from '../lib/i18n';
import { Info, TrendingUp, User, Shield } from 'lucide-react';

interface ExplainabilityPanelProps {
  fraudScore?: number;
  fraudSignals?: {
    geo_mismatch: boolean;
    age_discrepancy: boolean;
    pan_mismatch: boolean;
    behavioural_anomaly: boolean;
  };
  persona?: string;
  personaRationale?: string;
  riskBand?: string;
  topFactors?: string[];
  language: Language;
}

const SIGNAL_WEIGHTS = {
  geo_mismatch: 20,
  age_discrepancy: 25,
  pan_mismatch: 30,
  behavioural_anomaly: 25,
};

const SIGNAL_LABELS: Record<string, string> = {
  geo_mismatch: 'Geo-IP Verification',
  age_discrepancy: 'Age Cross-Validation',
  pan_mismatch: 'PAN Verification',
  behavioural_anomaly: 'Behavioural Analysis',
};

export default function ExplainabilityPanel({
  fraudScore,
  fraudSignals,
  persona,
  personaRationale,
  riskBand,
  topFactors,
  language,
}: ExplainabilityPanelProps) {
  if (!fraudScore && !persona && !topFactors?.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-gray-700">Decision Transparency</h3>
      </div>

      {/* Fraud Score Breakdown */}
      {fraudScore !== undefined && fraudSignals && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Fraud Score</span>
            </div>
            <span className={`text-sm font-bold ${fraudScore >= 70 ? 'text-red-600' : fraudScore >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>
              {fraudScore}/100
            </span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(fraudSignals).map(([key, triggered]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${triggered ? 'bg-red-400' : 'bg-green-400'}`} />
                <span className="text-xs text-gray-600 flex-1">{SIGNAL_LABELS[key]}</span>
                <span className="text-xs text-gray-400">w:{SIGNAL_WEIGHTS[key as keyof typeof SIGNAL_WEIGHTS]}</span>
                <span className={`text-xs font-medium ${triggered ? 'text-red-500' : 'text-green-500'}`}>
                  {triggered ? `+${SIGNAL_WEIGHTS[key as keyof typeof SIGNAL_WEIGHTS]}` : '0'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Persona */}
      {persona && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Borrower Profile</span>
          </div>
          <div className="bg-blue-50 rounded-lg px-3 py-2">
            <p className="text-sm font-semibold text-blue-700">{persona}</p>
            {personaRationale && <p className="text-xs text-blue-600 mt-0.5">{personaRationale}</p>}
          </div>
        </div>
      )}

      {/* Risk Band */}
      {riskBand && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Risk Band</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            riskBand === 'Low' ? 'bg-green-100 text-green-700' :
            riskBand === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {riskBand}
          </span>
        </div>
      )}

      {/* Top Factors */}
      {topFactors && topFactors.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">{t('offer.factors', language)}</span>
          </div>
          <ul className="space-y-1">
            {topFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-blue-500 font-bold flex-shrink-0">{i + 1}.</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
