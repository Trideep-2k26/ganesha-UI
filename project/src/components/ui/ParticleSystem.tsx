import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
  type: 'om' | 'spark' | 'lotus';
}

interface ParticleSystemProps {
  active: boolean;
  intensity?: number;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ active, intensity = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const configRef = useRef({
    maxParticles: 50 * intensity,
    spawnProb: 0.02 * intensity,
    sizeMul: 1,
    speedXMul: 1,
    speedYMul: 1,
  });
  const dprRef = useRef(1);
  const cssSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      dprRef.current = dpr;

      // DPI-aware canvas sizing
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      // Draw using CSS pixel coordinates
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cssSizeRef.current = { width: cssW, height: cssH };

      // Responsive particle behavior
      const shortSide = Math.min(cssW, cssH);
      if (shortSide <= 480) {
        configRef.current = {
          maxParticles: 30 * intensity,
          spawnProb: 0.015 * intensity,
          sizeMul: 0.85,
          speedXMul: 0.85,
          speedYMul: 0.9,
        };
      } else if (shortSide <= 768) {
        configRef.current = {
          maxParticles: 40 * intensity,
          spawnProb: 0.018 * intensity,
          sizeMul: 0.9,
          speedXMul: 0.9,
          speedYMul: 0.95,
        };
      } else {
        configRef.current = {
          maxParticles: 60 * intensity,
          spawnProb: 0.02 * intensity,
          sizeMul: 1,
          speedXMul: 1,
          speedYMul: 1,
        };
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createParticle = (): Particle => {
      const types = ['om', 'spark', 'lotus'] as const;
      const cfg = configRef.current;
      const { width, height } = cssSizeRef.current;
      return {
        x: Math.random() * width,
        y: height + 20,
        vx: (Math.random() - 0.5) * 2 * cfg.speedXMul,
        vy: (-Math.random() * 3 - 1) * cfg.speedYMul,
        life: 0,
        maxLife: Math.random() * 180 + 120,
        size: (Math.random() * 4 + 2) * cfg.sizeMul,
        alpha: 0,
        type: types[Math.floor(Math.random() * types.length)]
      };
    };

    const updateParticles = () => {
      const cfg = configRef.current;
      if (active && particlesRef.current.length < cfg.maxParticles) {
        if (Math.random() < cfg.spawnProb) {
          particlesRef.current.push(createParticle());
        }
      }

      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life++;

        // Fade in and out
        if (particle.life < 30) {
          particle.alpha = particle.life / 30;
        } else if (particle.life > particle.maxLife - 30) {
          particle.alpha = (particle.maxLife - particle.life) / 30;
        } else {
          particle.alpha = 1;
        }

        return particle.life < particle.maxLife && particle.y > -20;
      });
    };

    const drawParticle = (particle: Particle) => {
      ctx.save();
      ctx.globalAlpha = particle.alpha * 0.8;
      ctx.translate(particle.x, particle.y);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
      
      if (particle.type === 'om') {
        gradient.addColorStop(0, '#FF9933');
        gradient.addColorStop(1, '#DAA520');
        ctx.fillStyle = gradient;
        
        ctx.font = `${particle.size * 2}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('ॐ', 0, particle.size / 2);
      } else if (particle.type === 'spark') {
        gradient.addColorStop(0, '#FFB6C1');
        gradient.addColorStop(1, '#DC143C');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        gradient.addColorStop(0, '#FFFFF0');
        gradient.addColorStop(1, '#FF9933');
        ctx.fillStyle = gradient;
        
        // Simple lotus petal shape
        ctx.beginPath();
        ctx.ellipse(0, 0, particle.size, particle.size * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const animate = () => {
      const { width, height } = cssSizeRef.current;
      ctx.clearRect(0, 0, width, height);
      
      updateParticles();
      
      particlesRef.current.forEach(drawParticle);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ 
        background: 'transparent',
        mixBlendMode: 'overlay'
      }}
    />
  );
};

export default ParticleSystem;