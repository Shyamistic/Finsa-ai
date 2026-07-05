import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, Zap } from 'lucide-react';

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'admin-key-finsa-2026-secure';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    // Simulate a brief check
    await new Promise(r => setTimeout(r, 400));
    if (key.trim() === ADMIN_KEY || key.trim() === 'admin-key-finsa-2026-secure') {
      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('admin_key', key.trim());
      navigate('/admin');
    } else {
      setError('Invalid admin key. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5">
            <Shield className="w-3 h-3 text-red-400" />
            <span className="text-xs text-red-300/80 font-medium">Admin Access Only</span>
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/25">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Finsa AI · Finsa</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-2">Admin API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter admin key..."
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 pr-10 transition-colors"
                />
                <button
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={!key.trim() || loading}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
              ) : (
                <><Lock className="w-4 h-4" /> Access Dashboard</>
              )}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-600 text-center">
              Demo key: <code className="text-gray-500">admin-key-finsa-2026-secure</code>
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-6">
          <button onClick={() => navigate('/')} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Home
          </button>
          <button onClick={() => navigate('/demo')} className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
            <Zap className="w-3 h-3" /> Demo
          </button>
        </div>
      </div>
    </div>
  );
}
