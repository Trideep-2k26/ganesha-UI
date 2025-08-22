import React from 'react';
import { Settings, Home } from 'lucide-react';
import LanguageSelector from '../ui/LanguageSelector';
import { SupportedLanguage } from '../../types';

interface HeaderProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentLanguage, 
  onLanguageChange, 
  onSettingsClick 
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="flex items-center justify-between p-6">
        {/* Logo/Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-saffron-400 to-saffron-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">ॐ</span>
          </div>
          <div className="text-white">
            <h1 className="text-xl font-bold drop-shadow-lg">Divine Conversation</h1>
            <p className="text-sm opacity-80">with Lord Ganesha</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
          />
          
          <button
            onClick={onSettingsClick}
            className="
              p-2 rounded-full
              bg-white/10 backdrop-blur-sm 
              border border-white/20
              text-white hover:bg-white/20
              transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-saffron-400
            "
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;