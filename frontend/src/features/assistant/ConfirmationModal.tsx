import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ConfirmationRequest } from '../../types/agent.types';

interface ConfirmationModalProps {
  confirmation: ConfirmationRequest;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  confirmation,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Confirmation Required</h3>
            <p className="text-xs text-slate-400">IRIS requires explicit approval to proceed</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5 text-xs text-slate-300">
          <p>
            <span className="text-slate-500">Requested Action:</span>{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
              {confirmation.toolName}
            </code>
          </p>
          {confirmation.description && (
            <p className="text-slate-400">{confirmation.description}</p>
          )}
          {confirmation.riskLevel && (
            <p className="text-amber-400 text-[11px] font-medium uppercase tracking-wider">
              Risk Level: {confirmation.riskLevel}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-md shadow-indigo-600/30"
          >
            Confirm & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};
