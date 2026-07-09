import { useState, useRef, useCallback } from 'react';
import { 
    Players, 
    ActiveImage, 
    ActiveArea, 
    ActivePin, 
    Layer, 
    ActiveSoundboardItem, 
    ActiveNote, 
    ActiveGlobalTrack, 
    ActiveWall 
} from '../../../interfaces/utils/indexedDB';

export function useIDBPreview(
    db: IDBDatabase | null, 
    realStates: any, 
    setRealStates: any, 
    isPreviewModeRef: React.MutableRefObject<boolean>,
    previewState: any,
    setPreviewState: React.Dispatch<React.SetStateAction<any>>
) {
    const [isPreviewModeState, setIsPreviewModeState] = useState(false);

    const startPreview = useCallback(() => {
        setPreviewState({
            activePlayers: [...realStates.realActivePlayers],
            activeImages: [...realStates.realActiveImages],
            activeAreas: [...realStates.realActiveAreas],
            activePins: [...realStates.realActivePins],
            activeLayers: [...realStates.realActiveLayers],
            activeSoundboardItems: [...realStates.realActiveSoundboardItems],
            activeNotes: [...realStates.realActiveNotes],
            activeGlobalTracks: [...realStates.realActiveGlobalTracks],
            activeWalls: [...realStates.realActiveWalls],
        });
        setIsPreviewModeState(true);
        isPreviewModeRef.current = true;
    }, [
        realStates.realActivePlayers,
        realStates.realActiveImages,
        realStates.realActiveAreas,
        realStates.realActivePins,
        realStates.realActiveLayers,
        realStates.realActiveSoundboardItems,
        realStates.realActiveNotes,
        realStates.realActiveGlobalTracks,
        realStates.realActiveWalls
    ]);

    const discardPreview = useCallback(() => {
        setIsPreviewModeState(false);
        isPreviewModeRef.current = false;
        setPreviewState(null);
    }, []);

    const commitPreview = useCallback(() => {
        if (!previewState || !db) return;
        
        const transaction = db.transaction(['persistedCanvas'], 'readwrite');
        const store = transaction.objectStore('persistedCanvas');
        store.clear();

        const allItems = [
            ...previewState.activePlayers,
            ...previewState.activeImages,
            ...previewState.activeAreas,
            ...previewState.activePins,
            ...previewState.activeLayers,
            ...previewState.activeSoundboardItems,
            ...previewState.activeNotes,
            ...previewState.activeGlobalTracks,
            ...previewState.activeWalls
        ];

        for (const item of allItems) {
            store.add(item);
        }

        setRealStates.setRealActivePlayers(previewState.activePlayers);
        setRealStates.setRealActiveImages(previewState.activeImages);
        setRealStates.setRealActiveAreas(previewState.activeAreas);
        setRealStates.setRealActivePins(previewState.activePins);
        setRealStates.setRealActiveLayers(previewState.activeLayers);
        setRealStates.setRealActiveSoundboardItems(previewState.activeSoundboardItems);
        setRealStates.setRealActiveNotes(previewState.activeNotes);
        setRealStates.setRealActiveGlobalTracks(previewState.activeGlobalTracks);
        setRealStates.setRealActiveWalls(previewState.activeWalls);

        setIsPreviewModeState(false);
        isPreviewModeRef.current = false;
        setPreviewState(null);
    }, [previewState, db, setRealStates]);

    const activePlayers = isPreviewModeState && previewState ? previewState.activePlayers : realStates.realActivePlayers;
    const activeImages = isPreviewModeState && previewState ? previewState.activeImages : realStates.realActiveImages;
    const activeAreas = isPreviewModeState && previewState ? previewState.activeAreas : realStates.realActiveAreas;
    const activePins = isPreviewModeState && previewState ? previewState.activePins : realStates.realActivePins;
    const activeLayers = isPreviewModeState && previewState ? previewState.activeLayers : realStates.realActiveLayers;
    const activeWalls = isPreviewModeState && previewState ? previewState.activeWalls : realStates.realActiveWalls;
    const activeSoundboardItems = isPreviewModeState && previewState ? previewState.activeSoundboardItems : realStates.realActiveSoundboardItems;
    const activeNotes = isPreviewModeState && previewState ? previewState.activeNotes : realStates.realActiveNotes;
    const activeGlobalTracks = isPreviewModeState && previewState ? previewState.activeGlobalTracks : realStates.realActiveGlobalTracks;

    return {
        isPreviewMode: isPreviewModeState,
        isPreviewModeRef,
        previewState,
        setPreviewState,
        startPreview,
        commitPreview,
        discardPreview,
        activePlayers,
        activeImages,
        activeAreas,
        activePins,
        activeLayers,
        activeWalls,
        activeSoundboardItems,
        activeNotes,
        activeGlobalTracks
    };
}
