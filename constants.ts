
import { Character, LevelData, Obstacle } from './types';

export const GRAVITY = 1.1;
export const JUMP_FORCE = -18.5;
export const PLAYER_SIZE = 48;
export const GROUND_Y = 750;
export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 900;

const generateLevelObstacles = (count: number, difficulty: string): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  let currentX = 800;
  const gapMin = difficulty === 'Easy' ? 600 : difficulty === 'Medium' ? 480 : 350;
  const gapVar = difficulty === 'Easy' ? 400 : 300;

  for (let i = 0; i < count; i++) {
    const typeRoll = Math.random();
    if (typeRoll < 0.25) {
      const numSpikes = difficulty === 'Easy' ? 1 : Math.floor(Math.random() * 2) + 1;
      for (let s = 0; s < numSpikes; s++) {
        obstacles.push({ x: currentX + (s * 50), y: GROUND_Y, type: 'spike' });
      }
      currentX += numSpikes * 50;
    } else if (typeRoll < 0.55) {
      const height = Math.random() < 0.5 ? 50 : 100;
      const width = Math.floor(Math.random() * 2) + 1;
      for (let w = 0; w < width; w++) {
        obstacles.push({ x: currentX + (w * 50), y: GROUND_Y - height, type: 'block' });
      }
      currentX += width * 50;
    } else if (typeRoll < 0.65) {
      obstacles.push({ x: currentX, y: GROUND_Y - 200, type: 'coin' });
    }
    currentX += gapMin + Math.random() * gapVar;
  }
  return obstacles;
};

const createDifficultyLevels = (prefix: string, diff: 'Easy' | 'Medium' | 'Hard', count: number, baseSpeed: number, color: string): LevelData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + (prefix === 'Easy' ? 0 : prefix === 'Medium' ? 100 : 200),
    localId: i + 1,
    name: `${prefix} Run ${i + 1}`,
    difficulty: diff,
    color: color,
    speed: baseSpeed + (i * 0.1),
    obstacles: generateLevelObstacles(15 + i, diff)
  }));
};

export const LEVELS: LevelData[] = [
  ...createDifficultyLevels('Easy', 'Easy', 60, 8, '#00f2ff'),
  ...createDifficultyLevels('Medium', 'Medium', 60, 11, '#ffea00'),
  ...createDifficultyLevels('Hard', 'Hard', 60, 14, '#ff0040'),
];

