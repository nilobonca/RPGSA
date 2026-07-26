import React, { useState } from 'react';
import { Bookmark, Save, Trash2, Check } from 'lucide-react';
import clsx from 'clsx';
import { useMinigamesStore } from '@/store/minigamesStore';
import { useThemeStore } from '@/store/themeStore';

interface MinigamePresetBarProps {
  activeGameId: string;
  gameId: string; // 'clicker' | 'cards' | 'coin_flip'
  currentConfig: any;
}

export const MinigamePresetBar: React.FC<MinigamePresetBarProps> = ({ activeGameId, gameId, currentConfig }) => {
  const { presets, savePreset, deletePreset, applyPreset } = useMinigamesStore();
  const { theme } = useThemeStore();
  const [isSaving, setIsSaving] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');

  const typePresets = presets.filter(p => p.gameId === gameId);
  const isEthereal = theme === 'ethereal';
  const inputClass = clsx(
    "p-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500",
    isEthereal ? "bg-black/40 border-white/10 text-white placeholder-neutral-500" : "bg-neutral-800 border-neutral-700 text-neutral-200 placeholder-neutral-500"
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    savePreset(gameId, presetName.trim(), currentConfig || {});
    setPresetName('');
    setIsSaving(false);
  };

  return (
    <div className="p-2 border border-neutral-700/60 rounded-xl bg-neutral-900/60 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs select-none">
          <Bookmark size={13} />
          <span>Presets de Configuração</span>
        </div>
        {!isSaving && (
          <button
            type="button"
            onClick={() => setIsSaving(true)}
            className="px-2 py-1 text-[11px] rounded bg-indigo-600/80 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title="Salvar configuração atual como um preset permanente"
          >
            <Save size={11} />
            Salvar Preset
          </button>
        )}
      </div>

      {isSaving ? (
        <form onSubmit={handleSave} className="flex items-center gap-1.5 animate-in fade-in duration-200">
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
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded font-medium disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            onClick={() => setIsSaving(false)}
            className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs rounded transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-1.5">
          <select
            className={clsx(inputClass, "flex-1 cursor-pointer")}
            value={selectedPresetId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedPresetId(val);
              if (val) {
                applyPreset(activeGameId, val);
              }
            }}
          >
            <option value="">Carregar Preset Salvo...</option>
            {typePresets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {selectedPresetId && (
            <button
              type="button"
              onClick={() => {
                deletePreset(selectedPresetId);
                setSelectedPresetId('');
              }}
              className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
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
