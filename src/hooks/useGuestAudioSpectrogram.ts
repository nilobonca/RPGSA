import { useState, useRef, useEffect } from 'react';
import { getSharedAudioContext } from '@/utils/audio/audioContext';

export interface UseGuestAudioSpectrogramProps {
  showSpectrogram: boolean;
}

export const useGuestAudioSpectrogram = () => {
  const [showSpectrogram, setShowSpectrogram] = useState(true);
  const [guestVolume, setGuestVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const handleGuestVolumeChange = (newVolume: number) => {
    setGuestVolume(newVolume);
    if (newVolume > 0 && isMuted) setIsMuted(false);
    if (audioElRef.current) {
      audioElRef.current.volume = isMuted ? 0 : newVolume;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioElRef.current) {
      audioElRef.current.volume = nextMuted ? 0 : guestVolume;
    }
  };

  useEffect(() => {
    if (!showSpectrogram || !canvasRef.current || !audioElRef.current) return;

    try {
      const ctx = getSharedAudioContext();
      if (!ctx) return;

      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
      }

      if (audioElRef.current.srcObject && !streamSourceRef.current) {
        try {
          const stream = audioElRef.current.srcObject as MediaStream;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
          streamSourceRef.current = source;
        } catch (e) {
          console.warn("Could not create MediaStreamSource for spectrogram", e);
        }
      }

      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
        if (!analyserRef.current || !canvasCtx) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          canvasCtx.fillStyle = `rgba(99, 102, 241, ${0.4 + (dataArray[i] / 255) * 0.6})`;
          canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      };

      draw();
    } catch (e) {
      console.warn("Spectrogram initialization error", e);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [showSpectrogram]);

  return {
    showSpectrogram,
    setShowSpectrogram,
    guestVolume,
    setGuestVolume,
    isMuted,
    setIsMuted,
    handleGuestVolumeChange,
    toggleMute,
    audioElRef,
    canvasRef,
  };
};
