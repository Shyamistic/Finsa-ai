import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';

interface Props {
  principal: number;
  rate: number;
  months: number;
}

interface Row {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

function buildSchedule(principal: number, annualRate: number, months: number): Row[] {
  const r = annualRate / 12 / 100;
  const emi =
    r === 0
      ? Math.round(principal / months)
      : Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));

  const rows: Row[] = [];
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

function exportCSV(rows: Row[], principal: number, rate: number, months: number) {
  const header = 'Month,EMI,Principal,Interest,Balance\n';
  const body = rows
    .map(r => `${r.month},${r.emi},${r.principal},${r.interest},${r.balance}`)
    .join('\n');
  const blob = new Blob([header + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `amortization_${principal}_${rate}pct_${months}m.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AmortizationSchedule({ principal, rate, months }: Props) {
  const [showFull, setShowFull] = useState(false);

  const schedule = useMemo(() => buildSchedule(principal, rate, months), [principal, rate, months]);

  // Show first 6 + last 1 by default
  const displayRows = showFull
    ? schedule
    : [
        ...schedule.slice(0, 6),
        ...(schedule.length > 7 ? [schedule[schedule.length - 1]] : []),
      ];

  const hasMore = schedule.length > 7;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Amortization Schedule</p>
        <button
          onClick={() => exportCSV(schedule, principal, rate, months)}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/80">
              {['Month', 'EMI', 'Principal', 'Interest', 'Balance'].map(h => (
                <th key={h} className="px-3 py-2.5 text-right first:text-left text-gray-500 font-medium uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => {
              const isLast = !showFull && hasMore && i === displayRows.length - 1;
              return (
                <>
                  {isLast && (
                    <tr key="ellipsis" className="border-b border-gray-800/50">
                      <td colSpan={5} className="px-3 py-2 text-center text-gray-600 text-xs">
                        · · · {months - 7} more months · · ·
                      </td>
                    </tr>
                  )}
                  <tr
                    key={row.month}
                    className={`border-b border-gray-800/50 last:border-0 ${
                      row.month === 1 ? 'bg-blue-500/5' : 'bg-gray-900 hover:bg-gray-800/50'
                    } transition-colors`}
                  >
                    <td className="px-3 py-2.5 text-gray-400 font-medium">{row.month}</td>
                    <td className="px-3 py-2.5 text-right text-white font-medium">{formatINR(row.emi)}</td>
                    <td className="px-3 py-2.5 text-right text-blue-400">{formatINR(row.principal)}</td>
                    <td className="px-3 py-2.5 text-right text-amber-400">{formatINR(row.interest)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-300">{formatINR(row.balance)}</td>
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          onClick={() => setShowFull(v => !v)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-800 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
        >
          {showFull ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show Less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> View Full Schedule ({months} months)</>
          )}
        </button>
      )}
    </div>
  );
}
