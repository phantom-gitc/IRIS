import React, { useMemo } from 'react';
import type { AgentState } from '../../types/agent.types';
import { useUIStore } from '../../stores/ui.store';
import logoImg from '../../assets/Logo - Png.png';

interface IrisOrbProps {
  state: AgentState;
  audioLevel?: number;
  onClick?: () => void;
}

export const IrisOrb: React.FC<IrisOrbProps> = ({ state, audioLevel = 0, onClick }) => {
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  // 44 orbital dots positioned at radius 125 around (144, 144)
  const orbitalDots = useMemo(() => {
    const dots: { angle: number; radius: number; opacity: number }[] = [];
    const count = 44;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      dots.push({
        angle,
        radius: 125,
        opacity: i % 2 === 0 ? 0.7 : 0.25,
      });
    }
    return dots;
  }, []);

  const stateText = useMemo(() => {
    switch (state) {
      case 'LISTENING':
        return { title: 'Listening...', subtitle: "Speak naturally, I'm here." };
      case 'UNDERSTANDING':
        return { title: 'Understanding...', subtitle: 'Processing your thoughts.' };
      case 'THINKING':
        return { title: 'Thinking...', subtitle: 'Analyzing context and options.' };
      case 'PLANNING':
        return { title: 'Planning...', subtitle: 'Formulating the best action plan.' };
      case 'CONFIRMING':
        return { title: 'Waiting Confirmation', subtitle: 'Please confirm before I proceed.' };
      case 'EXECUTING':
        return { title: 'Executing...', subtitle: 'Running authorized computer tools.' };
      case 'VERIFYING':
        return { title: 'Verifying...', subtitle: 'Checking results and accuracy.' };
      case 'SPEAKING':
        return { title: 'Responding...', subtitle: 'Sharing the findings with you.' };
      case 'INTERRUPTED':
        return { title: 'Interrupted', subtitle: 'Listening to your new instruction.' };
      case 'SUCCESS':
        return { title: 'Completed', subtitle: 'Everything ran successfully.' };
      case 'ERROR':
        return { title: 'Encountered an Issue', subtitle: 'Let me help sort this out.' };
      case 'IDLE':
      default:
        return { title: 'Tap to speak', subtitle: "I'm ready whenever you are." };
    }
  }, [state]);

  const ringScale = 1 + (state === 'LISTENING' || state === 'SPEAKING' ? audioLevel * 0.12 : 0);

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Responsive Compact Orb Container */}
      <div
        onClick={onClick}
        className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center cursor-pointer group"
      >
        {/* Ambient Glow Field */}
        <div
          className={`absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
            isDark
              ? state === 'LISTENING'
                ? 'bg-cyan-500/20 shadow-[0_0_70px_rgba(56,189,248,0.35)]'
                : state === 'THINKING' || state === 'PLANNING'
                ? 'bg-violet-600/25 shadow-[0_0_80px_rgba(139,92,246,0.35)]'
                : state === 'EXECUTING' || state === 'VERIFYING'
                ? 'bg-indigo-500/25 shadow-[0_0_70px_rgba(99,102,241,0.3)]'
                : state === 'SPEAKING'
                ? 'bg-purple-500/30 shadow-[0_0_90px_rgba(168,85,247,0.35)]'
                : state === 'ERROR'
                ? 'bg-rose-500/25 shadow-[0_0_70px_rgba(244,63,94,0.3)]'
                : 'bg-indigo-500/15'
              : state === 'LISTENING'
              ? 'bg-sky-400/25 shadow-[0_0_60px_rgba(56,189,248,0.25)]'
              : state === 'THINKING' || state === 'PLANNING'
              ? 'bg-violet-400/25 shadow-[0_0_60px_rgba(139,92,246,0.25)]'
              : state === 'ERROR'
              ? 'bg-rose-400/25 shadow-[0_0_60px_rgba(244,63,94,0.25)]'
              : 'bg-indigo-300/20'
          }`}
        />

        {/* Concentric Orbital Dotted Ring */}
        <svg
          viewBox="0 0 288 288"
          className="absolute inset-0 w-full h-full pointer-events-none animate-[spin_60s_linear_infinite]"
        >
          {orbitalDots.map((dot, idx) => {
            const cx = 144 + dot.radius * Math.cos(dot.angle);
            const cy = 144 + dot.radius * Math.sin(dot.angle);
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={1.2}
                className={isDark ? 'fill-indigo-300' : 'fill-indigo-500'}
                style={{ opacity: dot.opacity }}
              />
            );
          })}
        </svg>

        {/* Radiant Wave Ring Layers */}
        <div
          style={{ transform: `scale(${ringScale})` }}
          className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center transition-transform duration-150"
        >
          {/* Rotating Gradient Wave 1 */}
          <div
            className={`absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400/70 border-r-indigo-500/50 border-b-violet-500/70 border-l-blue-400/60 blur-[1px] ${
              state === 'THINKING'
                ? 'animate-[spin_3.5s_linear_infinite]'
                : state === 'EXECUTING'
                ? 'animate-[spin_2s_linear_infinite]'
                : 'animate-[spin_10s_linear_infinite]'
            }`}
          />

          {/* Rotating Gradient Wave 2 */}
          <div
            className={`absolute inset-1.5 rounded-full border border-transparent border-t-violet-400/50 border-r-sky-300/60 border-b-pink-400/40 border-l-indigo-300/60 blur-[1px] ${
              state === 'THINKING'
                ? 'animate-[spin_5s_linear_infinite_reverse]'
                : 'animate-[spin_15s_linear_infinite_reverse]'
            }`}
          />

          {/* Radial Center Glow Field */}
          <div
            className={`absolute inset-3 rounded-full backdrop-blur-md border shadow-2xl flex items-center justify-center ${
              isDark
                ? 'bg-gradient-to-tr from-indigo-950/70 via-purple-900/30 to-slate-900/80 border-white/10'
                : 'bg-gradient-to-tr from-indigo-50/80 via-white/70 to-purple-50/80 border-slate-200/80'
            }`}
          />

          {/* Floating 3D IRIS Glass Prism Logo */}
          <div className="relative z-10 w-16 h-22 sm:w-18 sm:h-24 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <img
              src={logoImg}
              alt="IRIS Core Symbol"
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(129,140,248,0.75)] animate-[pulse_4s_ease-in-out_infinite]"
            />
          </div>
        </div>
      </div>

      {/* State Caption below Orb */}
      <div className="text-center mt-1 space-y-0.5">
        <h2
          className={`text-base sm:text-lg font-semibold tracking-wide font-['Poppins'] ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {stateText.title}
        </h2>
        <p
          className={`text-[11px] sm:text-xs font-normal tracking-wide ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {stateText.subtitle}
        </p>
      </div>
    </div>
  );
};
