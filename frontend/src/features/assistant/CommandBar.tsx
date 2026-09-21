import React, { useState } from 'react';
import {
  Plus,
  ArrowRight,
  AudioLines,
  Code,
  FileText,
  Globe,
  Maximize2,
} from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';

interface CommandBarProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

const actionChips = [
  { label: 'Open VS Code', icon: Code, prompt: 'Open VS Code and check the workspace' },
  { label: 'Create a new project', icon: FileText, prompt: 'Create a new project' },
  { label: 'Search the web', icon: Globe, prompt: 'Search the web for latest AI news' },
  { label: 'Take a screenshot', icon: Maximize2, prompt: 'Check system status and display telemetry' },
];

export const CommandBar: React.FC<CommandBarProps> = ({ onSubmit, disabled }) => {
  const [input, setInput] = useState('');
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSubmit(input.trim());
    setInput('');
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-2.5 z-20 shrink-0 mb-1">
      {/* Main Command Bar Input Pill */}
      <form
        onSubmit={handleSubmit}
        className={`w-full h-12 rounded-full border px-3 flex items-center gap-2.5 transition-all shadow-lg ${
          isDark
            ? 'bg-slate-900/80 border-white/10 backdrop-blur-xl focus-within:border-indigo-500/50 shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 border-slate-200 backdrop-blur-xl focus-within:border-indigo-500/60 shadow-[0_8px_25px_rgba(0,0,0,0.06)]'
        }`}
      >
        {/* Plus Button */}
        <button
          type="button"
          className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
            isDark
              ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800'
          }`}
          aria-label="Add attachment or action"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask IRIS anything..."
          disabled={disabled}
          className={`flex-1 bg-transparent text-xs sm:text-sm font-normal focus:outline-none ${
            isDark
              ? 'text-slate-100 placeholder:text-slate-500'
              : 'text-slate-900 placeholder:text-slate-400'
          }`}
        />

        {/* Audio Waveform Indicator */}
        <div
          className={`cursor-pointer p-1 transition-colors ${
            isDark ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <AudioLines className="w-3.5 h-3.5" />
        </div>

        {/* Send Arrow Button */}
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition shadow-md shadow-indigo-600/30 shrink-0"
          aria-label="Send message to IRIS"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Action Chips Row */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {actionChips.map((chip, idx) => {
          const Icon = chip.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSubmit(chip.prompt)}
              className={`h-7 px-3 rounded-full border text-[11px] font-medium flex items-center gap-1.5 transition backdrop-blur-sm shadow-xs ${
                isDark
                  ? 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white border-white/5 hover:border-white/10'
                  : 'bg-white/90 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <Icon
                className={`w-3 h-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
