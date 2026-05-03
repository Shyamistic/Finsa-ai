import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface Props {
  score: number;
  band: string;
}

const SCORE_MIN = 300;
const SCORE_MAX = 900;

function scoreToAngle(score: number): number {
  const pct = (score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
  return pct * 180; // 0° to 180°
}

function scoreColor(score: number): string {
  if (score >= 750) return '#10b981'; // emerald
  if (score >= 700) return '#22c55e'; // green
  if (score >= 650) return '#eab308'; // yellow
  if (score >= 600) return '#f97316'; // orange
  return '#ef4444'; // red
}

function bandColor(band: string): string {
  switch (band) {
    case 'Excellent': return 'text-emerald-400';
    case 'Good': return 'text-green-400';
    case 'Fair': return 'text-yellow-400';
    case 'Poor': return 'text-orange-400';
    default: return 'text-red-400';
  }
}

const IMPROVEMENT_TIPS = [
  'Pay all EMIs on time — biggest score factor',
  'Keep credit card utilisation below 30%',
  'Avoid multiple loan applications in short period',
];

export default function CreditScoreGauge({ score, band }: Props) {
  const [animatedScore, setAnimatedScore] = useState(SCORE_MIN);

  useEffect(() => {
    const target = score === 0 ? SCORE_MIN : score;
    let current = SCORE_MIN;
    const step = (target - SCORE_MIN) / 40;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, 25);
    return () => clearInterval(timer);
  }, [score]);

  const angle = scoreToAngle(animatedScore === SCORE_MIN && score === 0 ? SCORE_MIN : animatedScore);
  const color = scoreColor(score);

  // SVG arc parameters
  const cx = 100;
  const cy = 100;
  const r = 75;
  const strokeWidth = 14;

  // Arc from 180° to 0° (left to right, bottom half of circle)
  function polarToCartesian(angleDeg: number) {
    const rad = ((angleDeg - 180) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function arcPath(startAngle: number, endAngle: number) {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const needleEnd = polarToCartesian(angle);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        <h3 className="text-base font-bold text-white">Credit Score</h3>
      </div>

      {/* SVG Gauge */}
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 120" className="w-48 h-28">
          {/* Background arc */}
          <path
            d={arcPath(0, 180)}
            fill="none"
            stroke="#1f2937"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored fill arc */}
          {animatedScore > SCORE_MIN && (
            <path
              d={arcPath(0, angle)}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
            />
          )}

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={5} fill={color} />

          {/* Score labels */}
          <text x="18" y="112" fill="#6b7280" fontSize="9" textAnchor="middle">300</text>
          <text x="100" y="30" fill="#6b7280" fontSize="9" textAnchor="middle">600</text>
          <text x="182" y="112" fill="#6b7280" fontSize="9" textAnchor="middle">900</text>
        </svg>

        {/* Score display */}
        <div className="text-center -mt-2">
          {score === 0 ? (
            <p className="text-2xl font-bold text-yellow-400">NTC</p>
          ) : (
            <p className="text-3xl font-bold text-white">{animatedScore}</p>
          )}
          <p className={`text-sm font-semibold mt-0.5 ${bandColor(band)}`}>{band}</p>
          <p className="text-xs text-gray-500 mt-0.5">out of 900</p>
        </div>
      </div>

      {/* Score band legend */}
      <div className="grid grid-cols-5 gap-1">
        {[
          { label: 'Very Poor', range: '<600', color: 'bg-red-500' },
          { label: 'Poor', range: '600+', color: 'bg-orange-500' },
          { label: 'Fair', range: '650+', color: 'bg-yellow-500' },
          { label: 'Good', range: '700+', color: 'bg-green-500' },
          { label: 'Excellent', range: '750+', color: 'bg-emerald-500' },
        ].map(b => (
          <div key={b.label} className="text-center">
            <div className={`h-1.5 rounded-full ${b.color} mb-1`} />
            <p className="text-xs text-gray-600 leading-tight">{b.range}</p>
          </div>
        ))}
      </div>

      {/* Improvement tips */}
      <div className="space-y-2 pt-2 border-t border-gray-800">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tips to Improve</p>
        {IMPROVEMENT_TIPS.map((tip, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-blue-400 font-bold">{i + 1}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
