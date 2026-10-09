import React, { useState } from 'react';
import { GameStats } from '../game/types';
import { X, Shield, Plus, Check } from 'lucide-react';

interface LockerModalProps {
  stats: GameStats;
  onBuyHoverboard: (cost: number) => boolean;
  onClose: () => void;
}

export const LockerModal: React.FC<LockerModalProps> = ({
  stats,
  onBuyHoverboard,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'boards' | 'characters'>('boards');
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const hoverboardCost = 250;

  const handleBuy = () => {
    const success = onBuyHoverboard(hoverboardCost);
    if (success) {
      setPurchaseSuccess('Prancha adquirida com sucesso!');
      setTimeout(() => setPurchaseSuccess(null), 2500);
    } else {
      setPurchaseSuccess('Moedas insuficientes!');
      setTimeout(() => setPurchaseSuccess(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold font-game text-white tracking-tight">
              Arsenal & Pranchas
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Saldo:</span>
              <span className="font-bold text-amber-400 tabular-nums">
                {stats.totalCoins.toLocaleString()} moedas
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls (Functional buttons per guidelines) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 my-4">
          <button
            onClick={() => setActiveTab('boards')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'boards'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pranchas Magnéticas
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'characters'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Corredores Urbanos
          </button>
        </div>

        {purchaseSuccess && (
          <div className="mb-4 py-2 px-3 bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs rounded-xl text-center">
            {purchaseSuccess}
          </div>
        )}

        {/* Tab Content: Boards */}
        {activeTab === 'boards' && (
          <div className="space-y-4">
            {/* Featured Board Card */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 p-4">
              <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 mb-3 group">
                <img
                  src="/src/assets/images/hoverboard_showcase_1791557000596.jpg"
                  alt="Aether Tech Cyber Hoverboard"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <div>
                    <div className="text-white font-bold text-base">Aether MagLev 9000</div>
                    <div className="text-[11px] text-cyan-300">Propulsor magnético com escudo kinetic anti-impacto</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Em estoque</div>
                  <div className="text-xl font-game font-bold text-white tabular-nums">
                    {stats.hoverboardsOwned} unidades
                  </div>
                </div>

                <button
                  onClick={handleBuy}
                  disabled={stats.totalCoins < hoverboardCost}
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    stats.totalCoins >= hoverboardCost
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Comprar por {hoverboardCost} Moedas</span>
                </button>
              </div>
            </div>

            {/* Board benefits description */}
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/60 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Como funciona a Prancha</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Durante a corrida, dê um <strong className="text-white">duplo toque rápido</strong> em qualquer parte da tela ou pressione o botão do escudo para subir na prancha. Se você bater em qualquer trem ou obstáculo enquanto estiver nela, a prancha absorve todo o impacto e você continua correndo!
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: Characters */}
        {activeTab === 'characters' && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex gap-4 items-center mb-3">
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                  <img
                    src="/src/assets/images/subway_character_avatar_1791556986195.jpg"
                    alt="Corredor Urbano Protagonista"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Metro Runner Alpha</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Moletom aerodinâmico esportivo e fones magnéticos.
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Equipado & Ativo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
