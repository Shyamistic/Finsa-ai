import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, RotateCcw, ChevronDown, ExternalLink,
  Shield, CheckCircle, XCircle, Eye, Mic,
  MapPin, TrendingUp, AlertTriangle, Clock,
  User, CreditCard, Lock, Globe, Zap, Star, FileText, BarChart2
} from 'lucide-react';
import CreditScoreGauge from '../components/CreditScoreGauge';
import FraudScoreVisualizer from '../components/FraudScoreVisualizer';
import LoanComparisonTable from '../components/LoanComparisonTable';
import EmiCalculatorWidget from '../components/EmiCalculatorWidget';
import VcipCompliancePanel from '../components/VcipCompliancePanel';

// YouTube demo video ID — replace with your actual video ID after uploading
const YOUTUBE_VIDEO_ID = 'dQw4w9WgXcQ'; // placeholder — update after YouTube upload

const DEMO_PROFILES = [
  {
    id: 1, pan: 'ABCDE1234F', name: 'Priya Sharma', persona: 'Salaried-Urban',
    riskBand: 'Low', creditScore: 780, creditBand: 'Excellent', income: 85000, employment: 'Salaried',
    city: 'Mumbai', fraudScore: 8, outcome: 'approved',
    offerAmount: 1500000, offerRate: 9.99, offerEmi: 32500, tenure: 36,
    color: 'green', description: 'Low-risk salaried professional — best offer',
    responses: [
      "Hi, I'm looking for a personal loan for home renovation.",
      "My monthly salary is around 85,000 rupees. I work at TCS as a software engineer.",
      "I have one existing EMI of about 8,000 per month. I'd prefer a 3-year tenure.",
      "My PAN is ABCDE1234F.",
    ],
  },
  {
    id: 2, pan: 'FGHIJ5678K', name: 'Ramesh Patel', persona: 'Self-Employed-Tier2',
    riskBand: 'Medium', creditScore: 640, creditBand: 'Fair', income: 55000, employment: 'Self-Employed',
    city: 'Ahmedabad', fraudScore: 22, outcome: 'approved',
    offerAmount: 800000, offerRate: 14.5, offerEmi: 18900, tenure: 36,
    color: 'yellow', description: 'Medium-risk self-employed — moderate offer',
    responses: [
      "Mujhe business ke liye loan chahiye, apni shop expand karni hai.",
      "Main self-employed hoon, monthly around 55,000 kamaata hoon.",
      "Koi existing EMI nahi hai. 2 saal ka tenure theek rahega.",
      "Mera PAN FGHIJ5678K hai.",
    ],
  },
  {
    id: 3, pan: 'KLMNO9012P', name: 'Suresh Kumar', persona: 'MSME-Owner',
    riskBand: 'High', creditScore: 580, creditBand: 'Poor', income: 120000, employment: 'MSME-Owner',
    city: 'Coimbatore', fraudScore: 35, outcome: 'approved',
    offerAmount: 2000000, offerRate: 17.0, offerEmi: 49800, tenure: 36,
    color: 'orange', description: 'High-risk MSME owner — constrained offer',
    responses: [
      "I need a business loan for machinery purchase for my manufacturing unit.",
      "I run an MSME, monthly turnover around 1.2 lakhs net income.",
      "I have existing EMIs of 35,000. Need at least 3-4 year tenure.",
      "PAN is KLMNO9012P.",
    ],
  },
  {
    id: 4, pan: 'PQRST3456U', name: 'Test Fraud', persona: 'Unknown',
    riskBand: 'High', creditScore: 300, creditBand: 'Very Poor', income: 0, employment: 'Unknown',
    city: 'Unknown', fraudScore: 95, outcome: 'rejected',
    offerAmount: 0, offerRate: 0, offerEmi: 0, tenure: 12,
    color: 'red', description: 'Fraud-flagged profile — session rejected',
    responses: [
      "I want a loan for investment purposes.",
      "My income is variable, around 2 lakhs per month.",
      "No existing EMIs. I want maximum amount for 1 year.",
      "PAN is PQRST3456U.",
    ],
  },
  {
    id: 5, pan: 'UVWXY7890Z', name: 'Anjali Singh', persona: 'NTC',
    riskBand: 'Medium', creditScore: 0, creditBand: 'NTC', income: 30000, employment: 'Salaried',
    city: 'Jaipur', fraudScore: 12, outcome: 'approved',
    offerAmount: 300000, offerRate: 18.0, offerEmi: 10800, tenure: 36,
    color: 'blue', description: 'No credit history (NTC) — instant loan product',
    responses: [
      "I need a small loan for my education fees.",
      "I just started working, salary is 30,000 per month.",
      "No existing loans. I can repay in 2-3 years.",
      "My PAN is UVWXY7890Z.",
    ],
  },
];

