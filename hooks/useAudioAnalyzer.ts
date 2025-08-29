
import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioAnalyzer = () => {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    sourceNodeRef.current?.disconnect();
    sourceNodeRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
       // Do not close context for microphone, it might be reused.
       // It's generally better to suspend and resume for better performance.
    }
    setAnalyser(null);
    setIsPlaying(false);
  }, []);

  const setupAudio = useCallback(async (source: 'file' | 'microphone', file?: File) => {
    cleanup();
    setError(null);
    
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            setError("Web Audio API is not supported in this browser.");
            return;
        }
    }
    
    const context = audioContextRef.current;
    if (context.state === 'suspended') {
        await context.resume();
    }

    const newAnalyser = context.createAnalyser();
    newAnalyser.fftSize = 2048;
    setAnalyser(newAnalyser);

    try {
      if (source === 'file' && file) {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.crossOrigin = "anonymous";
        }
        audioRef.current.src = URL.createObjectURL(file);
        sourceNodeRef.current = context.createMediaElementSource(audioRef.current);
        sourceNodeRef.current.connect(newAnalyser);
        newAnalyser.connect(context.destination);
        
        audioRef.current.onended = () => {
            setIsPlaying(false);
            cleanup();
        };

        await audioRef.current.play();
        setIsPlaying(true);
      } else if (source === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        sourceNodeRef.current = context.createMediaStreamSource(stream);
        sourceNodeRef.current.connect(newAnalyser);
        // Do not connect mic input to destination to avoid feedback
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Error setting up audio:", err);
      setError("Could not access the audio source. Please check permissions and try again.");
      cleanup();
    }
  }, [cleanup]);

  const stopAudio = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
      if(audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, [cleanup]);

  return { analyser, isPlaying, error, setupAudio, stopAudio, audioRef };
};
