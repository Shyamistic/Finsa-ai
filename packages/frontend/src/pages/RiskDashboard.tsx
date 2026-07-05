import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Users, XCircle, MapPin, Clock, Zap } from 'lucide-react';

interface SessionRow {
  id: string;
  name: string;
  pan: string;
  city: string;
  fraudScore: number;
  riskBand: string;
  status: string;
  ts: number;
}

const MOCK_SESSIONS: SessionRow[] = [
  { id: 's001', name: 'Priya Sharma', pan: 'ABCDE****F', city: 'Mumbai', fraudScore: 8, riskBand: 'Low', status: 'approved', ts: Date.now() - 120000 },
  { id: 's002', name: 'Ramesh Patel', pan: 'FGHIJ****K', city: 'Ahmedabad', fraudScore: 22, riskBand: 'Medium', status: 'approved', ts: Date.now() - 240000 },
  { id: 's003', name: 'Suresh Kumar', pan: 'KLMNO****P', city: 'Coimbatore', fraudScore: 35, riskBand: 'High', status: 'approved', ts: Date.now() - 360000 },
  { id: 's004', name: 'Test Fraud', pan: 'PQRST****U', city: 'Unknown', fraudScore: 95, riskBand: 'High', status: 'rejected', ts: Date.now() - 480000 },
  { id: 's005', name: 'Anjali Singh', pan: 'UVWXY****Z', city: 'Jaipur', fraudScore: 12, riskBand: 'Medium', status: 'approved', ts: Date.now() - 600000 },
];

const ALERTS = [
  { id: 1, severity: 'critical', message: 'Fraud score 95 - session PQRST****U rejected', ts: Date.now() - 480000 },
  { id: 2, severity: 'warning', message: 'Geo mismatch detected - IP outside India', ts: Date.now() - 600000 },
  { id: 3, severity: 'info', message: 'Policy hot-reload triggered by admin', ts: Date.now() - 900000 },
  { id: 4, severity: 'info', message: 'Solana anchor successful - tx confirmed', ts: Date.now() - 1200000 },
];

const CITIES = [
  { name: 'Mumbai', x: 22, y: 58, count: 142 },
  { name: 'Delhi', x: 38, y: 28, count: 98 },
  { name: 'Bangalore', x: 35, y: 72, count: 87 },
  { name: 'Ahmedabad', x: 22, y: 45, count: 64 },
  { name: 'Jaipur', x: 33, y: 35, count: 51 },
  { name: 'Coimbatore', x: 33, y: 78, count: 38 },
];

