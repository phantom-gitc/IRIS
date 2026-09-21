
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IrisOrb } from '../features/assistant/IrisOrb';
import { VoiceControls } from '../features/assistant/VoiceControls';
import { CommandBar } from '../features/assistant/CommandBar';
import { ConversationOverlay } from '../features/assistant/ConversationOverlay';
import { ConfirmationModal } from '../features/assistant/ConfirmationModal';
import { useAgentStore } from '../stores/agent.store';
import { useVoiceStore } from '../stores/voice.store';
import { useTaskStore } from '../stores/task.store';
import { useUIStore } from '../stores/ui.store';
import { agentApi } from '../services/api/agent.api';
import { conversationsApi } from '../services/api/conversations.api';
import { confirmationsApi } from '../services/api/confirmations.api';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { audioQueuePlayer } from '../utils/audioQueue';
import type { Message } from '../types/agent.types';

export const AssistantPage: React.FC = () => {
  const { status, setStatus, conversationId, setConversationId } = useAgentStore();
  const { isListening, setListening, setSpeaking, audioLevel } = useVoiceStore();
  const { confirmation, setConfirmation } = useTaskStore();
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      role: 'assistant',
      content: "Hey boss. I'm IRIS. What are we working on today?",
      timestamp: 'Just now',
    },
  ]);

  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Hook up Web Audio API visualizer to drive IrisOrb pulse
  useAudioVisualizer(activeStream, audioRef.current, isListening || status === 'SPEAKING');

  // Connect AudioQueuePlayer to audio element for seamless queued playback
  useEffect(() => {
    if (audioRef.current) {
      audioQueuePlayer.setAudioElement(audioRef.current);
    }
    audioQueuePlayer.onPlaybackStarted(() => {
      setStatus('SPEAKING');
      setSpeaking(true);
    });
    audioQueuePlayer.onQueueFinished(() => {
      setSpeaking(false);
      if (isContinuousRef.current) {
        resumeContinuousListening();
      } else {
        setStatus('IDLE');
      }
    });
  });

  // Initialize active conversation from backend once on mount
  useEffect(() => {
    let isMounted = true;

    const initConversation = async () => {
      try {
        const activeId = useAgentStore.getState().conversationId;
        if (!activeId) {
          const res = await conversationsApi.getAll({ limit: 1 });
          if (!isMounted) return;

          if (res.conversations && res.conversations.length > 0) {
            const foundId = res.conversations[0]._id;
            setConversationId(foundId);
            const detail = await conversationsApi.getById(foundId);
            if (isMounted && detail.messages && detail.messages.length > 0) {
              setMessages(
                detail.messages.map((m) => ({
                  id: m._id || m.id || String(Date.now()),
                  role: m.role,
                  content: m.content,
                  timestamp: new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                }))
              );
            }
          } else {
            const newConv = await conversationsApi.create('New Conversation');
            if (isMounted) {
              setConversationId(newConv._id);
            }
          }
        } else {
          const detail = await conversationsApi.getById(activeId);
          if (isMounted && detail.messages && detail.messages.length > 0) {
            setMessages(
              detail.messages.map((m) => ({
                id: m._id || m.id || String(Date.now()),
                role: m.role,
                content: m.content,
                timestamp: new Date(m.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Error initializing conversation:', err);
      }
    };

    initConversation();
    return () => {
      isMounted = false;
    };
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'G O O D   M O R N I N G';
    if (hour < 18) return 'G O O D   A F T E R N O O N';
    return 'G O O D   E V E N I N G';
  })();

  const ensureActiveConversationId = async (): Promise<string> => {
    const currentId = useAgentStore.getState().conversationId;
    if (currentId) return currentId;
    const newConv = await conversationsApi.create('New Conversation');
    setConversationId(newConv._id);
    return newConv._id;
  };

  const isContinuousRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<any>(null);
  const hasSpokenRef = useRef<boolean>(false);
  const vadFrameRef = useRef<number | null>(null);
  const vadAudioCtxRef = useRef<AudioContext | null>(null);

  const { setContinuous } = useVoiceStore();

  const handleInterrupt = async () => {
    isContinuousRef.current = false;
    hasSpokenRef.current = false;
    setContinuous(false);
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;

    if (vadFrameRef.current) {
      cancelAnimationFrame(vadFrameRef.current);
      vadFrameRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    audioQueuePlayer.stop();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (activeStream) {
      activeStream.getTracks().forEach((t) => t.stop());
    }
    if (vadAudioCtxRef.current && vadAudioCtxRef.current.state !== 'closed') {
      try {
        vadAudioCtxRef.current.close();
      } catch {}
      vadAudioCtxRef.current = null;
    }

    setActiveStream(null);
    setSpeaking(false);
    setListening(false);
    setStatus('INTERRUPTED');

    if (conversationId) {
      try {
        await agentApi.interrupt(conversationId);
      } catch {}
    }

    setTimeout(() => {
      setStatus('IDLE');
    }, 400);
  };

  const resumeContinuousListening = () => {
    if (!isContinuousRef.current) return;
    setSpeaking(false);
    setListening(true);
    setStatus('LISTENING');
    hasSpokenRef.current = false;
    audioChunksRef.current = [];

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      try {
        mediaRecorderRef.current.start(250);
      } catch {}
    }
  };

  const executeVoiceTurn = async (spokenPrompt: string, audioBlob?: Blob) => {
    if (!spokenPrompt.trim() && !audioBlob) return;

    setStatus('THINKING');
    setListening(false);

    try {
      const activeId = await ensureActiveConversationId();
      const userMsgId = `u-${Date.now()}`;
      const assistantMsgId = `a-${Date.now()}`;

      if (spokenPrompt.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            id: userMsgId,
            role: 'user',
            content: spokenPrompt.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }

      const abortCtrl = new AbortController();
      abortControllerRef.current = abortCtrl;

      let hasQueuedAudio = false;
      let finalAnswerText = '';

      await agentApi.voiceStream(
        {
          conversationId: activeId,
          prompt: spokenPrompt.trim() || undefined,
          audioBlob,
          confirmationToken: confirmation?.token,
        },
        {
          onTranscription: ({ text }) => {
            if (!text) return;
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === userMsgId);
              if (exists) {
                return prev.map((m) => (m.id === userMsgId ? { ...m, content: text } : m));
              }
              return [
                ...prev,
                {
                  id: userMsgId,
                  role: 'user',
                  content: text,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ];
            });
          },

          onAcknowledgment: ({ text, audioBase64 }) => {
            // Immediate verbal acknowledgment (~250ms)
            setStatus('SPEAKING');
            setSpeaking(true);

            setMessages((prev) => {
              const exists = prev.some((m) => m.id === assistantMsgId);
              if (exists) {
                return prev.map((m) => (m.id === assistantMsgId ? { ...m, content: text } : m));
              }
              return [
                ...prev,
                {
                  id: assistantMsgId,
                  role: 'assistant',
                  content: text,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ];
            });

            if (audioBase64) {
              hasQueuedAudio = true;
              audioQueuePlayer.enqueue(audioBase64);
            }
          },

          onAnswer: (result) => {
            finalAnswerText = result.response;

            if (result.requiresConfirmation) {
              setConfirmation({
                toolName: result.requiresConfirmation.toolName,
                token: result.requiresConfirmation.token,
                riskLevel: result.requiresConfirmation.riskLevel,
              });
              setStatus('CONFIRMING');
            } else {
              setConfirmation(null);
              setStatus('SPEAKING');
              setSpeaking(true);
            }

            setMessages((prev) => {
              const exists = prev.some((m) => m.id === assistantMsgId);
              if (exists) {
                return prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: result.response,
                        toolExecuted: result.toolExecuted,
                      }
                    : m
                );
              }
              return [
                ...prev,
                {
                  id: assistantMsgId,
                  role: 'assistant',
                  content: result.response,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  toolExecuted: result.toolExecuted,
                },
              ];
            });

            if (result.audioBase64) {
              hasQueuedAudio = true;
              audioQueuePlayer.enqueue(result.audioBase64);
            }
          },

          onDone: () => {
            if (!hasQueuedAudio) {
              // If no audio was queued, immediately return to listening or idle
              setSpeaking(false);
              if (isContinuousRef.current) resumeContinuousListening();
              else setStatus('IDLE');
            }
          },

          onError: (streamErr) => {
            console.warn('Voice stream error event:', streamErr);
            setStatus('ERROR');
            setSpeaking(false);
            setTimeout(() => {
              if (isContinuousRef.current) resumeContinuousListening();
              else setStatus('IDLE');
            }, 1500);
          },
        },
        abortCtrl.signal
      );
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setStatus('ERROR');
      const errorMessage = (err as Error)?.message || 'Failed to process voice command';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'system',
          content: `Voice error: ${errorMessage}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setTimeout(() => {
        if (isContinuousRef.current) {
          resumeContinuousListening();
        } else {
          setStatus('IDLE');
        }
      }, 2500);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleToggleRecord = async () => {
    // If continuous mode is already running
    if (isContinuousRef.current || isListening) {
      // If currently recording and user spoke or chunks exist, finalize and submit immediately
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === 'recording' &&
        audioChunksRef.current.length > 0 &&
        hasSpokenRef.current
      ) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        hasSpokenRef.current = false;
        try {
          mediaRecorderRef.current.stop();
        } catch {}
        return;
      }

      // Otherwise interrupt / stop
      await handleInterrupt();
      return;
    }

    // Start Continuous Hands-Free Voice Conversation Mode
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setActiveStream(stream);
      isContinuousRef.current = true;
      hasSpokenRef.current = false;
      setContinuous(true);
      setListening(true);
      setStatus('LISTENING');

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        if (audioBlob.size > 1200 && isContinuousRef.current) {
          await executeVoiceTurn('', audioBlob);
        } else if (isContinuousRef.current && status !== 'SPEAKING' && status !== 'THINKING') {
          // Restart recorder slice if no speech was collected
          try {
            mediaRecorder.start(250);
          } catch {}
        }
      };

      mediaRecorder.start(250);

      // Initialize Web Audio VAD Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const vadCtx = new AudioCtx();
      vadAudioCtxRef.current = vadCtx;
      const analyser = vadCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = vadCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let ambientFloor = 6;
      let speechStartTime = 0;

      const checkVad = () => {
        if (!isContinuousRef.current) return;

        // Only track user speech when we are in LISTENING state
        if (mediaRecorderRef.current?.state === 'recording') {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;

          // Adaptive ambient floor tracking when quiet
          if (!hasSpokenRef.current) {
            ambientFloor = ambientFloor * 0.95 + avg * 0.05;
          }

          const speechThreshold = Math.max(11, ambientFloor + 5);
          const silenceThreshold = Math.max(6, ambientFloor + 2.5);

          // Speech sound detected
          if (avg > speechThreshold) {
            if (!hasSpokenRef.current) {
              speechStartTime = Date.now();
            }
            hasSpokenRef.current = true;
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }

            // Max speech duration safety limit (12 seconds)
            if (Date.now() - speechStartTime > 12000) {
              hasSpokenRef.current = false;
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                try {
                  mediaRecorderRef.current.stop();
                } catch {}
              }
            }
          } else if (hasSpokenRef.current && avg < silenceThreshold) {
            // User was speaking and now paused
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                if (hasSpokenRef.current && isContinuousRef.current) {
                  hasSpokenRef.current = false;
                  silenceTimerRef.current = null;
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    try {
                      mediaRecorderRef.current.stop();
                    } catch {}
                  }
                }
              }, 650);
            }
          }
        }

        vadFrameRef.current = requestAnimationFrame(checkVad);
      };

      vadFrameRef.current = requestAnimationFrame(checkVad);
    } catch (micErr) {
      console.error('Microphone access failed:', micErr);
      setStatus('ERROR');
      isContinuousRef.current = false;
      setContinuous(false);
      setTimeout(() => setStatus('IDLE'), 2000);
    }
  };

  const handleSendPrompt = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);
      setStatus('THINKING');

      try {
        const activeId = await ensureActiveConversationId();
        const result = await agentApi.chat({
          conversationId: activeId,
          prompt: trimmed,
          confirmationToken: confirmation?.token,
        });

        if (result.requiresConfirmation) {
          setConfirmation({
            toolName: result.requiresConfirmation.toolName,
            token: result.requiresConfirmation.token,
            riskLevel: result.requiresConfirmation.riskLevel,
          });
          setStatus('CONFIRMING');
        } else {
          setConfirmation(null);
        }

        setStatus('SPEAKING');
        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: result.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolExecuted: result.toolExecuted,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        setTimeout(() => {
          setStatus(result.state === 'ERROR' ? 'ERROR' : 'IDLE');
        }, 1800);
      } catch (err: unknown) {
        setStatus('ERROR');
        const errorMessage = (err as Error)?.message || 'Failed to send message';
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'system',
            content: `Error: ${errorMessage}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setTimeout(() => setStatus('IDLE'), 3000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confirmation]
  );

  const handleConfirmAction = async () => {
    if (!confirmation) return;
    const token = confirmation.token;
    try {
      await confirmationsApi.approve(token);
      setConfirmation(null);
      handleSendPrompt(`Confirmed: Proceed with token ${token}`);
    } catch (e) {
      console.error('Failed to approve confirmation:', e);
    }
  };

  const handleCancelAction = async () => {
    if (!confirmation) return;
    const token = confirmation.token;
    try {
      await confirmationsApi.reject(token);
    } catch (e) {
      console.error('Failed to reject confirmation:', e);
    } finally {
      setConfirmation(null);
      setStatus('IDLE');
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center relative">
      <audio ref={audioRef} />

      {/* Top Greeting Header */}
      <div className="text-center space-y-0.5 z-20 mt-1 shrink-0">
        <p
          className={`text-[10px] font-semibold tracking-[0.25em] font-['Poppins'] ${
            isDark ? 'text-indigo-300' : 'text-indigo-600'
          }`}
        >
          {greeting}
        </p>
        <h2
          className={`text-3xl sm:text-4xl font-bold tracking-tight font-['Poppins'] ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          I'm{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500">
            IRIS
          </span>
        </h2>
        <p
          className={`text-xs font-normal tracking-wide ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Think. Plan. Build. I'm here with you.
        </p>
      </div>

      {/* Floating Quote on Right */}
      <div className="hidden xl:block absolute right-6 top-12 w-44 text-right z-10 pointer-events-none">
        <p
          className={`text-xs font-serif italic leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          “A more capable you. Every day.”
        </p>
        <p
          className={`text-[9px] font-mono tracking-widest mt-1 uppercase ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          — IRIS
        </p>
      </div>

      {/* Central IRIS Orb & Voice Controls */}
      <div className="my-auto flex flex-col items-center justify-center z-20 shrink-0">
        <IrisOrb state={status} audioLevel={audioLevel} onClick={handleToggleRecord} />
        <VoiceControls onToggleRecord={handleToggleRecord} onInterrupt={handleInterrupt} />
      </div>

      {/* Floating Conversation Overlay on the Right */}
      <ConversationOverlay messages={messages} />

      {/* Bottom Compact Command Bar & Action Chips */}
      <CommandBar
        onSubmit={handleSendPrompt}
        disabled={status === 'PLANNING' || status === 'EXECUTING'}
      />

      {/* Confirmation Modal if approval is needed */}
      {confirmation && (
        <ConfirmationModal
          confirmation={confirmation}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
        />
      )}
    </div>
  );
};
