import React, { useState, useCallback } from 'react';
import { MessageSquare, Type } from 'lucide-react';
import Header from './components/layout/Header';
import GaneshaRotatingAvatar from './components/layout/GaneshaRotatingAvatar';
import ChatContainer from './components/chat/ChatContainer';
import VoiceButton from './components/ui/VoiceButton';
import LanguageSelector from './components/ui/LanguageSelector';
import ParticleSystem from './components/ui/ParticleSystem';
import SacredGeometry from './components/ui/SacredGeometry';
import LoadingSpinner from './components/ui/LoadingSpinner';
import useVoiceRecognition from './hooks/useVoiceRecognition';
import { ChatMessage, SupportedLanguage, UIState } from './types';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [uiState, setUIState] = useState<UIState>({
    isLoading: false,
    currentLanguage: 'en',
    showSettings: false,
    theme: 'default'
  });
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  // Simulated API call to Ganesha chatbot
  const sendMessageToGanesha = useCallback(async (message: string, language: SupportedLanguage) => {
    setUIState(prev => ({ ...prev, isLoading: true }));
    setIsResponding(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      // Simulated responses based on language
      const responses = {
        en: [
          "🙏 Namaste, dear devotee. I am here to guide you on your spiritual journey. What weighs upon your heart today?",
          "✨ May my blessings remove all obstacles from your path. How can I assist you in finding peace and wisdom?",
          "🐘 As the remover of obstacles, I sense your sincere devotion. What guidance do you seek, my child?",
          "🌸 Your prayers have reached me. I am here to shower you with wisdom and divine grace. Speak freely.",
          "🕉️ Om Gam Ganapataye Namaha. I feel your spiritual energy. What brings you to seek my counsel today?"
        ],
        hi: [
          "🙏 नमस्ते भक्त। मैं यहाँ आपकी आध्यात्मिक यात्रा में मार्गदर्शन करने के लिए हूँ।",
          "✨ मेरा आशीर्वाद आपके सभी विघ्नों को दूर करे। आज आप कैसी सहायता चाहते हैं?",
          "🐘 विघ्न हर्ता के रूप में, मैं आपकी भक्ति को महसूस करता हूँ। क्या सलाह चाहिए?",
          "🌸 आपकी प्रार्थना मुझ तक पहुँची है। मैं आपको ज्ञान और कृपा देने यहाँ हूँ।",
          "🕉️ ॐ गं गणपतये नमः। आपकी आध्यात्मिक ऊर्जा महसूस होती है।"
        ]
      };

      const languageResponses = responses[language] || responses.en;
      const response = languageResponses[Math.floor(Math.random() * languageResponses.length)];
      
      const ganeshaMessage: ChatMessage = {
        id: Date.now().toString() + '-ganesha',
        type: 'ganesha',
        content: response,
        timestamp: new Date(),
        language
      };
      
      setMessages(prev => [...prev, ganeshaMessage]);
    } catch (error) {
      console.error('Error sending message to Ganesha:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        type: 'ganesha',
        content: "🙏 I apologize, dear devotee. There seems to be a temporary disruption in our divine connection. Please try again in a moment.",
        timestamp: new Date(),
        language: 'en'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setUIState(prev => ({ ...prev, isLoading: false }));
      setIsResponding(false);
    }
  }, []);

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
    sendMessageToGanesha(textInput, currentLanguage);
    setTextInput('');
    setShowTextInput(false);
  }, [textInput, currentLanguage, sendMessageToGanesha]);

  const { voiceState, toggleListening } = useVoiceRecognition(handleVoiceTranscript, currentLanguage);

  const handleLanguageChange = useCallback((language: SupportedLanguage) => {
    setCurrentLanguage(language);
    setUIState(prev => ({ ...prev, currentLanguage: language }));
  }, []);

  const handleSettingsClick = useCallback(() => {
    setUIState(prev => ({ ...prev, showSettings: !prev.showSettings }));
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-saffron-400 via-gold-500 to-crimson-600" />
      
      {/* Sacred geometry background */}
      <div className="fixed inset-0 opacity-20">
        <SacredGeometry pattern="mandala" size={600} opacity={0.1} rotating />
        <div className="absolute top-1/4 left-1/4">
          <SacredGeometry pattern="lotus" size={200} opacity={0.15} />
        </div>
        <div className="absolute bottom-1/4 right-1/4">
          <SacredGeometry pattern="yantra" size={250} opacity={0.1} rotating />
        </div>
      </div>
      
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
        
        {/* Chat section */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gold-200 min-h-[400px] flex flex-col">
            <ChatContainer 
              messages={messages} 
              isLoading={uiState.isLoading}
            />
          </div>
        </div>
      </div>
      
      {/* Input controls */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center space-y-4">
          {/* Text input */}
          {showTextInput && (
            <form onSubmit={handleTextSubmit} className="mb-4">
              <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border border-gold-200">
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
              onClick={() => setShowTextInput(!showTextInput)}
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
              onToggleListening={toggleListening}
              disabled={uiState.isLoading}
            />
          </div>
          
          {/* Language selector for mobile */}
          <div className="md:hidden">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;