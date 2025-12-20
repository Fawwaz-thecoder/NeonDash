
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  LEVEL_SELECT = 'LEVEL_SELECT',
  SHOP = 'SHOP',
  STATS = 'STATS',
  DIFFICULTY_SELECT = 'DIFFICULTY_SELECT'
}

export interface Character {
  id: string;
  name: string;
  price: number;
  color: string;
  secondaryColor: string;
  trailColor?: string; // New property for custom trail color
  icon: string;
  unlocked: boolean;
  isCustom?: boolean;
  shape?: 'square' | 'circle' | 'diamond' | 'hexagon';
  pattern?: 'solid' | 'glow' | 'striped' | 'bordered';
}

export interface LevelData {
  id: number;
  localId: number; // 1-60 within category
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Insane' | 'Demon';
  color: string;
  speed: number;
  obstacles: Obstacle[];
}

export interface Obstacle {
  x: number;
  y: number;
  type: 'spike' | 'block' | 'coin';
}

export interface PlayerState {
  x: number;
  y: number;
  vy: number;
  isGrounded: boolean;
  isDead: boolean;
  score: number;
  coinsCollected: number;
  progress: number;
  jumpCount: number;
}
