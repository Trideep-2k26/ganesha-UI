export interface ChatMessage {
  id: string;
  type: 'user' | 'ganesha';
  content: string;
  timestamp: Date;
  language?: string;
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  audioLevel: number;
}

export interface UIState {
  isLoading: boolean;
  currentLanguage: string;
  showSettings: boolean;
  theme: 'default' | 'temple' | 'meditation';
}

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'mr' | 'gu';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  font: string;
}