import { useState, useRef, useCallback } from 'react';
import { VoiceState } from '../types';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface UseVoiceRecognitionReturn {
  voiceState: VoiceState;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

const useVoiceRecognition = (
  onTranscript: (transcript: string) => void,
  language: string = 'en-US'
): UseVoiceRecognitionReturn => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    audioLevel: 0
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const shouldRestartRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<number | null>(null);
  const analysisSetupDoneRef = useRef<boolean>(false);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    const normalizedLevel = Math.min(average / 128, 1);

    setVoiceState(prev => ({
      ...prev,
      audioLevel: normalizedLevel
    }));

    if (voiceState.isListening) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [voiceState.isListening]);

  const setupAudioAnalysis = useCallback(async () => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      updateAudioLevel();
      analysisSetupDoneRef.current = true;
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          alert('Microphone permission denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        }
      }
    }
  }, [updateAudioLevel]);

  const startListening = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    // Mark that we want to keep recognition alive until explicitly stopped
    shouldRestartRef.current = true;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    if (!recognitionRef.current) return;
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language;

    recognitionRef.current.onstart = () => {
      setVoiceState(prev => ({
        ...prev,
        isListening: true,
        isProcessing: false
      }));
      // Only set up audio analysis once per session; keep it alive across restarts
      if (!analysisSetupDoneRef.current) {
        setupAudioAnalysis();
      } else if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        // Mobile Safari may suspend the context; resume it on user gesture
        audioContextRef.current.resume().catch(() => {});
      }
    };

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setVoiceState(prev => ({
          ...prev,
          isProcessing: true
        }));
        
        onTranscript(finalTranscript.trim());
      }
    };

    recognitionRef.current.onend = () => {
      // Auto-restart on mobile if recognition stops unexpectedly
      if (shouldRestartRef.current) {
        // Keep UI in listening state and re-start after a short delay
        setVoiceState(prev => ({ ...prev, isListening: true, isProcessing: false }));
        if (restartTimeoutRef.current) window.clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = window.setTimeout(() => {
          try { recognitionRef.current?.start(); } catch {}
        }, 300);
        return;
      }

      // Full cleanup only when explicitly stopped by user
      setVoiceState(prev => ({
        ...prev,
        isListening: false,
        isProcessing: false,
        audioLevel: 0
      }));
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      analysisSetupDoneRef.current = false;
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      // Common transient errors on mobile: 'no-speech', 'network', 'audio-capture'
      if (shouldRestartRef.current && event.error !== 'aborted') {
        if (restartTimeoutRef.current) window.clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = window.setTimeout(() => {
          try { recognitionRef.current?.start(); } catch {}
        }, 500);
        return;
      }

      // Otherwise, treat as stopped
      setVoiceState(prev => ({ ...prev, isListening: false, isProcessing: false, audioLevel: 0 }));
    };

    try {
      recognitionRef.current.start();
    } catch {
      // Sometimes start can throw InvalidStateError; retry shortly
      restartTimeoutRef.current = window.setTimeout(() => {
        try { recognitionRef.current?.start(); } catch {}
      }, 200);
    }
  }, [language, onTranscript, setupAudioAnalysis, updateAudioLevel]);

  const stopListening = useCallback(() => {
    // Signal that we no longer want to auto-restart
    shouldRestartRef.current = false;
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (voiceState.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [voiceState.isListening, startListening, stopListening]);

  return {
    voiceState,
    startListening,
    stopListening,
    toggleListening
  };
};

export default useVoiceRecognition;