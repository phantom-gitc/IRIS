import React, { useState } from 'react';
import { useConversations, useDeleteConversation } from '../hooks/queries';
import { useAgentStore } from '../stores/agent.store';
import { useUIStore } from '../stores/ui.store';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Trash2, Plus, Calendar, Clock, RefreshCw } from 'lucide-react';
import { conversationsApi, type Conversation } from '../services/api/conversations.api';

export const ConversationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useConversations();
  const deleteMutation = useDeleteConversation();
  const { setConversationId } = useAgentStore();
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  const [isCreating, setCreating] = useState(false);

  const conversations = data?.conversations || [];

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      const newConv = await conversationsApi.create('New Conversation');
      const newId = newConv._id || newConv.id || '';
      if (newId) setConversationId(newId);
      navigate('/assistant');
    } catch {
      // Fallback redirect
      navigate('/assistant');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenConversation = (conv: Conversation) => {
    const convId = conv._id || conv.id || '';
    if (convId) setConversationId(convId);
    navigate('/assistant');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`text-2xl font-bold font-['Poppins'] ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Conversations
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Revisit, resume, or manage historical dialogs with IRIS
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          disabled={isCreating}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? 'Creating...' : 'New Session'}
        </button>
      </div>

      {/* Conversations List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading conversation history...</p>
          </div>
        )}

        {isError && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
            <p className="text-xs text-rose-300">
              Unable to load conversations. Please verify your connection.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium inline-flex items-center gap-2 hover:bg-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                No conversations yet
              </h3>
              <p className={`text-xs max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Talk to IRIS via voice or text in the Assistant view to begin your first dialogue session.
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Start Talking with IRIS
            </button>
          </div>
        )}

        {!isLoading &&
          !isError &&
          conversations.map((conv) => {
            const convId = conv._id || conv.id || '';
            return (
              <div
                key={convId}
                onClick={() => handleOpenConversation(conv)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isDark
                    ? 'bg-slate-900/60 hover:bg-slate-900/90 border-white/5 hover:border-indigo-500/30 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-300 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="truncate space-y-1">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {conv.title || 'Untitled Session'}
                    </h4>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {conv.messageCount} messages
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(e, convId)}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
