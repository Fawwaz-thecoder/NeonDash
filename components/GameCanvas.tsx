
import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { 
  LevelData, 
  PlayerState, 
  Character 
} from '../types';
import { 
  GRAVITY, 
  JUMP_FORCE, 
  PLAYER_SIZE, 
  GROUND_Y, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT 
} from '../constants';

interface GameCanvasProps {
  level: LevelData;
  character: Character;
  isDarkMode: boolean;
  isMultiplayer: boolean;
  onGameOver: (progress: number, coins: number) => void;
  onWin: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  level, 
  character, 
  isDarkMode, 
  isMultiplayer,
  onGameOver, 
  onWin 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  
  // Trails to store previous Y positions
  const playerTrail = useRef<number[]>([]);
  const botTrail = useRef<number[]>([]);
  const TRAIL_LENGTH = 12; // Increased from 8 to make it "just a bit longer"

  const particles = useMemo(() => {
    return Array.from({ length: 100 }, () => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * GROUND_Y,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.5 + 0.1
    }));
  }, []);

  const playerRef = useRef<PlayerState>({
    x: 100,
    y: GROUND_Y - PLAYER_SIZE,
    vy: 0,
    isGrounded: true,
    isDead: false,
    score: 0,
    coinsCollected: 0,
    progress: 0,
    jumpCount: 0
  });

  const botRef = useRef<PlayerState>({
    x: 100,
    y: GROUND_Y - PLAYER_SIZE,
    vy: 0,
    isGrounded: true,
    isDead: false,
    score: 0,
    coinsCollected: 0,
    progress: 0,
    jumpCount: 0
  });

  const scrollRef = useRef(0);
  const coinsCollectedInRun = useRef(0);
  const playerRotation = useRef(0);
  const botRotation = useRef(0);

  const jump = useCallback((p: React.MutableRefObject<PlayerState>) => {
    if (!p.current.isDead && p.current.jumpCount < 2) {
      p.current.vy = JUMP_FORCE;
      p.current.isGrounded = false;
      p.current.jumpCount++;
    }
  }, []);

  const handleJumpPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    jump(playerRef);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') jump(playerRef);
    };
    const handleMouseDown = (e: MouseEvent) => {
       if ((e.target as HTMLElement).closest('button')) return;
       jump(playerRef);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [jump]);

  const updateEntity = (p: React.MutableRefObject<PlayerState>, rotation: React.MutableRefObject<number>, trail: React.MutableRefObject<number[]>, isBot: boolean) => {
    if (p.current.isDead) {
      // Still update trail to let it fade out
      trail.current.unshift(p.current.y);
      if (trail.current.length > TRAIL_LENGTH) trail.current.pop();
      return;
    }

    p.current.vy += GRAVITY;
    p.current.y += p.current.vy;

    // Update trail
    trail.current.unshift(p.current.y);
    if (trail.current.length > TRAIL_LENGTH) trail.current.pop();

    if (!p.current.isGrounded) {
       rotation.current += 0.08;
    } else {
       rotation.current = Math.round(rotation.current / (Math.PI / 2)) * (Math.PI / 2);
    }

    if (p.current.y > GROUND_Y - PLAYER_SIZE) {
      p.current.y = GROUND_Y - PLAYER_SIZE;
      p.current.vy = 0;
      p.current.isGrounded = true;
      p.current.jumpCount = 0;
    }

    if (isBot && isMultiplayer) {
      const lookAhead = 250 + (level.speed * 8);
      for (const obs of level.obstacles) {
        const obsX = obs.x - scrollRef.current + 100;
        if (obsX > 100 && obsX < 100 + lookAhead) {
          if (p.current.isGrounded) jump(botRef);
        }
      }
    }

    for (const obs of level.obstacles) {
      const obsX = obs.x - scrollRef.current + 100;
      const obsY = obs.y;

      if (obs.type === 'spike') {
        const pX = 100;
        const pY = p.current.y;
        if (pX + PLAYER_SIZE - 8 > obsX + 10 && pX + 8 < obsX + 40 && pY + PLAYER_SIZE - 8 > obsY - 45) {
          p.current.isDead = true;
          if (!isBot) onGameOver(p.current.progress, coinsCollectedInRun.current);
          return;
        }
      }

      if (obs.type === 'block') {
        const pX = 100;
        const pY = p.current.y;
        const blockSize = 50;
        if (pX + PLAYER_SIZE > obsX && pX < obsX + blockSize && pY + PLAYER_SIZE > obsY && pY < obsY + blockSize) {
          if (p.current.vy >= 0 && pY + PLAYER_SIZE < obsY + 15) {
            p.current.y = obsY - PLAYER_SIZE;
            p.current.vy = 0;
            p.current.isGrounded = true;
            p.current.jumpCount = 0;
          } else {
            p.current.isDead = true;
            if (!isBot) onGameOver(p.current.progress, coinsCollectedInRun.current);
            return;
          }
        }
      }

      if (!isBot && obs.type === 'coin') {
        const pX = 100;
        const pY = p.current.y;
        if (pX + PLAYER_SIZE > obsX && pX < obsX + 40 && pY + PLAYER_SIZE > obsY - 60 && pY < obsY) {
          obs.x = -9999;
          coinsCollectedInRun.current += 10;
        }
      }
    }
  };

  const update = useCallback(() => {
    if (playerRef.current.isDead) return;

    updateEntity(playerRef, playerRotation, playerTrail, false);
    if (isMultiplayer) updateEntity(botRef, botRotation, botTrail, true);

    scrollRef.current += level.speed;
    const lastObstacleX = level.obstacles.length > 0 
      ? Math.max(...level.obstacles.map(o => o.x)) 
      : 8000;
    const finishLine = lastObstacleX + 1500;
    
    const progressRaw = (scrollRef.current / finishLine) * 100;
    const progressVal = Math.min(100, Math.floor(progressRaw));
    playerRef.current.progress = progressVal;
    
    if (progressVal !== displayProgress) setDisplayProgress(progressVal);
    if (playerRef.current.progress >= 100) onWin();
  }, [level, isMultiplayer, onGameOver, onWin, displayProgress]);

  const drawTrail = (ctx: CanvasRenderingContext2D, trail: number[], char: Character, isBot: boolean) => {
    ctx.save();
    const baseAlpha = isBot ? 0.15 : 0.35;
    // Use character's custom trail color if it exists, otherwise fallback to their primary color
    const trailColor = isBot ? '#ff00ff' : (char.trailColor || char.color);
    
    for (let i = 1; i < trail.length; i++) {
      const alpha = baseAlpha * Math.pow(1 - (i / trail.length), 1.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = trailColor;
      
      const x = 100 - (i * level.speed * 1.05); 
      const y = trail[i];
      
      const sizeScale = Math.pow(1 - (i / trail.length), 0.8);
      const currentSize = PLAYER_SIZE * sizeScale * 0.7;

      const offset = (PLAYER_SIZE - currentSize) / 2;

      ctx.beginPath();
      if (char.shape === 'circle') {
        ctx.arc(x + PLAYER_SIZE/2, y + PLAYER_SIZE/2, currentSize / 2, 0, Math.PI * 2);
      } else if (char.shape === 'diamond') {
        const s = currentSize / 2;
        const cx = x + PLAYER_SIZE/2;
        const cy = y + PLAYER_SIZE/2;
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx + s, cy);
        ctx.lineTo(cx, cy + s);
        ctx.lineTo(cx - s, cy);
        ctx.closePath();
      } else {
        ctx.fillRect(x + offset, y + offset, currentSize, currentSize);
      }
      ctx.fill();
    }
    ctx.restore();
  };

  const drawEntity = (ctx: CanvasRenderingContext2D, p: React.MutableRefObject<PlayerState>, rotation: number, char: Character, isBot: boolean) => {
    const pX = 100;
    const pY = p.current.y;
    ctx.save();
    
    if (isBot) {
      ctx.globalAlpha = p.current.isDead ? 0.1 : 0.4;
    } else {
      ctx.globalAlpha = p.current.isDead ? 0.5 : 1.0;
    }

    ctx.translate(pX + PLAYER_SIZE / 2, pY + PLAYER_SIZE / 2);
    ctx.rotate(rotation);
    
    ctx.fillStyle = char.color;
    ctx.shadowBlur = isBot ? 0 : 25;
    ctx.shadowColor = char.color;

    const s = PLAYER_SIZE / 2;
    if (char.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
    } else if (char.shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0);
      ctx.closePath();
      ctx.fill();
    } else if (char.shape === 'hexagon') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        ctx.lineTo(s * Math.cos(i * Math.PI / 3), s * Math.sin(i * Math.PI / 3));
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-s, -s, PLAYER_SIZE, PLAYER_SIZE);
    }

    if (char.pattern === 'striped') {
      ctx.strokeStyle = char.secondaryColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-s, -s/2); ctx.lineTo(s, -s/2);
      ctx.moveTo(-s, s/2); ctx.lineTo(s, s/2);
      ctx.stroke();
    } else if (char.pattern === 'bordered') {
      ctx.strokeStyle = char.secondaryColor;
      ctx.lineWidth = 6;
      if (char.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, s-3, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.strokeRect(-s+3, -s+3, PLAYER_SIZE-6, PLAYER_SIZE-6);
      }
    } else if (char.pattern === 'glow') {
      ctx.shadowBlur = 40;
      ctx.shadowColor = char.secondaryColor;
      ctx.strokeStyle = char.secondaryColor;
      ctx.lineWidth = 2;
      if (char.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, s-2, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.strokeRect(-s+2, -s+2, PLAYER_SIZE-4, PLAYER_SIZE-4);
      }
    }
    
    ctx.restore();
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    if (isDarkMode) {
      gradient.addColorStop(0, '#020008');
      gradient.addColorStop(0.5, '#050212');
      gradient.addColorStop(1, '#000000');
    } else {
      gradient.addColorStop(0, '#f0f4ff');
      gradient.addColorStop(1, '#ffffff');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (isDarkMode) {
      ctx.globalCompositeOperation = 'screen';
      const time = Date.now() * 0.001;
      const glowX = CANVAS_WIDTH / 2 + Math.cos(time * 0.2) * 200;
      const glowY = CANVAS_HEIGHT / 3 + Math.sin(time * 0.3) * 100;
      const glowGrad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 600);
      glowGrad.addColorStop(0, level.color + '22');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalCompositeOperation = 'source-over';
    }

    particles.forEach(p => {
      const px = (p.x - (scrollRef.current * p.speed)) % CANVAS_WIDTH;
      const actualX = px < 0 ? px + CANVAS_WIDTH : px;
      ctx.fillStyle = isDarkMode ? `rgba(255, 255, 255, ${p.opacity})` : `rgba(0, 0, 0, ${p.opacity * 0.5})`;
      ctx.beginPath(); ctx.arc(actualX, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });

    const drawHills = (offsetMult: number, height: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
        const noise = Math.sin((x + scrollRef.current * offsetMult) * 0.002) * 40;
        ctx.lineTo(x, GROUND_Y - height + noise);
      }
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.fill();
    };

    if (isDarkMode) {
      drawHills(0.1, 150, '#040210'); drawHills(0.2, 80, '#080518');
    } else {
      drawHills(0.1, 120, '#e8e8f8'); drawHills(0.2, 60, '#dadada');
    }

    const groundColor = isDarkMode ? '#050505' : '#e0e0e0';
    const accentColor = level.color;
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(CANVAS_WIDTH, GROUND_Y); ctx.stroke();

    const barWidth = (CANVAS_WIDTH * playerRef.current.progress) / 100;
    ctx.shadowBlur = 15;
    ctx.shadowColor = accentColor;
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, barWidth, 14);
    ctx.shadowBlur = 0;

    // Draw Trails first
    if (isMultiplayer) {
      drawTrail(ctx, botTrail.current, character, true);
    }
    drawTrail(ctx, playerTrail.current, character, false);

    // Draw Bot
    if (isMultiplayer) {
      drawEntity(ctx, botRef, botRotation.current, { ...character, color: '#ff00ff', secondaryColor: '#ffffff' }, true);
    }
    
    // Draw Player
    if (!playerRef.current.isDead) {
      drawEntity(ctx, playerRef, playerRotation.current, character, false);
    }

    level.obstacles.forEach(obs => {
      const obsX = obs.x - scrollRef.current + 100;
      if (obsX < -200 || obsX > CANVAS_WIDTH + 200) return;

      if (obs.type === 'spike') {
        ctx.shadowBlur = 15; ctx.shadowColor = '#ff2222';
        ctx.fillStyle = '#ff2222';
        ctx.beginPath(); ctx.moveTo(obsX, obs.y); ctx.lineTo(obsX + 50, obs.y); ctx.lineTo(obsX + 25, obs.y - 50); ctx.closePath();
        ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      } else if (obs.type === 'block') {
        ctx.fillStyle = isDarkMode ? '#111' : '#ccc';
        ctx.fillRect(obsX, obs.y, 50, 50);
        ctx.strokeStyle = accentColor; ctx.lineWidth = 4; ctx.strokeRect(obsX, obs.y, 50, 50);
      } else if (obs.type === 'coin') {
        ctx.shadowBlur = 20; ctx.shadowColor = '#ffd700';
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.arc(obsX + 25, obs.y - 25, 20, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      }
    });
  }, [isDarkMode, level, character, isMultiplayer, particles]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(animate);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden relative">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-cover" />
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none">
        <button 
          onMouseDown={handleJumpPress}
          onTouchStart={handleJumpPress}
          className="pointer-events-auto w-96 h-28 rounded-3xl bg-white/5 border border-white/30 backdrop-blur-2xl flex flex-col items-center justify-center active:scale-95 active:bg-white/10 transition-all shadow-[0_0_60px_rgba(0,0,0,0.8)] group overflow-hidden"
        >
          <div className="absolute inset-0 bg-cyan-500/10 animate-pulse rounded-3xl"></div>
          <div className="flex items-center gap-10">
             <i className="fas fa-chevron-up text-3xl opacity-50 group-active:opacity-100 animate-bounce"></i>
             <div className="flex flex-col items-center">
               <span className="text-2xl font-black italic tracking-[0.6em] text-white opacity-60 group-active:opacity-100">JUMP</span>
               <span className="text-xs font-black opacity-30 uppercase tracking-widest mt-2 border-t border-white/10 pt-2">DOUBLE JUMP ACTIVE</span>
             </div>
             <i className="fas fa-chevron-up text-3xl opacity-50 group-active:opacity-100 animate-bounce"></i>
          </div>
        </button>
      </div>
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">
        <div className="flex items-baseline gap-3">
          <span className="text-6xl font-black italic tracking-tighter text-white tabular-nums drop-shadow-xl">{displayProgress}</span>
          <span className="text-2xl font-black italic text-cyan-400 opacity-80">%</span>
        </div>
        <div className="w-64 h-2 bg-black/40 rounded-full mt-4 overflow-hidden border border-white/10 backdrop-blur-md">
          <div style={{ width: `${displayProgress}%` }} className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
