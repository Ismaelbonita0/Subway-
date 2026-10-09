import React from 'react';
import { Play, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-2xl font-bold font-game text-white tracking-tight mb-6">
          Jogo Pausado
        </h2>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Continuar</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reiniciar Corrida</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
            <span>{isMuted ? 'Ativar Áudio' : 'Desativar Áudio'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Configurações & Gráficos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
