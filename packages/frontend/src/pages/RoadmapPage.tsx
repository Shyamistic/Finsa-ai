import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Rocket,
  Zap,
  Shield,
  Globe,
  Server,
  Database,
  Cloud,
  Bot,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Lock,
  BarChart3,
  Smartphone,
} from 'lucide-react';

const SBI_BLUE = '#00B5EF';
const SBI_NAVY = '#292075';

const CURRENT_FEATURES = [
  { label: '12+ Specialized AI Agents', detail: 'Running in parallel via Redis EventBus' },
  { label: 'Multi-Product Banking (7 types)', detail: 'Personal Loan, Savings, CC, SIP, Insurance, FD, UPI' },
  { label: 'Conversational AI Onboarding', detail: 'Video call with AI agent Priya' },
  { label: 'Real-Time Fraud Detection', detail: '7 signals, composite scoring, instant rejection' },
  { label: 'Solana-Anchored Audit Trail', detail: 'Immutable, verifiable compliance proof' },
  { label: 'DPDP Act 2023 Compliance', detail: 'Consent gating, data minimization, client-side biometrics' },
  { label: 'Policy-Based Offer Engine', detail: '12 rules covering all customer segments' },
  { label: 'In-Browser Liveness Detection', detail: 'face-api.js in Web Worker — no data to server' },
  { label: 'Demo Mode (5 Profiles)', detail: 'Pre-seeded PAN profiles for instant evaluation' },
  { label: 'White-Label Architecture', detail: 'Any partner bank can apply branding at runtime' },
];

const IN_DEVELOPMENT = [
  { label: 'Customer Acquisition Agent', detail: 'Lead scoring, segment classification, funnel optimization' },
  { label: 'Digital Adoption Agent', detail: 'Contextual nudges, feature discovery, acceptance tracking' },
  { label: 'Life-Event Engagement Agent', detail: 'Proactive recommendations on salary, birthday, job change' },
  { label: 'Sarvam AI Multilingual (10 languages)', detail: 'Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati, Punjabi, Odia' },
  { label: 'AWS CDK Infrastructure', detail: 'ECS Fargate, RDS PostgreSQL, ElastiCache, CloudFront' },
  { label: 'CI/CD Pipeline', detail: 'Blue/Green zero-downtime deployments with CodeDeploy' },
];

const FUTURE_VISION = [
  { label: 'Admin Dashboard with RBAC', detail: 'Role-based access: Admin, Operator, Viewer' },
  { label: 'Analytics Engine + A/B Testing', detail: 'Conversion funnels, segment performance, experiment framework' },
  { label: 'API Gateway (OAuth 2.0)', detail: 'Webhooks, SDKs, OpenAPI docs, tiered rate limiting' },
  { label: 'Document Intelligence Model', detail: 'Trained on Indian banking loan documents (ITR, bank statements)' },
  { label: 'Observability Stack', detail: 'CloudWatch, X-Ray distributed tracing, custom dashboards' },
  { label: 'Multi-Tenant SaaS Mode', detail: 'Full isolation per partner bank with usage metering' },
];

const TIMELINE = [
  { phase: 'Prototype', period: 'Jan–Mar 2026', status: 'done', items: ['12 agents', 'Loan origination', 'Fraud detection', 'Solana audit'] },
  { phase: 'SBI Hackathon', period: 'Apr 2026', status: 'current', items: ['3 pillar agents', 'Demo mode', 'SBI branding', 'Multilingual prep'] },
  { phase: 'Production', period: 'Q3 2026', status: 'future', items: ['AWS CDK deploy', 'Sarvam AI live', 'CI/CD pipeline', 'Admin dashboard'] },
  { phase: 'Scale', period: 'Q4 2026+', status: 'future', items: ['API gateway', 'Multi-tenant', 'Analytics', '10 languages live'] },
];

const TECH_STACK = [
  { name: 'React + Vite', category: 'Frontend', icon: Layers },
  { name: 'Node.js + Express', category: 'Backend', icon: Server },
  { name: 'PostgreSQL', category: 'Database', icon: Database },
  { name: 'Redis EventBus', category: 'Messaging', icon: Zap },
  { name: 'AWS CDK', category: 'Infrastructure', icon: Cloud },
  { name: 'Sarvam AI', category: 'Multilingual', icon: Globe },
  { name: 'Solana', category: 'Audit Chain', icon: Lock },
  { name: 'Tailwind CSS', category: 'Styling', icon: Smartphone },
];