function scoreColor(score: number) {
  if (score < 30) return 'text-green-400';
  if (score < 60) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBg(score: number) {
  if (score < 30) return 'bg-green-500/10 border-green-500/20';
  if (score < 60) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export default function RiskDashboard() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const activeSessions = 3 + (tick % 3);
  const avgFraud = Math.round(MOCK_SESSIONS.reduce((s, r) => s + r.fraudScore, 0) / MOCK_SESSIONS.length);
  const rejectionRate = Math.round((MOCK_SESSIONS.filter(s => s.status === 'rejected').length / MOCK_SESSIONS.length) * 100);
  const avgOffer = 920000;

  const signalBreakdown = [
    { label: 'Geo Mismatch', count: 1, pct: 20, color: 'bg-red-500' },
    { label: 'PAN Mismatch', count: 1, pct: 20, color: 'bg-orange-500' },
    { label: 'Age Discrepancy', count: 0, pct: 0, color: 'bg-yellow-500' },
    { label: 'Behaviour', count: 1, pct: 20, color: 'bg-amber-500' },
    { label: 'Clean', count: 3, pct: 60, color: 'bg-green-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
            <div>
              <div className="font-bold text-white text-sm">Risk Dashboard</div>
              <div className="text-xs text-gray-400">Finsa AI - SBI Pilot Risk Console</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-green-400"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />Live</div>
            <button onClick={() => navigate('/demo')} className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors">Demo</button>
            <button onClick={() => navigate('/admin')} className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors">Admin</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Active Sessions', value: String(activeSessions), sub: 'right now', color: 'blue', trend: '+2' },
            { icon: Shield, label: 'Avg Fraud Score', value: String(avgFraud) + '/100', sub: 'last 24h', color: 'amber', trend: '-3' },
            { icon: XCircle, label: 'Rejection Rate', value: rejectionRate + '%', sub: 'last 24h', color: 'red', trend: '-1%' },
            { icon: TrendingUp, label: 'Avg Offer Amount', value: 'Rs' + (avgOffer / 100000).toFixed(1) + 'L', sub: 'last 24h', color: 'green', trend: '+5%' },
          ].map(kpi => {
            const Icon = kpi.icon;
            const cc = kpi.color === 'blue' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : kpi.color === 'amber' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : kpi.color === 'red' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-green-400 bg-green-500/10 border-green-500/20';
            return (
              <div key={kpi.label} className={'border rounded-xl p-5 ' + cc}>
                <div className="flex items-center justify-between mb-3">
                  <div className={'w-9 h-9 rounded-lg flex items-center justify-center border ' + cc}><Icon className="w-4 h-4" /></div>
                  <span className="text-xs text-gray-500">{kpi.trend}</span>
                </div>
                <div className="text-2xl font-bold text-white mb-0.5">{kpi.value}</div>
                <div className="text-xs text-gray-400">{kpi.label}</div>
                <div className="text-xs text-gray-600 mt-0.5">{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions Table */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-white">Recent Sessions</h2>
              <span className="text-xs text-gray-500">{MOCK_SESSIONS.length} sessions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-800 bg-gray-900/80">
                  {['Customer', 'City', 'Fraud Score', 'Risk', 'Status', 'Time'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {MOCK_SESSIONS.map(s => (
                    <tr key={s.id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-sm">{s.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{s.pan}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{s.city}</td>
                      <td className="px-4 py-3">
                        <span className={'text-sm font-bold ' + scoreColor(s.fraudScore)}>{s.fraudScore}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={'text-xs px-2 py-0.5 rounded-full border ' + scoreBg(s.fraudScore) + ' ' + scoreColor(s.fraudScore)}>{s.riskBand}</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.status === 'approved'
                          ? <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3 h-3" />Approved</span>
                          : <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3 h-3" />Rejected</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round((Date.now() - s.ts) / 60000)}m ago</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Fraud signal breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-red-400" />Fraud Signals</h3>
              <div className="space-y-3">
                {signalBreakdown.map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{s.label}</span><span>{s.count} sessions</span></div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className={s.color + ' h-full rounded-full transition-all duration-700'} style={{ width: s.pct + '%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert feed */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" />Alert Feed</h3>
              <div className="space-y-3">
                {ALERTS.map(a => (
                  <div key={a.id} className={'flex items-start gap-3 p-3 rounded-lg border ' + (a.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : a.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-gray-800/50 border-gray-700/50')}>
                    {a.severity === 'critical' ? <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /> : a.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> : <Zap className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-xs text-gray-300 leading-relaxed">{a.message}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{Math.round((Date.now() - a.ts) / 60000)}m ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Geographic distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-400" />Geographic Distribution - India</h3>
          <div className="relative bg-gray-800/50 rounded-xl overflow-hidden" style={{ height: '200px' }}>
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">India Map Placeholder</div>
            {CITIES.map(city => (
              <div key={city.name} className="absolute flex flex-col items-center" style={{ left: city.x + '%', top: city.y + '%', transform: 'translate(-50%, -50%)' }}>
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-300 animate-pulse" style={{ boxShadow: '0 0 8px rgba(59,130,246,0.6)' }} />
                <div className="text-xs text-blue-300 mt-1 whitespace-nowrap bg-gray-900/80 px-1 rounded">{city.name} ({city.count})</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
