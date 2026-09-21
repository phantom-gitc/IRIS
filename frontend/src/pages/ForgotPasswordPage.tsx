import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import logoImg from '../assets/Logo - Png.png';
import { useUIStore } from '../stores/ui.store';
import { authApi } from '../services/api/auth.api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-screen flex items-center justify-center p-6 font-['Poppins'] select-none relative ${
        isDark ? 'bg-[#04060a] text-slate-100' : 'bg-[#ffffff] text-slate-900'
      }`}
    >
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6 z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-14 mx-auto flex items-center justify-center">
            <img src={logoImg} alt="IRIS" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Poppins']">
            Reset Password
          </h1>
          <p className="text-xs text-slate-400">
            Enter your email to receive recovery instructions
          </p>
        </div>

        {submitted ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
            <p className="text-xs font-medium text-emerald-300">Recovery email sent!</p>
            <p className="text-[11px] text-slate-400">
              If an account matches {email}, we've sent reset instructions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 focus-within:border-indigo-500/60 transition">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {loading ? 'Sending link...' : 'Send reset link'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        <div className="text-center">
          <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
