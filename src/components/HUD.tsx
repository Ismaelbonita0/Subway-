import React from 'react';
import { GameStats, ActivePowerup } from '../game/types';
import { 
  Pause, 
  Volume2, 
  VolumeX, 
  Shield, 
  Rocket, 
  Magnet, 
  Zap, 
  Award,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  activePowerups: ActivePowerup[];
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onDeployHoverboard: () => void;
  showOnScreenControls: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onRoll: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  activePowerups,
  isMuted,
  onToggleMute,
  onPause,
  onDeployHoverboard,
  showOnScreenControls,
  onMoveLeft,
  onMoveRight,
  onJump,
  onRoll,
}) => {
  const hoverboardActive = activePowerups.some(p => p.type === 'hoverboard');

  const getPowerupIcon = (type: string) => {
    switch (type) {
      case 'hoverboard':
        return <Shield className="w-4 h-4 text-cyan-400" />;
      case 'jetpack':
        return <Rocket className="w-4 h-4 text-indigo-400" />;
      case 'magnet':
        return <Magnet className="w-4 h-4 text-red-400" />;
      case 'sneakers':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'multiplier':
        return <Award className="w-4 h-4 text-purple-400" />;
      default:
        return null;
    }
  };

  const getPowerupLabel = (type: string) => {
    switch (type) {
      case 'hoverboard':
        return 'Hoverboard';
      case 'jetpack':
        return 'Jetpack';
      case 'magnet':
        return 'Ímã';
      case 'sneakers':
        return 'Super Pulo';
      case 'multiplier':
        return '2x Multi';
      default:
        return type;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 z-10">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Quick Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onPause}
            className="w-11 h-11 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors active:scale-95 shadow-lg"
            aria-label="Pausar jogo"
          >
            <Pause className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleMute}
            className="w-11 h-11 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors active:scale-95 shadow-lg"
            aria-label="Alternar áudio"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Center: Live Power-Up Indicators */}
        <div className="flex flex-col items-center gap-1.5">
          {activePowerups.map((p) => {
            const pct = Math.max(0, Math.min(100, (p.timeLeft / p.duration) * 100));
            return (
              <div 
                key={p.type} 
                className="flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/15 rounded-lg text-xs"
              >
                {getPowerupIcon(p.type)}
                <span className="font-semibold text-white/90">{getPowerupLabel(p.type)}</span>
                <span className="tabular-nums text-white/60 font-mono text-[11px]">
                  {p.timeLeft.toFixed(1)}s
                </span>
                <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden ml-1">
                  <div 
                    className="h-full bg-cyan-400 transition-all duration-100 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Score, Coins and Multiplier */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* Main Score Counter */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-right shadow-lg">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Pontuação</div>
            <div className="font-game text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums drop-shadow-sm">
              {stats.score.toLocaleString()}
            </div>
          </div>

          {/* Coins and Multiplier */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md border border-amber-500/30 rounded-lg shadow-sm">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-200 inline-block shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <span className="font-game font-bold text-amber-300 tabular-nums text-sm sm:text-base">
                {stats.coins.toLocaleString()}
              </span>
            </div>

            <div className="px-2.5 py-1 bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-lg text-xs font-game font-bold text-purple-300 tabular-nums">
              {stats.multiplier}x
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Hoverboard quick summon & Optional on-screen touch buttons */}
      <div className="flex items-end justify-between gap-4">
        {/* Left: Quick Hoverboard Deployment Button */}
        <div className="pointer-events-auto">
          <button
            onClick={onDeployHoverboard}
            disabled={stats.hoverboardsOwned <= 0 || hoverboardActive}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-md border shadow-xl transition-all active:scale-95 ${
              hoverboardActive
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/40'
                : stats.hoverboardsOwned > 0
                ? 'bg-black/60 border-cyan-500/40 hover:border-cyan-400 text-white'
                : 'bg-black/40 border-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <div className="relative">
              <Shield className={`w-6 h-6 ${hoverboardActive ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />
              {stats.hoverboardsOwned > 0 && !hoverboardActive && (
                <span className="absolute -top-2 -right-2 bg-cyan-500 text-black text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                  {stats.hoverboardsOwned}
                </span>
              )}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">
                {hoverboardActive ? 'Prancha Ativa' : 'Prancha (2x Toque)'}
              </div>
              <div className="text-[10px] text-white/60">
                {hoverboardActive ? 'Proteção contra batida' : `${stats.hoverboardsOwned} disponíveis`}
              </div>
            </div>
          </button>
        </div>

        {/* Right: On-Screen Touch Controls (if enabled in settings) */}
        {showOnScreenControls && (
          <div className="pointer-events-auto flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
            <button
              onClick={onMoveLeft}
              className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 active:bg-cyan-500/40 border border-white/15 flex items-center justify-center text-white transition-all active:scale-90"
              aria-label="Mover para esquerda"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <div className="flex flex-col gap-2">
              <button
                onClick={onJump}
                className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 active:bg-amber-500/40 border border-white/15 flex items-center justify-center text-white transition-all active:scale-90"
                aria-label="Pular"
              >
                <ArrowUp className="w-7 h-7" />
              </button>
              <button
                onClick={onRoll}
                className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 active:bg-amber-500/40 border border-white/15 flex items-center justify-center text-white transition-all active:scale-90"
                aria-label="Rolar"
              >
                <ArrowDown className="w-7 h-7" />
              </button>
            </div>
            <button
              onClick={onMoveRight}
              className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 active:bg-cyan-500/40 border border-white/15 flex items-center justify-center text-white transition-all active:scale-90"
              aria-label="Mover para direita"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
