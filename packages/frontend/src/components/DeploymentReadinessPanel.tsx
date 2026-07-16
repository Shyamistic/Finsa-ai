import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

type DependencyStatus = {
  status: 'ok' | 'degraded';
  db: { ok: boolean; detail: string };
  redis: { ok: boolean; detail: string };
  aws: { ok: boolean; region: string; using_profile: boolean; using_static_keys: boolean };
  uptime_s: number;
};

const INITIAL_STATUS: DependencyStatus = {
  status: 'degraded',
  db: { ok: false, detail: 'pending' },
  redis: { ok: false, detail: 'pending' },
  aws: { ok: false, region: 'us-east-1', using_profile: false, using_static_keys: false },
  uptime_s: 0,
};

function StatusChip({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${ok ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-300" />}
        <span className="text-xs font-semibold text-white">{label}</span>
      </div>
      {detail && <p className="text-[11px] text-white/60 mt-1 line-clamp-1">{detail}</p>}
    </div>
  );
}

export default function DeploymentReadinessPanel() {
  const [status, setStatus] = useState<DependencyStatus>(INITIAL_STATUS);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/health/dependencies`, { cache: 'no-store' });
      const data = (await response.json()) as DependencyStatus;
      setStatus(data);
    } catch {
      setStatus({
        ...INITIAL_STATUS,
        db: { ok: false, detail: 'backend unreachable' },
        redis: { ok: false, detail: 'backend unreachable' },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const awsAuthMode = useMemo(() => {
    if (status.aws.using_profile) return 'profile';
    if (status.aws.using_static_keys) return 'static keys';
    return 'not configured';
  }, [status.aws.using_profile, status.aws.using_static_keys]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-white">Live Deployment Readiness</p>
          <p className="text-xs text-white/50">Auto-check every 15s for judge demo stability</p>
        </div>
        <button
          onClick={fetchStatus}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-white/15 text-white/70 hover:bg-white/10 transition-colors inline-flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <StatusChip label="Postgres" ok={status.db.ok} detail={status.db.detail} />
        <StatusChip label="Redis" ok={status.redis.ok} detail={status.redis.detail} />
        <StatusChip label="AWS" ok={status.aws.ok} detail={`region ${status.aws.region} - ${awsAuthMode}`} />
      </div>

      <div className="mt-3 text-[11px] text-white/50">
        Overall: <span className={status.status === 'ok' ? 'text-emerald-300' : 'text-amber-300'}>{status.status.toUpperCase()}</span>
      </div>
    </div>
  );
}