const AGENTS = [
  { id: 'visual_intel', name: 'Visual Intel', icon: Eye, color: 'blue', desc: 'Liveness + Age Estimation' },
  { id: 'speech_intel', name: 'Speech Intel', icon: Mic, color: 'violet', desc: 'STT + Entity Extraction' },
  { id: 'fraud_detection', name: 'Fraud Detection', icon: Shield, color: 'red', desc: 'Composite Fraud Score' },
  { id: 'bureau_risk', name: 'Bureau Risk', icon: TrendingUp, color: 'amber', desc: 'Credit Bureau Lookup' },
  { id: 'persona', name: 'Persona Classifier', icon: User, color: 'green', desc: 'Customer Segmentation' },
  { id: 'offer', name: 'Offer Engine', icon: CreditCard, color: 'emerald', desc: 'Policy-Based Offer Gen' },
  { id: 'compliance', name: 'Compliance', icon: Lock, color: 'indigo', desc: 'Audit + Solana Anchor' },
];

type AgentState = 'idle' | 'running' | 'completed' | 'error';
interface AgentStatus { state: AgentState; output: string; durationMs: number; startedAt: number; }

function buildTimeline(profile: typeof DEMO_PROFILES[0]) {
  const isRejected = profile.outcome === 'rejected';
  return [
    { t: 0,     agent: 'visual_intel',    output: 'Liveness: ' + (isRejected ? 'FAIL 42%' : 'PASS 97%') + ' | Age est: ' + (profile.creditScore ? '32' : '24') },
    { t: 3000,  agent: 'speech_intel',    output: 'Turn 1: "' + profile.responses[0].slice(0, 38) + '..."' },
    { t: 8000,  agent: 'speech_intel',    output: 'Turn 2: Income Rs' + profile.income.toLocaleString('en-IN') + '/mo | ' + profile.employment },
    { t: 14000, agent: 'bureau_risk',     output: 'PAN: ' + profile.pan + ' | Score: ' + (profile.creditScore || 'NTC') + ' | Band: ' + profile.riskBand },
    { t: 16000, agent: 'fraud_detection', output: isRejected ? 'ALERT Score: ' + String(profile.fraudScore) + ' REJECTED' : 'Score: ' + String(profile.fraudScore) + ' APPROVED' },
    { t: 18000, agent: 'persona',         output: 'Persona: ' + profile.persona + ' | Confidence: 91%' },
    { t: 22000, agent: 'offer',           output: isRejected ? 'No offer session rejected' : 'Rs' + (profile.offerAmount / 100000).toFixed(1) + 'L @ ' + String(profile.offerRate) + '% | EMI Rs' + profile.offerEmi.toLocaleString('en-IN') },
    { t: 26000, agent: 'compliance',      output: 'Audit sealed | Solana Devnet anchored' },
  ];
}

