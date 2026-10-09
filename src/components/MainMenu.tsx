import React from 'react';
import { GameStats } from '../game/types';
import { Play, Shield, Settings, Trophy, Smartphone, ArrowRight } from 'lucide-react';

interface MainMenuProps {
  stats: GameStats;
  onStartGame: () => void;
  onOpenStore: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  onStartGame,
  onOpenStore,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-8 bg-gradient-to-t from-black/90 via-black/40 to-black/60 pointer-events-auto">
      {/* Top Bar: Stats and Settings */}
      <div className="w-full flex items-center justify-between">
        {/* Record info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="text-xs">
              <span className="text-slate-400 mr-1.5">Recorde:</span>
              <span className="font-game font-bold text-white tabular-nums">
                {stats.highScore.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-lg">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-200 inline-block shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="font-game font-bold text-amber-300 tabular-nums text-xs">
              {stats.totalCoins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="w-11 h-11 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors shadow-lg active:scale-95"
          aria-label="Abrir configurações"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Branding & Start CTA */}
      <div className="flex flex-col items-center text-center max-w-lg mx-auto w-full my-auto py-6">
        <div className="mb-2">
          <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">
            Metrô Runner 3D Ultra
          </span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold font-game text-white tracking-tight leading-none mb-3 drop-shadow-md">
          SUBWAY <span className="text-cyan-400">SURFERS</span>
        </h1>
        
        <p className="text-slate-300 text-xs sm:text-sm max-w-md leading-relaxed mb-6 font-medium drop-shadow">
          Corrida infinita com física fluida em 3D, trens em alta velocidade e trilhos urbanos ultra realistas.
        </p>

        {/* Start Game Action */}
        <button
          onClick={onStartGame}
          className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-game font-bold text-xl sm:text-2xl tracking-wide flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.5)] mb-4"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>INICIAR CORRIDA</span>
          <ArrowRight className="w-6 h-6" />
        </button>

        {/* Secondary Store Button */}
        <button
          onClick={onOpenStore}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 text-xs font-semibold transition-all active:scale-95 shadow-md"
        >
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Loja de Pranchas ({stats.hoverboardsOwned} em posse)</span>
        </button>
      </div>

      {/* Bottom: Mobile & Desktop Controls Quick Guide */}
      <div className="max-w-xl mx-auto w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 sm:p-4 text-xs text-slate-300 shadow-xl">
        <div className="flex items-center gap-2 font-semibold text-white mb-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <span>Como Jogar</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
          <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
            <div className="font-bold text-cyan-300">Deslize ⇄</div>
            <div className="text-slate-400">Mudar de trilho</div>
          </div>
          <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
            <div className="font-bold text-amber-300">Deslize ⇧</div>
            <div className="text-slate-400">Pular obstáculo</div>
          </div>
          <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
            <div className="font-bold text-amber-300">Deslize ⇩</div>
            <div className="text-slate-400">Rolar / Descer</div>
          </div>
          <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
            <div className="font-bold text-cyan-300">Toque 2x</div>
            <div className="text-slate-400">Invocar Prancha</div>
          </div>
        </div>
      </div>
    </div>
  );
};
