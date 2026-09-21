import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Heart,
  User as UserIcon,
  Lock,
  Sun,
  Moon,
  LogOut,
  ShieldAlert,
  Check,
} from 'lucide-react';
import { useAgentStore } from '../../stores/agent.store';
import { useUIStore } from '../../stores/ui.store';
import { useAuthStore } from '../../stores/auth.store';
import { useCurrentUser, useUpdateUser, useChangePassword } from '../../hooks/queries';
import { authApi } from '../../services/api/auth.api';
import { useNavigate } from 'react-router-dom';
import type { PersonalityMode } from '../../types/agent.types';

export const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const { personalityMode, setPersonalityMode } = useAgentStore();
  const { theme, setTheme } = useUIStore();
  const { user: authUser, logout: clearAuth } = useAuthStore();
  const { data: currentUserData } = useCurrentUser();

  const user = currentUserData || authUser;

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const updateUserMutation = useUpdateUser();
  const changePasswordMutation = useChangePassword();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await updateUserMutation.mutateAsync({ name, email });
      setProfileMsg({ text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ text: (err as Error)?.message || 'Failed to update profile', error: true });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match', error: true });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'Password must be at least 8 characters', error: true });
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      setPasswordMsg({ text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ text: (err as Error)?.message || 'Failed to change password', error: true });
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Sign out of all devices and active sessions?')) return;
    try {
      await authApi.logoutAll();
    } catch {
      // Ignore
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const modes: { id: PersonalityMode; label: string; desc: string }[] = [
    { id: 'WARM', label: 'Warm & Friendly (Default)', desc: 'Intelligent, warm, and natural conversational partner' },
    { id: 'FOCUSED', label: 'Focused & Calm', desc: 'Minimal chatter, prioritizes technical precision' },
    { id: 'PLAYFUL', label: 'Playful & Cheerful', desc: 'Upbeat banter and light celebratory comments' },
    { id: 'LIGHTLY_FLIRTY', label: 'Lightly Flirty', desc: 'Tasteful, occasional subtle flirty charm within cooldowns' },
    { id: 'PROFESSIONAL', label: 'Professional', desc: 'Zero nicknames, strictly concise and business-focused' },
  ];

  return (
    <div className="w-full max-w-4xl space-y-6 z-20 pb-16">
      <div>
        <h2 className="text-xl font-semibold text-white font-['Poppins']">Settings</h2>
        <p className="text-xs text-slate-400">Configure profile, personality, voice, and system behavior</p>
      </div>

      {/* Profile Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <UserIcon className="w-4 h-4 text-cyan-400" />
          <span>User Profile</span>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          {profileMsg && (
            <p
              className={`text-xs ${
                profileMsg.error ? 'text-rose-400' : 'text-emerald-400'
              } flex items-center gap-1.5`}
            >
              {!profileMsg.error && <Check className="w-3.5 h-3.5" />}
              {profileMsg.text}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
            >
              {updateUserMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Security & Password</span>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          {passwordMsg && (
            <p
              className={`text-xs ${
                passwordMsg.error ? 'text-rose-400' : 'text-emerald-400'
              } flex items-center gap-1.5`}
            >
              {!passwordMsg.error && <Check className="w-3.5 h-3.5" />}
              {passwordMsg.text}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
            >
              {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Personality Style Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Heart className="w-4 h-4 text-pink-400" />
          <span>Conversational Personality Intensity</span>
        </div>

        <div className="grid gap-2.5">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setPersonalityMode(m.id)}
              className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                personalityMode === m.id
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-slate-200">{m.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
              </div>
              <span
                className={`w-3 h-3 rounded-full border ${
                  personalityMode === m.id
                    ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                    : 'border-slate-700'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Appearance Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sun className="w-4 h-4 text-amber-400" />
          <span>Theme & Appearance</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
              theme === 'dark'
                ? 'bg-indigo-600/20 border-indigo-500/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-sm font-medium text-slate-200">Dark Cosmos (Recommended)</p>
              <p className="text-xs text-slate-500">Premium deep cosmic ambient glass</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`flex-1 p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
              theme === 'light'
                ? 'bg-indigo-600/20 border-indigo-500/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-slate-200">Light Prism</p>
              <p className="text-xs text-slate-500">Bright clean ambient aesthetic</p>
            </div>
          </button>
        </div>
      </div>

      {/* Voice & Realtime Settings */}
      <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span>Voice & Audio Realtime Pipeline</span>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5">
            <div>
              <p className="font-medium">LiveKit Low-Latency WebRTC</p>
              <p className="text-slate-500">Ultra-fast bidirectional audio streaming</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
              Enabled
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5">
            <div>
              <p className="font-medium">Automatic Barge-In Interruption</p>
              <p className="text-slate-500">Cancels speech immediately when user begins speaking</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Session & Logout</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-2 border border-white/5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
          <button
            onClick={handleLogoutAll}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-medium transition flex items-center justify-center gap-2 border border-rose-500/30"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Sign Out All Devices
          </button>
        </div>
      </div>
    </div>
  );
};
