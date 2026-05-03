import { AgentStates } from '../hooks/useSocket';
import { Language } from '../lib/i18n';
import clsx from 'clsx';
import { Eye, Mic, Shield, BarChart2, User, Tag, CheckCircle, Loader2, Clock, AlertCircle, Zap } from 'lucide-react';

interface AgentDashboardProps {
  agentStates: AgentStates;
  language: Language;
  compact?: boolean;
}

const AGENT_CONFIG = [
  { id: 'visual_intel',    icon: Eye,         label: 'Visual Intel',     color: 'blue' },
  { id: 'speech_intel',    icon: Mic,         label: 'Speech Intel',     color: 'violet' },
  { id: 'fraud_detection', icon: Shield,      label: 'Fraud Detection',  color: 'red' },
  { id: 'bureau_risk',     icon: BarChart2,   label: 'Bureau & Risk',    color: 'amber' },
  { id: 'persona',         icon: User,        label: 'Persona',          color: 'teal' },
  { id: 'offer',           icon: Tag,         label: 'Offer Engine',     color: 'green' },
  { id: 'compliance',      icon: CheckCircle, label: 'Compliance',       color: 'indigo' },
];

const GLOW: Record<string, string> = {
  blue:   'shadow-blue-500/20',
  violet: 'shadow-violet-500/20',
  red:    'shadow-red-500/20',
  amber:  'shadow-amber-500/20',
  teal:   'shadow-teal-500/20',
  green:  'shadow-green-500/20',
  indigo: 'shadow-indigo-500/20',
};

const ICON_COLOR: Record<string, string> = {
  blue:   'text-blue-400',
  violet: 'text-violet-400',
  red:    'text-red-400',
  amber:  'text-amber-400',
  teal:   'text-teal-400',
  green:  'text-green-400',
  indigo: 'text-indigo-400',
};

const BG_ACTIVE: Record<string, string> = {
  blue:   'bg-blue-500/10 border-blue-500/20',
  violet: 'bg-violet-500/10 border-violet-500/20',
  red:    'bg-red-500/10 border-red-500/20',
  amber:  'bg-amber-500/10 border-amber-500/20',
  teal:   'bg-teal-500/10 border-teal-500/20',
  green:  'bg-green-500/10 border-green-500/20',
  indigo: 'bg-indigo-500/10 border-indigo-500/20',
};

function getPreview(agentId: string, data: Record<string, unknown>): string {
  switch (agentId) {
    case 'visual_intel': {
      const l = data.liveness as { passed?: boolean; confidence?: number } | undefined;
      if (l) return `Liveness: ${l.passed ? '✓ PASS' : '✗ FAIL'} ${Math.round((l.confidence ?? 0) * 100)}%`;
      return 'Analysing video...';
    }
    case 'speech_intel': {
      const e = data.entities as Record<string, unknown> | undefined;
      if (e?.employment_type) return `${e.employment_type}${e.income ? ` · ₹${Number(e.income).toLocaleString('en-IN')}` : ''}`;
      return 'Listening...';
    }
    case 'fraud_detection': {
      const score = data.fraud_score as number | undefined;
      const decision = data.decision as string | undefined;
      if (score !== undefined) return `Score: ${score}/100 · ${(decision ?? '').toUpperCase()}`;
      return 'Cross-validating signals...';
    }
    case 'bureau_risk': {
      const band = data.risk_band as string | undefined;
      const score = data.credit_score as number | undefined;
      if (band) return `${band} Risk${score ? ` · CIBIL ${score}` : ''}`;
      return 'Fetching bureau data...';
    }
    case 'persona': {
      const p = data.persona as string | undefined;
      return p ?? 'Classifying profile...';
    }
    case 'offer': {
      const amount = data.amount as number | undefined;
      const rate = data.rate_pa as number | undefined;
      if (amount) return `₹${(amount / 100000).toFixed(1)}L @ ${rate}% p.a.`;
      return 'Computing offer...';
    }
    case 'compliance': {
      const tx = data.solana_tx as string | undefined;
      if (tx) return `⛓ ${tx.slice(0, 8)}...`;
      return 'Sealing audit log...';
    }
    default: return '';
  }
}

const completedCount = (states: AgentStates) =>
  Object.values(states).filter(s => s.status === 'completed').length;

export default function AgentDashboard({ agentStates, language: _language, compact = false }: AgentDashboardProps) {
  const done = completedCount(agentStates);
  const total = AGENT_CONFIG.length;
  const pct = Math.round((done / total) * 100);

  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {AGENT_CONFIG.map(({ id, icon: Icon, color, label }) => {
          const state = agentStates[id];
          const status = state?.status ?? 'idle';
          const isDone = status === 'completed';
          const isActive = status === 'running';
          return (
            <div
              key={id}
              title={label}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                isDone ? `bg-${color}-500/15 border border-${color}-500/25` :
                isActive ? 'bg-blue-500/10 border border-blue-500/20 shimmer' :
                'bg-white/5 border border-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isDone ? ICON_COLOR[color] : isActive ? 'text-blue-400' : 'text-white/25'}`} />
              <span className={`text-xs font-medium ${isDone ? 'text-white/80' : isActive ? 'text-blue-300' : 'text-white/30'}`}>
                {label.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white/80">AI Agents</span>
        </div>
        <span className="text-xs text-white/40">{done}/{total} complete</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Agent cards */}
      <div className="flex flex-col gap-2 flex-1">
        {AGENT_CONFIG.map(({ id, icon: Icon, label, color }) => {
          const state = agentStates[id];
          const status = state?.status ?? 'idle';
          const preview = state ? getPreview(id, state.data) : '';
          const isActive = status === 'running';
          const isDone = status === 'completed';

          return (
            <div
              key={id}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-xl border transition-all duration-300',
                isDone ? `${BG_ACTIVE[color]} shadow-sm ${GLOW[color]}` :
                isActive ? 'bg-white/5 border-white/10 shimmer' :
                'bg-white/[0.02] border-white/5'
              )}
            >
              <div className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                isDone ? `bg-${color}-500/20` : 'bg-white/5'
              )}>
                <Icon className={clsx('w-4 h-4', isDone ? ICON_COLOR[color] : 'text-white/30')} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={clsx('text-xs font-medium truncate', isDone ? 'text-white/90' : 'text-white/40')}>
                    {label}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isDone && <CheckCircle className={clsx('w-3.5 h-3.5', ICON_COLOR[color])} />}
                    {isActive && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                    {status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                    {status === 'idle' && <Clock className="w-3.5 h-3.5 text-white/20" />}
                    {state?.durationMs && (
                      <span className="text-[10px] text-white/25">{state.durationMs}ms</span>
                    )}
                  </div>
                </div>
                {preview && (
                  <p className={clsx('text-[11px] truncate mt-0.5', isDone ? 'text-white/50' : 'text-white/25')}>
                    {preview}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
