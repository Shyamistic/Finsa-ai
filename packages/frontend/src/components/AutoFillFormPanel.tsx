/**
 * AutoFillFormPanel — Live form auto-fill visualization
 *
 * Shows the loan application form being filled in real-time as
 * Priya extracts entities from the conversation. Each field animates
 * in as it gets populated, with source badges (speech/bureau/derived/OCR)
 * and validation status.
 *
 * This is the "Auto-Fill & Alternate Data Generation" node from the
 * Finsa AI architecture diagram — made visible to judges.
 */
import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Clock, Mic, Database, Cpu, Camera, Zap } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  value: string | number | null;
  status: 'empty' | 'filling' | 'valid' | 'error' | 'derived';
  error?: string;
  source: 'speech' | 'bureau' | 'derived' | 'ocr';
  confidence: number;
  filled_at?: number;
}

interface AutoFillData {
  form: Record<string, FormField>;
  completion_pct: number;
  errors: string[];
  warnings: string[];
  alternate_data: {
    foir: number;
    max_eligible_emi: number;
    max_eligible_amount: number;
    income_stability_score: number;
    recommended_tenure_months: number;
  };
  nova_act_actions: Array<{
    action: string;
    field_id?: string;
    value?: string;
    description: string;
    timestamp: number;
  }>;
}

interface Props {
  autoFillData: AutoFillData | null;
  isActive: boolean;
}

