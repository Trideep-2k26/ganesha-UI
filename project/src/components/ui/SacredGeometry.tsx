import React from 'react';

interface SacredGeometryProps {
  pattern: 'mandala' | 'lotus' | 'yantra';
  size?: number;
  opacity?: number;
  rotating?: boolean;
}

const SacredGeometry: React.FC<SacredGeometryProps> = ({ 
  pattern, 
  size = 300, 
  opacity = 0.1,
  rotating = false
}) => {
  const renderMandala = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      className={`${rotating ? 'animate-spin-slow' : ''}`}
      style={{ animationDuration: rotating ? '60s' : undefined }}
    >
      <defs>
        <radialGradient id="mandalaGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF9933" stopOpacity={opacity} />
          <stop offset="50%" stopColor="#DAA520" stopOpacity={opacity * 0.7} />
          <stop offset="100%" stopColor="#DC143C" stopOpacity={opacity * 0.3} />
        </radialGradient>
      </defs>
      
      {/* Outer circle */}
      <circle cx="150" cy="150" r="140" fill="none" stroke="url(#mandalaGradient)" strokeWidth="2" />
      
      {/* Petals */}
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 45} 150 150)`}>
          <path
            d="M 150 150 Q 150 50 120 80 Q 150 50 180 80 Q 150 50 150 150"
            fill="url(#mandalaGradient)"
          />
        </g>
      ))}
      
      {/* Inner patterns */}
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1="150"
          y1="150"
          x2={150 + 80 * Math.cos((i * 30) * Math.PI / 180)}
          y2={150 + 80 * Math.sin((i * 30) * Math.PI / 180)}
          stroke="url(#mandalaGradient)"
          strokeWidth="1"
        />
      ))}
      
      <circle cx="150" cy="150" r="20" fill="url(#mandalaGradient)" />
    </svg>
  );

  const renderLotus = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      className={rotating ? 'animate-pulse' : ''}
    >
      <defs>
        <radialGradient id="lotusGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB6C1" stopOpacity={opacity} />
          <stop offset="100%" stopColor="#FF9933" stopOpacity={opacity * 0.3} />
        </radialGradient>
      </defs>
      
      {/* Lotus petals */}
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse
          key={i}
          cx="150"
          cy="100"
          rx="15"
          ry="40"
          fill="url(#lotusGradient)"
          transform={`rotate(${i * 45} 150 150)`}
        />
      ))}
      
      {/* Center */}
      <circle cx="150" cy="150" r="25" fill="url(#lotusGradient)" />
    </svg>
  );

  const renderYantra = () => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      className={rotating ? 'animate-spin-slow' : ''}
      style={{ animationDuration: rotating ? '45s' : undefined }}
    >
      <defs>
        <linearGradient id="yantraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DAA520" stopOpacity={opacity} />
          <stop offset="100%" stopColor="#DC143C" stopOpacity={opacity * 0.5} />
        </linearGradient>
      </defs>
      
      {/* Outer square */}
      <rect x="50" y="50" width="200" height="200" fill="none" stroke="url(#yantraGradient)" strokeWidth="2" />
      
      {/* Triangles */}
      <polygon
        points="150,80 120,180 180,180"
        fill="none"
        stroke="url(#yantraGradient)"
        strokeWidth="2"
      />
      <polygon
        points="150,220 120,120 180,120"
        fill="none"
        stroke="url(#yantraGradient)"
        strokeWidth="2"
      />
      
      {/* Center point */}
      <circle cx="150" cy="150" r="5" fill="url(#yantraGradient)" />
    </svg>
  );

  const renderPattern = () => {
    switch (pattern) {
      case 'mandala':
        return renderMandala();
      case 'lotus':
        return renderLotus();
      case 'yantra':
        return renderYantra();
      default:
        return renderMandala();
    }
  };

  return (
    <div 
      className="absolute pointer-events-none"
      style={{
        transform: 'translate(-50%, -50%)',
        left: '50%',
        top: '50%'
      }}
    >
      {renderPattern()}
    </div>
  );
};

export default SacredGeometry;