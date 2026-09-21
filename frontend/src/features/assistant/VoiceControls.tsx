import React from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { useVoiceStore } from '../../stores/voice.store';
import { useAgentStore } from '../../stores/agent.store';
import { useUIStore } from '../../stores/ui.store';

interface VoiceControlsProps {
  onToggleRecord: () => void;
  onInterrupt: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  onToggleRecord,
  onInterrupt,
}) => {
  const { isListening, isMuted, isContinuous, toggleMute } = useVoiceStore();
  const { status } = useAgentStore();
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  const isSpeaking = status === 'SPEAKING';

  return (
    <div className="flex items-center justify-center gap-8 mt-3 select-none">
      {/* Mute Button */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={toggleMute}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border shadow-sm ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              : isDark
              ? 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-white/5'
              : 'bg-white/90 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
          }`}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <MicOff className="w-4 h-4 opacity-70" />}
        </button>
        <span
          className={`text-[10px] font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Mute
        </span>
      </div>

      {/* Main Microphone Button */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={onToggleRecord}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
            isListening
              ? 'bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-500 text-white ring-4 ring-cyan-500/30 shadow-[0_0_35px_rgba(56,189,248,0.5)] scale-105'
              : 'bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white ring-2 ring-indigo-500/20 hover:ring-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.35)]'
          }`}
          aria-label={isListening ? 'Stop listening' : 'Start speaking with IRIS'}
        >
          <Mic className={`w-6 h-6 ${isListening ? 'animate-pulse' : ''}`} />
        </button>
        <span
          className={`text-[10px] font-medium ${
            isListening
              ? 'text-cyan-400 font-semibold tracking-wide'
              : isDark
              ? 'text-slate-400'
              : 'text-slate-500'
          }`}
        >
          {isListening ? (isContinuous ? 'Live (Continuous)' : 'Listening') : 'Tap to speak'}
        </span>
      </div>

      {/* Stop / Interrupt Button */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={onInterrupt}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border shadow-sm ${
            isSpeaking
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
              : isDark
              ? 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-white/5'
              : 'bg-white/90 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
          }`}
          aria-label="Stop or interrupt IRIS"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
        <span
          className={`text-[10px] font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Stop
        </span>
      </div>
    </div>
  );
};
