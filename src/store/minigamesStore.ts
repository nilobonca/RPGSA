import { create } from 'zustand';

export interface ActiveGame {
  id: string;
  gameId: string;
  title: string;
  isMinimized: boolean;
  config?: any;
  status?: 'idle' | 'running' | 'finished';
}

interface PlayerProgress {
  clicks: number;
  name?: string;
  coinResult?: string;
  spinning?: boolean;
}

interface MinigamesState {
  activeGames: ActiveGame[];
  playerProgress: Record<string, PlayerProgress>;
  broadcastEvent?: (event: { type: string, payload: any }) => void;
  
  addGame: (game: ActiveGame) => void;
  removeGame: (id: string) => void;
  toggleMinimize: (id: string) => void;
  updateGame: (id: string, update: Partial<ActiveGame>) => void;
  updateProgress: (listenerId: string, clicks: number, name?: string, coinResult?: string) => void;
  setSpinning: (listenerId: string, spinning: boolean, name?: string) => void;
  clearProgress: () => void;
  setBroadcastEvent: (fn: (event: { type: string, payload: any }) => void) => void;
}

export const useMinigamesStore = create<MinigamesState>((set) => ({
  activeGames: [],
  playerProgress: {},

  addGame: (game) => set((state) => ({
    activeGames: [...state.activeGames, game]
  })),

  removeGame: (id) => set((state) => ({
    activeGames: state.activeGames.filter((g) => g.id !== id)
  })),

  toggleMinimize: (id) => set((state) => ({
    activeGames: state.activeGames.map((g) =>
      g.id === id ? { ...g, isMinimized: !g.isMinimized } : g
    )
  })),

  updateGame: (id, update) => set((state) => ({
    activeGames: state.activeGames.map(g => g.id === id ? { ...g, ...update } : g)
  })),

  updateProgress: (listenerId, clicks, name, coinResult) => set((state) => {
    const existing = state.playerProgress[listenerId];
    return {
      playerProgress: {
        ...state.playerProgress,
        [listenerId]: { clicks, name: name || existing?.name || 'Ouvinte', coinResult: coinResult || existing?.coinResult, spinning: false }
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
}));
