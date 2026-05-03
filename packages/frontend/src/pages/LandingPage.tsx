import { useNavigate } from 'react-router-dom';
import { Zap, Shield, CheckCircle, Star, ChevronDown, ChevronUp, Video, TrendingUp, CreditCard, Building2, User, Globe } from 'lucide-react';
import { useState } from 'react';

const PRODUCTS = [
  { icon: User, title: 'Personal Loan', rate: '9.99%', amount: 'Up to Rs50L', time: '3 min', color: 'blue', desc: 'Instant approval for salaried professionals' },
  { icon: Building2, title: 'Business Loan', rate: '15%', amount: 'Up to Rs50L', time: '24 hrs', color: 'violet', desc: 'Quick capital for your business growth' },
  { icon: TrendingUp, title: 'MSME Loan', rate: '15%', amount: 'Up to Rs75L', time: '48 hrs', color: 'amber', desc: 'Tailored for small and medium enterprises' },
  { icon: Star, title: 'Professional Loan', rate: '11%', amount: 'Up to Rs75L', time: '6 hrs', color: 'emerald', desc: 'For doctors, CAs, lawyers and consultants' },
  { icon: CreditCard, title: 'Consumer Durable', rate: '13%', amount: 'Up to Rs5L', time: 'Instant', color: 'pink', desc: 'Buy electronics and appliances on easy EMI' },
];

