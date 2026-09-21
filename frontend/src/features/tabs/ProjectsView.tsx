import React from 'react';
import { Folder, FileCode, ExternalLink } from 'lucide-react';
import { useAgentStore } from '../../stores/agent.store';

export const ProjectsView: React.FC = () => {
  const { activeProject } = useAgentStore();

  const projects = [
    {
      name: 'Avenya',
      description: 'Next-generation web application with interactive dashboard',
      files: 48,
      status: 'Active',
      lastModified: '20 mins ago',
    },
    {
      name: 'IRIS',
      description: 'Intelligent Real-time Interactive System',
      files: 132,
      status: 'Core Workspace',
      lastModified: 'Just now',
    },
  ];

  return (
    <div className="w-full max-w-4xl space-y-6 z-20">
      <div>
        <h2 className="text-xl font-semibold text-white font-['Poppins']">Projects</h2>
        <p className="text-xs text-slate-400">Workspaces currently accessible by IRIS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => (
          <div
            key={proj.name}
            className={`p-5 rounded-2xl border transition ${
              proj.name === activeProject
                ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/80 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                : 'bg-slate-900/60 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Folder className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-white/5">
                {proj.status}
              </span>
            </div>

            <h3 className="text-base font-semibold text-white mt-4">{proj.name}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{proj.description}</p>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" /> {proj.files} files
              </span>
              <span className="flex items-center gap-1 hover:text-slate-300 cursor-pointer">
                Open in VS Code <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
