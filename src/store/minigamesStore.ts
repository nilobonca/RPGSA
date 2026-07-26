import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { useCanvasGlobalStore } from './canvasStore';

export interface ActiveGame {
  id: string;
  gameId: string;
  title: string;
  isMinimized: boolean;
  config?: any;
  status?: 'idle' | 'running' | 'finished';
}

export interface MinigamePreset {
  id: string;
  name: string;
  gameId: string;
  config: any;
  createdAt: number;
}

interface PlayerProgress {
  clicks: number;
  name?: string;
  coinResult?: string;
  spinning?: boolean;
  cardResult?: { index: number; card?: { type: string; value: string; title?: string }; imageUrl?: string };
}

interface MinigamesState {
  activeGames: ActiveGame[];
  playerProgress: Record<string, PlayerProgress>;
  lastConfigs: Record<string, any>;
  presets: MinigamePreset[];
  broadcastEvent?: (event: { type: string, payload: any }) => void;
  
  addGame: (game: ActiveGame) => void;
  removeGame: (id: string) => void;
  toggleMinimize: (id: string) => void;
  updateGame: (id: string, update: Partial<ActiveGame>) => void;
  updateGameConfig: (id: string, updater: (config: any) => any) => void;
  updateProgress: (listenerId: string, clicks: number, name?: string, coinResult?: string, cardResult?: { index: number; card?: { type: string; value: string; title?: string }; imageUrl?: string }) => void;
  setSpinning: (listenerId: string, spinning: boolean, name?: string) => void;
  clearProgress: () => void;
  setBroadcastEvent: (fn: (event: { type: string, payload: any }) => void) => void;

  // Preset operations
  savePreset: (gameId: string, name: string, config: any) => void;
  deletePreset: (presetId: string) => void;
  applyPreset: (activeGameId: string, presetId: string) => void;
}

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('RPGSA_DB', 9);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('keyval')) {
            request.result.createObjectStore('keyval');
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('keyval')) {
            resolve(null);
            return;
          }
          const tx = db.transaction('keyval', 'readonly');
          const store = tx.objectStore('keyval');
          const getReq = store.get(name);
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        };
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('RPGSA_DB', 9);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('keyval')) {
            request.result.createObjectStore('keyval');
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('keyval')) {
            resolve();
            return;
          }
          const tx = db.transaction('keyval', 'readwrite');
          const store = tx.objectStore('keyval');
          const putReq = store.put(value, name);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        };
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('RPGSA_DB', 9);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('keyval')) {
            request.result.createObjectStore('keyval');
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('keyval')) {
            resolve();
            return;
          }
          const tx = db.transaction('keyval', 'readwrite');
          const store = tx.objectStore('keyval');
          const delReq = store.delete(name);
          delReq.onsuccess = () => resolve();
          delReq.onerror = () => resolve();
        };
        request.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }
};

export const useMinigamesStore = create<MinigamesState>()(
  persist(
    (set, get) => ({
      activeGames: [],
      playerProgress: {},
      lastConfigs: {},
      presets: [],

      addGame: (game) => {
        const lastConfig = get().lastConfigs[game.gameId];
        const mergedGame = {
          ...game,
          config: {
            ...(game.config || {}),
            ...(lastConfig || {})
          }
        };
        set((state) => ({
          activeGames: [...state.activeGames, mergedGame]
        }));
        useCanvasGlobalStore.getState().bringToFront(`minigame-${game.id}`);
      },

      removeGame: (id) => {
        const target = get().activeGames.find(g => g.id === id);
        if (target && target.config) {
          set(state => ({
            lastConfigs: {
              ...state.lastConfigs,
              [target.gameId]: target.config
            }
          }));
        }
        set((state) => ({
          activeGames: state.activeGames.filter((g) => g.id !== id)
        }));
      },

      toggleMinimize: (id) => set((state) => {
        const targetGame = state.activeGames.find(g => g.id === id);
        if (targetGame && targetGame.isMinimized) {
          useCanvasGlobalStore.getState().bringToFront(`minigame-${id}`);
        }
        return {
          activeGames: state.activeGames.map((g) =>
            g.id === id ? { ...g, isMinimized: !g.isMinimized } : g
          )
        };
      }),

      updateGame: (id, update) => set((state) => {
        const activeGames = state.activeGames.map(g => {
          if (g.id === id) {
            const updated = { ...g, ...update };
            if (update.config) {
              state.lastConfigs[g.gameId] = update.config;
            }
            return updated;
          }
          return g;
        });
        return { activeGames, lastConfigs: { ...state.lastConfigs } };
      }),

      updateGameConfig: (id, updater) => set((state) => {
        const activeGames = state.activeGames.map(g => {
          if (g.id === id) {
            const newConfig = updater(g.config || {});
            state.lastConfigs[g.gameId] = newConfig;
            return { ...g, config: newConfig };
          }
          return g;
        });
        return { activeGames, lastConfigs: { ...state.lastConfigs } };
      }),

      updateProgress: (listenerId, clicks, name, coinResult, cardResult) => set((state) => {
        const existing = state.playerProgress[listenerId];
        return {
          playerProgress: {
            ...state.playerProgress,
            [listenerId]: { 
              clicks, 
              name: name || existing?.name || 'Ouvinte', 
              coinResult: coinResult || existing?.coinResult, 
              cardResult: cardResult || existing?.cardResult,
              spinning: false 
            }
          }
        };
      }),

      setSpinning: (listenerId, spinning, name) => set((state) => {
        const existing = state.playerProgress[listenerId] || { clicks: 0, name: name || 'Ouvinte' };
        return {
          playerProgress: {
            ...state.playerProgress,
            [listenerId]: { ...existing, spinning, name: name || existing.name || 'Ouvinte' }
          }
        };
      }),

      clearProgress: () => set({ playerProgress: {} }),
      setBroadcastEvent: (fn) => set({ broadcastEvent: fn }),

      savePreset: (gameId, name, config) => set(state => {
        const newPreset: MinigamePreset = {
          id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          gameId,
          config,
          createdAt: Date.now()
        };
        return { presets: [...state.presets, newPreset] };
      }),

      deletePreset: (presetId) => set(state => ({
        presets: state.presets.filter(p => p.id !== presetId)
      })),

      applyPreset: (activeGameId, presetId) => set(state => {
        const preset = state.presets.find(p => p.id === presetId);
        if (!preset) return state;
        const activeGames = state.activeGames.map(g => 
          g.id === activeGameId ? { ...g, config: { ...preset.config } } : g
        );
        return {
          activeGames,
          lastConfigs: { ...state.lastConfigs, [preset.gameId]: preset.config }
        };
      })
    }),
    {
      name: 'rpgsa_minigame_store_v1',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        lastConfigs: state.lastConfigs,
        presets: state.presets,
        activeGames: state.activeGames
      })
    }
  )
);
