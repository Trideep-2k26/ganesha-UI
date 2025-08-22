import React, { useState, useEffect } from 'react';
import { VoiceState } from '../../types';

interface GaneshaAvatarProps {
  voiceState: VoiceState;
  isResponding: boolean;
}

const GaneshaAvatar: React.FC<GaneshaAvatarProps> = ({ voiceState, isResponding }) => {
  const [breathingPhase, setBreathingPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathingPhase(prev => (prev + 0.1) % (Math.PI * 2));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  const avatarScale = 1 + Math.sin(breathingPhase) * 0.02;
  const glowIntensity = voiceState.isListening ? 20 + voiceState.audioLevel * 30 : 10;
  
  return (
    <div className="relative flex items-center justify-center mb-8">
      {/* Aura rings */}
      <div 
        className="absolute rounded-full border-2 border-saffron-300 animate-pulse"
        style={{
          width: `${280 + glowIntensity}px`,
          height: `${280 + glowIntensity}px`,
          animationDuration: voiceState.isListening ? '1s' : '3s'
        }}
      />
      <div 
        className="absolute rounded-full border border-gold-400 animate-pulse"
        style={{
          width: `${320 + glowIntensity * 1.2}px`,
          height: `${320 + glowIntensity * 1.2}px`,
          animationDuration: voiceState.isListening ? '1.5s' : '4s',
          animationDelay: '0.5s'
        }}
      />

      {/* Main avatar container */}
      <div 
        className={`
          relative w-64 h-64 rounded-full
          bg-gradient-to-br from-saffron-400 via-gold-500 to-crimson-500
          shadow-2xl overflow-hidden
          transition-all duration-500 ease-out
          ${isResponding ? 'animate-gentle-pulse' : ''}
          ${voiceState.isListening ? 'animate-gentle-glow' : ''}
        `}
        style={{
          transform: `scale(${avatarScale})`,
          boxShadow: `
            0 0 ${glowIntensity}px rgba(255, 153, 51, 0.6),
            0 20px 40px rgba(0, 0, 0, 0.3),
            inset 0 10px 20px rgba(255, 255, 255, 0.2)
          `
        }}
      >
        {/* Inner glow */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
        
        {/* Ganesha representation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {/* Om symbol */}
            <div className={`
              text-6xl font-bold text-white drop-shadow-lg mb-2
              ${voiceState.isListening ? 'animate-pulse' : ''}
              ${isResponding ? 'animate-bounce' : ''}
            `}>
              ॐ
            </div>
            
            {/* Ganesha text */}
            <div className="text-lg font-semibold text-white/90 drop-shadow">
              गणेश
            </div>
          </div>
        </div>

        {/* Blessing particles */}
        {(voiceState.isListening || isResponding) && (
          <div className="absolute inset-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-float"
                style={{
                  left: `${20 + Math.cos((i * 45) * Math.PI / 180) * 80}px`,
                  top: `${20 + Math.sin((i * 45) * Math.PI / 180) * 80}px`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '3s'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status indicators */}
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
        <div className={`
          px-4 py-2 rounded-full text-sm font-medium
          transition-all duration-300
          ${voiceState.isListening 
            ? 'bg-green-500 text-white animate-pulse' 
            : voiceState.isProcessing 
            ? 'bg-yellow-500 text-white' 
            : isResponding
            ? 'bg-blue-500 text-white animate-pulse'
            : 'bg-white/80 text-gray-700 backdrop-blur-sm'
          }
        `}>
          {voiceState.isListening 
            ? '👂 Listening...' 
            : voiceState.isProcessing 
            ? '🤔 Processing...' 
            : isResponding
            ? '🗣️ Speaking...'
            : '🙏 Ready to help'
          }
        </div>
      </div>
    </div>
  );
};

export default GaneshaAvatar;