export const INITIAL_CHARACTERS: Character[] = [
  { id: 'cube1', name: 'Neon Square', price: 0, color: '#00f2ff', secondaryColor: '#ffffff', icon: 'square', unlocked: true, shape: 'square', pattern: 'solid' },
  { id: 'cube2', name: 'Blaze Cube', price: 50, color: '#ff4d00', secondaryColor: '#ffea00', icon: 'fire', unlocked: false, shape: 'square' },
  { id: 'cube3', name: 'Cobalt Matrix', price: 250, color: '#0047ab', secondaryColor: '#00ffff', icon: 'cube', unlocked: false, shape: 'square' },
  { id: 'cube4', name: 'Emerald Glider', price: 300, color: '#00ff40', secondaryColor: '#f0f0f0', icon: 'bolt', unlocked: false, shape: 'square' },
  { id: 'cube5', name: 'Circuit Block', price: 400, color: '#ff00ff', secondaryColor: '#ffffff', icon: 'microchip', unlocked: false, shape: 'square' },
  { id: 'cube6', name: 'Pulse Wave', price: 500, color: '#0080ff', secondaryColor: '#00ffff', icon: 'wave-square', unlocked: false, shape: 'square' },
  { id: 'cube7', name: 'Cyber Frame', price: 600, color: '#ff8000', secondaryColor: '#ffff00', icon: 'border-all', unlocked: false, shape: 'square' },
  { id: 'cube8', name: 'Vortex Core', price: 700, color: '#ff0000', secondaryColor: '#ffffff', icon: 'atom', unlocked: false, shape: 'square' },
  { id: 'cube9', name: 'Zenith', price: 800, color: '#ffffff', secondaryColor: '#000000', icon: 'compass', unlocked: false, shape: 'square' },
  { id: 'cube10', name: 'Ion Burst', price: 900, color: '#7cfc00', secondaryColor: '#ffffff', icon: 'radiation', unlocked: false, shape: 'square' },
  { id: 'cube11', name: 'Plasma Guard', price: 1000, color: '#e6e6fa', secondaryColor: '#4b0082', icon: 'shield-halved', unlocked: false, shape: 'square' },
  { id: 'cube12', name: 'Gravity Key', price: 1100, color: '#ffd700', secondaryColor: '#000000', icon: 'key', unlocked: false, shape: 'square' },
  { id: 'cube13', name: 'Phase Shift', price: 1200, color: '#00ced1', secondaryColor: '#ffffff', icon: 'code-branch', unlocked: false, shape: 'square' },
  { id: 'cube14', name: 'Bit Runner', price: 1300, color: '#ff1493', secondaryColor: '#ffffff', icon: 'hashtag', unlocked: false, shape: 'square' },
  { id: 'cube15', name: 'Neon Cross', price: 1400, color: '#adff2f', secondaryColor: '#000000', icon: 'plus', unlocked: false, shape: 'square' },
  { id: 'cube16', name: 'Vector X', price: 1500, color: '#4169e1', secondaryColor: '#ffffff', icon: 'xmark', unlocked: false, shape: 'square' },
  { id: 'cube17', name: 'Hex Shield', price: 1600, color: '#ff4500', secondaryColor: '#ffffff', icon: 'dice-d6', unlocked: false, shape: 'square' },
  { id: 'cube18', name: 'Grid Master', price: 1700, color: '#32cd32', secondaryColor: '#ffffff', icon: 'table-cells', unlocked: false, shape: 'square' },
  { id: 'cube19', name: 'Core Link', price: 1800, color: '#9400d3', secondaryColor: '#00ffff', icon: 'link', unlocked: false, shape: 'square' },
  { id: 'cube20', name: 'Omega Point', price: 2000, color: '#000000', secondaryColor: '#ff0000', icon: 'circle-dot', unlocked: false, shape: 'square' },
  { id: 'cube21', name: 'Static Volt', price: 2200, color: '#f0e68c', secondaryColor: '#000000', icon: 'bolt-lightning', unlocked: false, shape: 'square' },
  { id: 'cube22', name: 'Echo Prism', price: 2500, color: '#fa8072', secondaryColor: '#ffffff', icon: 'diamond', unlocked: false, shape: 'square' },
  { id: 'cube23', name: 'Data Stream', price: 2800, color: '#20b2aa', secondaryColor: '#ffffff', icon: 'stream', unlocked: false, shape: 'square' },
  { id: 'cube24', name: 'Null Zone', price: 3500, color: '#708090', secondaryColor: '#ffffff', icon: 'ban', unlocked: false, shape: 'square' },
  { id: 'cube25', name: 'Aether Link', price: 4000, color: '#ff00ff', secondaryColor: '#ffffff', icon: 'link-slash', unlocked: false, shape: 'square' },
  { id: 'cube26', name: 'Plasma Node', price: 4500, color: '#00ffff', secondaryColor: '#000000', icon: 'circle-nodes', unlocked: false, shape: 'square' },
  { id: 'cube27', name: 'Bit Spear', price: 5000, color: '#ff8800', secondaryColor: '#ffffff', icon: 'location-arrow', unlocked: false, shape: 'square' },
  { id: 'cube28', name: 'Spectral Mark', price: 5500, color: '#aa00ff', secondaryColor: '#00ffcc', icon: 'signature', unlocked: false, shape: 'square' },
  { id: 'cube29', name: 'Binary Star', price: 6000, color: '#ffff00', secondaryColor: '#000000', icon: 'star', unlocked: false, shape: 'square' },
  { id: 'cube30', name: 'Void Frame', price: 6500, color: '#444444', secondaryColor: '#ffffff', icon: 'crop-simple', unlocked: false, shape: 'square' },
  { id: 'cube31', name: 'Cyber Arc', price: 7000, color: '#00ffaa', secondaryColor: '#ffffff', icon: 'archway', unlocked: false, shape: 'square' },
  { id: 'cube32', name: 'Pixel Guard', price: 7500, color: '#ff0055', secondaryColor: '#ffffff', icon: 'shield', unlocked: false, shape: 'square' },
  { id: 'cube33', name: 'Data Forge', price: 8000, color: '#3366ff', secondaryColor: '#ffffff', icon: 'hammer', unlocked: false, shape: 'square' },
  { id: 'cube34', name: 'Static Drift', price: 8500, color: '#888888', secondaryColor: '#ff00ff', icon: 'forward', unlocked: false, shape: 'square' },
  { id: 'cube35', name: 'Echo Pulse', price: 9000, color: '#00ccff', secondaryColor: '#ffffff', icon: 'ellipsis', unlocked: false, shape: 'square' },
  { id: 'cube36', name: 'Zero Logic', price: 9500, color: '#ffffff', secondaryColor: '#ff0000', icon: '0', unlocked: false, shape: 'square' },
  { id: 'cube37', name: 'Delta Shift', price: 10000, color: '#ffcc00', secondaryColor: '#000000', icon: 'play', unlocked: false, shape: 'square' },
  { id: 'cube38', name: 'Titan Mesh', price: 11000, color: '#000000', secondaryColor: '#00ff00', icon: 'border-none', unlocked: false, shape: 'square' },
  { id: 'cube39', name: 'Radiant Flux', price: 12000, color: '#ff5500', secondaryColor: '#ffff00', icon: 'sun', unlocked: false, shape: 'square' },
  { id: 'cube40', name: 'Abyss Core', price: 13000, color: '#1a1a1a', secondaryColor: '#555555', icon: 'circle-notch', unlocked: false, shape: 'square' },
  { id: 'cube41', name: 'Ion Prism', price: 14000, color: '#ff0088', secondaryColor: '#ffffff', icon: 'gem', unlocked: false, shape: 'square' },
  { id: 'cube42', name: 'Hyper Wind', price: 15000, color: '#00ffff', secondaryColor: '#ffffff', icon: 'wind', unlocked: false, shape: 'square' },
  { id: 'cube43', name: 'Null Point', price: 16000, color: '#ff0000', secondaryColor: '#ffffff', icon: 'stop', unlocked: false, shape: 'square' },
  { id: 'cube44', name: 'Exo Zenith', price: 18000, color: '#4400ff', secondaryColor: '#00ffff', icon: 'terminal', unlocked: false, shape: 'square' },
  { id: 'custom', name: 'Neo Creator', price: 25000, color: '#ffffff', secondaryColor: '#00ffff', trailColor: '#00ffff', icon: 'pen-ruler', unlocked: false, isCustom: true, shape: 'square', pattern: 'solid' },
];
