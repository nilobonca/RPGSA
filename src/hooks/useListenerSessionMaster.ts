import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useGuestAudioSpectrogram } from '@/hooks/useGuestAudioSpectrogram';
import { useGuestMinigames } from '@/hooks/useGuestMinigames';
import { useWebRTCGuestSession } from '@/hooks/useWebRTCGuestSession';

export const useListenerSessionMaster = () => {
  const router = useRouter();
  const { id: projectId } = router.query;

  const [username, setUsername] = useState('');
  const [isDiceTrayOpen, setIsDiceTrayOpen] = useState(false);
  const [chatSoundEnabled, setChatSoundEnabled] = useState(true);
  const chatSoundEnabledRef = useRef(true);

  const spectrogram = useGuestAudioSpectrogram();

  const guestSession = useWebRTCGuestSession({
    projectId,
    username,
    chatSoundEnabledRef,
    audioElRef: spectrogram.audioElRef,
    isMuted: spectrogram.isMuted,
    guestVolume: spectrogram.guestVolume
  });

  const minigames = useGuestMinigames({
    channelRef: guestSession.channelRef,
    listenerId: guestSession.listenerId,
    handleSendMessage: (text: string, isRoll?: boolean) => {
      guestSession.handleGuestSendMessage(text, isRoll);
    },
    chatSoundEnabledRef
  });

  return {
    projectId,
    username,
    setUsername,
    isDiceTrayOpen,
    setIsDiceTrayOpen,
    chatSoundEnabled,
    setChatSoundEnabled,
    chatSoundEnabledRef,
    spectrogram,
    minigames,
    guestSession,
  };
};