export default function DemoPage() {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState(DEMO_PROFILES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'agent' | 'user'; text: string; ts: number }>>([]);
  const [extractedEntities, setExtractedEntities] = useState<Record<string, string>>({});
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'flow' | 'agents' | 'analytics' | 'audit'>('flow');
  const [offerReady, setOfferReady] = useState(false);
  const [sessionRejected, setSessionRejected] = useState(false);
  const [geoData, setGeoData] = useState({ country: 'IN', city: 'Mumbai', lat: 19.076, lng: 72.877 });
  const [livenessResult, setLivenessResult] = useState<{ passed: boolean; confidence: number; ageEstimate: number } | null>(null);
  const [auditChain, setAuditChain] = useState<Array<{ seq: number; event: string; hash: string; ts: number }>>([]);
  const [solanaSignature, setSolanaSignature] = useState<string | null>(null);
  const [campaignLink, setCampaignLink] = useState('');
  const [showEmiCalc, setShowEmiCalc] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timelineRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const TOTAL_DURATION = 30000;

  useEffect(() => {
    setCampaignLink(window.location.origin + '/apply?ref=demo&utm_source=sms&utm_campaign=loan2026');
  }, []);

  const resetDemo = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timelineRef.current.forEach(t => clearTimeout(t));
    timelineRef.current = [];
    setIsPlaying(false);
    setElapsed(0);
    setAgentStatuses({});
    setChatHistory([]);
    setExtractedEntities({});
    setOfferReady(false);
    setSessionRejected(false);
    setLivenessResult(null);
    setAuditChain([]);
    setSolanaSignature(null);
    setShowEmiCalc(false);
    setShowComparison(false);
  }, []);

  const addAuditEntry = useCallback((event: string, _detail: string) => {
    setAuditChain(prev => {
      const prevHash = prev.length > 0 ? (prev[prev.length - 1].hash.split('->')[1] ?? '0000000000000000') : '0000000000000000';
      const hash = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
      return [...prev, { seq: prev.length, event, hash: prevHash.slice(0, 8) + '->' + hash, ts: Date.now() }];
    });
  }, []);

  const startDemo = useCallback(() => {
    resetDemo();
    const profile = selectedProfile;
    const timeline = buildTimeline(profile);
    const isRejected = profile.outcome === 'rejected';

    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev >= TOTAL_DURATION) { clearInterval(timerRef.current!); setIsPlaying(false); return TOTAL_DURATION; }
        return prev + 100;
      });
    }, 100);

    addAuditEntry('consent_captured', 'DPDP consent recorded');

    timelineRef.current.push(setTimeout(() => {
      const age = profile.creditScore ? 32 : 24;
      setLivenessResult({ passed: !isRejected, confidence: isRejected ? 0.42 : 0.97, ageEstimate: age });
      setAgentStatuses(prev => ({ ...prev, visual_intel: { state: 'running', output: '', durationMs: 0, startedAt: Date.now() } }));
      addAuditEntry('liveness_result', 'passed:' + String(!isRejected));
    }, 1000));

    timelineRef.current.push(setTimeout(() => {
      setChatHistory([{ role: 'agent', text: "Hi! I'm Priya from Poonawalla Fincorp. I'll help you get a personalised loan offer in just a few minutes. What are you looking to use the loan for?", ts: Date.now() }]);
      addAuditEntry('session_started', 'greeting_sent');
    }, 1500));

    const geoMap: Record<string, { lat: number; lng: number }> = {
      'Mumbai': { lat: 19.076, lng: 72.877 }, 'Ahmedabad': { lat: 23.022, lng: 72.571 },
      'Coimbatore': { lat: 11.016, lng: 76.955 }, 'Jaipur': { lat: 26.912, lng: 75.787 },
    };
    timelineRef.current.push(setTimeout(() => {
      const geo = geoMap[profile.city] ?? { lat: 0, lng: 0 };
      setGeoData({ country: isRejected ? 'XX' : 'IN', city: profile.city, lat: geo.lat, lng: geo.lng });
      addAuditEntry('geo_captured', 'country:' + (isRejected ? 'XX' : 'IN'));
    }, 2000));

    timeline.forEach(event => {
      timelineRef.current.push(setTimeout(() => {
        setAgentStatuses(prev => ({
          ...prev,
          [event.agent]: { state: 'completed', output: event.output, durationMs: Math.floor(Math.random() * 800 + 200), startedAt: Date.now() },
        }));
        addAuditEntry(event.agent + '_completed', event.output.slice(0, 40));
      }, event.t + 2000));
    });

    const agentReplies = [
      "Great! And what's your monthly income and employment type?",
      "Perfect. Any existing EMIs? And what tenure would you prefer?",
      "Got it! Could you please share your PAN card number?",
      isRejected
        ? "I'm sorry, we're unable to process your application at this time due to verification issues."
        : "Thank you! I have all the details. Generating your personalised offer now — just a moment!",
    ];

    profile.responses.forEach((resp, i) => {
      timelineRef.current.push(setTimeout(() => {
        setChatHistory(prev => [...prev, { role: 'user', text: resp, ts: Date.now() }]);
        if (i === 0) setExtractedEntities(prev => ({ ...prev, loan_purpose: resp.includes('renovation') ? 'Home Renovation' : resp.includes('business') ? 'Business Expansion' : resp.includes('machinery') ? 'Machinery Purchase' : resp.includes('investment') ? 'Investment' : 'Education' }));
        if (i === 1) setExtractedEntities(prev => ({ ...prev, income: 'Rs ' + profile.income.toLocaleString('en-IN') + '/mo', employment: profile.employment }));
        if (i === 2) setExtractedEntities(prev => ({ ...prev, tenure: '36 months', existing_emis: profile.income > 0 ? 'Rs ' + Math.floor(profile.income * 0.1).toLocaleString('en-IN') + '/mo' : 'None' }));
        if (i === 3) setExtractedEntities(prev => ({ ...prev, pan: profile.pan }));
        addAuditEntry('transcript_turn_' + String(i + 1), resp.slice(0, 30));
      }, 3000 + i * 5000));
      timelineRef.current.push(setTimeout(() => {
        setChatHistory(prev => [...prev, { role: 'agent', text: agentReplies[i] ?? '', ts: Date.now() }]);
      }, 3000 + i * 5000 + 1500));
    });

    timelineRef.current.push(setTimeout(() => {
      if (isRejected) {
        setSessionRejected(true);
        addAuditEntry('session_rejected', 'fraud_score:' + String(profile.fraudScore));
      } else {
        setOfferReady(true);
        const sig = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        setSolanaSignature(sig);
        addAuditEntry('on_chain_anchored', 'solana_devnet_tx:' + sig.slice(0, 12));
      }
    }, 24000));
  }, [selectedProfile, resetDemo, addAuditEntry]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);
  useEffect(() => () => resetDemo(), [resetDemo]);

  const progressPct = (elapsed / TOTAL_DURATION) * 100;
  const completedAgents = Object.values(agentStatuses).filter(s => s.state === 'completed').length;

  const agentColorMap: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  };

  const profileBorderMap: Record<string, string> = {
    green: 'border-green-500/50 text-green-400',
    yellow: 'border-yellow-500/50 text-yellow-400',
    orange: 'border-orange-500/50 text-orange-400',
    red: 'border-red-500/50 text-red-400',
    blue: 'border-blue-500/50 text-blue-400',
  };

  const fraudSignals = {
    geo_mismatch: geoData.country !== 'IN',
    age_discrepancy: false,
    pan_mismatch: selectedProfile.outcome === 'rejected',
    behavioural_anomaly: selectedProfile.outcome === 'rejected',
    device_fingerprint_mismatch: false,
    multiple_applications: selectedProfile.outcome === 'rejected',
    income_inconsistency: selectedProfile.outcome === 'rejected',
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Stats bar */}
      <div className="bg-blue-600/10 border-b border-blue-500/20 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 flex-wrap text-xs text-blue-300/80">
          {[
            { label: 'AUM', value: 'Rs55,017 Cr' },
            { label: 'Customers', value: '7M+' },
            { label: 'From', value: '9.99% p.a.' },
            { label: 'Rating', value: 'AAA/Stable' },
            { label: 'Loans Disbursed', value: '61M+' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="text-blue-400/50">|</span>
              <span className="text-gray-400">{s.label}:</span>
              <span className="font-semibold text-white">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Poonawalla Fincorp</span>
                <span className="text-gray-600 text-xs">|</span>
                <span className="text-xs text-gray-400">Finsa</span>
              </div>
              <span className="text-xs text-blue-400/70">Agentic AI Video Loan Origination</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/risk')} className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors hidden md:block">Risk Dashboard</button>
            <button onClick={() => navigate('/admin')} className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors">Admin</button>
            <button onClick={() => navigate('/apply')} className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 transition-colors font-medium">Apply Now</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-blue-300">Live Demo — Judges Mode</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            From Hello to Loan Offer in{' '}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">30 Seconds</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            7 AI agents run in parallel — liveness detection, speech intelligence, fraud scoring, bureau lookup, persona classification, offer generation, and blockchain audit — all in one video call.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(v => !v)}
              className={'flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm bg-gray-900 hover:bg-gray-800 transition-colors ' + (profileBorderMap[selectedProfile.color] ?? 'border-gray-600 text-gray-300')}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {selectedProfile.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="font-semibold">{selectedProfile.name}</div>
                <div className="text-xs opacity-70">{selectedProfile.description}</div>
              </div>
              <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
            </button>
            {showProfileDropdown && (
              <div className="absolute left-0 top-full mt-1 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                {DEMO_PROFILES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProfile(p); setShowProfileDropdown(false); resetDemo(); }}
                    className={'w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0 ' + (selectedProfile.id === p.id ? 'bg-gray-800' : '')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-bold text-white">{p.name.charAt(0)}</div>
                        <div>
                          <div className="font-medium text-white text-sm">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.employment} · {p.city}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={'text-xs px-2 py-0.5 rounded-full border ' + (profileBorderMap[p.color] ?? 'border-gray-600 text-gray-400')}>{p.riskBand}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.creditScore || 'NTC'}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={isPlaying ? resetDemo : startDemo}
              className={'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ' + (isPlaying ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/20 hover:opacity-90')}
            >
              {isPlaying ? <><Pause className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> Run Demo</>}
            </button>
            <button onClick={resetDemo} className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>{completedAgents}/7 agents complete</span>
            <span>{Math.round(elapsed / 1000)}s / 30s</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-100" style={{ width: progressPct + '%' }} />
          </div>
        </div>

        {/* Status banners */}
        {sessionRejected && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-red-400">Session Rejected — Fraud Score {selectedProfile.fraudScore}/100</div>
              <div className="text-sm text-red-300/70">Geo mismatch + PAN anomaly detected. V-CIP audit trail preserved on-chain.</div>
            </div>
          </div>
        )}
        {offerReady && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-green-400">Offer Generated — Rs{(selectedProfile.offerAmount / 100000).toFixed(1)}L @ {selectedProfile.offerRate}% p.a.</div>
              <div className="text-sm text-green-300/70">EMI Rs{selectedProfile.offerEmi.toLocaleString('en-IN')}/mo · Audit anchored on Solana Devnet</div>
            </div>
            {solanaSignature && (
              <a href={'https://explorer.solana.com/tx/' + solanaSignature + '?cluster=devnet'} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg px-2 py-1 flex-shrink-0">
                <ExternalLink className="w-3 h-3" /> Verify On-Chain
              </a>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
          {(['flow', 'agents', 'analytics', 'audit'] as const).map(s => (
            <button key={s} onClick={() => setActiveTab(s)}
              className={'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ' + (activeTab === s ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white')}>
              {s === 'flow' ? 'Live Flow' : s === 'agents' ? 'Agents' : s === 'analytics' ? 'Analytics' : 'Audit Chain'}
            </button>
          ))}
        </div>

        {/* FLOW TAB */}
        {activeTab === 'flow' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="aspect-video bg-gray-950 flex items-center justify-center relative">
                  {!isPlaying && !livenessResult && (
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
                        <User className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-500 text-sm">Press Run Demo to start</p>
                    </div>
                  )}
                  {(isPlaying || livenessResult) && (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 relative">
                      {/* Animated video call background */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl animate-pulse" />
                        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                      </div>
                      {/* Customer avatar */}
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600/40 to-violet-600/40 border-2 border-blue-500/50 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                          <span className="text-4xl font-bold text-white/80">{selectedProfile.name.charAt(0)}</span>
                        </div>
                        {/* Liveness pulse ring */}
                        {isPlaying && !livenessResult && (
                          <div className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping" />
                        )}
                        {livenessResult?.passed && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      {/* Liveness badge */}
                      {livenessResult && (
                        <div className={'absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ' + (livenessResult.passed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30')}>
                          {livenessResult.passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          Liveness {livenessResult.passed ? 'PASS' : 'FAIL'} {Math.round(livenessResult.confidence * 100)}%
                        </div>
                      )}
                      {livenessResult && <div className="absolute bottom-3 left-3 text-xs text-gray-400 bg-gray-900/80 rounded px-2 py-1">Age est: {livenessResult.ageEstimate}y</div>}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-gray-400 bg-gray-900/80 rounded px-2 py-1">
                        <Globe className="w-3 h-3" />
                        {geoData.country === 'IN' ? <span className="text-green-400">IN ✓</span> : <span className="text-red-400">{geoData.country} ✗</span>}
                        <span>{geoData.city}</span>
                      </div>
                      {isPlaying && <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs text-red-400 bg-gray-900/80 rounded px-2 py-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />LIVE · REC</div>}
                      {/* Agent processing indicator */}
                      {completedAgents > 0 && completedAgents < 7 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs text-blue-300 bg-blue-900/60 border border-blue-500/30 rounded-full px-3 py-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          {completedAgents}/7 agents
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400">WebRTC · 720p · {geoData.city}</span>
                  <span className="text-xs text-gray-500">Profile {selectedProfile.id}: {selectedProfile.name}</span>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3"><MapPin className="w-4 h-4 text-blue-400" /><span className="text-sm font-medium text-white">Geo-Fence & Campaign Entry</span></div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[['Country', geoData.country === 'IN' ? 'IN (Allowed)' : geoData.country + ' BLOCKED', geoData.country === 'IN' ? 'text-green-400' : 'text-red-400'],
                    ['City', geoData.city, 'text-white'],
                    ['Lat', geoData.lat.toFixed(3), 'text-gray-300'],
                    ['Lng', geoData.lng.toFixed(3), 'text-gray-300']].map(([k, v, c]) => (
                    <div key={String(k)} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">{k}</div>
                      <div className={'font-mono text-sm font-bold ' + c}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Campaign Entry Link</div>
                  <div className="font-mono text-xs text-blue-400 break-all">{campaignLink}</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col" style={{ height: '520px' }}>
              <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-white">Priya — AI Loan Advisor</span>
                <span className="ml-auto text-xs text-gray-500">Hindi / English</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.length === 0 && <div className="text-center text-gray-600 text-sm mt-8">Conversation will appear here...</div>}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'agent' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white mr-2 flex-shrink-0 mt-0.5">P</div>
                    )}
                    <div className={'max-w-xs rounded-2xl px-4 py-2.5 text-sm ' + (msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm')}>{msg.text}</div>
                  </div>
                ))}
                {/* Typing indicator */}
                {isPlaying && chatHistory.length > 0 && chatHistory[chatHistory.length - 1]?.role === 'user' && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">P</div>
                    <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {Object.keys(extractedEntities).length > 0 && (
                <div className="border-t border-gray-800 px-4 py-3">
                  <div className="text-xs text-gray-500 mb-2">Extracted Entities</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(extractedEntities).map(([k, v]) => (
                      <span key={k} className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-full px-2 py-0.5">{k.replace(/_/g, ' ')}: <strong>{v}</strong></span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AGENTS TAB */}
        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {AGENTS.map(agent => {
              const status = agentStatuses[agent.id];
              const Icon = agent.icon;
              const colorClass = agentColorMap[agent.color] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/20';
              return (
                <div key={agent.id} className={'border rounded-xl p-4 transition-all ' + (status?.state === 'completed' ? colorClass : status?.state === 'running' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-gray-800 bg-gray-900')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={'w-9 h-9 rounded-lg flex items-center justify-center border ' + colorClass}><Icon className="w-4 h-4" /></div>
                    <div className="text-right">
                      {!status && <span className="text-xs text-gray-600">idle</span>}
                      {status?.state === 'running' && <span className="text-xs text-yellow-400 animate-pulse">processing...</span>}
                      {status?.state === 'completed' && <span className="text-xs text-green-400">{status.durationMs}ms</span>}
                    </div>
                  </div>
                  <div className="font-medium text-sm text-white mb-0.5">{agent.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{agent.desc}</div>
                  {status?.output && <div className="text-xs text-gray-300 bg-gray-800/60 rounded-lg p-2 font-mono leading-relaxed">{status.output}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CreditScoreGauge score={selectedProfile.creditScore} band={selectedProfile.creditBand} />
              <FraudScoreVisualizer fraudScore={selectedProfile.fraudScore} signals={fraudSignals} />
            </div>
            {offerReady && selectedProfile.outcome === 'approved' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2"><BarChart2 className="w-5 h-5 text-blue-400" />Lender Comparison</h3>
                  <button onClick={() => setShowComparison(v => !v)} className="text-xs text-blue-400 hover:text-blue-300">{showComparison ? 'Hide' : 'Show'}</button>
                </div>
                {showComparison && <LoanComparisonTable offer={{ amount: selectedProfile.offerAmount, rate_pa: selectedProfile.offerRate, tenure_months: selectedProfile.tenure, emi: selectedProfile.offerEmi }} />}
                {!showComparison && <button onClick={() => setShowComparison(true)} className="w-full py-3 border border-gray-800 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors">Show Lender Comparison</button>}
              </div>
            )}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><User className="w-4 h-4 text-green-400" />Persona Classification</h3>
              <div className="space-y-3">
                {[
                  { label: selectedProfile.persona, pct: 91, color: 'bg-green-500' },
                  { label: 'Salaried-Urban', pct: 6, color: 'bg-blue-500' },
                  { label: 'Other', pct: 3, color: 'bg-gray-600' },
                ].map(p => (
                  <div key={p.label}>
                    <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{p.label}</span><span>{p.pct}%</span></div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className={p.color + ' h-full rounded-full transition-all duration-700'} style={{ width: p.pct + '%' }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === 'audit' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-indigo-400" /><span className="font-medium text-white">Hash-Chained Audit Log</span><span className="text-xs text-gray-500 ml-2">{auditChain.length} entries</span></div>
              {solanaSignature && (
                <a href={'https://explorer.solana.com/tx/' + solanaSignature + '?cluster=devnet'} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg px-3 py-1.5 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Verify on Solana Devnet
                </a>
              )}
            </div>
            {auditChain.length === 0 ? <p className="text-gray-600 text-sm">Run the demo to generate audit entries...</p> : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditChain.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs text-indigo-400 font-mono">{entry.seq}</div>
                      {i < auditChain.length - 1 && <div className="w-px h-4 bg-indigo-500/20 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white">{entry.event}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0"><Clock className="w-3 h-3" />{new Date(entry.ts).toLocaleTimeString()}</span>
                      </div>
                      <div className="font-mono text-xs text-indigo-300/70 mt-1 truncate">{entry.hash}</div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EMI Calculator section */}
        {offerReady && selectedProfile.outcome === 'approved' && (
          <div className="mt-6">
            <button onClick={() => setShowEmiCalc(v => !v)} className="w-full flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800/50 transition-colors mb-3">
              <span className="font-medium text-white text-sm">EMI Calculator & Amortization</span>
              <ChevronDown className={'w-4 h-4 text-gray-400 transition-transform ' + (showEmiCalc ? 'rotate-180' : '')} />
            </button>
            {showEmiCalc && <EmiCalculatorWidget />}
          </div>
        )}

        {/* V-CIP Compliance Panel */}
        <div className="mt-6">
          <VcipCompliancePanel
            livenessComplete={livenessResult?.passed === true}
            geoVerified={geoData.country === 'IN'}
            consentCaptured={auditChain.some(e => e.event === 'consent_captured')}
            panVerified={!!extractedEntities.pan}
            sessionActive={isPlaying || completedAgents > 0}
            auditEntries={auditChain.length}
          />
        </div>

        {/* YouTube Demo Video Section */}
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Full Demo Video</h3>
                <p className="text-xs text-gray-400">Watch the complete end-to-end flow</p>
              </div>
            </div>
            <button
              onClick={() => setShowVideo(v => !v)}
              className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg px-3 py-1.5 transition-colors"
            >
              {showVideo ? 'Hide Video' : 'Watch Demo'}
            </button>
          </div>
          {showVideo ? (
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
                title="Finsa — Full Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div
              className="aspect-video bg-gray-950 flex items-center justify-center cursor-pointer group relative overflow-hidden"
              onClick={() => setShowVideo(true)}
            >
              {/* Thumbnail placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-violet-900/20" />
              <div className="relative text-center">
                <div className="w-20 h-20 bg-red-500/20 border-2 border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-red-400 ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <p className="text-white font-semibold text-lg">Finsa — Full Demo</p>
                <p className="text-gray-400 text-sm mt-1">Poonawalla Fincorp · Agentic AI Video Loan Origination</p>
                <p className="text-gray-600 text-xs mt-2">Click to play · ~3 minutes</p>
              </div>
            </div>
          )}
          <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Shows: Consent → Liveness → Priya AI → 7 Agents → Offer → Solana Audit
            </p>
            <a
              href={`https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Open on YouTube
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Star className="w-4 h-4 text-yellow-400" /><span className="text-sm font-medium text-white">White-Label SDK</span></div>
            <p className="text-xs text-gray-400 mb-3">Embed Finsa in any NBFC/bank portal with 3 lines of JS.</p>
            <code className="text-xs text-green-400 bg-gray-800 rounded p-2 block font-mono">{'<script src="finsa-sdk.js"></script>'}</code>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-blue-400" /><span className="text-sm font-medium text-white">Compliance</span></div>
            <div className="space-y-1.5">
              {['RBI V-CIP Guidelines', 'DPDP Act 2023', 'ISO 27001', 'SOC 2 Type II', 'Solana On-Chain Audit'].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-300"><CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />{item}</div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-violet-400" /><span className="text-sm font-medium text-white">Performance</span></div>
            <div className="space-y-1.5">
              {[['Time to Offer', '< 30s'], ['Agents', '7 parallel'], ['Fraud Detection', 'Real-time'], ['Uptime SLA', '99.9%'], ['Languages', 'EN/HI/MR/TA']].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs"><span className="text-gray-400">{k}</span><span className="text-white font-medium">{v}</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* Data tab */}
        {activeTab === 'flow' && Object.keys(extractedEntities).length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><FileText className="w-4 h-4 text-violet-400" /><span className="font-medium text-white">Extracted Entities</span></div>
              <div className="space-y-3">
                {Object.entries(extractedEntities).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-sm text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-amber-400" /><span className="font-medium text-white">Risk & Offer Summary</span></div>
              <div className="space-y-3">
                {[
                  ['Risk Band', selectedProfile.riskBand, selectedProfile.riskBand === 'Low' ? 'text-green-400' : selectedProfile.riskBand === 'Medium' ? 'text-yellow-400' : 'text-red-400'],
                  ['Credit Score', String(selectedProfile.creditScore || 'NTC'), 'text-white'],
                  ['Fraud Score', String(selectedProfile.fraudScore) + '/100', selectedProfile.fraudScore >= 70 ? 'text-red-400' : selectedProfile.fraudScore >= 30 ? 'text-yellow-400' : 'text-green-400'],
                  ['Persona', selectedProfile.persona, 'text-white'],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-sm text-gray-400">{k}</span>
                    <span className={'text-sm font-bold ' + c}>{v}</span>
                  </div>
                ))}
                {selectedProfile.outcome === 'approved' && (
                  <>
                    <div className="flex justify-between py-2 border-b border-gray-800"><span className="text-sm text-gray-400">Offer Amount</span><span className="text-sm font-bold text-green-400">Rs{(selectedProfile.offerAmount / 100000).toFixed(1)}L</span></div>
                    <div className="flex justify-between py-2 border-b border-gray-800"><span className="text-sm text-gray-400">Interest Rate</span><span className="text-sm font-medium text-white">{selectedProfile.offerRate}% p.a.</span></div>
                    <div className="flex justify-between py-2"><span className="text-sm text-gray-400">Monthly EMI</span><span className="text-sm font-bold text-blue-400">Rs{selectedProfile.offerEmi.toLocaleString('en-IN')}</span></div>
                  </>
                )}
                {selectedProfile.outcome === 'rejected' && (
                  <div className="flex items-center gap-2 py-2 text-red-400"><AlertTriangle className="w-4 h-4" /><span className="text-sm font-medium">Application Rejected</span></div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
