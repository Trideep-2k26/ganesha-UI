import { useState, useRef, useCallback } from 'react';
import { VoiceState } from '../types';

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
  }, [updateAudioLevel]);

  const startListening = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language;

    recognitionRef.current.onstart = () => {
      setVoiceState(prev => ({
        ...prev,
        isListening: true,
        isProcessing: false
      }));
      setupAudioAnalysis();
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
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setVoiceState(prev => ({
        ...prev,
        isListening: false,
        isProcessing: false,
        audioLevel: 0
      }));
    };

    recognitionRef.current.start();
  }, [language, onTranscript, setupAudioAnalysis, updateAudioLevel]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
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