const STEPS = [
  { icon: Globe, title: 'Click Campaign Link', desc: 'Receive a secure link via SMS, WhatsApp, or email. One click to start.' },
  { icon: Shield, title: 'DPDP Consent', desc: 'Give digital consent per DPDP Act 2023. Fully paperless and compliant.' },
  { icon: Video, title: 'Video Call with Priya', desc: 'Our AI advisor Priya guides you through a 3-minute video conversation.' },
  { icon: Zap, title: 'Instant Offer', desc: '7 AI agents process your profile in parallel. Get a personalised offer in seconds.' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Mumbai', role: 'Software Engineer', quote: 'Got Rs15L approved in under 3 minutes. The video process was smooth and Priya was incredibly helpful!', rating: 5 },
  { name: 'Ramesh Patel', city: 'Ahmedabad', role: 'Business Owner', quote: 'As a self-employed person, getting a loan was always hard. Finsa understood my business instantly.', rating: 5 },
  { name: 'Anjali Singh', city: 'Jaipur', role: 'First-Time Borrower', quote: 'No credit history, but they still gave me a fair offer. The AI explained everything clearly in Hindi.', rating: 4 },
];

const FAQS = [
  { q: 'How long does the video loan process take?', a: 'The entire process from consent to offer takes under 3 minutes. Our 7 AI agents work in parallel to process your application in real-time.' },
  { q: 'Is my video data safe?', a: 'Yes. Facial biometrics are processed in-browser only — no raw video is sent to our servers. All data is encrypted per DPDP Act 2023 and retained for 7 years per RBI guidelines.' },
  { q: 'What documents do I need?', a: 'Just your PAN card (captured via camera OCR during the call) and verbal confirmation of your income and employment. No physical documents required.' },
  { q: 'What is the minimum credit score required?', a: 'We serve all profiles including NTC (No Credit History) customers. Our AI assesses your complete profile, not just your credit score.' },
  { q: 'How is the audit trail maintained?', a: 'Every session event is recorded in a SHA-256 hash-chained audit log and anchored on Solana Devnet blockchain for tamper-proof compliance.' },
];

const colorMap: Record<string, string> = {
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <div>
              <div className="font-bold text-white text-sm">Poonawalla Fincorp</div>
              <div className="text-xs text-gray-400">Finsa by Poonawalla Fincorp</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/demo')} className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors hidden md:block">View Demo</button>
            <button onClick={() => navigate('/admin')} className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors hidden md:block">Admin</button>
            <button onClick={() => navigate('/apply')} className="text-xs bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-lg px-4 py-1.5 font-semibold hover:opacity-90 transition-opacity">Apply Now</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-blue-300">AI-First · RBI V-CIP Compliant · DPDP 2023</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Get a Personal Loan in{' '}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">3 Minutes</span>
            {' '}via Video Call
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            India's first Agentic AI video loan origination platform. 7 AI agents process your application in real-time — from consent to personalised offer in one video call.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/apply')} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-2xl shadow-blue-500/25 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" /> Start Your Application
            </button>
            <button onClick={() => navigate('/demo')} className="px-8 py-4 border border-gray-700 text-white rounded-xl font-semibold text-base hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
              <Video className="w-5 h-5" /> Watch Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-800 bg-gray-900/50 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          {[['61M+', 'Loans Disbursed'], ['Rs55,017 Cr', 'AUM'], ['9.99%', 'Starting Rate'], ['7M+', 'Customers'], ['AAA/Stable', 'Credit Rating']].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl font-bold text-white">{v}</div>
              <div className="text-xs text-gray-400 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-gray-400">From campaign link to loan offer in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative">
                  {i < STEPS.length - 1 && <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-500/30 to-transparent z-10" />}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center hover:border-blue-500/30 transition-colors">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-xs text-blue-400 font-semibold mb-1">Step {i + 1}</div>
                    <h3 className="font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 px-4 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Our Loan Products</h2>
            <p className="text-gray-400">Tailored solutions for every financial need</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PRODUCTS.map(p => {
              const Icon = p.icon;
              const cc = colorMap[p.color] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/20';
              return (
                <div key={p.title} className={'border rounded-xl p-5 hover:scale-[1.02] transition-all cursor-pointer ' + cc} onClick={() => navigate('/apply')}>
                  <div className={'w-10 h-10 rounded-xl flex items-center justify-center border mb-4 ' + cc}><Icon className="w-5 h-5" /></div>
                  <h3 className="font-bold text-white mb-1 text-sm">{p.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">{p.desc}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Rate from</span><span className="font-semibold text-white">{p.rate}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Amount</span><span className="font-semibold text-white">{p.amount}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Approval</span><span className="font-semibold text-emerald-400">{p.time}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">What Our Customers Say</h2>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
              <span className="text-sm text-gray-400 ml-2">4.8 on Google · 50,000+ reviews</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                <div className="flex gap-0.5 mb-4">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}</div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white">{t.name.charAt(0)}</div>
                  <div><div className="text-sm font-semibold text-white">{t.name}</div><div className="text-xs text-gray-400">{t.role} · {t.city}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-900/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors">
                  <span className="font-medium text-white text-sm">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-gray-800 pt-3">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Your Loan?</h2>
          <p className="text-gray-400 mb-8">Join 7M+ customers who trust Poonawalla Fincorp for their financial needs.</p>
          <button onClick={() => navigate('/apply')} className="px-10 py-4 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-bold text-base hover:opacity-90 transition-opacity shadow-2xl shadow-blue-500/25 flex items-center justify-center gap-2 mx-auto">
            <Zap className="w-5 h-5" /> Start Application — 3 Minutes
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
            {['RBI V-CIP Compliant', 'DPDP Act 2023', 'ISO 27001', 'SOC 2 Type II', 'Solana Blockchain Audit'].map(b => (
              <div key={b} className="flex items-center gap-1.5 text-xs text-gray-500"><CheckCircle className="w-3 h-3 text-green-400" />{b}</div>
            ))}
          </div>
          <div className="text-center text-xs text-gray-600">
            <p>Poonawalla Fincorp Limited · CIN: L65910PN1978PLC011487 · RBI Reg. No. N-13.02268</p>
            <p className="mt-1">Registered Office: 1st Floor, Poonawalla House, 570-C, Bund Garden Road, Pune - 411001</p>
            <p className="mt-1">© 2026 Poonawalla Fincorp Limited. All rights reserved. | <button onClick={() => navigate('/demo')} className="text-blue-400 hover:underline">Demo</button> | <button onClick={() => navigate('/admin')} className="text-blue-400 hover:underline">Admin</button></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
