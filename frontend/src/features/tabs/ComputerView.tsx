import React from 'react';
import { Cpu, HardDrive, Shield } from 'lucide-react';

export const ComputerView: React.FC = () => {
  return (
    <div className="w-full max-w-4xl space-y-6 z-20">
      <div>
        <h2 className="text-xl font-semibold text-white font-['Poppins']">Computer Environment</h2>
        <p className="text-xs text-slate-400">System telemetry and local executor permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 space-y-2">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Processor</span>
          </div>
          <p className="text-xl font-semibold text-white">8 Cores</p>
          <p className="text-[11px] text-slate-500">AMD / Intel Architecture</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 space-y-2">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Memory Available</span>
          </div>
          <p className="text-xl font-semibold text-white">12.4 GB</p>
          <p className="text-[11px] text-slate-500">Fast local execution memory</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 space-y-2">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Security Sandbox</span>
          </div>
          <p className="text-xl font-semibold text-emerald-400">Protected</p>
          <p className="text-[11px] text-slate-500">Permission engine enforcing boundaries</p>
        </div>
      </div>
    </div>
  );
};
