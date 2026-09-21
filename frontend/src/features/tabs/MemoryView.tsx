import React, { useState } from 'react';
import { Bookmark, Tag, Trash2, Plus, Search, RefreshCw, X } from 'lucide-react';
import { useMemories, useCreateMemory, useDeleteMemory } from '../../hooks/queries';
import type { MemoryItem, MemoryType } from '../../services/api/memories.api';

const MEMORY_TYPES: { id: MemoryType | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'PERSONAL_MEMORY', label: 'Personal' },
  { id: 'PROJECT_MEMORY', label: 'Projects' },
  { id: 'CONVERSATION_MEMORY', label: 'Conversations' },
  { id: 'WORKING_MEMORY', label: 'Working' },
  { id: 'EPISODIC_MEMORY', label: 'Episodic' },
];

export const MemoryView: React.FC = () => {
  const [selectedType, setSelectedType] = useState<MemoryType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<MemoryType>('PERSONAL_MEMORY');
  const [newImportance, setNewImportance] = useState(5);
  const [newTags, setNewTags] = useState('');

  const {
    data: memories,
    isLoading,
    isError,
    error,
    refetch,
  } = useMemories({
    memoryType: selectedType === 'ALL' ? undefined : selectedType,
    query: searchQuery || undefined,
  });

  const createMemoryMutation = useCreateMemory();
  const deleteMemoryMutation = useDeleteMemory();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      await createMemoryMutation.mutateAsync({
        content: newContent.trim(),
        memoryType: newType,
        importance: newImportance,
        tags: newTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setNewContent('');
      setNewTags('');
      setIsAdding(false);
    } catch {
      // Error handled by react-query
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this memory?')) return;
    try {
      await deleteMemoryMutation.mutateAsync(id);
    } catch {
      // Error handled by react-query
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6 z-20 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white font-['Poppins']">Memory</h2>
          <p className="text-xs text-slate-400">Context, preferences, and details IRIS remembers</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isAdding ? 'Cancel' : 'Add Memory'}
        </button>
      </div>

      {/* Add Memory Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 space-y-4 shadow-xl backdrop-blur-md"
        >
          <h3 className="text-sm font-semibold text-white">Create New Memory</h3>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Content</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Enter context, user fact, preference, or project detail..."
              rows={3}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Memory Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as MemoryType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
              >
                <option value="PERSONAL_MEMORY">Personal</option>
                <option value="PROJECT_MEMORY">Project</option>
                <option value="CONVERSATION_MEMORY">Conversation</option>
                <option value="WORKING_MEMORY">Working</option>
                <option value="EPISODIC_MEMORY">Episodic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Importance ({newImportance}/10)
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={newImportance}
                onChange={(e) => setNewImportance(Number(e.target.value))}
                className="w-full mt-2 accent-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="e.g. tone, workspace, ui"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMemoryMutation.isPending}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50"
            >
              {createMemoryMutation.isPending ? 'Saving...' : 'Save Memory'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {MEMORY_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedType === t.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-white/5 text-center text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
          Loading memories...
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <span>Failed to load memories: {(error as Error)?.message || 'Unknown error'}</span>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (!memories || memories.length === 0) && (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-white/5 text-center text-slate-400">
          <Bookmark className="w-8 h-8 mx-auto mb-3 text-slate-600" />
          <p className="text-sm font-medium text-slate-300">No memories found</p>
          <p className="text-xs text-slate-500 mt-1">
            IRIS automatically retains context and preferences here, or you can add custom ones above.
          </p>
        </div>
      )}

      {!isLoading && !isError && memories && memories.length > 0 && (
        <div className="grid gap-3">
          {memories.map((mem: MemoryItem) => {
            const memoryId = mem._id || mem.id || '';
            const typeLabel = mem.memoryType.replace('_MEMORY', '').toLowerCase();

            return (
              <div
                key={memoryId}
                className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/5 space-y-2 hover:border-white/10 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 capitalize">
                    <Bookmark className="w-3.5 h-3.5 text-indigo-400" /> {typeLabel}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Importance: {mem.importance}/10
                    </span>
                    <button
                      onClick={() => handleDelete(memoryId)}
                      disabled={deleteMemoryMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-200">{mem.content}</p>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {mem.tags &&
                      mem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 border border-white/5 flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-500" /> {tag}
                        </span>
                      ))}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(mem.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
