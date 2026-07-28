import React, { useState } from 'react';
import { Bookmark, Save, Trash2, Check, X, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useMinigamesStore } from '@/store/minigamesStore';

interface MinigamePresetBarProps {
  activeGameId: string;
  gameId: string; // 'clicker' | 'cards' | 'coin_flip'
  currentConfig: any;
}

export const MinigamePresetBar: React.FC<MinigamePresetBarProps> = ({ activeGameId, gameId, currentConfig }) => {
  const { presets, savePreset, deletePreset, applyPreset } = useMinigamesStore();
  const [isSaving, setIsSaving] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');

  const typePresets = presets.filter(p => p.gameId === gameId);

  const inputClass = clsx(
    "p-2 text-xs rounded-xl border transition-all focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50",
    "bg-black/50 border-white/10 text-white placeholder-neutral-500"
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    savePreset(gameId, presetName.trim(), currentConfig || {});
    setPresetName('');
    setIsSaving(false);
  };

  return (
    <div className="p-3 border border-white/10 rounded-2xl bg-neutral-900/90 backdrop-blur-2xl shadow-2xl shadow-black/80 flex flex-col gap-2.5 transition-all">
      {/* Header with luminous icon badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 select-none">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-orange-500/20 border border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center">
            <Bookmark size={13} className="drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#fbbf24]" />
            <span className="text-xs font-semibold tracking-wide text-amber-300 drop-shadow-sm">Presets de Configuração</span>
          </div>
        </div>

        {!isSaving && (
          <button
            type="button"
            onClick={() => setIsSaving(true)}
            className="px-2.5 py-1 text-[11px] rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/30 text-white font-medium flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all cursor-pointer"
            title="Salvar configuração atual como um preset permanente"
          >
            <Save size={12} />
            <span>Salvar Preset</span>
          </button>
        )}
      </div>

      {isSaving ? (
        <form onSubmit={handleSave} className="flex items-center gap-2 animate-in fade-in duration-200">
          <input
            type="text"
            placeholder="Nome do Preset (ex: Chefão 100 Cliques)..."
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            autoFocus
            className={clsx(inputClass, "flex-1")}
          />
          <button
            type="submit"
            disabled={!presetName.trim()}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 text-white text-xs rounded-xl font-medium disabled:opacity-50 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center justify-center"
            title="Confirmar e Salvar"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsSaving(false)}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center"
            title="Cancelar"
          >
            <X size={14} />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              className={clsx(inputClass, "w-full cursor-pointer appearance-none pr-7")}
              value={selectedPresetId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPresetId(val);
                if (val) {
                  applyPreset(activeGameId, val);
                }
              }}
            >
              <option value="" className="bg-neutral-900 text-neutral-400">Carregar Preset Salvo...</option>
              {typePresets.map(p => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-white">{p.name}</option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
              <Sparkles size={12} className="text-amber-400/70" />
            </div>
          </div>

          {selectedPresetId && (
            <button
              type="button"
              onClick={() => {
                deletePreset(selectedPresetId);
                setSelectedPresetId('');
              }}
              className="p-2 text-neutral-400 hover:text-rose-400 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer flex items-center justify-center"
              title="Excluir preset selecionado"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

