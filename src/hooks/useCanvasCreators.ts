import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ActiveArea,
  ActivePin,
  ActiveNote,
  ActiveSoundboardItem,
  SoundboardItem,
  Audios,
} from '@/interfaces/utils/indexedDB';

export interface UseCanvasCreatorsProps {
  activeProjectId?: string | string[] | number | null;
  addToHistory: (description?: string) => void;
  addAreaPersisted: (area: ActiveArea, projectId?: any) => void;
  addPinPersisted: (pin: ActivePin, projectId?: any) => void;
  addNotePersisted: (note: ActiveNote, projectId?: any) => void;
  addSoundboardItem: (item: SoundboardItem) => void;
  addSoundboardItemPersisted: (item: ActiveSoundboardItem, projectId?: any) => void;
  soundboardItems: SoundboardItem[];
  activeSoundboardItems: ActiveSoundboardItem[];
  updateSoundboardItem: (item: SoundboardItem) => void;
  savedAudios: Audios[];
  activeAreas: ActiveArea[];
  handleUpdateArea: (area: ActiveArea) => void;
  setContextMenu: (menu: any) => void;
  setSelectedItemIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  activePins?: ActivePin[];
  setEditingSoundboardItemId?: (id: string | null) => void;
}

export const useCanvasCreators = ({
  activeProjectId,
  addToHistory,
  addAreaPersisted,
  addPinPersisted,
  addNotePersisted,
  addSoundboardItem,
  addSoundboardItemPersisted,
  soundboardItems,
  activeSoundboardItems,
  updateSoundboardItem,
  savedAudios,
  activeAreas,
  handleUpdateArea,
  setContextMenu,
  setSelectedItemIds,
  activePins = [],
  setEditingSoundboardItemId,
}: UseCanvasCreatorsProps) => {
  const createArea = useCallback((position?: { x: number; y: number }) => {
    addToHistory('Criar Área');
    const baseX = position?.x || 100;
    const baseY = position?.y || 100;

    const newArea: ActiveArea = {
      id: uuidv4(),
      type: 'area',
      name: 'Nova Área',
      points: [
        { x: baseX, y: baseY },
        { x: baseX + 200, y: baseY },
        { x: baseX + 200, y: baseY + 200 },
        { x: baseX, y: baseY + 200 }
      ],
      linkedPlayerId: null,
      linkedAudioId: null,
      volumeMode: 'standard'
    };

    addAreaPersisted(newArea, activeProjectId);
  }, [addToHistory, addAreaPersisted, activeProjectId]);

  const createPin = useCallback((position?: { x: number; y: number }, icon?: 'pin' | 'person' | 'ear') => {
    addToHistory('Criar Pin');
    const baseX = position?.x || 100;
    const baseY = position?.y || 100;

    const newPin: ActivePin = {
      id: uuidv4(),
      type: 'pin',
      position: { x: baseX, y: baseY },
      name: 'Novo Pin',
      enabled: true,
      order: activePins.length,
      icon: icon || 'pin'
    };
    addPinPersisted(newPin, activeProjectId);
    setContextMenu(null);
  }, [addToHistory, activePins, addPinPersisted, activeProjectId, setContextMenu]);

  const createNote = useCallback((position?: { x: number; y: number }) => {
    addToHistory('Criar Texto');
    const baseX = position?.x || 100;
    const baseY = position?.y || 100;

    const newNote: ActiveNote = {
      id: uuidv4(),
      type: 'note',
      content: '',
      position: { x: baseX, y: baseY },
      width: 200,
      height: 100,
      color: '#ffffff',
      fontSize: 14,
      fontColor: '#000000',
      transparentBg: true,
      textAlign: 'left'
    };
    addNotePersisted(newNote, activeProjectId);
    setSelectedItemIds(new Set([newNote.id]));
    setContextMenu(null);
  }, [addToHistory, addNotePersisted, activeProjectId, setSelectedItemIds, setContextMenu]);

  const createSoundboardButton = useCallback((position: { x: number; y: number }) => {
    addToHistory('Criar Botão Soundboard');
    const newItemId = uuidv4();
    const newDef: SoundboardItem = {
      id: newItemId, name: 'Botão', audioId: null, color: '#A855F7', order: soundboardItems.length, playbackMode: 'overlap' as any
    };
    addSoundboardItem(newDef);
    const newInstance: ActiveSoundboardItem = {
      id: uuidv4(), type: 'soundboard' as any, soundboardItemId: newItemId, position
    };
    addSoundboardItemPersisted(newInstance, activeProjectId);
  }, [addToHistory, soundboardItems, addSoundboardItem, addSoundboardItemPersisted, activeProjectId]);

  const handleRenameSoundboardItem = useCallback((id: string, newName: string) => {
    const definition = soundboardItems.find(d => d.id === id);
    if (definition) {
      updateSoundboardItem({ ...definition, name: newName });
    } else {
      const activeItem = activeSoundboardItems.find(i => i.id === id);
      if (activeItem) {
        const def = soundboardItems.find(d => d.id === activeItem.soundboardItemId);
        if (def) updateSoundboardItem({ ...def, name: newName });
      }
    }
    if (setEditingSoundboardItemId) {
      setEditingSoundboardItemId(null);
    }
  }, [soundboardItems, activeSoundboardItems, updateSoundboardItem, setEditingSoundboardItemId]);

  const linkSoundboardItemToAudio = useCallback((targetId: string, audioId: number) => {
    const audio = savedAudios.find(a => a.id === audioId);
    const audioName = audio ? audio.name : 'Botão';
    const definition = soundboardItems.find(d => d.id === targetId);
    if (definition) {
      updateSoundboardItem({ ...definition, audioId, name: audioName });
    } else {
      const activeItem = activeSoundboardItems.find(i => i.id === targetId);
      if (activeItem) {
        const def = soundboardItems.find(d => d.id === activeItem.soundboardItemId);
        if (def) updateSoundboardItem({ ...def, audioId, name: audioName });
      }
    }
  }, [savedAudios, soundboardItems, activeSoundboardItems, updateSoundboardItem]);

  const linkAreaToAudio = useCallback((areaId: string, audioId: number) => {
    const area = activeAreas.find((a: ActiveArea) => a.id === areaId);
    const audio = savedAudios.find((a: Audios) => a.id === audioId);

    if (area && audio) {
      const updatedArea = { ...area, linkedAudioId: audioId, linkedPlayerId: null };
      handleUpdateArea(updatedArea);
    }
  }, [activeAreas, savedAudios, handleUpdateArea]);

  return {
    createArea,
    createPin,
    createNote,
    createSoundboardButton,
    handleRenameSoundboardItem,
    linkSoundboardItemToAudio,
    linkAreaToAudio,
  };
};