const SOURCE_META = {
  speech: { icon: Mic, label: 'Speech', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  bureau: { icon: Database, label: 'Bureau', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  derived: { icon: Cpu, label: 'Derived', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  ocr: { icon: Camera, label: 'OCR', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
};

const STATUS_STYLES = {
  empty: 'border-gray-700/50 bg-gray-800/20',
  filling: 'border-blue-500/40 bg-blue-500/5 animate-pulse',
  valid: 'border-green-500/30 bg-green-500/5',
  error: 'border-red-500/40 bg-red-500/5',
  derived: 'border-blue-500/20 bg-blue-500/5',
};

function formatValue(value: string | number | null, fieldId: string): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (fieldId.includes('income') || fieldId.includes('emi') || fieldId.includes('amount')) {
      return '₹' + value.toLocaleString('en-IN');
    }
    if (fieldId === 'foir') return value + '%';
    return String(value);
  }
  return String(value);
}

const FORM_SECTIONS = [
  {
    title: 'Personal Details',
    fields: ['full_name', 'pan_number', 'date_of_birth', 'age'],
  },
  {
    title: 'Employment & Income',
    fields: ['employment_type', 'monthly_income', 'employer_name'],
  },
  {
    title: 'Loan Requirements',
    fields: ['loan_purpose', 'loan_amount_requested', 'preferred_tenure_months'],
  },
  {
    title: 'Obligations & Derived',
    fields: ['existing_emis', 'foir', 'max_eligible_amount', 'recommended_tenure', 'risk_indicator'],
  },
];

export default function AutoFillFormPanel({ autoFillData, isActive }: Props) {
  const [lastAction, setLastAction] = useState<string>('');
  const [actionFlash, setActionFlash] = useState(false);

  useEffect(() => {
    if (autoFillData?.nova_act_actions?.length) {
      const latest = autoFillData.nova_act_actions[autoFillData.nova_act_actions.length - 1];
      setLastAction(latest.description);
      setActionFlash(true);
      const t = setTimeout(() => setActionFlash(false), 1500);
      return () => clearTimeout(t);
    }
  }, [autoFillData?.nova_act_actions?.length]);

  if (!isActive && !autoFillData) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-48">
        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3">
          <Zap className="w-6 h-6 text-blue-400/50" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Auto-Fill Agent</p>
        <p className="text-gray-600 text-xs mt-1">Activates when session starts</p>
      </div>
    );
  }

  const form = autoFillData?.form ?? {};
  const completionPct = autoFillData?.completion_pct ?? 0;
  const altData = autoFillData?.alternate_data;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-lg flex items-center justify-center border border-blue-500/20">
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Auto-Fill Agent</h3>
            <p className="text-xs text-gray-500">Nova Act · Real-time form population</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${completionPct === 100 ? 'text-green-400' : completionPct > 50 ? 'text-blue-400' : 'text-gray-400'}`}>
            {completionPct}%
          </div>
          <div className="text-xs text-gray-500">complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <div
          className={`h-full transition-all duration-700 ${completionPct === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-blue-500 to-violet-500'}`}
          style={{ width: `${completionPct}%` }}
        />
      </div>

      {/* Nova Act action feed */}
      {lastAction && (
        <div className={`px-4 py-2 border-b border-gray-800 flex items-center gap-2 transition-all ${actionFlash ? 'bg-blue-500/10' : 'bg-transparent'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
          <p className="text-xs text-blue-300 truncate">{lastAction}</p>
        </div>
      )}

      <div className="p-4 space-y-5">
        {/* Form sections */}
        {FORM_SECTIONS.map(section => {
          const sectionFields = section.fields.map(id => ({ id, field: form[id] })).filter(f => f.field);
          if (sectionFields.length === 0) return null;

          return (
            <div key={section.title}>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">{section.title}</p>
              <div className="space-y-2">
                {sectionFields.map(({ id, field }) => {
                  if (!field) return null;
                  const sourceMeta = SOURCE_META[field.source] ?? SOURCE_META.speech;
                  const SourceIcon = sourceMeta.icon;
                  const statusStyle = STATUS_STYLES[field.status] ?? STATUS_STYLES.empty;

                  return (
                    <div
                      key={id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-500 ${statusStyle}`}
                    >
                      {/* Status icon */}
                      <div className="flex-shrink-0">
                        {field.status === 'valid' || field.status === 'derived' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : field.status === 'error' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : field.status === 'filling' ? (
                          <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-600" />
                        )}
                      </div>

                      {/* Label + value */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5">{field.label}</div>
                        {field.value !== null ? (
                          <div className={`text-sm font-semibold ${field.status === 'error' ? 'text-red-400' : field.status === 'derived' ? 'text-blue-300' : 'text-white'}`}>
                            {formatValue(field.value, id)}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 italic">—</div>
                        )}
                        {field.error && (
                          <div className="text-xs text-red-400 mt-0.5">{field.error}</div>
                        )}
                      </div>

                      {/* Source badge */}
                      {field.value !== null && (
                        <div className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border flex-shrink-0 ${sourceMeta.color}`}>
                          <SourceIcon className="w-2.5 h-2.5" />
                          <span>{sourceMeta.label}</span>
                        </div>
                      )}

                      {/* Confidence */}
                      {field.confidence > 0 && field.value !== null && (
                        <div className="text-xs text-gray-600 flex-shrink-0">
                          {Math.round(field.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Alternate data panel */}
        {altData && (altData.foir > 0 || altData.max_eligible_amount > 0) && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Alternate Data (Derived by AI)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['FOIR', altData.foir + '%', altData.foir > 60 ? 'text-red-400' : 'text-green-400'],
                ['Max EMI Available', '₹' + altData.max_eligible_emi.toLocaleString('en-IN'), 'text-white'],
                ['Max Eligible Amount', '₹' + (altData.max_eligible_amount / 100000).toFixed(1) + 'L', 'text-blue-400'],
                ['Recommended Tenure', altData.recommended_tenure_months + ' months', 'text-white'],
              ].map(([k, v, c]) => (
                <div key={String(k)} className="bg-gray-800/50 rounded-lg p-2.5">
                  <div className="text-xs text-gray-500 mb-0.5">{k}</div>
                  <div className={`text-sm font-bold ${c}`}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors & warnings */}
        {(autoFillData?.errors?.length ?? 0) > 0 && (
          <div className="space-y-1.5">
            {autoFillData!.errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {err}
              </div>
            ))}
          </div>
        )}
        {(autoFillData?.warnings?.length ?? 0) > 0 && (
          <div className="space-y-1.5">
            {autoFillData!.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {w}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
