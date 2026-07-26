import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/interfaces/chat';

export interface UseWebRTCGuestSessionProps {
  projectId: string | string[] | undefined;
  username: string;
  chatSoundEnabledRef: React.MutableRefObject<boolean>;
  onMinigamePayload?: (type: string, payload: any) => void;
  audioElRef: React.MutableRefObject<HTMLAudioElement | null>;
  isMuted: boolean;
  guestVolume: number;
}

export const useWebRTCGuestSession = ({
  projectId,
  username,
  chatSoundEnabledRef,
  onMinigamePayload,
  audioElRef,
  isMuted,
  guestVolume,
}: UseWebRTCGuestSessionProps) => {
  const [listenerId, setListenerId] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const isJoinedRef = useRef(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('idle');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);
  const [ping, setPing] = useState<number | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatClearedAt, setChatClearedAt] = useState<number | null>(null);

  const peerRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const currentCallRef = useRef<any>(null);

  const playPing = useCallback(() => {
    if (chatSoundEnabledRef.current) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.error("Failed to play ping", e);
      }
    }
  }, [chatSoundEnabledRef]);

  const disconnectFromGM = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    isReconnectingRef.current = false;
    isJoinedRef.current = false;
    setIsJoined(false);

    if (currentCallRef.current) {
      try { currentCallRef.current.close(); } catch (e) {}
      currentCallRef.current = null;
    }
    if (channelRef.current) {
      try { channelRef.current.close(); } catch (e) {}
      channelRef.current = null;
    }
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch (e) {}
      peerRef.current = null;
    }
    setStatus('idle');
    setPing(null);
    setReconnectAttempt(0);
  }, []);

  const connectToGM = useCallback(async (isAutoReconnect = false) => {
    if (!projectId) return;

    if (!isAutoReconnect) {
      setStatus('connecting');
      setIsJoined(true);
      isJoinedRef.current = true;
    } else {
      setStatus('reconnecting');
      isReconnectingRef.current = true;
    }

    try {
      const Peer = (await import('peerjs')).default;
      const id = listenerId || `guest-${uuidv4().substring(0, 8)}`;
      if (!listenerId) setListenerId(id);

      if (peerRef.current) {
        try { peerRef.current.destroy(); } catch (e) {}
        peerRef.current = null;
      }

      const peer = new Peer(id, { debug: 0 });
      peerRef.current = peer;

      peer.on('open', () => {
        const gmPeerId = `visual-sound-design-${projectId}`;
        const conn = peer.connect(gmPeerId, {
          metadata: { name: username || 'Ouvinte' }
        });
        channelRef.current = conn;

        conn.on('open', () => {
          setStatus('connected');
          setReconnectAttempt(0);
          isReconnectingRef.current = false;
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
        });

        conn.on('data', (data: any) => {
          if (!data) return;

          if (data.type === 'ping') {
            const { timestamp } = data.payload || {};
            if (conn && conn.open) {
              conn.send({ type: 'pong', payload: { timestamp } });
            }
          } else if (data.type === 'chat') {
            const msg: ChatMessage = data.payload;
            setChatMessages(prev => [...prev, msg]);
            if (msg.senderName !== (username || 'Ouvinte')) playPing();
          } else if (data.type === 'kick_listener') {
            disconnectFromGM();
          } else if (onMinigamePayload) {
            onMinigamePayload(data.type, data.payload);
          }
        });

        conn.on('close', () => {
          handleConnectionLoss();
        });

        conn.on('error', () => {
          handleConnectionLoss();
        });
      });

      peer.on('call', (call) => {
        currentCallRef.current = call;
        call.answer();

        call.on('stream', (remoteStream) => {
          if (audioElRef.current) {
            audioElRef.current.srcObject = remoteStream;
            audioElRef.current.volume = isMuted ? 0 : guestVolume;
            audioElRef.current.play().catch(e => console.warn("Audio element play error:", e));
          }
        });
      });

      peer.on('error', (err) => {
        console.warn("PeerJS error:", err);
        handleConnectionLoss();
      });

    } catch (err) {
      console.warn("Failed to connect PeerJS:", err);
      handleConnectionLoss();
    }

    function handleConnectionLoss() {
      if (!isJoinedRef.current) return;
      setStatus('reconnecting');
      setReconnectAttempt(prev => prev + 1);

      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (isJoinedRef.current) connectToGM(true);
      }, 4000);
    }
  }, [projectId, username, listenerId, isMuted, guestVolume, audioElRef, playPing, disconnectFromGM, onMinigamePayload]);

  const handleGuestSendMessage = useCallback((text: string, isRoll = false) => {
    if (!channelRef.current || !channelRef.current.open) return;
    const msg: ChatMessage = {
      id: uuidv4(),
      senderId: listenerId,
      senderName: username || 'Ouvinte',
      text,
      timestamp: Date.now(),
      isRoll
    };
    channelRef.current.send({ type: 'chat', payload: msg });
    setChatMessages(prev => [...prev, msg]);
  }, [username]);

  return {
    listenerId,
    username,
    isJoined,
    status,
    reconnectAttempt,
    ping,
    activeCount,
    chatMessages,
    chatClearedAt,
    setChatClearedAt,
    peerRef,
    channelRef,
    connectToGM,
    disconnectFromGM,
    handleGuestSendMessage,
    handleSendMessage: handleGuestSendMessage,
  };
};
