import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/interfaces/chat';

export function useWebRTCHostSession(
  projectId: string | string[] | undefined,
  externalConnectionsRef?: React.MutableRefObject<Record<string, any>>
) {
  const localConnectionsRef = useRef<Record<string, any>>({});
  const connectionsRef = externalConnectionsRef || localConnectionsRef;

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [chatClearedAt, setChatClearedAt] = useState<number | null>(null);
  const isChatOpenRef = useRef(false);

  const [saveChatHistory, setSaveChatHistory] = useState(false);
  const saveChatHistoryRef = useRef(false);
  const [chatSoundEnabled, setChatSoundEnabled] = useState(true);
  const chatSoundEnabledRef = useRef(true);

  // Sync refs with state
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  useEffect(() => {
    saveChatHistoryRef.current = saveChatHistory;
  }, [saveChatHistory]);

  useEffect(() => {
    chatSoundEnabledRef.current = chatSoundEnabled;
  }, [chatSoundEnabled]);

  const toggleChat = useCallback((open: boolean) => {
    setIsChatOpen(open);
    isChatOpenRef.current = open;
    if (open) setHasUnreadMessages(false);
  }, []);

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
        console.error('Failed to play ping', e);
      }
    }
  }, []);

  const handleHostSendMessage = useCallback(
    (text: string, isRoll?: boolean) => {
      const msg: ChatMessage = {
        id: uuidv4(),
        senderId: 'host',
        senderName: 'Narrador',
        text,
        timestamp: Date.now(),
        isRoll,
      };

      setChatMessages((prev) => {
        const next = [...prev, msg];
        if (saveChatHistoryRef.current && projectId) {
          localStorage.setItem(`chat_history_${projectId}`, JSON.stringify(next));
        }
        return next;
      });

      if (connectionsRef.current) {
        Object.values(connectionsRef.current).forEach((conn: any) => {
          if (conn && conn.open) {
            conn.send({ type: 'chat', payload: msg });
          }
        });
      }
    },
    [projectId, connectionsRef]
  );

  useEffect(() => {
    if (projectId) {
      const saved = localStorage.getItem(`chat_history_${projectId}`);
      if (saved) {
        try {
          setChatMessages(JSON.parse(saved));
          setSaveChatHistory(true);
          saveChatHistoryRef.current = true;
        } catch (e) {}
      }
    }
  }, [projectId]);

  const handleToggleSaveChat = useCallback(() => {
    const nextVal = !saveChatHistory;
    setSaveChatHistory(nextVal);
    saveChatHistoryRef.current = nextVal;
    if (!nextVal && projectId) {
      localStorage.removeItem(`chat_history_${projectId}`);
    } else if (nextVal && projectId) {
      localStorage.setItem(`chat_history_${projectId}`, JSON.stringify(chatMessages));
    }
  }, [saveChatHistory, projectId, chatMessages]);

  const handleIncomingChatMessage = useCallback(
    (msg: ChatMessage, senderListenerId?: string) => {
      setChatMessages((prev) => {
        const next = [...prev, msg];
        if (saveChatHistoryRef.current && projectId) {
          localStorage.setItem(`chat_history_${projectId}`, JSON.stringify(next));
        }
        return next;
      });

      if (connectionsRef.current) {
        Object.values(connectionsRef.current).forEach((otherConn: any) => {
          if (otherConn && otherConn.open && otherConn.peer !== senderListenerId) {
            otherConn.send({ type: 'chat', payload: msg });
          }
        });
      }

      if (!isChatOpenRef.current) {
        setHasUnreadMessages(true);
      }
      playPing();
    },
    [projectId, connectionsRef, playPing]
  );

  return {
    chatMessages,
    setChatMessages,
    isChatOpen,
    setIsChatOpen,
    hasUnreadMessages,
    setHasUnreadMessages,
    chatClearedAt,
    setChatClearedAt,
    saveChatHistory,
    setSaveChatHistory,
    chatSoundEnabled,
    setChatSoundEnabled,
    isChatOpenRef,
    saveChatHistoryRef,
    chatSoundEnabledRef,
    toggleChat,
    playPing,
    handleHostSendMessage,
    handleToggleSaveChat,
    handleIncomingChatMessage,
    connectionsRef,
  };
}
