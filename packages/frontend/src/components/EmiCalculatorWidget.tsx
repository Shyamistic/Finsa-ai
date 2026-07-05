import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, TrendingUp, Zap } from 'lucide-react';

function calcEMI(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

interface AmortizationRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

function buildSchedule(principal: number, annualRate: number, months: number): AmortizationRow[] {
  const emi = calcEMI(principal, annualRate, months);
  const r = annualRate / 12 / 100;
  const rows: AmortizationRow[] = [];
  let balance = principal;
  for (let m = 1; m <= months; m++) {
    const interest = Math.round(balance * r);
    const principalPart = emi - interest;
    balance = Math.max(0, balance - principalPart);
    rows.push({ month: m, emi, principal: principalPart, interest, balance: Math.round(balance) });
  }
  return rows;
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function EmiCalculatorWidget() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(500000);
  const [tenure, setTenure] = useState(36);
  const [rate] = useState(12.5);

  const emi = useMemo(() => calcEMI(amount, rate, tenure), [amount, tenure, rate]);
  const totalPayment = emi * tenure;
  const totalInterest = totalPayment - amount;
  const schedule = useMemo(() => buildSchedule(amount, rate, tenure), [amount, tenure, rate]);

  // Build bar chart data — group by year
  const yearlyData = useMemo(() => {
    const years: { year: number; principal: number; interest: number }[] = [];
    for (let y = 0; y < Math.ceil(tenure / 12); y++) {
      const slice = schedule.slice(y * 12, (y + 1) * 12);
      years.push({
        year: y + 1,
        principal: slice.reduce((s, r) => s + r.principal, 0),
        interest: slice.reduce((s, r) => s + r.interest, 0),
      });
    }
    return years;
  }, [schedule, tenure]);

  const maxBar = Math.max(...yearlyData.map(y => y.principal + y.interest));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <Calculator className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">EMI Calculator</h2>
          <p className="text-xs text-gray-400">Finsa AI Personal Loan</p>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-5">
        {/* Loan Amount */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-400 font-medium">Loan Amount</label>
            <span className="text-sm font-bold text-white bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1">
              {formatINR(amount)}
            </span>
          </div>
          <input
            type="range"
            min={50000}
            max={5000000}
            step={50000}
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>₹50K</span>
            <span>₹50L</span>
          </div>
        </div>

        {/* Tenure */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-400 font-medium">Tenure</label>
            <span className="text-sm font-bold text-white bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-1">
              {tenure} months
            </span>
          </div>
          <input
            type="range"
            min={12}
            max={84}
            step={6}
            value={tenure}
            onChange={e => setTenure(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-violet-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>12m</span>
            <span>84m</span>
          </div>
        </div>

        {/* Rate display */}
        <div className="flex items-center justify-between bg-gray-800/50 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-400">Interest Rate</span>
          <span className="text-sm font-bold text-emerald-400">{rate}% p.a.</span>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-300/70 mb-1">Monthly EMI</p>
          <p className="text-xl font-bold text-white">{formatINR(emi)}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Total Interest</p>
          <p className="text-lg font-bold text-amber-400">{formatINR(totalInterest)}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Total Payment</p>
          <p className="text-lg font-bold text-white">{formatINR(totalPayment)}</p>
        </div>
      </div>

      {/* Effective rate badge */}
      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
        <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <p className="text-xs text-emerald-300">
          Effective annual rate: <strong>{rate}%</strong> · Interest as % of principal:{' '}
          <strong>{((totalInterest / amount) * 100).toFixed(1)}%</strong>
        </p>
      </div>

      {/* Amortization bar chart */}
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">
          Year-wise Breakdown
        </p>
        <div className="space-y-2">
          {yearlyData.map(y => {
            const totalH = ((y.principal + y.interest) / maxBar) * 100;
            const principalPct = (y.principal / (y.principal + y.interest)) * 100;
            return (
              <div key={y.year} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-10 flex-shrink-0">Yr {y.year}</span>
                <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full flex rounded-full overflow-hidden transition-all duration-500"
                    style={{ width: `${totalH}%` }}
                  >
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${principalPct}%` }}
                    />
                    <div
                      className="bg-amber-500/70 h-full flex-1"
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">
                  {formatINR(y.principal + y.interest)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span className="text-xs text-gray-500">Principal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-500/70" />
            <span className="text-xs text-gray-500">Interest</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/apply')}
        className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Apply Now — Get Offer in 3 Minutes
      </button>
    </div>
  );
}
