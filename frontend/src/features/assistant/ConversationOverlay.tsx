import React from 'react';
import type { Message } from '../../types/agent.types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';

interface ConversationOverlayProps {
  messages: Message[];
  onClose?: () => void;
}

export const ConversationOverlay: React.FC<ConversationOverlayProps> = ({ messages }) => {
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  if (messages.length === 0) return null;

  return (
    <div className="absolute top-16 right-8 w-72 max-h-[360px] flex flex-col gap-2 z-20 pointer-events-auto overflow-y-auto pr-1">
      {messages.slice(-3).map((msg) => (
        <div
          key={msg.id}
          className={`p-3 rounded-2xl backdrop-blur-xl border text-xs leading-relaxed transition-all shadow-md ${
            msg.role === 'user'
              ? 'bg-indigo-600/30 text-white border-indigo-500/30 self-end max-w-[90%]'
              : isDark
              ? 'bg-slate-900/85 text-slate-200 border-white/10 self-start max-w-[95%]'
              : 'bg-white/95 text-slate-800 border-slate-200/90 self-start max-w-[95%] shadow-sm'
          }`}
        >
          <p className="font-normal">{msg.content}</p>

          {/* Tool Result Badge */}
          {msg.toolExecuted && (
            <div
              className={`mt-1.5 pt-1.5 border-t flex items-center gap-1.5 text-[11px] ${
                isDark ? 'border-white/10' : 'border-slate-100'
              }`}
            >
              {msg.toolExecuted.success ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
              )}
              <span
                className={`font-mono font-medium truncate ${
                  isDark ? 'text-cyan-300' : 'text-indigo-600'
                }`}
              >
                {msg.toolExecuted.toolName}
              </span>
              <span className="text-slate-400 text-[10px] truncate">
                {msg.toolExecuted.summary}
              </span>
            </div>
          )}

          <div
            className={`text-[9px] text-right mt-1 font-mono ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {msg.timestamp}
          </div>
        </div>
      ))}
    </div>
  );
};
