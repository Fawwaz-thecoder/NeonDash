
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Character, LevelData } from './types';
import { INITIAL_CHARACTERS, LEVELS } from './constants';
import GameCanvas from './components/GameCanvas';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('neon-dash-coins');
    return saved ? parseInt(saved) : 0;
  });
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('neon-dash-chars');
    return saved ? JSON.parse(saved) : INITIAL_CHARACTERS;
  });
  const [selectedCharId, setSelectedCharId] = useState(() => {
    return localStorage.getItem('neon-dash-selected-char') || INITIAL_CHARACTERS[0].id;
  });
  
  const [completedLevels, setCompletedLevels] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('neon-dash-completed');
    return saved ? JSON.parse(saved) : { Easy: 0, Medium: 0, Hard: 0 };
  });

  const [currentLevel, setCurrentLevel] = useState<LevelData>(LEVELS[0]);
  const [lastRunProgress, setLastRunProgress] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');

  useEffect(() => {
    localStorage.setItem('neon-dash-coins', coins.toString());
    localStorage.setItem('neon-dash-chars', JSON.stringify(characters));
    localStorage.setItem('neon-dash-selected-char', selectedCharId);
    localStorage.setItem('neon-dash-completed', JSON.stringify(completedLevels));
  }, [coins, characters, selectedCharId, completedLevels]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const selectedCharacter = characters.find(c => c.id === selectedCharId) || characters[0];

  const handleLevelSelect = (level: LevelData) => {
    setCurrentLevel(level);
    setGameState(GameState.PLAYING);
  };

  const handleNextLevel = () => {
    const nextLocalId = currentLevel.localId + 1;
    const nextLevel = LEVELS.find(l => l.difficulty === currentLevel.difficulty && l.localId === nextLocalId);
    if (nextLevel) {
      handleLevelSelect(nextLevel);
    } else {
      setGameState(GameState.LEVEL_SELECT);
    }
  };

  const handleGameOver = useCallback((progress: number, coinsEarned: number) => {
    setGameState(GameState.GAMEOVER);
    setLastRunProgress(progress);
    setCoins(prev => prev + coinsEarned);
  }, []);

  const handleWin = useCallback(() => {
    setGameState(GameState.GAMEOVER);
    setLastRunProgress(100);
    setCoins(prev => prev + 100); 

    const diff = currentLevel.difficulty as 'Easy' | 'Medium' | 'Hard';
    if (currentLevel.localId > completedLevels[diff]) {
      setCompletedLevels(prev => ({
        ...prev,
        [diff]: currentLevel.localId
      }));
    }
  }, [currentLevel, completedLevels]);

  const buyCharacter = (id: string) => {
    const char = characters.find(c => c.id === id);
    if (char && !char.unlocked && coins >= char.price) {
      setCoins(prev => prev - char.price);
      setCharacters(prev => prev.map(c => c.id === id ? { ...c, unlocked: true } : c));
    }
  };

  const updateCustomCharacter = (field: keyof Character, value: any) => {
    setCharacters(prev => prev.map(c => c.isCustom ? { ...c, [field]: value } : c));
  };

  const getBackgroundPulse = () => {
    switch (gameState) {
      case GameState.MENU: return 'bg-cyan-500';
      case GameState.DIFFICULTY_SELECT:
      case GameState.LEVEL_SELECT: 
        return isMultiplayer ? 'bg-red-600' : 'bg-yellow-500';
      case GameState.SHOP: return 'bg-green-500';
      case GameState.GAMEOVER: return lastRunProgress === 100 ? 'bg-cyan-500' : 'bg-red-600';
      default: return 'bg-white';
    }
  };

  const containerClass = `fixed inset-0 flex flex-col transition-colors duration-500 overflow-hidden ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-gray-100 text-black'}`;
  const showHeader = gameState !== GameState.PLAYING;

  const handleDifficultyClick = (diff: 'Easy' | 'Medium' | 'Hard') => {
    if (isMultiplayer) {
      const level = LEVELS.find(l => l.difficulty === diff);
      if (level) handleLevelSelect(level);
    } else {
      setActiveCategory(diff);
      setGameState(GameState.LEVEL_SELECT);
    }
  };

  return (
    <div className={containerClass}>
      {showHeader && (
        <header className="p-6 flex justify-between items-center z-50 relative w-full px-12">
          <div className="flex-1"></div>
          <div className="flex flex-col items-center flex-1">
            <h1 className="text-3xl font-black italic tracking-tighter cursor-pointer select-none" onClick={() => { setGameState(GameState.MENU); setIsMultiplayer(false); }}>
              NEON<span className="text-cyan-400">DASH</span>
            </h1>
          </div>
          <div className="flex-1 flex justify-end items-center gap-6">
            <button onClick={toggleFullscreen} className="p-2 hover:text-cyan-400 transition-colors">
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-lg`}></i>
            </button>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
              <i className="fas fa-coins text-yellow-400 text-sm"></i>
              <span className="font-bold text-lg">{coins}</span>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:text-cyan-400 transition-colors">
              <i className={`fas ${isDarkMode ? 'fa-sun text-lg' : 'fa-moon text-lg'}`}></i>
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 relative flex items-center justify-center">
        {gameState !== GameState.PLAYING && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 transition-all duration-1000">
             <div className={`w-[120vw] h-[120vw] ${getBackgroundPulse()} rounded-full blur-[200px] animate-pulse`}></div>
          </div>
        )}

        {gameState === GameState.MENU && (
          <div className="z-10 text-center space-y-16 max-w-6xl animate-in fade-in zoom-in duration-700 px-4">
            <div className="space-y-4">
              <h2 className="text-[12rem] font-black uppercase italic tracking-tighter leading-none bg-gradient-to-b from-white to-gray-700 bg-clip-text text-transparent">DASH</h2>
              <div className="flex items-center justify-center gap-8 opacity-40 uppercase tracking-[1em] text-[12px] font-bold">
                <span>SPEED</span><span>•</span><span>RHYTHM</span><span>•</span><span>FLOW</span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <button onClick={() => setGameState(GameState.DIFFICULTY_SELECT)} className="w-56 group relative overflow-hidden rounded-2xl bg-cyan-500 p-[1px] transition-all hover:scale-110">
                <div className="bg-black/90 rounded-2xl h-full py-5 px-6 flex items-center justify-center gap-4">
                  <i className="fas fa-play text-cyan-500 text-xl"></i><span className="text-2xl font-black italic text-white">PLAY</span>
                </div>
              </button>
              <button onClick={() => { setIsMultiplayer(true); setGameState(GameState.DIFFICULTY_SELECT); }} className="w-56 group relative overflow-hidden rounded-2xl bg-red-600 p-[1px] transition-all hover:scale-110">
                <div className="bg-black/90 rounded-2xl h-full py-5 px-6 flex items-center justify-center gap-4">
                  <i className="fas fa-users text-red-500 text-xl"></i><span className="text-lg font-black italic text-white uppercase">Multiplayer</span>
                </div>
              </button>
              <button onClick={() => setGameState(GameState.SHOP)} className="w-56 group relative overflow-hidden rounded-2xl bg-green-500 p-[1px] transition-all hover:scale-110">
                <div className="bg-black/90 rounded-2xl h-full py-5 px-6 flex items-center justify-center gap-4">
                  <i className="fas fa-shopping-cart text-green-400 text-xl"></i><span className="text-2xl font-black italic text-white">SHOP</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.DIFFICULTY_SELECT && (
          <div className="z-10 w-full max-w-6xl px-4 grid grid-cols-1 md:grid-cols-3 gap-10 animate-in fade-in zoom-in duration-500">
            {(['Easy', 'Medium', 'Hard'] as const).map(diff => {
              const borderColors = { Easy: 'bg-cyan-500', Medium: 'bg-yellow-400', Hard: 'bg-red-500' };
              const icons = { Easy: 'fa-feather', Medium: 'fa-bolt', Hard: 'fa-fire' };
              return (
                <button key={diff} onClick={() => handleDifficultyClick(diff)} className={`group relative h-64 rounded-3xl ${borderColors[diff]} p-[1.5px] transform hover:scale-105 transition-all`}>
                  <div className="w-full h-full bg-black/95 backdrop-blur-xl rounded-[1.4rem] flex flex-col items-center justify-center gap-4 p-6">
                    <i className={`fas ${icons[diff]} text-4xl text-white opacity-90 group-hover:scale-125 transition-transform duration-500`}></i>
                    <h3 className="text-3xl font-black uppercase italic tracking-tight">{diff}</h3>
                    <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em]">
                      {isMultiplayer ? 'QUICK START' : `${completedLevels[diff]} / 60 PROGRESS`}
                    </div>
                  </div>
                </button>
              );
            })}
            <button onClick={() => { setGameState(GameState.MENU); setIsMultiplayer(false); }} className="absolute bottom-16 left-16 p-6 hover:text-cyan-400 text-3xl transition-transform hover:-translate-x-2">
              <i className="fas fa-arrow-left"></i>
            </button>
          </div>
        )}

        {gameState === GameState.LEVEL_SELECT && (
          <div className="z-10 w-full max-w-7xl px-4 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center gap-6">
              <button onClick={() => setGameState(GameState.DIFFICULTY_SELECT)} className="p-4 hover:text-cyan-400 text-4xl transition-transform hover:-translate-x-2">
                <i className="fas fa-arrow-left"></i>
              </button>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">{activeCategory} MISSIONS</h2>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-3 overflow-y-auto max-h-[70vh] p-4 scrollbar-hide">
              {LEVELS.filter(l => l.difficulty === activeCategory).map(level => {
                const isUnlocked = level.localId === 1 || level.localId <= completedLevels[activeCategory] + 1;
                const categoryColor = activeCategory === 'Easy' ? 'bg-cyan-500' : activeCategory === 'Medium' ? 'bg-yellow-400' : 'bg-red-500';
                return (
                  <button 
                    key={level.id}
                    disabled={!isUnlocked}
                    onClick={() => handleLevelSelect(level)}
                    className={`relative aspect-square rounded-xl p-[1.5px] transition-all ${isUnlocked ? `${categoryColor} hover:scale-110 shadow-lg` : 'bg-white/10 opacity-30 cursor-not-allowed grayscale'}`}
                  >
                    <div className="w-full h-full bg-black/95 rounded-[0.6rem] flex flex-col items-center justify-center">
                      <span className={`text-2xl font-black ${!isUnlocked && 'text-gray-500'}`}>{level.localId}</span>
                      {!isUnlocked && <i className="fas fa-lock text-[8px] mt-1 text-gray-600"></i>}
                      {level.localId <= completedLevels[activeCategory] && <i className="fas fa-check-circle text-cyan-400 text-[8px] absolute top-1 right-1"></i>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {gameState === GameState.PLAYING && (
          <div className="fixed inset-0 w-full h-full bg-black z-[100] animate-in fade-in duration-1000">
            <GameCanvas level={currentLevel} character={selectedCharacter} isDarkMode={isDarkMode} isMultiplayer={isMultiplayer} onGameOver={handleGameOver} onWin={handleWin} />
          </div>
        )}

        {gameState === GameState.GAMEOVER && (
          <div className="z-10 text-center space-y-12 animate-in fade-in zoom-in duration-500">
            <h2 className={`text-[10rem] font-black italic uppercase ${lastRunProgress === 100 ? 'text-cyan-400' : 'text-red-600'} drop-shadow-2xl leading-none`}>
              {lastRunProgress === 100 ? 'SUCCESS' : 'FAILURE'}
            </h2>
            <div className="flex flex-col items-center gap-4">
               <div className="w-96 h-2 bg-white/5 rounded-full overflow-hidden shadow-inner">
                  <div style={{ width: `${lastRunProgress}%` }} className={`h-full ${lastRunProgress === 100 ? 'bg-cyan-500' : 'bg-red-600'} transition-all duration-1000`}></div>
               </div>
               <span className="text-lg font-bold opacity-30 uppercase tracking-[0.5em]">{lastRunProgress}% COMPLETE</span>
            </div>
            <div className="flex gap-8 justify-center items-center">
              {lastRunProgress === 100 && (
                <button onClick={handleNextLevel} className="w-56 group relative overflow-hidden rounded-2xl bg-white p-[1.5px] transition-all hover:scale-110 shadow-2xl">
                   <div className="bg-black/95 py-5 rounded-[1.1rem] font-black italic uppercase text-xl text-white group-hover:text-cyan-400">NEXT LEVEL</div>
                </button>
              )}
              <button onClick={() => handleLevelSelect(currentLevel)} className={`w-56 bg-cyan-500 p-[1.5px] rounded-2xl transition-all hover:scale-110 shadow-2xl ${lastRunProgress === 100 ? 'opacity-50 hover:opacity-100' : ''}`}>
                <div className="bg-black/95 py-5 rounded-[1.1rem] font-black italic uppercase text-xl">RETRY</div>
              </button>
              <button onClick={() => { setGameState(GameState.MENU); setIsMultiplayer(false); }} className="w-56 bg-white/10 p-[1.5px] rounded-2xl transition-all hover:scale-110">
                <div className="bg-black/95 py-5 rounded-[1.1rem] font-black italic uppercase text-xl text-white opacity-60">EXIT</div>
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.SHOP && (
          <div className="z-10 w-full max-w-6xl px-4 space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <button onClick={() => setGameState(GameState.MENU)} className="p-4 hover:text-green-400 text-4xl transition-transform hover:-translate-x-2">
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">THE ARMORY</h2>
              </div>
              <div className="flex items-center gap-6 bg-white/5 px-8 py-4 rounded-3xl border border-white/10 shadow-2xl">
                 <span className="text-xs font-bold opacity-40 uppercase tracking-[0.3em]">EQUIPPED</span>
                 <div style={{ backgroundColor: selectedCharacter.color, borderColor: selectedCharacter.secondaryColor }} className="w-16 h-16 rounded-xl border-4 shadow-2xl flex items-center justify-center text-xl">
                   <i className={`fas fa-${selectedCharacter.icon}`} style={{ color: selectedCharacter.secondaryColor }}></i>
                 </div>
              </div>
            </div>
            
            {selectedCharacter.isCustom && (
              <div className="bg-black/95 border border-white/10 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-12 mb-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="relative group">
                   <div style={{ backgroundColor: selectedCharacter.color, borderColor: selectedCharacter.secondaryColor }} className={`w-32 h-32 rounded-2xl border-[6px] shadow-2xl flex items-center justify-center text-5xl transition-all duration-500 ${selectedCharacter.shape === 'circle' ? 'rounded-full' : selectedCharacter.shape === 'diamond' ? 'rotate-45' : ''}`}>
                      <div className={`absolute inset-0 flex items-center justify-center ${selectedCharacter.pattern === 'striped' ? 'opacity-40' : 'opacity-0'}`}>
                         <div className="w-full h-2 bg-white mb-4"></div><div className="w-full h-2 bg-white"></div>
                      </div>
                      <div className="relative z-10">
                        <i className="fas fa-wand-magic-sparkles" style={{ color: selectedCharacter.secondaryColor }}></i>
                      </div>
                      <div style={{ backgroundColor: selectedCharacter.trailColor || selectedCharacter.color }} className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full opacity-50 blur-sm shadow-[0_0_15px_currentColor]"></div>
                   </div>
                   <div className="absolute -top-3 -right-3 bg-green-500 text-black text-[10px] font-black px-2 py-1 rounded-full">DESIGN MODE</div>
                </div>
                
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black opacity-30 uppercase tracking-widest">SHAPE</label>
                    <div className="flex gap-2">
                      {(['square', 'circle', 'diamond', 'hexagon'] as const).map(s => (
                        <button key={s} onClick={() => updateCustomCharacter('shape', s)} className={`w-8 h-8 rounded border transition-all ${selectedCharacter.shape === s ? 'bg-green-500 border-green-500 scale-125' : 'bg-white/5 border-white/20'}`}>
                          <i className={`fas fa-${s === 'square' ? 'square' : s === 'circle' ? 'circle' : s === 'diamond' ? 'diamond' : 'certificate'} text-[10px]`}></i>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black opacity-30 uppercase tracking-widest">PATTERN</label>
                    <div className="flex gap-2">
                      {(['solid', 'glow', 'striped', 'bordered'] as const).map(p => (
                        <button key={p} onClick={() => updateCustomCharacter('pattern', p)} className={`w-8 h-8 rounded border transition-all ${selectedCharacter.pattern === p ? 'bg-green-500 border-green-500 scale-125' : 'bg-white/5 border-white/20'}`}>
                          <i className={`fas fa-${p === 'solid' ? 'stop' : p === 'glow' ? 'sun' : p === 'striped' ? 'grip-lines' : 'square-full'} text-[10px]`}></i>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black opacity-30 uppercase tracking-widest">CORE</label>
                    <input type="color" value={selectedCharacter.color} onChange={(e) => updateCustomCharacter('color', e.target.value)} className="w-full h-10 bg-transparent cursor-pointer rounded overflow-hidden" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black opacity-30 uppercase tracking-widest">GLOW</label>
                    <input type="color" value={selectedCharacter.secondaryColor} onChange={(e) => updateCustomCharacter('secondaryColor', e.target.value)} className="w-full h-10 bg-transparent cursor-pointer rounded overflow-hidden" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black opacity-30 uppercase tracking-widest">TRAIL</label>
                    <input type="color" value={selectedCharacter.trailColor || selectedCharacter.color} onChange={(e) => updateCustomCharacter('trailColor', e.target.value)} className="w-full h-10 bg-transparent cursor-pointer rounded overflow-hidden" />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 overflow-y-auto max-h-[50vh] p-4 scrollbar-hide">
              {characters.map(char => (
                <div key={char.id} className={`group p-4 rounded-2xl flex flex-col items-center gap-4 border transition-all duration-300 ${selectedCharId === char.id ? 'border-green-400 bg-green-400/10 scale-105 shadow-2xl' : 'border-white/5 bg-black/60 hover:bg-white/5 hover:scale-105'}`}>
                  <div style={{ backgroundColor: char.color, borderColor: char.secondaryColor }} className={`w-16 h-16 rounded-xl border-4 flex items-center justify-center text-lg shadow-xl ${char.shape === 'circle' ? 'rounded-full' : ''}`}>
                    <i className={`fas fa-${char.icon}`} style={{ color: char.secondaryColor }}></i>
                  </div>
                  {char.unlocked ? (
                    <button onClick={() => setSelectedCharId(char.id)} className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${selectedCharId === char.id ? 'bg-green-500 text-black' : 'bg-white/10 text-white/60'}`}>
                      {selectedCharId === char.id ? 'ACTIVE' : 'SELECT'}
                    </button>
                  ) : (
                    <button onClick={() => buyCharacter(char.id)} disabled={coins < char.price} className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${coins >= char.price ? 'bg-yellow-400 text-black shadow-lg' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}>
                      {char.price} <i className="fas fa-coins ml-1"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
