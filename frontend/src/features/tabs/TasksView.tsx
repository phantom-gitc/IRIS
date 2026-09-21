import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Ban,
  Wrench,
} from 'lucide-react';
import { useTasks, useCancelTask } from '../../hooks/queries';
import type { TaskItem, TaskStatus } from '../../services/api/tasks.api';

export const TasksView: React.FC = () => {
  const { data: tasks, isLoading, isError, error, refetch } = useTasks();
  const cancelTaskMutation = useCancelTask();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'RUNNING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 animate-pulse">
            <PlayCircle className="w-3.5 h-3.5" /> Running
          </span>
        );
      case 'PLANNING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Planning
          </span>
        );
      case 'WAITING_CONFIRMATION':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Needs Confirmation
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30 flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-white/10 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  const handleCancel = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    try {
      await cancelTaskMutation.mutateAsync(taskId);
    } catch {
      // Handled by react-query
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6 z-20 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white font-['Poppins']">Tasks</h2>
          <p className="text-xs text-slate-400">Computer tasks and automation executions</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          title="Refresh tasks"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-white/5 text-center text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
          Loading tasks...
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <span>Failed to load tasks: {(error as Error)?.message || 'Unknown error'}</span>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (!tasks || tasks.length === 0) && (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-white/5 text-center text-slate-400">
          <Clock className="w-8 h-8 mx-auto mb-3 text-slate-600" />
          <p className="text-sm font-medium text-slate-300">No tasks recorded</p>
          <p className="text-xs text-slate-500 mt-1">
            Tasks executed by IRIS during conversations will be displayed here in real time.
          </p>
        </div>
      )}

      {!isLoading && !isError && tasks && tasks.length > 0 && (
        <div className="grid gap-3">
          {tasks.map((task: TaskItem) => {
            const taskId = task._id || task.id || '';
            const isExpanded = expandedTaskId === taskId;
            const canCancel = ['PENDING', 'PLANNING', 'RUNNING', 'WAITING_CONFIRMATION'].includes(
              task.status
            );

            return (
              <div
                key={taskId}
                onClick={() => setExpandedTaskId(isExpanded ? null : taskId)}
                className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 transition hover:border-white/10 cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {task.status === 'COMPLETED' ? (
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : task.status === 'RUNNING' || task.status === 'PLANNING' ? (
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <PlayCircle className="w-4 h-4 animate-pulse" />
                        </div>
                      ) : task.status === 'FAILED' ? (
                        <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                          <XCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-white/5 flex items-center justify-center text-slate-400">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span>{new Date(task.createdAt).toLocaleString()}</span>
                        {task.steps && task.steps.length > 0 && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Wrench className="w-3 h-3" /> {task.steps.length} step{task.steps.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {getStatusBadge(task.status)}

                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-semibold text-indigo-300 font-mono">
                        {task.progress}%
                      </span>
                      <div className="w-20 h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>

                    {canCancel && (
                      <button
                        onClick={(e) => handleCancel(e, taskId)}
                        disabled={cancelTaskMutation.isPending}
                        className="px-2.5 py-1 rounded-lg text-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition flex items-center gap-1"
                        title="Cancel task"
                      >
                        <Ban className="w-3 h-3" /> Cancel
                      </button>
                    )}

                    <div className="text-slate-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    {task.description && (
                      <p className="text-xs text-slate-300">{task.description}</p>
                    )}

                    {task.error && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                        {task.error.message || JSON.stringify(task.error)}
                      </div>
                    )}

                    {task.steps && task.steps.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-400">Execution Steps</p>
                        <div className="space-y-1.5">
                          {task.steps.map((step, idx) => (
                            <div
                              key={step.id || idx}
                              className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono">
                                  {idx + 1}
                                </span>
                                <span className="text-slate-300">{step.title}</span>
                                {step.toolName && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono">
                                    {step.toolName}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-mono ${
                                  step.status === 'COMPLETED'
                                    ? 'text-emerald-400'
                                    : step.status === 'RUNNING'
                                    ? 'text-indigo-400'
                                    : step.status === 'FAILED'
                                    ? 'text-rose-400'
                                    : 'text-slate-500'
                                }`}
                              >
                                {step.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