const PILLAR_MATRIX = [
  {
    pillar: 'Customer Acquisition',
    icon: TrendingUp,
    features: ['Lead Scoring Agent', 'Conversational Onboarding', 'Segment Classification', 'Campaign-Aware Routing', 'Conversion Funnel Analytics'],
  },
  {
    pillar: 'Digital Adoption',
    icon: Bot,
    features: ['Contextual Nudge Engine', 'Feature Discovery (YONO/UPI/SIP)', 'Acceptance Tracking', 'Adaptive Strategy (30-day learning)', 'In-Session Coaching'],
  },
  {
    pillar: 'Digital Engagement',
    icon: Sparkles,
    features: ['Life-Event Detection', 'Proactive Recommendations', 'Personalization Scoring', 'Cross-Sell Optimization', 'Communication Preference Respect'],
  },
];

export default function RoadmapPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${SBI_NAVY}, ${SBI_BLUE})` }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Finsa AI × SBI</div>
              <div className="text-xs text-slate-500">Platform Roadmap</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/demo')}
              className="text-xs text-white rounded-lg px-4 py-1.5 font-semibold transition-colors"
              style={{ backgroundColor: SBI_BLUE }}
            >
              View Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-4" style={{ background: `linear-gradient(135deg, ${SBI_NAVY} 0%, #1a1560 50%, ${SBI_NAVY} 100%)` }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: SBI_BLUE }} />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/90">SBI Hackathon @ GFF 2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Finsa AI × SBI
            <span className="block mt-2" style={{ color: SBI_BLUE }}>Platform Roadmap</span>
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-3xl mx-auto mb-8">
            From working prototype to production-grade enterprise platform.
            Addressing all three SBI pillars with agentic AI orchestration.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { num: '12+', label: 'AI Agents' },
              { num: '7', label: 'Product Types' },
              { num: '10', label: 'Languages (planned)' },
              { num: '<15s', label: 'Pipeline Speed' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                <div className="text-xl font-bold text-white">{stat.num}</div>
                <div className="text-xs text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Prototype Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Current Prototype</h2>
              <p className="text-sm text-slate-500">Working and demonstrable today</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CURRENT_FEATURES.map((f) => (
              <div key={f.label} className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{f.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{f.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* In Development Section */}
      <section className="py-16 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">In Development</h2>
              <p className="text-sm text-slate-500">Actively being built for production</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {IN_DEVELOPMENT.map((f) => (
              <div key={f.label} className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-white hover:border-amber-200 transition-colors">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{f.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{f.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Vision Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${SBI_BLUE}15`, border: `1px solid ${SBI_BLUE}40` }}>
              <Rocket className="w-5 h-5" style={{ color: SBI_BLUE }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Future Vision</h2>
              <p className="text-sm text-slate-500">Long-term enterprise capabilities</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FUTURE_VISION.map((f) => (
              <div key={f.label} className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                <Rocket className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: SBI_BLUE }} />
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{f.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{f.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Development Timeline</h2>
          <p className="text-sm text-slate-500 text-center mb-10">From prototype to scale</p>

          {/* Desktop Timeline */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 rounded-full" />
              <div className="grid grid-cols-4 gap-4 relative">
                {TIMELINE.map((t, i) => (
                  <div key={i} className="text-center">
                    <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center border-4 relative z-10 ${
                      t.status === 'done' ? 'bg-emerald-500 border-emerald-200' :
                      t.status === 'current' ? 'border-amber-300' : 'bg-white border-slate-200'
                    }`} style={t.status === 'current' ? { backgroundColor: SBI_BLUE } : {}}>
                      {t.status === 'done' && <CheckCircle2 className="w-5 h-5 text-white" />}
                      {t.status === 'current' && <Zap className="w-5 h-5 text-white" />}
                      {t.status === 'future' && <Clock className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{t.phase}</div>
                    <div className="text-xs text-slate-500 mb-2">{t.period}</div>
                    <div className="space-y-1">
                      {t.items.map((item) => (
                        <div key={item} className="text-xs text-slate-600 bg-white border border-slate-100 rounded-lg px-2 py-1">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Timeline (Vertical) */}
          <div className="md:hidden space-y-6">
            {TIMELINE.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 flex-shrink-0 ${
                    t.status === 'done' ? 'bg-emerald-500 border-emerald-200' :
                    t.status === 'current' ? 'border-amber-300' : 'bg-white border-slate-200'
                  }`} style={t.status === 'current' ? { backgroundColor: SBI_BLUE } : {}}>
                    {t.status === 'done' && <CheckCircle2 className="w-4 h-4 text-white" />}
                    {t.status === 'current' && <Zap className="w-4 h-4 text-white" />}
                    {t.status === 'future' && <Clock className="w-4 h-4 text-slate-400" />}
                  </div>
                  {i < TIMELINE.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-2" />}
                </div>
                <div className="pb-6">
                  <div className="font-bold text-slate-900 text-sm">{t.phase}</div>
                  <div className="text-xs text-slate-500 mb-2">{t.period}</div>
                  <div className="flex flex-wrap gap-1">
                    {t.items.map((item) => (
                      <span key={item} className="text-xs text-slate-600 bg-white border border-slate-100 rounded-lg px-2 py-1">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Technology Stack</h2>
          <p className="text-sm text-slate-500 text-center mb-10">Production-grade infrastructure</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TECH_STACK.map((tech) => {
              const Icon = tech.icon;
              return (
                <div key={tech.name} className="text-center p-5 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${SBI_NAVY}08`, border: `1px solid ${SBI_NAVY}15` }}>
                    <Icon className="w-6 h-6" style={{ color: SBI_NAVY }} />
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">{tech.name}</div>
                  <div className="text-xs text-slate-500">{tech.category}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SBI Pillar Alignment Matrix */}
      <section className="py-16 px-4 border-y border-slate-200" style={{ backgroundColor: `${SBI_NAVY}03` }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">SBI Pillar Alignment</h2>
          <p className="text-sm text-slate-500 text-center mb-10">Every feature maps to a strategic pillar</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PILLAR_MATRIX.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.pillar} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${SBI_BLUE}15`, border: `1px solid ${SBI_BLUE}30` }}>
                      <Icon className="w-5 h-5" style={{ color: SBI_BLUE }} />
                    </div>
                    <h3 className="font-bold text-slate-900">{pillar.pillar}</h3>
                  </div>
                  <ul className="space-y-2">
                    {pillar.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                        <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: SBI_BLUE }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Business Impact */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Projected Business Impact</h2>
          <p className="text-sm text-slate-500 text-center mb-10">Measurable outcomes for SBI</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { metric: '3x', label: 'Faster Onboarding', sub: 'vs traditional forms' },
              { metric: '80%', label: 'KYC Reduction', sub: 'manual processing eliminated' },
              { metric: '40%', label: 'Lead Conversion', sub: 'improvement with AI scoring' },
              { metric: '60%', label: 'Digital Adoption', sub: 'increase via contextual nudges' },
            ].map((item) => (
              <div key={item.label} className="text-center p-6 rounded-xl border border-slate-100">
                <div className="text-3xl font-bold mb-1" style={{ color: SBI_BLUE }}>{item.metric}</div>
                <div className="font-semibold text-slate-900 text-sm">{item.label}</div>
                <div className="text-xs text-slate-500 mt-1">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4" style={{ background: `linear-gradient(135deg, ${SBI_NAVY}, #1a1560)` }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready for a Technical Deep Dive?</h2>
          <p className="text-white/70 mb-8 text-sm md:text-base">
            Schedule a session with our engineering team to explore architecture,
            deployment strategy, and SBI-specific customization options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.open('mailto:team@tenzor.in?subject=Finsa AI - Technical Deep Dive Request', '_blank')}
              className="px-8 py-4 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: SBI_BLUE }}
            >
              <BarChart3 className="w-4 h-4" /> Schedule a Technical Deep Dive
            </button>
            <button
              onClick={() => window.open('https://github.com/Shyamistic/Finsa-ai', '_blank')}
              className="px-8 py-4 border border-white/30 text-white rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> View on GitHub
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
            {['12+ AI Agents', '7 Product Types', 'Solana Audit', 'DPDP Compliant', 'White-Label Ready'].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 text-xs text-slate-500">
                <Shield className="w-3 h-3 text-emerald-500" />
                {badge}
              </div>
            ))}
          </div>
          <div className="text-center text-xs text-slate-500">
            <p>Finsa AI × SBI | Hackathon @ GFF 2026 | Tenzor (Udyam-Certified)</p>
            <p className="mt-1">
              <button onClick={() => navigate('/')} className="hover:underline" style={{ color: SBI_BLUE }}>Home</button>
              {' · '}
              <button onClick={() => navigate('/demo')} className="hover:underline" style={{ color: SBI_BLUE }}>Demo</button>
              {' · '}
              <button onClick={() => navigate('/admin')} className="hover:underline" style={{ color: SBI_BLUE }}>Admin</button>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
