import { useEffect, useRef } from 'react';
import { useVoiceStore } from '../stores/voice.store';

export const useAudioVisualizer = (
  stream: MediaStream | null,
  audioElement: HTMLAudioElement | null,
  isActive: boolean
) => {
  const setAudioLevel = useVoiceStore((s) => s.setAudioLevel);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || (!stream && !audioElement)) {
      setAudioLevel(0);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }

      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      if (stream) {
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;
      } else if (audioElement) {
        try {
          const source = audioCtx.createMediaElementSource(audioElement);
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          sourceRef.current = source;
        } catch {
          // If already connected, catch and ignore
        }
      }

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Normalize between 0 and 1 with a scale factor
        const normalized = Math.min(1, avg / 64);
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(checkLevel);
      };

      animFrameRef.current = requestAnimationFrame(checkLevel);
    } catch (e) {
      console.warn('Audio visualizer init error:', e);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setAudioLevel(0);
    };
  }, [stream, audioElement, isActive, setAudioLevel]);
};
