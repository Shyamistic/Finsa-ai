import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Language } from '../lib/i18n';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import {
  CheckCircle, ExternalLink, Download, TrendingUp, Shield,
  RefreshCw, Gift, CreditCard, Phone, ChevronDown, ChevronUp,
  Star, Clock, Zap, Lock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface TenureOption {
  months: number;
  emi: number;
  total_interest: number;
}

interface LoanOffer {
  amount: number;
  rate_pa: number;
  tenure_options: TenureOption[];
  recommended_tenure_months: number;
  emi: number;
  explanation_en: string;
  explanation_hi: string;
  top_factors: string[];
}

interface SessionData {
  id: string;
  offer: LoanOffer | null;
  persona: string | null;
  risk_band: string | null;
  fraud_score: number | null;
  solana_tx_signature: string | null;
  language: string;
}

export default function OfferPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const language: Language = (location.state as { language?: Language })?.language || 'en';
  const apiKey: string = (location.state as { apiKey?: string })?.apiKey || 'demo-key-loanwizard-2026';

  const [session, setSession] = useState<SessionData | null>(null);
  const [selectedTenure, setSelectedTenure] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNach, setShowNach] = useState(false);
  const [showReferEarn, setShowReferEarn] = useState(false);
  const [showEmiCard, setShowEmiCard] = useState(false);
  const [nachBank, setNachBank] = useState('');
  const [nachAccount, setNachAccount] = useState('');
  const [nachSetup, setNachSetup] = useState(false);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const poll = setInterval(async () => {
      try {
        const { data } = await axios.get<SessionData>(`${API_URL}/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (data.offer) {
          setSession(data);
          setSelectedTenure(data.offer.recommended_tenure_months);
          setCustomAmount(data.offer.amount);
          setLoading(false);
          clearInterval(poll);
        }
      } catch {
        clearInterval(poll);
        setLoading(false);
      }
    }, 1000);
    return () => clearInterval(poll);
  }, [sessionId, apiKey]);

  const offer = session?.offer;
  const selectedOption = offer?.tenure_options.find(t => t.months === selectedTenure);

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  // EMI calculator
  const calcEMI = (principal: number, annualRate: number, months: number) => {
    const r = annualRate / 12 / 100;
    if (r === 0) return Math.round(principal / months);
    return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
  };

  const calcEmi = customAmount && offer && selectedTenure
    ? calcEMI(customAmount, offer.rate_pa, selectedTenure)
    : selectedOption?.emi ?? offer?.emi ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Generating your personalised offer...</p>
          <p className="text-white/30 text-xs mt-2">Analysing your profile with 7 AI agents</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <div className="text-center text-white/50">
          <p>No offer available for this session.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-400 text-sm hover:underline">
            Start a new session
          </button>
        </div>
      </div>
    );
  }

  const explanation = language === 'hi' ? offer.explanation_hi : offer.explanation_en;

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      {/* Header */}
      <div className="bg-black/40 border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">PF</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Poonawalla Fincorp</p>
            <p className="text-xs text-white/40">Loans Made Simple</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Offer Ready</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-12">
        {/* Success header */}
        {!declined && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/25">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">
              {language === 'hi' ? 'Badhai ho! Aapka offer ready hai' : 'Congratulations! Your offer is ready'}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {language === 'hi' ? 'Poonawalla Fincorp ki taraf se' : 'From Poonawalla Fincorp'}
            </p>
          </div>
        )}

        {/* Main offer card */}
        {!declined && (
          <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/30 rounded-2xl p-5">
            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center bg-white/5 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-1">
                  {language === 'hi' ? 'Loan Amount' : 'Loan Amount'}
                </p>
                <p className="text-lg font-bold text-white">{formatINR(offer.amount)}</p>
              </div>
              <div className="text-center bg-white/5 rounded-xl p-3 border border-blue-500/30">
                <p className="text-xs text-white/40 mb-1">Interest Rate</p>
                <p className="text-lg font-bold text-blue-400">{offer.rate_pa}%</p>
                <p className="text-xs text-white/30">p.a.</p>
              </div>
              <div className="text-center bg-white/5 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-1">Monthly EMI</p>
                <p className="text-lg font-bold text-white">{formatINR(calcEmi)}</p>
              </div>
            </div>

            {/* Tenure selector */}
            <div className="mb-4">
              <p className="text-xs text-white/50 mb-2 font-medium uppercase tracking-wide">Select Tenure</p>
              <div className="grid grid-cols-3 gap-2">
                {offer.tenure_options.map(option => (
                  <button
                    key={option.months}
                    onClick={() => setSelectedTenure(option.months)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedTenure === option.months
                        ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className="text-sm font-bold text-white">{option.months}m</p>
                    <p className="text-xs text-white/50">{formatINR(option.emi)}/mo</p>
                    {selectedTenure === option.months && (
                      <div className="flex items-center justify-center gap-0.5 mt-1">
                        <Star className="w-2.5 h-2.5 text-blue-400 fill-blue-400" />
                        <span className="text-xs text-blue-400">Best</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* EMI Calculator toggle */}
            <button
              onClick={() => setShowCalculator(v => !v)}
              className="w-full flex items-center justify-between text-xs text-white/40 hover:text-white/60 transition-colors py-1"
            >
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" />
                Adjust loan amount
              </span>
              {showCalculator ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showCalculator && (
              <div className="mt-3 bg-white/5 rounded-xl p-3 space-y-3">
                <div>
                  <label className="text-xs text-white/50 block mb-1">Loan Amount</label>
                  <input
                    type="range"
                    min={50000}
                    max={offer.amount * 1.5}
                    step={10000}
                    value={customAmount ?? offer.amount}
                    onChange={e => setCustomAmount(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>₹50K</span>
                    <span className="text-white font-medium">{formatINR(customAmount ?? offer.amount)}</span>
                    <span>{formatINR(offer.amount * 1.5)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-blue-500/10 rounded-lg px-3 py-2">
                  <span className="text-xs text-white/60">Estimated EMI</span>
                  <span className="text-sm font-bold text-blue-400">{formatINR(calcEmi)}/month</span>
                </div>
              </div>
            )}

            {/* Why this offer */}
            <div className="mt-4 bg-white/5 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white/70 mb-1">
                    {language === 'hi' ? 'Yeh offer kyun mila?' : 'Why this offer?'}
                  </p>
                  <p className="text-xs text-white/50 leading-relaxed">{explanation}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!accepted && !declined && (
          <div className="flex gap-3">
            <button
              onClick={() => { setAccepted(true); setShowNach(true); setShowReferEarn(true); setShowEmiCard(true); }}
              className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {language === 'hi' ? 'Offer Accept Karein' : 'Accept Offer'}
            </button>
            <button
              onClick={() => setDeclined(true)}
              className="px-5 py-3.5 border border-white/10 text-white/50 rounded-xl text-sm hover:bg-white/5 transition-colors"
            >
              {language === 'hi' ? 'Nahi' : 'Decline'}
            </button>
          </div>
        )}

        {/* Accepted state */}
        {accepted && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-400">
                  {language === 'hi' ? 'Offer Accept Ho Gaya!' : 'Offer Accepted!'}
                </p>
                <p className="text-xs text-white/40">
                  {language === 'hi'
                    ? 'Hamari team 24 ghante mein aapse contact karegi'
                    : 'Our team will contact you within 24 hours'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Phone className="w-3 h-3" />
              <span>Support: 1800-266-3201 (Toll Free)</span>
            </div>
          </div>
        )}

        {/* Declined state */}
        {declined && (
          <div className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-center">
              <p className="text-sm font-semibold text-amber-400 mb-1">
                {language === 'hi' ? 'Offer Decline Kar Diya' : 'Offer Declined'}
              </p>
              <p className="text-xs text-white/40">
                {language === 'hi'
                  ? 'Koi baat nahi! Aap kabhi bhi dobara apply kar sakte hain.'
                  : 'No worries! You can apply again anytime.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 border border-white/10 text-white/50 rounded-xl text-sm hover:bg-white/5 transition-colors"
            >
              {language === 'hi' ? 'Home Par Wapas Jaayein' : 'Back to Home'}
            </button>
          </div>
        )}

        {/* NACH Mandate Setup */}
        {accepted && showNach && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <button
              onClick={() => setShowNach(v => !v)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Set Up Auto-Pay (NACH)</p>
                  <p className="text-xs text-white/40">Never miss an EMI</p>
                </div>
              </div>
              {nachSetup
                ? <CheckCircle className="w-5 h-5 text-green-400" />
                : <ChevronDown className="w-4 h-4 text-white/30" />
              }
            </button>

            {!nachSetup && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Bank name (e.g. HDFC Bank)"
                  value={nachBank}
                  onChange={e => setNachBank(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
                <input
                  type="text"
                  placeholder="Account number"
                  value={nachAccount}
                  onChange={e => setNachAccount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={() => { if (nachBank && nachAccount) setNachSetup(true); }}
                  disabled={!nachBank || !nachAccount}
                  className="w-full py-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-30"
                >
                  Register NACH Mandate
                </button>
              </div>
            )}
          </div>
        )}

        {/* EMI Card Upsell */}
        {accepted && showEmiCard && (
          <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Get PFIN EMI Card</p>
                <p className="text-xs text-white/50 mt-0.5">Up to ₹5 Lakh limit. Convert any purchase to EMI instantly.</p>
                <button className="mt-2 text-xs text-violet-400 hover:text-violet-300 font-medium">
                  Apply Now →
                </button>
              </div>
              <button onClick={() => setShowEmiCard(false)} className="text-white/20 hover:text-white/40 text-xs">✕</button>
            </div>
          </div>
        )}

        {/* Refer & Earn */}
        {accepted && showReferEarn && (
          <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Refer & Earn</p>
                <p className="text-xs text-white/50 mt-0.5">Refer friends and earn unlimited rewards. No cap on referrals!</p>
                <button className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-medium">
                  Share Referral Link →
                </button>
              </div>
              <button onClick={() => setShowReferEarn(false)} className="text-white/20 hover:text-white/40 text-xs">✕</button>
            </div>
          </div>
        )}

        {/* Explainability */}
        {session && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <ExplainabilityPanel
              persona={session.persona ?? undefined}
              riskBand={session.risk_band ?? undefined}
              topFactors={offer.top_factors}
              language={language}
            />
          </div>
        )}

        {/* On-chain verification */}
        {session?.solana_tx_signature && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-green-400" />
              <p className="text-sm font-semibold text-white">On-Chain Audit Proof</p>
            </div>
            <p className="text-xs text-white/40 mb-1">Audit trail anchored on Solana Devnet — tamper-proof</p>
            <p className="text-xs text-white/30 font-mono mb-2 break-all">{session.solana_tx_signature}</p>
            <a
              href={`https://explorer.solana.com/tx/${session.solana_tx_signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View on Solana Explorer
            </a>
          </div>
        )}

        {/* Compliance badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { icon: Lock, label: 'RBI V-CIP Compliant' },
            { icon: Shield, label: 'DPDP Act 2023' },
            { icon: Clock, label: 'Data: 7 Years' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              <Icon className="w-3 h-3 text-white/30" />
              <span className="text-xs text-white/30">{label}</span>
            </div>
          ))}
        </div>

        {/* Download V-CIP PDF */}
        <a
          href={`${API_URL}/sessions/${sessionId}/vcip-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download V-CIP Compliance Record (PDF)
        </a>
      </div>
    </div>
  );
}
