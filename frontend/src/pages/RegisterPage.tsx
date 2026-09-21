import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import logoImg from '../assets/Logo - Png.png';
import { useUIStore } from '../stores/ui.store';
import { authApi } from '../services/api/auth.api';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useUIStore();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pwd)) return 'Password must include at least one uppercase letter.';
    if (!/[a-z]/.test(pwd)) return 'Password must include at least one lowercase letter.';
    if (!/[0-9]/.test(pwd)) return 'Password must include at least one number.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await authApi.register({ name, email, password });
      navigate('/assistant');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
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
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-14 mx-auto flex items-center justify-center">
            <img
              src={logoImg}
              alt="IRIS"
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Poppins']">
            Create your account
          </h1>
          <p className="text-xs text-slate-400">
            Get started with IRIS intelligent realtime agent
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Your Full Name</label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 focus-within:border-indigo-500/60 transition">
              <User className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Saroj Kumar"
                className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-slate-500"
              />
            </div>
          </div>

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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 focus-within:border-indigo-500/60 transition">
              <Lock className="w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 chars, 1 uppercase, 1 number"
                className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-slate-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 pl-1">
              Minimum 8 characters with at least one uppercase letter, lowercase letter, and digit.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            {loading ? 'Creating account...' : 'Create account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
