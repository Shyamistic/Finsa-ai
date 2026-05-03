import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ConsentPage from './pages/ConsentPage';
import SessionPage from './pages/SessionPage';
import OfferPage from './pages/OfferPage';
import DemoPage from './pages/DemoPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import RiskDashboard from './pages/RiskDashboard';

export default function App() {
  return (
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
    </Routes>
  );
}
