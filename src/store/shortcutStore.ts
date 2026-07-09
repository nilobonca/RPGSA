import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const defaultBindings: Record<string, string> = {
  // Menus e Painéis
  toggleChat: 'c',
  toggleDiceTray: 'd',
  toggleHistory: 'h',
  toggleSoundboard: 's',
  toggleGlobalAudio: 'g',
  toggleLayers: 'l',
  toggleSettings: 'o',
  
  // Ferramentas
  toolCursor: 'v',
  toolArea: 'a',
  toolWall: 'w',
  toolPin: 'p',
  toolNote: 'n',
  toolEraser: 'e',

  // Controle de Áudio
  muteMaster: 'm',
  stopAllAudio: 'Escape',

  // Sistema
  toggleTheaterMode: 'F10',
  togglePreviewMode: 'Shift+P',
  undo: 'Control+z',
  redo: 'Control+y',
  deleteSelection: 'Delete',
};

type ShortcutState = {
  bindings: Record<string, string>;
  setBinding: (actionId: string, keys: string) => void;
  resetToDefaults: () => void;
};

export const useShortcutStore = create<ShortcutState>()(
  persist(
    (set) => ({
      bindings: defaultBindings,
      setBinding: (actionId, keys) => 
        set((state) => ({
          bindings: { ...state.bindings, [actionId]: keys }
        })),
      resetToDefaults: () => set({ bindings: defaultBindings }),
    }),
    {
      name: 'vsd-shortcuts',
    }
  )
);
