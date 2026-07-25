import { create } from 'zustand';
import { Audios } from '@/interfaces/utils/indexedDB';

export interface AudioEditorConfig {
    audio: Audios;
    initialTrimStart?: number;
    initialTrimEnd?: number;
    onSaveTrimRange?: (start: number, end: number) => void;
}

interface AudioEditorState {
    isOpen: boolean;
    config: AudioEditorConfig | null;
    openEditor: (config: AudioEditorConfig) => void;
    closeEditor: () => void;
}

export const useAudioEditorStore = create<AudioEditorState>((set) => ({
    isOpen: false,
    config: null,
    openEditor: (config) => set({ isOpen: true, config }),
    closeEditor: () => set({ isOpen: false, config: null }),
}));
