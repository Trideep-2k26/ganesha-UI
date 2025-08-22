import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  audioLevel: number;
  onToggleListening: () => void;
  disabled?: boolean;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({
  isListening,
  isProcessing,
  audioLevel,
  onToggleListening,
  disabled = false
}) => {
  const [ripples, setRipples] = useState<number[]>([]);

  useEffect(() => {
    if (isListening && audioLevel > 0.1) {
      const id = Date.now();
      setRipples(prev => [...prev, id]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(rippleId => rippleId !== id));
      }, 1000);
    }
  }, [isListening, audioLevel]);

  const buttonScale = isProcessing ? 0.95 : (isListening ? 1.05 : 1);
  const glowIntensity = isListening ? audioLevel * 20 + 10 : 0;

  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple effects */}
      {ripples.map(rippleId => (
        <div
          key={rippleId}
          className="absolute rounded-full border-2 border-saffron-500 animate-ping"
          style={{
            width: '120px',
            height: '120px',
            animationDuration: '1s'
          }}
        />
      ))}
      
      {/* Sound waves */}
      {isListening && (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-saffron-300"
              style={{
                width: `${140 + i * 30}px`,
                height: `${140 + i * 30}px`,
                animation: `pulse 2s infinite ${i * 0.3}s`,
                opacity: audioLevel * (1 - i * 0.2)
              }}
            />
          ))}
        </>
      )}

      {/* Main button */}
      <button
        onClick={onToggleListening}
        disabled={disabled || isProcessing}
        className={`
          relative w-20 h-20 rounded-full
          bg-gradient-to-br from-saffron-400 to-saffron-600
          border-4 border-gold-400
          flex items-center justify-center
          transition-all duration-300 ease-out
          transform hover:scale-105 focus:scale-105
          focus:outline-none focus:ring-4 focus:ring-saffron-300
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg hover:shadow-xl
        `}
        style={{
          transform: `scale(${buttonScale})`,
          boxShadow: isListening 
            ? `0 0 ${glowIntensity}px rgba(255, 153, 51, 0.6), 0 10px 20px rgba(0, 0, 0, 0.2)`
            : '0 10px 20px rgba(0, 0, 0, 0.2)'
        }}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {/* Lotus petal background */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 opacity-30" />
        
        {isProcessing ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isListening ? (
          <MicOff className="w-8 h-8 text-white drop-shadow-md" />
        ) : (
          <Mic className="w-8 h-8 text-white drop-shadow-md" />
        )}
      </button>

      {/* Audio level indicator */}
      {isListening && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-saffron-400 rounded-full transition-all duration-100"
                style={{
                  height: `${8 + (audioLevel * 20 * (i === 2 ? 1.5 : i === 1 || i === 3 ? 1.2 : 1))}px`,
                  opacity: audioLevel > (i * 0.2) ? 1 : 0.3
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceButton;