import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'mandala' | 'lotus' | 'simple';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'mandala' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const renderMandalaSpinner = () => (
    <div className={`${sizeClasses[size]} relative`}>
      <svg
        className="animate-spin"
        viewBox="0 0 50 50"
        style={{ animationDuration: '3s' }}
      >
        <defs>
          <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9933" />
            <stop offset="50%" stopColor="#DAA520" />
            <stop offset="100%" stopColor="#DC143C" />
          </linearGradient>
        </defs>
        
        {/* Outer petals */}
        {Array.from({ length: 8 }).map((_, i) => (
          <path
            key={i}
            d="M 25 25 Q 25 10 20 15 Q 25 10 30 15 Q 25 10 25 25"
            fill="url(#spinnerGradient)"
            opacity={0.8}
            transform={`rotate(${i * 45} 25 25)`}
          />
        ))}
        
        {/* Inner circle */}
        <circle
          cx="25"
          cy="25"
          r="8"
          fill="none"
          stroke="url(#spinnerGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="15 5"
          className="animate-spin"
          style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
        />
        
        <circle cx="25" cy="25" r="3" fill="url(#spinnerGradient)" />
      </svg>
    </div>
  );

  const renderLotusSpinner = () => (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute inset-0 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              transform: `rotate(${i * 60}deg)`,
              animation: `spin 2s linear infinite ${i * 0.1}s`
            }}
          >
            <div className="w-2 h-6 bg-gradient-to-t from-saffron-400 to-saffron-600 rounded-full mx-auto" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 bg-gold-500 rounded-full animate-pulse" />
      </div>
    </div>
  );

  const renderSimpleSpinner = () => (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute inset-0 rounded-full border-2 border-saffron-200" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-saffron-500 animate-spin" />
    </div>
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'mandala':
        return renderMandalaSpinner();
      case 'lotus':
        return renderLotusSpinner();
      case 'simple':
        return renderSimpleSpinner();
      default:
        return renderMandalaSpinner();
    }
  };

  return (
    <div className="flex items-center justify-center">
      {renderSpinner()}
    </div>
  );
};

export default LoadingSpinner;