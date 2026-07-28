import { useCallback, useEffect, useRef, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { useMinigamesStore } from '@/store/minigamesStore';
import { ActivePin, ActiveArea, Audios, ActiveWall, ActiveGlobalTrack } from '@/interfaces/utils/indexedDB';
import { getSharedAudioContext } from '@/utils/audio/audioContext';
import { Jungle } from '@/utils/audio/jungle';
import { setPlaySoundboardCallback, setStopSoundboardCallback } from '@/components/Soundboard/activeAudios';
import { useAudioInteractions } from '@/hooks/useAudioInteractions';

export interface ListenerGraph {
  destination: MediaStreamAudioDestinationNode | AudioDestinationNode;
  call?: any;
  activeSources: Map<string, {
    audioElement: HTMLAudioElement;
    sourceNode: MediaElementAudioSourceNode;
    gainNode: GainNode;
    pannerNode: StereoPannerNode | null;
    filterNode: BiquadFilterNode;
    jungle?: Jungle;
  }>;
}

export interface UseWebRTCAudioStreamerOptions {
  isSessionActive: boolean;
  projectId: string | string[] | undefined;
  activeProjectId?: string | null;
  sessionListeners: { listenerId: string; name: string }[];
  setSessionListeners?: Dispatch<SetStateAction<{ listenerId: string; name: string }[]>>;
  savedAudios: Audios[];
  activePins: ActivePin[];
  addPinPersisted: (pin: ActivePin, projectId?: string | null) => void;
  deletePinPersisted: (id: string) => void;
  connectionsRef: MutableRefObject<Record<string, any>>;
  setListenerPings: Dispatch<SetStateAction<Record<string, number>>>;
  isPreviewMode?: boolean;
  isLoading?: boolean;
  handleIncomingChatMessage?: (data: any, listenerId: string) => void;
}

export const useWebRTCAudioStreamer = ({
  isSessionActive,
  projectId,
  activeProjectId,
  sessionListeners,
  setSessionListeners,
  savedAudios,
  activePins,
  addPinPersisted,
  deletePinPersisted,
  connectionsRef,
  setListenerPings,
  isPreviewMode = false,
  isLoading = false,
  handleIncomingChatMessage,
}: UseWebRTCAudioStreamerOptions) => {
  const peerRef = useRef<any>(null);
  const listenerGraphsRef = useRef<Map<string, ListenerGraph>>(new Map());
  const objectUrlsRef = useRef<Map<number, string>>(new Map());
  const activeSoundboardStreamsRef = useRef<Map<string, { sound: HTMLAudioElement; source: MediaElementAudioSourceNode; jungle?: Jungle }[]>>(new Map());

  const cleanedPinsRef = useRef(false);
  const pendingAddPinsRef = useRef<Set<string>>(new Set());
  const pendingDeletePinsRef = useRef<Set<string>>(new Set());
  const isChannelSubscribedRef = useRef(false);
  const listenerTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const getOrCreateListenerGraph = useCallback((listenerId: string) => {
    let graph = listenerGraphsRef.current.get(listenerId);
    if (!graph) {
      const ctx = getSharedAudioContext();
      if (ctx) {
        let dest: MediaStreamAudioDestinationNode | AudioDestinationNode;
        if (listenerId === 'local') {
          dest = ctx.destination;
        } else {
          dest = ctx.createMediaStreamDestination();
        }
        graph = {
          destination: dest,
          activeSources: new Map()
        };
        listenerGraphsRef.current.set(listenerId, graph);
      }
    }
    return graph;
  }, []);

  const removeListenerGraph = useCallback((listenerId: string) => {
    const graph = listenerGraphsRef.current.get(listenerId);
    if (graph) {
      graph.activeSources.forEach(src => {
        try {
          src.audioElement.pause();
          src.audioElement.src = '';
          src.audioElement.load();
        } catch (e) {}
        try {
          if (src.jungle) src.jungle.disconnect();
          if (src.pannerNode) src.pannerNode.disconnect();
          src.filterNode.disconnect();
          src.gainNode.disconnect();
          src.sourceNode.disconnect();
        } catch (e) {}
      });
      graph.activeSources.clear();

      if (graph.call) {
        try { graph.call.close(); } catch (e) {}
      }
      listenerGraphsRef.current.delete(listenerId);
    }
  }, []);

  const { calculateInteractions } = useAudioInteractions(
    isSessionActive,
    sessionListeners,
    savedAudios,
    getOrCreateListenerGraph,
    removeListenerGraph,
    objectUrlsRef,
    isPreviewMode
  );

  // Sync pending additions/deletions refs with actual activePins state
  useEffect(() => {
    const pinIds = new Set(activePins.map(p => p.id));
    
    pendingAddPinsRef.current.forEach(id => {
      if (pinIds.has(id)) {
        pendingAddPinsRef.current.delete(id);
      }
    });

    pendingDeletePinsRef.current.forEach(id => {
      if (!pinIds.has(id)) {
        pendingDeletePinsRef.current.delete(id);
      }
    });
  }, [activePins]);

  useEffect(() => {
    return () => {
      Object.values(listenerTimeoutsRef.current).forEach(clearTimeout);
      listenerTimeoutsRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !cleanedPinsRef.current && activePins.length > 0) {
      activePins.forEach(pin => {
        if (pin.id.startsWith('listener:')) {
          if (!pendingDeletePinsRef.current.has(pin.id)) {
            pendingDeletePinsRef.current.add(pin.id);
            deletePinPersisted(pin.id);
          }
        }
      });
      cleanedPinsRef.current = true;
    }
  }, [isLoading, activePins, deletePinPersisted]);

  // Presence updates (add/remove listener pins when listeners join/leave)
  useEffect(() => {
    if (!isSessionActive) return;

    sessionListeners.forEach(listener => {
      const pinId = `listener:${listener.listenerId}`;
      
      if (listenerTimeoutsRef.current[pinId]) {
        clearTimeout(listenerTimeoutsRef.current[pinId]);
        delete listenerTimeoutsRef.current[pinId];
      }

      if (pendingAddPinsRef.current.has(pinId)) return;

      const existingPin = activePins.find(p => p.id === pinId);
      if (!existingPin) {
        pendingAddPinsRef.current.add(pinId);
        const newPin: ActivePin = {
          id: pinId,
          type: 'pin',
          position: { x: 500, y: 500 },
          name: listener.name,
          enabled: true,
          icon: 'ear',
          color: '#6366f1'
        };
        addPinPersisted(newPin, activeProjectId);
      }
    });

    activePins.forEach(pin => {
      if (pin.id.startsWith('listener:')) {
        const listenerId = pin.id.replace('listener:', '');
        const stillConnected = sessionListeners.some(l => l.listenerId === listenerId);
        
        if (!stillConnected && isChannelSubscribedRef.current) {
          if (listenerTimeoutsRef.current[pin.id]) return;

          listenerTimeoutsRef.current[pin.id] = setTimeout(() => {
            if (!pendingDeletePinsRef.current.has(pin.id)) {
              pendingDeletePinsRef.current.add(pin.id);
              deletePinPersisted(pin.id);
            }
            delete listenerTimeoutsRef.current[pin.id];
          }, 5000);
        }
      }
    });
  }, [sessionListeners, activePins, isSessionActive, activeProjectId, addPinPersisted, deletePinPersisted]);

  // Clean listener pins when session is deactivated
  useEffect(() => {
    if (!isSessionActive) {
      activePins.forEach(pin => {
        if (pin.id.startsWith('listener:')) {
          if (!pendingDeletePinsRef.current.has(pin.id)) {
            pendingDeletePinsRef.current.add(pin.id);
            deletePinPersisted(pin.id);
          }
        }
      });
    }
  }, [isSessionActive, activePins, deletePinPersisted]);

  // Setup PeerJS host and connection handlers
  useEffect(() => {
    if (!isSessionActive || !projectId) {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      Object.values(connectionsRef.current).forEach((conn: any) => {
        if (conn) conn.close();
      });
      connectionsRef.current = {};

      Array.from(listenerGraphsRef.current.keys()).forEach(id => {
        removeListenerGraph(id);
      });

      activeSoundboardStreamsRef.current.forEach(list => {
        list.forEach(item => {
          try {
            item.sound.pause();
            item.sound.currentTime = 0;
          } catch (e) {}
          try {
            if (item.jungle) item.jungle.disconnect();
            item.source.disconnect();
          } catch (e) {}
        });
      });
      activeSoundboardStreamsRef.current.clear();

      objectUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      objectUrlsRef.current.clear();

      if (setSessionListeners) setSessionListeners([]);
      isChannelSubscribedRef.current = false;
      return;
    }

    const initPeer = async () => {
      try {
        const Peer = (await import('peerjs')).default;
        const gmPeerId = `visual-sound-design-${projectId}`;

        const peer = new Peer(gmPeerId, {
          debug: 1
        });
        peerRef.current = peer;

        peer.on('open', (id) => {
          isChannelSubscribedRef.current = true;
        });

        peer.on('error', (err) => {
          console.error('[DEBUG] PeerJS Host error:', err);
          isChannelSubscribedRef.current = false;
        });

        peer.on('close', () => {
          isChannelSubscribedRef.current = false;
        });

        peer.on('connection', (conn) => {
          const listenerId = conn.peer;
          const name = (conn.metadata as any)?.name || 'Ouvinte Anônimo';

          connectionsRef.current[listenerId] = conn;

          conn.on('open', () => {
            if (setSessionListeners) {
              setSessionListeners(prev => {
                if (prev.some(l => l.listenerId === listenerId)) return prev;
                return [...prev, { listenerId, name }];
              });
            }

            const ctx = getSharedAudioContext();
            if (ctx) {
              ctx.resume().then(() => {
                const graph = getOrCreateListenerGraph(listenerId);
                if (graph && graph.destination instanceof MediaStreamAudioDestinationNode && peerRef.current) {
                  const call = peerRef.current.call(listenerId, graph.destination.stream);
                  graph.call = call;
                }
              });
            }
          });

          conn.on('data', (data: any) => {
            if (!data) return;

            if (data.type === 'pong') {
              const { timestamp } = data.payload || {};
              if (timestamp) {
                const rtt = Date.now() - timestamp;
                setListenerPings(prev => ({
                  ...prev,
                  [listenerId]: rtt
                }));
              }
            } else if (data.type === 'update_guest_name') {
              const { name: newName } = data.payload || {};
              if (newName) {
                if (conn.metadata) conn.metadata.name = newName;
                if (setSessionListeners) {
                  setSessionListeners(prev => prev.map(l => l.listenerId === listenerId ? { ...l, name: newName } : l));
                }
              }
            } else if (data.type === 'coin_spinning') {
              const currentName = (conn.metadata as any)?.name || name;
              useMinigamesStore.getState().setSpinning(listenerId, data.payload.spinning, currentName);
            } else if (data.type === 'minigame_progress') {
              const currentName = (conn.metadata as any)?.name || name;
              useMinigamesStore.getState().updateProgress(listenerId, data.payload.clicks, currentName, data.payload.coinResult, data.payload.cardResult);
              const store = useMinigamesStore.getState();
              const clickerGame = store.activeGames.find(g => g.gameId === 'clicker' && g.status === 'running');
              if (clickerGame && clickerGame.config?.isCooperative) {
                const totalClicks = Object.values(store.playerProgress).reduce((sum, p) => sum + (p.clicks || 0), 0);
                store.broadcastEvent?.({
                  type: 'cooperative_click_update',
                  payload: { totalClicks }
                });
              }
            } else if (data.type === 'chat') {
              handleIncomingChatMessage?.(data.payload, listenerId);
            }
          });

          conn.on('close', () => {
            delete connectionsRef.current[listenerId];
            removeListenerGraph(listenerId);
            if (setSessionListeners) {
              setSessionListeners(prev => prev.filter(l => l.listenerId !== listenerId));
            }
          });

          conn.on('error', (err) => {
            console.error(`[DEBUG] Connection error with ${name}:`, err);
            conn.close();
          });
        });
      } catch (err) {
        console.error('Failed to init PeerJS:', err);
      }
    };

    initPeer();

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      Object.values(connectionsRef.current).forEach((conn: any) => {
        if (conn) conn.close();
      });
      connectionsRef.current = {};
      
      Array.from(listenerGraphsRef.current.keys()).forEach(id => {
        removeListenerGraph(id);
      });

      activeSoundboardStreamsRef.current.forEach(list => {
        list.forEach(item => {
          try {
            item.sound.pause();
            item.sound.currentTime = 0;
          } catch (e) {}
          try {
            if (item.jungle) item.jungle.disconnect();
            item.source.disconnect();
          } catch (e) {}
        });
      });
      activeSoundboardStreamsRef.current.clear();

      objectUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      objectUrlsRef.current.clear();

      if (setSessionListeners) setSessionListeners([]);
      isChannelSubscribedRef.current = false;
    };
  }, [isSessionActive, projectId, getOrCreateListenerGraph, removeListenerGraph, connectionsRef, setListenerPings, setSessionListeners, handleIncomingChatMessage]);

  // Broadcast ping to P2P listeners every 3 seconds
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      Object.values(connectionsRef.current).forEach((conn: any) => {
        if (conn && conn.open) {
          conn.send({
            type: 'ping',
            payload: { timestamp: Date.now() }
          });
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSessionActive, connectionsRef]);

  // Hook soundboard audio plays/stops callbacks to route into P2P listener streams
  useEffect(() => {
    if (!isSessionActive) {
      setPlaySoundboardCallback(null);
      setStopSoundboardCallback(null);
      return;
    }

    setPlaySoundboardCallback((payload) => {
      const { soundboardItemId, url, volume, pitch } = payload;
      const ctx = getSharedAudioContext();
      if (!ctx) return;
      if (isPreviewMode) return;

      const instances: { sound: HTMLAudioElement; source: MediaElementAudioSourceNode; jungle?: Jungle }[] = [];

      Array.from(listenerGraphsRef.current.entries()).forEach(([listenerId, graph]) => {
        if (listenerId === 'local') return;

        try {
          const sound = new Audio(url);
          sound.volume = volume !== undefined ? volume : 1.0;
          sound.crossOrigin = 'anonymous';

          const source = ctx.createMediaElementSource(sound);
          let jungle: Jungle | undefined;

          if (pitch !== undefined && pitch !== 1.0) {
            jungle = new Jungle(ctx);
            jungle.setPitchOffset(pitch - 1.0);
            source.connect(jungle.input);
            jungle.output.connect(graph.destination);
          } else {
            source.connect(graph.destination);
          }

          const instance = { sound, source, jungle };
          instances.push(instance);

          sound.onended = () => {
            try {
              if (jungle) jungle.disconnect();
              source.disconnect();
            } catch (e) {}
            const current = activeSoundboardStreamsRef.current.get(soundboardItemId) || [];
            const updated = current.filter(i => i.sound !== sound);
            if (updated.length === 0) {
              activeSoundboardStreamsRef.current.delete(soundboardItemId);
            } else {
              activeSoundboardStreamsRef.current.set(soundboardItemId, updated);
            }
          };

          sound.play().catch(e => console.error("Error playing soundboard to listener stream:", e));
        } catch (err) {
          console.error("Failed to route soundboard audio to listener stream:", err);
        }
      });

      if (instances.length > 0) {
        const prev = activeSoundboardStreamsRef.current.get(soundboardItemId) || [];
        activeSoundboardStreamsRef.current.set(soundboardItemId, [...prev, ...instances]);
      }
    });

    setStopSoundboardCallback((soundboardItemId) => {
      const list = activeSoundboardStreamsRef.current.get(soundboardItemId);
      if (list) {
        list.forEach(item => {
          try {
            item.sound.pause();
            item.sound.currentTime = 0;
          } catch (e) {}
          try {
            if (item.jungle) item.jungle.disconnect();
            item.source.disconnect();
          } catch (e) {}
        });
        activeSoundboardStreamsRef.current.delete(soundboardItemId);
      }
    });

    return () => {
      setPlaySoundboardCallback(null);
      setStopSoundboardCallback(null);
    };
  }, [isSessionActive, isPreviewMode]);

  return {
    calculateInteractions,
    getOrCreateListenerGraph,
    removeListenerGraph,
    objectUrlsRef,
  };
};
