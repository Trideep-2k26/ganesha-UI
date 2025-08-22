import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { SupportedLanguage } from '../../types';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center space-x-2 px-4 py-2 
          bg-white/10 backdrop-blur-sm 
          rounded-full border border-white/20
          text-white hover:bg-white/20
          transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-saffron-400
        "
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLang?.nativeName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="
          absolute top-full mt-2 left-0
          bg-white rounded-lg shadow-xl
          border border-gold-200
          overflow-hidden z-50
          min-w-[200px]
        ">
          {SUPPORTED_LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                onLanguageChange(language.code);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-3 text-left
                hover:bg-saffron-50 
                transition-colors duration-200
                border-b border-gold-100 last:border-b-0
                ${currentLanguage === language.code ? 'bg-saffron-100 text-saffron-800' : 'text-gray-700'}
              `}
              style={{ fontFamily: language.font }}
            >
              <div className="flex flex-col">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-xs text-gray-500">{language.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;