import { useMemo } from 'react';
import { CheckCircle, TrendingDown } from 'lucide-react';

interface LoanOffer {
  amount: number;
  rate_pa: number;
  tenure_months?: number;
  emi: number;
}

interface CompetitorRow {
  lender: string;
  logo_initial: string;
  effective_rate: number;
  emi: number;
  total_cost: number;
  processing_fee: number;
  approval_time: string;
  savings_vs_this: number;
  is_loanwizard: boolean;
  highlight?: string;
}

interface Props {
  offer: LoanOffer;
}

function calcEMI(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function LoanComparisonTable({ offer }: Props) {
  const tenure = offer.tenure_months ?? 36;

  const rows: CompetitorRow[] = useMemo(() => {
    const lwEmi = calcEMI(offer.amount, offer.rate_pa, tenure);
    const lwTotal = lwEmi * tenure;
    const lwFee = Math.round(offer.amount * 0.01);

    const competitors = [
      { lender: 'Bajaj Finance', logo_initial: 'BF', rate: offer.rate_pa + 2.5, fee_pct: 3.93, time: '24-48 hrs' },
      { lender: 'Tata Capital', logo_initial: 'TC', rate: offer.rate_pa + 1.5, fee_pct: 2.75, time: '2-3 hrs' },
      { lender: 'HDFC Bank', logo_initial: 'HB', rate: offer.rate_pa + 1.0, fee_pct: 2.5, time: '4-6 hrs' },
    ];

    const loanwizard: CompetitorRow = {
      lender: 'Poonawalla Fincorp',
      logo_initial: 'PF',
      effective_rate: offer.rate_pa,
      emi: lwEmi,
      total_cost: lwTotal,
      processing_fee: lwFee,
      approval_time: '< 3 min',
      savings_vs_this: 0,
      is_loanwizard: true,
      highlight: 'Best Rate · Instant',
    };

    const compRows: CompetitorRow[] = competitors.map(c => {
      const emi = calcEMI(offer.amount, c.rate, tenure);
      const total = emi * tenure;
      const fee = Math.round(offer.amount * (c.fee_pct / 100));
      return {
        lender: c.lender,
        logo_initial: c.logo_initial,
        effective_rate: Math.round(c.rate * 10) / 10,
        emi,
        total_cost: total,
        processing_fee: fee,
        approval_time: c.time,
        savings_vs_this: (total + fee) - (lwTotal + lwFee),
        is_loanwizard: false,
      };
    });

    return [loanwizard, ...compRows];
  }, [offer, tenure]);

  const avgSavings = Math.round(
    rows.filter(r => !r.is_loanwizard).reduce((s, r) => s + r.savings_vs_this, 0) /
    rows.filter(r => !r.is_loanwizard).length
  );

  return (
    <div className="space-y-4">
      {/* Savings banner */}
      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
        <TrendingDown className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <p className="text-sm text-emerald-300">
          You save <strong>{formatINR(avgSavings)}</strong> vs market average over {tenure} months with Poonawalla Fincorp
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/80">
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Lender</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Rate</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">EMI/mo</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide hidden md:table-cell">Total Cost</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide hidden md:table-cell">Proc. Fee</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Approval</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.lender}
                className={`border-b border-gray-800/50 last:border-0 transition-colors ${
                  row.is_loanwizard
                    ? 'bg-blue-500/10 hover:bg-blue-500/15'
                    : 'bg-gray-900 hover:bg-gray-800/50'
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Lender */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      row.is_loanwizard
                        ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {row.logo_initial}
                    </div>
                    <div>
                      <p className={`font-semibold ${row.is_loanwizard ? 'text-white' : 'text-gray-300'}`}>
                        {row.lender}
                      </p>
                      {row.highlight && (
                        <span className="text-xs text-blue-400 font-medium">{row.highlight}</span>
                      )}
                      {!row.is_loanwizard && row.savings_vs_this > 0 && (
                        <span className="text-xs text-red-400">
                          +{formatINR(row.savings_vs_this)} more
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Rate */}
                <td className="px-4 py-3.5 text-right">
                  <span className={`font-bold ${row.is_loanwizard ? 'text-emerald-400' : 'text-gray-300'}`}>
                    {row.effective_rate}%
                  </span>
                </td>

                {/* EMI */}
                <td className="px-4 py-3.5 text-right">
                  <span className={`font-semibold ${row.is_loanwizard ? 'text-white' : 'text-gray-400'}`}>
                    {formatINR(row.emi)}
                  </span>
                </td>

                {/* Total Cost */}
                <td className="px-4 py-3.5 text-right hidden md:table-cell">
                  <span className={row.is_loanwizard ? 'text-white' : 'text-gray-400'}>
                    {formatINR(row.total_cost)}
                  </span>
                </td>

                {/* Processing Fee */}
                <td className="px-4 py-3.5 text-right hidden md:table-cell">
                  <span className={row.is_loanwizard ? 'text-emerald-400' : 'text-gray-400'}>
                    {formatINR(row.processing_fee)}
                  </span>
                </td>

                {/* Approval Time */}
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {row.is_loanwizard && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                    <span className={`text-xs font-medium ${row.is_loanwizard ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {row.approval_time}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600 text-center">
        * Competitor rates are indicative. Actual rates depend on individual credit profile.
      </p>
    </div>
  );
}
