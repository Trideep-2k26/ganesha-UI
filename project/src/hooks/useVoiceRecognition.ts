import { useState, useRef, useCallback, useEffect } from 'react';
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
  isMobileSupported: boolean;
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
  const isStartingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const silenceTimeoutRef = useRef<number | null>(null);

  // Detect if we're on mobile and check support
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isMobileSupported = isMobile && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Mobile-specific timeout for no-speech scenarios
  const MOBILE_TIMEOUT = 8000; // 8 seconds
  const RESTART_DELAY = isMobile ? 500 : 1000; // Shorter delay on mobile

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

    // Update last speech time if we detect audio
    if (normalizedLevel > 0.01) {
      lastSpeechTimeRef.current = Date.now();
    }

    if (voiceState.isListening) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [voiceState.isListening]);

  const setupAudioAnalysis = useCallback(async () => {
    try {
      // Check if we already have a working stream
      if (streamRef.current && streamRef.current.active) {
        console.log('Reusing existing audio stream');
        return;
      }

      console.log('Setting up audio analysis...');

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }

      // Progressive fallback for audio constraints
      let constraints;
      
      if (isMobile) {
        // Minimal constraints for mobile
        constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };
      } else {
        // More advanced constraints for desktop
        constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: { ideal: 44100, min: 16000 },
            channelCount: { ideal: 1 }
          }
        };
      }

      console.log('Requesting microphone access with constraints:', constraints);
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintError) {
        console.warn('Failed with advanced constraints, trying basic audio:', constraintError);
        // Fallback to basic audio request
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      if (!stream || stream.getTracks().length === 0) {
        throw new Error('No audio tracks in stream');
      }

      console.log('Audio stream obtained successfully');
      streamRef.current = stream;

      // Check if audio context is supported
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.warn('AudioContext not supported, skipping audio analysis');
        analysisSetupDoneRef.current = true;
        lastSpeechTimeRef.current = Date.now();
        return;
      }
      
      // Create or reuse audio context
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        try {
          audioContextRef.current = new AudioContext();
          console.log('Created new AudioContext');
        } catch (audioError) {
          console.warn('Failed to create AudioContext, continuing without audio analysis:', audioError);
          analysisSetupDoneRef.current = true;
          lastSpeechTimeRef.current = Date.now();
          return;
        }
      }
      
      // Resume audio context if suspended (critical for mobile)
      if (audioContextRef.current.state === 'suspended') {
        console.log('Resuming suspended AudioContext...');
        await audioContextRef.current.resume();
      }
      
      // Set up audio analysis nodes
      try {
        if (!analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = isMobile ? 128 : 256;
          analyserRef.current.smoothingTimeConstant = 0.8;
        }
        
        if (microphoneRef.current) {
          microphoneRef.current.disconnect();
        }
        microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
        microphoneRef.current.connect(analyserRef.current);
        
        console.log('Audio analysis nodes connected successfully');
        updateAudioLevel();
      } catch (analysisError) {
        console.warn('Failed to set up audio analysis, continuing without it:', analysisError);
      }
      
      analysisSetupDoneRef.current = true;
      lastSpeechTimeRef.current = Date.now();
      
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
      analysisSetupDoneRef.current = false;
      
      let errorMessage = 'Microphone access error: ';
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage += 'Permission denied. Please click "Allow" when prompted for microphone access.';
            break;
          case 'NotFoundError':
            errorMessage += 'No microphone found. Please connect a microphone and try again.';
            break;
          case 'NotReadableError':
            errorMessage += 'Microphone is busy. Please close other apps using the microphone.';
            break;
          case 'OverconstrainedError':
            errorMessage += 'Microphone constraints not supported. Trying with basic settings...';
            // Try again with basic constraints
            setTimeout(() => {
              if (shouldRestartRef.current) {
                setupAudioAnalysis();
              }
            }, 1000);
            return;
          case 'SecurityError':
            errorMessage += 'Security error. Please ensure you\'re using HTTPS.';
            break;
          case 'InvalidAccessError':
            errorMessage += 'Invalid access to microphone. Please refresh the page and try again.';
            break;
          default:
            errorMessage += `${error.name}: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred';
      }
      
      console.error('Audio setup error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: false, 
        isProcessing: false,
        audioLevel: 0
      }));
      
      // Show user-friendly error message
      alert(errorMessage);
      
      // Clean up any partial setup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [updateAudioLevel, isMobile, shouldRestartRef]);

  // Mobile-specific silence detection
  const startSilenceTimeout = useCallback(() => {
    if (!isMobile) return;
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    silenceTimeoutRef.current = window.setTimeout(() => {
      console.log('Mobile silence timeout - restarting recognition');
      if (shouldRestartRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }, MOBILE_TIMEOUT);
  }, [isMobile]);

  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const startListening = useCallback(async () => {
    console.log('Starting voice recognition...');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      const browserName = isMobile ? 'Chrome or Safari' : 'Chrome, Safari, or Edge';
      alert(`Voice recognition is not supported in this browser. Please use ${browserName}.`);
      return;
    }

    // Prevent multiple simultaneous starts
    if (isStartingRef.current) {
      console.log('Already starting, skipping...');
      return;
    }
    
    // Check if we're already listening
    if (voiceState.isListening) {
      console.log('Already listening, skipping...');
      return;
    }

    isStartingRef.current = true;

    try {
      // Clear any existing timeouts
      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      clearSilenceTimeout();

      // Mark that we want to keep recognition alive until explicitly stopped
      shouldRestartRef.current = true;

      // Set up audio analysis first (required for permissions)
      console.log('Setting up audio before speech recognition...');
      await setupAudioAnalysis();
      
      // Check if audio setup failed
      if (!analysisSetupDoneRef.current) {
        console.error('Audio setup failed, cannot start speech recognition');
        isStartingRef.current = false;
        shouldRestartRef.current = false;
        return;
      }
      
      // Longer delay for mobile to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, isMobile ? 300 : 100));

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      // Clean up existing recognition
      if (recognitionRef.current) {
        console.log('Cleaning up existing recognition...');
        try {
          recognitionRef.current.stop();
        } catch {}
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('Creating new SpeechRecognition instance...');
      recognitionRef.current = new SpeechRecognition();
      
      if (!recognitionRef.current) {
        throw new Error('Failed to create SpeechRecognition instance');
      }
      
      // Mobile-optimized settings
      recognitionRef.current.continuous = false; // Keep false for mobile stability
      recognitionRef.current.interimResults = !isMobile; // Disable interim results on mobile
      recognitionRef.current.lang = language;

      console.log('Speech recognition configured:', {
        continuous: recognitionRef.current.continuous,
        interimResults: recognitionRef.current.interimResults,
        language: recognitionRef.current.lang
      });

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started successfully');
        isStartingRef.current = false;
        setVoiceState(prev => ({
          ...prev,
          isListening: true,
          isProcessing: false
        }));
        
        // Resume audio context if suspended (critical for mobile)
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          console.log('Resuming audio context on start...');
          audioContextRef.current.resume().catch(console.warn);
        }
        
        // Start silence detection for mobile
        startSilenceTimeout();
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        console.log('Speech recognition result received, event:', event);
        clearSilenceTimeout();
        
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          console.log(`Result ${i}:`, {
            transcript,
            confidence,
            isFinal: event.results[i].isFinal
          });
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          console.log('Final transcript:', finalTranscript);
          setVoiceState(prev => ({
            ...prev,
            isProcessing: true
          }));
          
          onTranscript(finalTranscript.trim());
          
          // Stop after getting result to prevent continuous listening issues
          shouldRestartRef.current = false;
          try {
            recognitionRef.current?.stop();
          } catch {}
        } else if (interimTranscript.trim() && !isMobile) {
          // Only show interim results on desktop
          console.log('Interim transcript:', interimTranscript);
          // Restart silence timeout if we have interim results
          startSilenceTimeout();
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended, shouldRestart:', shouldRestartRef.current, 'isProcessing:', voiceState.isProcessing);
        isStartingRef.current = false;
        clearSilenceTimeout();
        
        // Only auto-restart if we haven't received a result and user wants to keep listening
        if (shouldRestartRef.current && !voiceState.isProcessing) {
          console.log('Auto-restarting recognition...');
          if (restartTimeoutRef.current) window.clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = window.setTimeout(() => {
            if (shouldRestartRef.current && !isStartingRef.current) {
              startListening();
            }
          }, RESTART_DELAY);
          return;
        }

        // Full cleanup when stopping
        console.log('Stopping voice recognition completely');
        setVoiceState(prev => ({
          ...prev,
          isListening: false,
          isProcessing: false,
          audioLevel: 0
        }));
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        isStartingRef.current = false;
        clearSilenceTimeout();
        
        // Handle specific errors
        if (event.error === 'not-allowed') {
          shouldRestartRef.current = false;
          setVoiceState(prev => ({ ...prev, isListening: false, isProcessing: false }));
          alert('Microphone access denied. Please enable microphone permissions and refresh the page.');
          return;
        }
        
        if (event.error === 'no-speech') {
          console.log('No speech detected, will restart...');
          // Continue listening on no-speech (common on mobile)
          if (shouldRestartRef.current) {
            if (restartTimeoutRef.current) window.clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = window.setTimeout(() => {
              if (shouldRestartRef.current && !isStartingRef.current) {
                startListening();
              }
            }, RESTART_DELAY);
          }
          return;
        }
        
        if (event.error === 'aborted') {
          // User stopped, don't restart
          console.log('Recognition aborted by user');
          shouldRestartRef.current = false;
          setVoiceState(prev => ({ ...prev, isListening: false, isProcessing: false }));
          return;
        }
        
        // For network/audio errors, try to restart with backoff
        if (shouldRestartRef.current && ['network', 'audio-capture', 'service-not-allowed'].includes(event.error)) {
          console.log(`Restarting due to ${event.error} error`);
          if (restartTimeoutRef.current) window.clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = window.setTimeout(() => {
            if (shouldRestartRef.current && !isStartingRef.current) {
              startListening();
            }
          }, RESTART_DELAY * 2);
          return;
        }

        // Otherwise, stop listening
        console.log('Stopping due to unrecoverable error:', event.error);
        shouldRestartRef.current = false;
        setVoiceState(prev => ({ ...prev, isListening: false, isProcessing: false, audioLevel: 0 }));
        
        // Show user-friendly error message for unhandled errors
        if (!['no-speech', 'aborted'].includes(event.error)) {
          alert(`Speech recognition error: ${event.error}. Please try again.`);
        }
      };

      console.log('Starting speech recognition...');
      recognitionRef.current.start();
      
    } catch (error) {
      console.error('Failed to start recognition:', error);
      isStartingRef.current = false;
      shouldRestartRef.current = false;
      
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: false, 
        isProcessing: false, 
        audioLevel: 0 
      }));
      
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to start voice recognition: ${error.message}`);
      } else {
        alert('Failed to start voice recognition. Please try again.');
      }
      
      // Retry with delay if it's a recoverable error
      if (shouldRestartRef.current && error instanceof DOMException && error.name === 'InvalidStateError') {
        console.log('Retrying after InvalidStateError...');
        restartTimeoutRef.current = window.setTimeout(() => {
          if (shouldRestartRef.current && !isStartingRef.current) {
            startListening();
          }
        }, RESTART_DELAY * 2);
      }
    }
  }, [language, onTranscript, setupAudioAnalysis, voiceState.isListening, voiceState.isProcessing, isMobile, startSilenceTimeout, clearSilenceTimeout]);

  const stopListening = useCallback(() => {
    console.log('Stopping voice recognition...');
    // Signal that we no longer want to auto-restart
    shouldRestartRef.current = false;
    isStartingRef.current = false;
    
    // Clear any pending timeouts
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    clearSilenceTimeout();
    
    // Stop recognition
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.stop(); 
      } catch {}
    }
    
    // Clean up audio resources
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.warn);
      audioContextRef.current = null;
    }
    
    analysisSetupDoneRef.current = false;
    
    // Update UI state
    setVoiceState(prev => ({
      ...prev,
      isListening: false,
      isProcessing: false,
      audioLevel: 0
    }));
  }, [clearSilenceTimeout]);

  const toggleListening = useCallback(() => {
    if (voiceState.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [voiceState.isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Mobile-specific debugging
  useEffect(() => {
    if (isMobile) {
      console.log('Mobile device detected, using mobile-optimized settings');
      console.log('Mobile speech recognition supported:', isMobileSupported);
    }
  }, [isMobile, isMobileSupported]);

  return {
    voiceState,
    startListening,
    stopListening,
    toggleListening,
    isMobileSupported
  };
};

export default useVoiceRecognition;