import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ActiveArea, ActiveWall } from '@/interfaces/utils/indexedDB';

export interface UseCanvasDrawingToolsProps {
  activeProjectId?: string | string[] | number | null;
  addToHistory: (description?: string) => void;
  addAreaPersisted: (area: ActiveArea, projectId?: any) => void;
  addWallPersisted: (wall: ActiveWall, projectId?: any) => void;
  activeAreas: ActiveArea[];
  activeWalls: ActiveWall[];
  isPreviewMode?: boolean;
  startPreview?: () => void;
  discardPreview?: () => void;
}

export const useCanvasDrawingTools = ({
  activeProjectId,
  addToHistory,
  addAreaPersisted,
  addWallPersisted,
  activeAreas,
  activeWalls,
  isPreviewMode,
  startPreview,
  discardPreview,
}: UseCanvasDrawingToolsProps) => {
  const [tool, setTool] = useState<'cursor' | 'pin' | 'area' | 'wall' | 'eraser'>('cursor');
  const [currentAreaPoints, setCurrentAreaPoints] = useState<{ x: number; y: number }[]>([]);
  const [currentWallPoints, setCurrentWallPoints] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (tool === 'area' && currentAreaPoints.length >= 3) {
          addToHistory('Criar Área');
          addAreaPersisted({
            id: uuidv4(),
            type: 'area',
            points: currentAreaPoints,
            linkedPlayerId: null,
            linkedAudioId: null,
            name: `Área ${activeAreas.length + 1}`,
            volumeMode: 'standard'
          } as unknown as ActiveArea, activeProjectId);
          setCurrentAreaPoints([]);
          setTool('cursor');
        } else if (tool === 'wall' && currentWallPoints.length >= 2) {
          addToHistory('Criar Parede');
          addWallPersisted({
            id: Date.now().toString(),
            type: 'wall',
            projectId: activeProjectId || 0,
            name: `Parede ${activeWalls.length + 1}`,
            points: [...currentWallPoints],
            color: '#444444',
            thickness: 8,
            occludesAudio: true
          } as unknown as ActiveWall, activeProjectId);
          setCurrentWallPoints([]);
          setTool('cursor');
        }
      } else if (e.key === 'Escape') {
        if (tool === 'area' || tool === 'wall') {
          setCurrentAreaPoints([]);
          setCurrentWallPoints([]);
          setTool('cursor');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tool, currentAreaPoints, currentWallPoints, activeAreas.length, activeWalls.length, activeProjectId, addToHistory, addAreaPersisted, addWallPersisted]);

  return {
    tool,
    setTool,
    currentAreaPoints,
    setCurrentAreaPoints,
    currentWallPoints,
    setCurrentWallPoints,
  };
};
