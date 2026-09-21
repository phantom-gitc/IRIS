import React from 'react';
import { Code, GitBranch, Radio, Terminal, Sparkles } from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const integrations = [
    { name: 'VS Code', status: 'Connected', icon: Code, desc: 'Filesystem and workspace inspection' },
    { name: 'Git Engine', status: 'Active', icon: GitBranch, desc: 'Branch status, diff inspection, commit history' },
    { name: 'LiveKit Cloud', status: 'Connected', icon: Radio, desc: 'Realtime WebRTC voice and turn detection' },
    { name: 'System Terminal', status: 'Sandboxed', icon: Terminal, desc: 'Secure command policy engine with confirmation' },
    { name: 'Groq & Gemini', status: 'Ready', icon: Sparkles, desc: 'Ultra-low latency LLM and STT transcription' },
  ];

  return (
    <div className="w-full max-w-4xl space-y-6 z-20">
      <div>
        <h2 className="text-xl font-semibold text-white font-['Poppins']">Integrations</h2>
        <p className="text-xs text-slate-400">Connected tools and external agent services</p>
      </div>

      <div className="grid gap-3">
        {integrations.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.name}
              className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{tool.name}</p>
                  <p className="text-xs text-slate-500">{tool.desc}</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                {tool.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
