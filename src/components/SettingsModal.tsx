import React from 'react';
import { GameSettings } from '../game/types';
import { X, Smartphone, Volume2, Sparkles, Sliders } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold font-game text-white tracking-tight">
              Ajustes & Desempenho
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Graphics Quality */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Qualidade Gráfica 3D</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              {(['performance', 'balanced', 'ultra'] as const).map((preset) => {
                const label = preset === 'performance' ? 'Fluido' : preset === 'balanced' ? 'Equilibrado' : 'Ultra 3D';
                const isSelected = settings.graphicsPreset === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => onUpdateSettings({ graphicsPreset: preset })}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 px-1">
              {settings.graphicsPreset === 'ultra' && 'Resolução nativa 2x, iluminação PBR e sombras em tempo real.'}
              {settings.graphicsPreset === 'balanced' && 'Filtro otimizado para celulares médios mantendo alto nível visual.'}
              {settings.graphicsPreset === 'performance' && 'Desativa sombras pesadas para atingir taxa máxima de quadros.'}
            </p>
          </div>

          {/* FPS Target */}
          <div>
            <div className="flex items-center justify-between text-sm font-semibold text-white mb-2">
              <span>Taxa de Atualização Alvo</span>
              <span className="text-xs font-mono text-cyan-400">{settings.targetFps} FPS</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => onUpdateSettings({ targetFps: 60 })}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  settings.targetFps === 60
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Padrão 60 FPS
              </button>
              <button
                onClick={() => onUpdateSettings({ targetFps: 120 })}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  settings.targetFps === 120
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ProMotion 120 FPS
              </button>
            </div>
          </div>

          {/* Touch Sensitivity */}
          <div>
            <div className="flex items-center justify-between text-sm font-semibold text-white mb-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Sensibilidade do Deslize Mobile</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {Math.round(settings.touchSensitivity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.05"
              value={settings.touchSensitivity}
              onChange={(e) => onUpdateSettings({ touchSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Mais firme</span>
              <span>Ultra responsivo</span>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {/* On-screen controls */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Botões Virtuais na Tela</div>
                <div className="text-[11px] text-slate-400">Adiciona setas para controle tátil além de gestos</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showOnScreenControls}
                onChange={(e) => onUpdateSettings({ showOnScreenControls: e.target.checked })}
                className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            {/* Sound FX */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Efeitos Sonoros (SFX)</div>
                <div className="text-[11px] text-slate-400">Trilhos, pulos, moedas e trens sintetizados</div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            {/* Background Music */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Trilha Sonora Procedural</div>
                <div className="text-[11px] text-slate-400">Batida eletrônica adaptativa de alta energia</div>
              </div>
              <input
                type="checkbox"
                checked={settings.musicEnabled}
                onChange={(e) => onUpdateSettings({ musicEnabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            {/* Haptics */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Vibração Tátil (Mobile)</div>
                <div className="text-[11px] text-slate-400">Feedback físico em pulos, curvas e batidas</div>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => onUpdateSettings({ hapticFeedback: e.target.checked })}
                className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Done Button */}
        <div className="mt-7 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-cyan-500/20"
          >
            Salvar e Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
