import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'ethereal' | 'grimdark' | 'cyber' | 'taverna' | 'dark' | 'light' | 'default';

type ThemeState = {
  theme: ThemeType;
  isSettingsOpen: boolean;
  audioVizEnabled: boolean;
  audioVizColor: string;
  audioVizIntensity: number; // 0.0 to 2.0, default 1.0
  areaRippleEnabled: boolean;
  pinnedMinigames: string[];
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setAudioVizEnabled: (enabled: boolean) => void;
  setAudioVizColor: (color: string) => void;
  setAudioVizIntensity: (intensity: number) => void;
  setAreaRippleEnabled: (enabled: boolean) => void;
  togglePinnedMinigame: (minigameId: string) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'ethereal',
      isSettingsOpen: false,
      audioVizEnabled: true,
      audioVizColor: '#818cf8', // indigo-400
      audioVizIntensity: 1.0,
      areaRippleEnabled: true,
      pinnedMinigames: [], 
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'ethereal' ? 'default' : 'ethereal' })),
      setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
      setAudioVizEnabled: (enabled) => set({ audioVizEnabled: enabled }),
      setAudioVizColor: (color) => set({ audioVizColor: color }),
      setAudioVizIntensity: (intensity) => set({ audioVizIntensity: intensity }),
      setAreaRippleEnabled: (enabled) => set({ areaRippleEnabled: enabled }),
      togglePinnedMinigame: (id) => set((state) => ({
        pinnedMinigames: state.pinnedMinigames.includes(id)
          ? state.pinnedMinigames.filter(m => m !== id)
          : [...state.pinnedMinigames, id]
      })),
    }),
    {
      name: 'vsd-theme-storage',
    }
  )
);
