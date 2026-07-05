import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Language } from '../lib/i18n';
import { Shield, FileText, Clock, UserX, CheckCircle, Zap, Lock, Globe } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const CURRENT_DEMO_KEY = 'demo-key-finsa-2026';
const LEGACY_DEMO_KEY = 'demo-key-loanwizard-2026';

interface ConsentPageProps {
  language?: Language;
  apiKey?: string;
  whiteLabelConfig?: {
    logo?: string;
    primaryColor?: string;
    institutionName?: string;
  };
}

export default function ConsentPage({ language = 'en', apiKey, whiteLabelConfig }: ConsentPageProps) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const institutionName = whiteLabelConfig?.institutionName || 'Finsa AI x SBI Pilot';

  const handleStart = async () => {
    if (!agreed) return;
    setLoading(true);
    setError(null);
    try {
      const primaryKey = apiKey || CURRENT_DEMO_KEY;
      const fallbackKey = LEGACY_DEMO_KEY;

      const createSession = async (token: string) => axios.post(
        `${API_URL}/sessions`,
        { language, white_label_config: whiteLabelConfig },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        }
      );

      let data: { session_id: string };
      try {
        const response = await createSession(primaryKey);
        data = response.data as { session_id: string };
      } catch (e) {
        if (apiKey || !axios.isAxiosError(e) || (e.response && e.response.status !== 403)) {
          throw e;
        }
        const fallbackResponse = await createSession(fallbackKey);
        data = fallbackResponse.data as { session_id: string };
      }

      const sessionId = data.session_id as string;
      axios.post(`${API_URL}/sessions/${sessionId}/consent`, {
        consent_version: '1.0',
        data_categories: ['video', 'audio', 'pan', 'facial_biometrics', 'financial', 'geo_ip'],
        purpose: 'Loan eligibility assessment and offer generation',
        retention_days: 2555,
      }, { headers: { Authorization: `Bearer ${apiKey || CURRENT_DEMO_KEY}` } }).catch(() => {});
      navigate(`/session/${sessionId}`, { state: { language, apiKey } });
    } catch (err) {
      const isNetworkError = !axios.isAxiosError(err) || !err.response;
      if (isNetworkError) {
        setError('Backend is not reachable. Start the backend server or use Demo Mode to explore the product.');
      } else {
        setError('Failed to start session. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Header badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/60 font-medium">Secure Video Session</span>
          </div>
        </div>

        {/* Main card */}
        <div className="glass rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            {whiteLabelConfig?.logo ? (
              <img src={whiteLabelConfig.logo} alt={institutionName} className="h-10 mx-auto mb-4" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                <Shield className="w-7 h-7 text-white" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-white">{institutionName}</h1>
            <p className="text-sm text-white/50 mt-1">SBI Hackathon Agentic Banking Journey</p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {[
                { icon: Zap, label: '3-min guided flow' },
              { icon: Lock, label: 'RBI V-CIP compliant' },
                { icon: Globe, label: 'Multilingual support' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Icon className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-white/60">{label}</span>
              </div>
            ))}
          </div>

          {/* Consent section */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-white/80 mb-3">Before We Begin</p>
            <p className="text-xs text-white/50 mb-4 leading-relaxed">
              We need your consent to collect and process the following data during this video session:
            </p>

            <div className="space-y-2 mb-4">
              {[
                'Live video and audio during the session',
                'PAN card details (via camera OCR)',
                'Facial biometrics for liveness verification (processed in-browser only)',
                'Financial information shared during conversation',
                'IP address for geo-verification',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-white/60 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-white/10">
              {[
                { icon: FileText, text: 'Purpose: Loan eligibility assessment and offer generation' },
                { icon: Clock, text: 'Retention: 7 years as per RBI guidelines' },
                { icon: UserX, text: 'You may withdraw consent at any time by contacting us at privacy@finsa.ai' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Icon className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/40 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-6 group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                agreed ? 'bg-blue-500 border-blue-500' : 'border-white/20 bg-white/5 group-hover:border-white/40'
              }`}>
                {agreed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>
            <span className="text-xs text-white/60 leading-relaxed">
              I have read and agree to the above terms. I consent to the collection and processing of my data for loan origination purposes.
            </span>
          </label>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-400 mb-2">{error}</p>
              {error.includes('Backend') && (
                <button
                  onClick={() => navigate('/demo')}
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  → Open Demo Mode (no backend needed)
                </button>
              )}
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleStart}
            disabled={!agreed || loading}
            className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
              agreed && !loading
                ? 'bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90 active:scale-[0.98] shadow-lg shadow-blue-500/25'
                : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting session...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Start Video Session
              </span>
            )}
          </button>

          <p className="text-xs text-white/25 text-center mt-4">
            This consent is recorded per the Digital Personal Data Protection Act 2023 (India)
          </p>
        </div>

        {/* Bottom links */}
        <div className="flex justify-center gap-6 mt-6">
          <button onClick={() => navigate('/demo')} className="text-xs text-white/30 hover:text-white/60 transition-colors">
            View Demo
          </button>
          <button onClick={() => navigate('/admin')} className="text-xs text-white/30 hover:text-white/60 transition-colors">
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}
