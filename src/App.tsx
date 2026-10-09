/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { GameStats, ActivePowerup, GameSettings } from './game/types';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { LockerModal } from './components/LockerModal';
import { sounds } from './game/sound';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    coins: 0,
    distance: 0,
    multiplier: 1,
    highScore: 0,
    totalCoins: 0,
    hoverboardsOwned: 3,
  });
  const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    graphicsPreset: 'ultra',
    targetFps: 60,
    soundEnabled: true,
    musicEnabled: true,
    touchSensitivity: 1.0,
    showOnScreenControls: false,
    hapticFeedback: true,
  });

  // Initialize engine once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onStatsUpdate: (updatedStats) => {
        setStats(updatedStats);
      },
      onPowerupUpdate: (updatedPowerups) => {
        setActivePowerups(updatedPowerups);
      },
      onGameOver: (finalStats) => {
        setStats(finalStats);
        setGameState('gameover');
      },
      onReviveSuccess: () => {
        setGameState('playing');
      },
    });

    engineRef.current = engine;
    setStats(engine.getStats());
    setSettings(engine.getSettings());

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    if (!engineRef.current) return;
    engineRef.current.startGame();
    setGameState('playing');
  };

  const handlePause = () => {
    if (!engineRef.current) return;
    engineRef.current.pauseGame();
    setGameState('paused');
  };

  const handleResume = () => {
    if (!engineRef.current) return;
    engineRef.current.resumeGame();
    setGameState('playing');
  };

  const handleRestart = () => {
    if (!engineRef.current) return;
    engineRef.current.startGame();
    setGameState('playing');
  };

  const handleRevive = () => {
    if (!engineRef.current) return;
    engineRef.current.revive();
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    sounds.setMuted(newMuted);
    if (engineRef.current) {
      engineRef.current.setSettings({
        soundEnabled: !newMuted,
        musicEnabled: !newMuted,
      });
      setSettings(engineRef.current.getSettings());
    }
  };

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    if (!engineRef.current) return;
    engineRef.current.setSettings(newSettings);
    setSettings(engineRef.current.getSettings());
    if (newSettings.soundEnabled !== undefined) {
      setIsMuted(!newSettings.soundEnabled);
    }
  };

  const handleBuyHoverboard = (cost: number) => {
    if (!engineRef.current) return false;
    return engineRef.current.buyHoverboard(cost);
  };

  const handleDeployHoverboard = () => {
    if (!engineRef.current) return;
    engineRef.current.activateHoverboard();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070913] select-none touch-none">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Main Menu State */}
      {gameState === 'menu' && (
        <MainMenu
          stats={stats}
          onStartGame={handleStartGame}
          onOpenStore={() => setShowStore(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* In-Game Heads-Up Display (HUD) */}
      {gameState === 'playing' && (
        <HUD
          stats={stats}
          activePowerups={activePowerups}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onDeployHoverboard={handleDeployHoverboard}
          showOnScreenControls={settings.showOnScreenControls}
          onMoveLeft={() => engineRef.current?.moveLane(-1)}
          onMoveRight={() => engineRef.current?.moveLane(1)}
          onJump={() => engineRef.current?.jump()}
          onRoll={() => engineRef.current?.roll()}
        />
      )}

      {/* Pause Screen Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onOpenSettings={() => setShowSettings(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Screen Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={stats}
          onRestart={handleRestart}
          onRevive={handleRevive}
          onOpenStore={() => setShowStore(true)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Locker & Store Modal */}
      {showStore && (
        <LockerModal
          stats={stats}
          onBuyHoverboard={handleBuyHoverboard}
          onClose={() => setShowStore(false)}
        />
      )}
    </div>
  );
}
