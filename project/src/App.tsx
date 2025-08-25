import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { MessageSquare, Type } from 'lucide-react';
import Header from './components/layout/Header';
import GaneshaRotatingAvatar from './components/layout/GaneshaRotatingAvatar';
import ChatContainer from './components/chat/ChatContainer';
import VoiceButton from './components/ui/VoiceButton';
import ParticleSystem from './components/ui/ParticleSystem';
import NebulaBackground, { type NebulaBackgroundHandle } from './components/ui/NebulaBackground';
import useVoiceRecognition from './hooks/useVoiceRecognition';
import { ChatMessage, SupportedLanguage, UIState } from './types';
import { chatAPI, ttsAPI, playAudioBlob, type HistoryItem } from './services/api';
import SettingsPanel, { type Settings } from './components/ui/SettingsPanel';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [started, setStarted] = useState(false);
  const nebulaRef = useRef<NebulaBackgroundHandle>(null);
  const [uiState, setUIState] = useState<UIState>({
    isLoading: false,
    currentLanguage: 'en',
    showSettings: false,
    theme: 'default'
  });
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  // User settings (persisted)
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem('ganesha_settings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      autoTTS: true,
      ttsRate: 175,
      ttsVoice: undefined,
      ttsVolume: 1,
      temperature: 0.6,
      keepTextInputOpen: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('ganesha_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Session id persisted in localStorage for continuity (frontend-managed)
  const [sessionId] = useState<string>(() => {
    const key = 'ganesha_session_id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const sid = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(key, sid);
    return sid;
  });

  // Build history for backend (map UI messages to role/content)
  const buildHistory = useCallback((limit: number = 8): HistoryItem[] => {
    const recent = messages.slice(-limit);
    const hist: HistoryItem[] = recent
      .filter(m => !!m.content)
      .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));
    return hist;
  }, [messages]);

  // Real API call to chatbot + TTS playback
  const sendMessageToGanesha = useCallback(async (message: string, language: SupportedLanguage) => {
    setUIState(prev => ({ ...prev, isLoading: true }));
    setIsResponding(true);

    try {
      const chatRes = await chatAPI({
        text: message,
        language,
        history: buildHistory(8),
        context: { sessionId: sessionId },
        temperature: settings.temperature,
      });

      const ganeshaMessage: ChatMessage = {
        id: Date.now().toString() + '-ganesha',
        type: 'ganesha',
        content: chatRes.text,
        timestamp: new Date(),
        language: chatRes.language as SupportedLanguage,
      };
      setMessages(prev => [...prev, ganeshaMessage]);

      // Auto TTS playback of assistant reply (use the language returned by backend)
      if (settings.autoTTS) {
        try {
          const audioBlob = await ttsAPI({ 
            text: chatRes.text, 
            language: chatRes.language as SupportedLanguage,
            rate: settings.ttsRate,
            voice: settings.ttsVoice,
          });
          playAudioBlob(audioBlob, { volume: settings.ttsVolume });
        } catch (e) {
          // Non-fatal if TTS fails
          console.warn('TTS playback failed:', e);
        }
      }
    } catch (error) {
      console.error('Error sending message to backend:', error);

      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        type: 'ganesha',
        content: 'Mere bacche, abhi connection mein thodi pareshani hai. Kripya thoda intezaar karke phir se koshish kariye.',
        timestamp: new Date(),
        language: 'en',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setUIState(prev => ({ ...prev, isLoading: false }));
      setIsResponding(false);
    }
  }, [buildHistory, sessionId]);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    if (!transcript.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: transcript,
      timestamp: new Date(),
      language: currentLanguage
    };
    
    setMessages(prev => [...prev, userMessage]);
    sendMessageToGanesha(transcript, currentLanguage);
  }, [currentLanguage, sendMessageToGanesha]);

  const handleTextSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: textInput,
      timestamp: new Date(),
      language: currentLanguage
    };
    
    setMessages(prev => [...prev, userMessage]);
    // Ensure chat view opens when sending via text input
    nebulaRef.current?.triggerRipple();
    if (!started) setStarted(true);
    sendMessageToGanesha(textInput, currentLanguage);
    setTextInput('');
    if (!settings.keepTextInputOpen) setShowTextInput(false);
  }, [textInput, currentLanguage, sendMessageToGanesha, started, settings.keepTextInputOpen]);

  const bcp47 = useMemo(() => {
    const map: Record<string, string> = {
      en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN'
    };
    return map[currentLanguage] || 'en-US';
  }, [currentLanguage]);
  const { voiceState, toggleListening } = useVoiceRecognition(handleVoiceTranscript, bcp47);

  const handleMicToggle = useCallback(() => {
    // Trigger cosmic ripple and mark experience as started
    nebulaRef.current?.triggerRipple();
    if (!started) setStarted(true);
    toggleListening();
  }, [started, toggleListening]);

  const handleLanguageChange = useCallback((language: SupportedLanguage) => {
    setCurrentLanguage(language);
    setUIState(prev => ({ ...prev, currentLanguage: language }));
  }, []);

  const handleSettingsClick = useCallback(() => {
    setUIState(prev => ({ ...prev, showSettings: !prev.showSettings }));
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden text-white" style={{ backgroundColor: '#010005' }}>
      {/* Three.js Nebula background */}
      <NebulaBackground ref={nebulaRef} />

      {/* Intro overlay (hidden after mic pressed) */}
      {!started && (
        <div className="fixed inset-0 z-10 flex items-center justify-center text-center px-6">
          <div className="max-w-2xl">
            
          </div>
        </div>
      )}
      
      {/* Particle system */}
      <ParticleSystem 
        active={voiceState.isListening || isResponding} 
        intensity={voiceState.isListening ? 1.5 : 0.8} 
      />
      
      {/* Header */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        onSettingsClick={handleSettingsClick}
      />
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col pt-20 pb-32">
        {/* Avatar section */}
        <div className="flex justify-center items-center py-8">
          <GaneshaRotatingAvatar />
        </div>
        
        {/* Chat section - hidden until started (so the white box won't appear initially) */}
        {started && (
          <div className="max-w-4xl mx-auto w-full px-4 mt-8 md:mt-[40vh]">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gold-200 min-h-[240px] sm:min-h-[300px] max-h-[50vh] sm:max-h-[60vh] flex flex-col">
              <ChatContainer 
                messages={messages} 
                isLoading={uiState.isLoading}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Settings Panel */}
      <SettingsPanel 
        open={uiState.showSettings}
        settings={settings}
        onChange={(next) => setSettings(prev => ({ ...prev, ...next }))}
        onClose={() => setUIState(prev => ({ ...prev, showSettings: false }))}
      />

      {/* Input controls */}
      <div className="fixed bottom-6 md:bottom-28 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center space-y-4">
          {/* Text input */}
          {showTextInput && (
            <form onSubmit={handleTextSubmit} className="mb-4">
              <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border border-gold-200 w-[92vw] sm:w-[80vw] max-w-2xl">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your message to Lord Ganesha..."
                  className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-500 px-2"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="ml-2 p-2 bg-gradient-to-r from-saffron-400 to-saffron-600 text-white rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}
          
          {/* Control buttons */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => {
                const next = !showTextInput;
                setShowTextInput(next);
                if (next && !started) setStarted(true);
              }}
              className="
                p-4 bg-white/90 backdrop-blur-sm rounded-full
                border border-gold-200 shadow-lg
                text-gray-700 hover:bg-white hover:shadow-xl
                transition-all duration-300 transform hover:scale-105
                focus:outline-none focus:ring-4 focus:ring-saffron-300
              "
              aria-label="Toggle text input"
            >
              <Type className="w-6 h-6" />
            </button>
            
            <VoiceButton
              isListening={voiceState.isListening}
              isProcessing={voiceState.isProcessing}
              audioLevel={voiceState.audioLevel}
              onToggleListening={handleMicToggle}
              disabled={uiState.isLoading && !voiceState.isListening}
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default App;