import { useCallback } from 'react';
import { Layer, ActiveArea, ActivePin, ActiveImage } from '@/interfaces/utils/indexedDB';

export interface UseLayerManagerActionsProps {
  activeAreas: ActiveArea[];
  activePins: ActivePin[];
  activeImages: ActiveImage[];
  setActiveAreaIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  handleEditImage: (id: string) => void;
}

export const useLayerManagerActions = ({
  activeAreas,
  activePins,
  activeImages,
  setActiveAreaIds,
  handleEditImage,
}: UseLayerManagerActionsProps) => {
  const isLayerVisible = useCallback((layer: Layer, allLayers: Layer[], visited = new Set<string>()): boolean => {
    if (visited.has(layer.id)) return false; // Cycle detected
    visited.add(layer.id);

    if (!layer.visible) return false;
    if (layer.parentId) {
      const parent = allLayers.find(l => l.id === layer.parentId);
      if (parent) {
        return isLayerVisible(parent, allLayers, visited);
      }
    }
    return true;
  }, []);

  const handleLayerAction = useCallback((layer: Layer) => {
    if (layer.itemType === 'image' && layer.itemId) {
      handleEditImage(layer.itemId);
    } else if (layer.itemType === 'area' && layer.itemId) {
      const area = activeAreas.find(a => a.id === layer.itemId);
      if (area) {
        setActiveAreaIds(new Set([area.id]));
      }
    } else if (layer.itemType === 'pin' && layer.itemId) {
      // Similar for pin
    }
  }, [activeAreas, setActiveAreaIds, handleEditImage]);

  return {
    isLayerVisible,
    handleLayerAction,
  };
};
