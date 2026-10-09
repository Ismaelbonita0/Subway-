import React from 'react';
import { GameStats } from '../game/types';
import { RotateCcw, Shield, Trophy } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onRevive: () => void;
  onOpenStore: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onRevive,
  onOpenStore,
}) => {
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;
  const canRevive = stats.hoverboardsOwned > 0 || stats.totalCoins >= 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Title */}
        <div className="mb-2">
          {isNewHighScore ? (
            <div className="inline-flex items-center gap-1.5 text-amber-400 font-semibold text-sm mb-1">
              <Trophy className="w-4 h-4" />
              <span>Novo Recorde!</span>
            </div>
          ) : (
            <div className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">
              Fim de Jogo
            </div>
          )}
          <h2 className="text-3xl font-extrabold font-game text-white tracking-tight">
            Corrida Encerrada
          </h2>
        </div>

        {/* Big Score Card */}
        <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 my-5">
          <div className="text-xs text-slate-400 font-medium mb-1">Pontuação Final</div>
          <div className="text-4xl sm:text-5xl font-game font-bold text-white tabular-nums tracking-tight mb-4">
            {stats.score.toLocaleString()}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-left">
            <div>
              <div className="text-[11px] text-slate-400">Moedas Coletadas</div>
              <div className="text-lg font-game font-bold text-amber-300 tabular-nums">
                +{stats.coins.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Distância Percorrida</div>
              <div className="text-lg font-game font-bold text-cyan-300 tabular-nums">
                {stats.distance.toLocaleString()}m
              </div>
            </div>
          </div>
        </div>

        {/* Record & Total Coins info (No pills, clean unboxed typography) */}
        <div className="w-full flex items-center justify-around text-xs text-slate-400 mb-6 px-2">
          <div>
            <span>Melhor: </span>
            <span className="font-semibold text-white tabular-nums">{stats.highScore.toLocaleString()}</span>
          </div>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <div>
            <span>Saldo: </span>
            <span className="font-semibold text-amber-400 tabular-nums">{stats.totalCoins.toLocaleString()} moedas</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {canRevive && (
            <button
              onClick={onRevive}
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-cyan-500/20"
            >
              <Shield className="w-4 h-4" />
              <span>
                {stats.hoverboardsOwned > 0 
                  ? 'Reviver com Prancha (1 Restante)' 
                  : 'Reviver por 100 Moedas'}
              </span>
            </button>
          )}

          <button
            onClick={onRestart}
            className="w-full py-3.5 px-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Correr Novamente</span>
          </button>

          <button
            onClick={onOpenStore}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs transition-colors"
          >
            Loja & Pranchas
          </button>
        </div>

      </div>
    </div>
  );
};
