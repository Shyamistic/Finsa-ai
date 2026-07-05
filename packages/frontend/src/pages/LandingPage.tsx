import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Zap,
  Shield,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Video,
  TrendingUp,
  CreditCard,
  Building2,
  User,
  Globe,
  Sparkles,
  Bot,
} from 'lucide-react';

const PRODUCTS = [
  {
    icon: User,
    title: 'SBI Personal Loan Flow',
    amount: 'INR 50L ceiling (demo)',
    time: '3 min journey',
    desc: 'Conversational onboarding with multilingual support and instant pre-screening.',
  },
  {
    icon: Building2,
    title: 'SBI MSME Assist Flow',
    amount: 'INR 75L ceiling (demo)',
    time: '5 min journey',
    desc: 'Business context capture, risk cues, and adaptive product matching.',
  },
  {
    icon: CreditCard,
    title: 'SBI Digital Adoption Flow',
    amount: 'Feature-led',
    time: 'Under 2 min',
    desc: 'YONO, UPI, SIP, and digital feature nudges with contextual triggers.',
  },
];

const PILLARS = [
  {
    icon: TrendingUp,
    title: 'Customer Acquisition',
    desc: 'Lead scoring, qualification, and product-fit recommendations in real time.',
  },
  {
    icon: Bot,
    title: 'Digital Adoption',
    desc: 'Proactive nudges for UPI, mobile banking, SIP, and digital servicing.',
  },
  {
    icon: Sparkles,
    title: 'Digital Engagement',
    desc: 'Life-event intelligence for personalized outreach and next best action.',
  },
];

const STEPS = [
  {
    icon: Globe,
    title: 'Campaign Entry',
    desc: 'Customer taps an SBI campaign link from SMS, WhatsApp, or branch QR.',
  },
  {
    icon: Shield,
    title: 'DPDP Consent',
    desc: 'Explicit consent capture with purpose, retention, and audit proofing.',
  },
  {
    icon: Video,
    title: 'Agentic Interview',
    desc: 'Priya conducts a short multilingual conversation and gathers signals.',
  },
  {
    icon: Zap,
    title: 'Guided Outcome',
    desc: 'System returns pre-qualified next step, offer band, and digital action.',
  },
];

const FAQS = [
  {
    q: 'Is this only a loan demo?',
    a: 'No. The platform is positioned as a multi-product SBI engagement layer. Loans are one journey among acquisition, adoption, and engagement journeys.',
  },
  {
    q: 'How does this improve shortlist odds?',
    a: 'Judges usually reward clarity of problem-solution fit, production realism, and measurable outcomes. This UI and narrative now map directly to all three SBI pillars.',
  },
  {
    q: 'Can this be implemented during prototype phase?',
    a: 'Yes. The current stack already has orchestration, eventing, and demo primitives. Prototype phase can focus on one trained model and better data-backed scoring.',
  },
  {
    q: 'How is compliance handled?',
    a: 'Consent gating, immutable audit events, and India-region deployment constraints are built into the design and can be demonstrated in the evaluator flow.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-700 to-blue-500 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Finsa AI for SBI Hackathon</div>
              <div className="text-xs text-slate-500">Agentic Banking Prototype</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/demo')} className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 transition-colors hidden md:block">View Demo</button>
            <button onClick={() => navigate('/admin')} className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 transition-colors hidden md:block">Admin</button>
            <button onClick={() => navigate('/apply')} className="text-xs bg-blue-700 text-white rounded-lg px-4 py-1.5 font-semibold hover:bg-blue-800 transition-colors">Start Journey</button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-200/60 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-blue-800">Built for SBI Hackathon 2026: Acquisition, Adoption, Engagement</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Reinventing SBI Customer Journeys
            <span className="block bg-gradient-to-r from-blue-700 to-amber-500 bg-clip-text text-transparent">
              with Agentic AI
            </span>
          </h1>
          <p className="text-slate-600 text-lg mb-8 max-w-3xl mx-auto">
            Finsa AI is presenting a practical, bank-ready orchestration layer for SBI. The prototype combines conversational onboarding,
            multilingual intelligence, and product-aware decisioning to improve conversion and digital adoption.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/apply')} className="px-8 py-4 bg-blue-700 text-white rounded-xl font-bold text-base hover:bg-blue-800 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" /> Start SBI Journey
            </button>
            <button onClick={() => navigate('/demo')} className="px-8 py-4 border border-slate-300 text-slate-800 rounded-xl font-semibold text-base hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
              <Video className="w-5 h-5" /> Watch Judge Demo
            </button>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          {[
            ['3', 'Hackathon Pillars Covered'],
            ['12+', 'Specialized Agents'],
            ['10', 'Indian Languages (planned)'],
            ['< 180s', 'Demo Scenario Completion'],
            ['DPDP + RBI', 'Compliance Anchors'],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl font-bold text-slate-900">{v}</div>
              <div className="text-xs text-slate-500 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">SBI Theme Alignment</h2>
            <p className="text-slate-600">The prototype is explicitly mapped to all three hackathon themes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PILLARS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-blue-700" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Demo Flow</h2>
            <p className="text-slate-600">From campaign link to guided output in 4 steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative">
                  {i < STEPS.length - 1 && <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-200 to-transparent z-10" />}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 text-center hover:border-blue-300 transition-colors">
                    <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-blue-700" />
                    </div>
                    <div className="text-xs text-blue-700 font-semibold mb-1">Step {i + 1}</div>
                    <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Prototype Journeys</h2>
            <p className="text-slate-600">Three high-impact flows ready for judge walkthrough.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRODUCTS.map(p => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="border border-slate-200 bg-slate-50 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/apply')}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-blue-100 bg-blue-50 mb-4">
                    <Icon className="w-5 h-5 text-blue-700" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1 text-sm">{p.title}</h3>
                  <p className="text-xs text-slate-600 mb-3">{p.desc}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Scope</span><span className="font-semibold text-slate-900">{p.amount}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Timeline</span><span className="font-semibold text-blue-700">{p.time}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Shortlist FAQ</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-900 text-sm">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-3">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready for SBI Jury Demo?</h2>
          <p className="text-slate-600 mb-8">Open the guided flow and present all three pillars in under 10 minutes.</p>
          <button onClick={() => navigate('/apply')} className="px-10 py-4 bg-blue-700 text-white rounded-xl font-bold text-base hover:bg-blue-800 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mx-auto">
            <Zap className="w-5 h-5" /> Launch Prototype Flow
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
            {['RBI V-CIP aligned', 'DPDP Act 2023', 'Audit traceability', 'Multilingual journeys', 'SBI hackathon ready'].map(b => (
              <div key={b} className="flex items-center gap-1.5 text-xs text-slate-500"><CheckCircle className="w-3 h-3 text-emerald-500" />{b}</div>
            ))}
          </div>
          <div className="text-center text-xs text-slate-500">
            <p>Finsa AI startup demo build for SBI Hackathon @ GFF 2026.</p>
            <p className="mt-1">Udyam-certified startup positioning available for collaboration and pilot discussions.</p>
            <p className="mt-1">2026 Finsa AI. All rights reserved. | <button onClick={() => navigate('/demo')} className="text-blue-700 hover:underline">Demo</button> | <button onClick={() => navigate('/admin')} className="text-blue-700 hover:underline">Admin</button></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
