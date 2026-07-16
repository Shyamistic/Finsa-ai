import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const ConsentPage = lazy(() => import('./pages/ConsentPage'));
const SessionPage = lazy(() => import('./pages/SessionPage'));
const OfferPage = lazy(() => import('./pages/OfferPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const RiskDashboard = lazy(() => import('./pages/RiskDashboard'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center text-sm">Loading experience...</div>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/apply" element={<ConsentPage />} />
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/session/:id" element={<SessionPage />} />
        <Route path="/offer/:id" element={<OfferPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/risk" element={<RiskDashboard />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
      </Routes>
    </Suspense>
  );
}
