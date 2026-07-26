import { useCanvasGlobalStore } from '@/store/canvasStore';

export const useCanvasUI = (projectId: string | string[] | undefined) => {
  const headerOpen = useCanvasGlobalStore(state => state.headerOpen);
  const setHeaderOpen = useCanvasGlobalStore(state => state.setHeaderOpen);
  
  const layerManagerOpen = useCanvasGlobalStore(state => state.layerManagerOpen);
  const setLayerManagerOpen = useCanvasGlobalStore(state => state.setLayerManagerOpen);
  
  const pinManagerOpen = useCanvasGlobalStore(state => state.pinManagerOpen);
  const setPinManagerOpen = useCanvasGlobalStore(state => state.setPinManagerOpen);
  
  const historyOpen = useCanvasGlobalStore(state => state.historyOpen);
  const setHistoryOpen = useCanvasGlobalStore(state => state.setHistoryOpen);
  
  const soundboardOpen = useCanvasGlobalStore(state => state.soundboardOpen);
  const setSoundboardOpen = useCanvasGlobalStore(state => state.setSoundboardOpen);
  
  const activePlayersOpen = useCanvasGlobalStore(state => state.activePlayersOpen);
  const setActivePlayersOpen = useCanvasGlobalStore(state => state.setActivePlayersOpen);

  const globalTracksOpen = useCanvasGlobalStore(state => state.globalTracksOpen);
  const setGlobalTracksOpen = useCanvasGlobalStore(state => state.setGlobalTracksOpen);
  
  const mobileMenuOpen = useCanvasGlobalStore(state => state.mobileMenuOpen);
  const setMobileMenuOpen = useCanvasGlobalStore(state => state.setMobileMenuOpen);
  const listenersOpen = useCanvasGlobalStore(state => state.listenersOpen);
  const setListenersOpen = useCanvasGlobalStore(state => state.setListenersOpen);
  const listenerSettingsOpen = useCanvasGlobalStore(state => state.listenerSettingsOpen);
  const setListenerSettingsOpen = useCanvasGlobalStore(state => state.setListenerSettingsOpen);
  
  const menuZIndices = useCanvasGlobalStore(state => state.menuZIndices);
  const bringToFront = useCanvasGlobalStore(state => state.bringToFront) as (menu: 'header' | 'layer' | 'pin' | 'soundboard' | 'globalTracks' | 'history' | 'listeners' | 'activePlayers') => void;

  return {
    headerOpen, setHeaderOpen,
    layerManagerOpen, setLayerManagerOpen,
    pinManagerOpen, setPinManagerOpen,
    historyOpen, setHistoryOpen,
    soundboardOpen, setSoundboardOpen,
    activePlayersOpen, setActivePlayersOpen,
    globalTracksOpen, setGlobalTracksOpen,
    mobileMenuOpen, setMobileMenuOpen,
    listenersOpen, setListenersOpen,
    listenerSettingsOpen, setListenerSettingsOpen,
    menuZIndices, bringToFront
  };
};
