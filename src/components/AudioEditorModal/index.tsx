import React, { useState, useEffect, useRef } from 'react';
import { Audios } from '@/interfaces/utils/indexedDB';
import { X, Play, Pause, Scissors, Copy, Check, Volume2, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { useThemeStore } from '@/store/themeStore';

interface AudioEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  audio?: Audios | null;
  initialTrimStart?: number;
  initialTrimEnd?: number;
  onSaveTrimmedCopy?: (trimmedFile: File, newName: string) => Promise<void> | void;
  onSaveTrimRange?: (trimStart: number, trimEnd: number) => void;
}

export const AudioEditorModal: React.FC<AudioEditorModalProps> = ({
  isOpen,
  onClose,
  audio,
  initialTrimStart = 0,
  initialTrimEnd,
  onSaveTrimmedCopy,
  onSaveTrimRange
}) => {
  const { theme } = useThemeStore();
  const [duration, setDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(initialTrimStart);
  const [trimEnd, setTrimEnd] = useState<number>(initialTrimEnd || 0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copyName, setCopyName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize values when audio changes
  useEffect(() => {
    if (audio) {
      setCopyName(`${audio.name} (Cortado)`);
    }
  }, [audio]);

  useEffect(() => {
    if (!isOpen || !audio) {
      if (isPlaying) stopPlayback();
      return;
    }

    const audioElement = new Audio(audio.url);
    audioRef.current = audioElement;

    const handleLoadedMetadata = () => {
      const dur = audioElement.duration || 0;
      setDuration(dur);
      setTrimStart(initialTrimStart || 0);
      setTrimEnd(initialTrimEnd && initialTrimEnd <= dur ? initialTrimEnd : dur);
      setCurrentTime(initialTrimStart || 0);
    };

    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audioElement.pause();
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, audio, initialTrimStart, initialTrimEnd]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const updatePlaybackProgress = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);

      if (cur >= trimEnd) {
        audioRef.current.pause();
        audioRef.current.currentTime = trimStart;
        setIsPlaying(false);
        return;
      }
    }
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updatePlaybackProgress);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      if (currentTime < trimStart || currentTime >= trimEnd) {
        audioRef.current.currentTime = trimStart;
      } else {
        audioRef.current.currentTime = currentTime;
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        animFrameRef.current = requestAnimationFrame(updatePlaybackProgress);
      }).catch(console.error);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = trimStart;
    }
    setIsPlaying(false);
    setCurrentTime(trimStart);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const handleStartChange = (val: number) => {
    const newStart = Math.max(0, Math.min(val, trimEnd - 0.1));
    setTrimStart(newStart);
    if (currentTime < newStart) {
      setCurrentTime(newStart);
      if (audioRef.current) audioRef.current.currentTime = newStart;
    }
  };

  const handleEndChange = (val: number) => {
    const newEnd = Math.min(duration, Math.max(val, trimStart + 0.1));
    setTrimEnd(newEnd);
    if (currentTime > newEnd) {
      setCurrentTime(trimStart);
      if (audioRef.current) audioRef.current.currentTime = trimStart;
    }
  };

  // Web Audio API buffer trimming to export a clean File/Blob copy
  const exportTrimmedCopy = async () => {
    if (!audio || !onSaveTrimmedCopy) return;
    try {
      setIsSaving(true);
      const response = await fetch(audio.url);
      const arrayBuffer = await response.arrayBuffer();
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const sampleRate = decodedBuffer.sampleRate;
      const startFrame = Math.floor(trimStart * sampleRate);
      const endFrame = Math.floor(trimEnd * sampleRate);
      const frameCount = Math.max(1, endFrame - startFrame);

      const offlineCtx = new OfflineAudioContext(
        decodedBuffer.numberOfChannels,
        frameCount,
        sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(offlineCtx.destination);
      source.start(0, trimStart, trimEnd - trimStart);

      const renderedBuffer = await offlineCtx.startRendering();

      // Convert rendered AudioBuffer to WAV Blob
      const wavBlob = audioBufferToWav(renderedBuffer);
      const trimmedFile = new File([wavBlob], `${copyName.trim() || 'audio_cortado'}.wav`, { type: 'audio/wav' });

      await onSaveTrimmedCopy(trimmedFile, copyName);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error('Erro ao recortar e exportar áudio:', err);
      alert('Ocorreu um erro ao cortar o áudio.');
      setIsSaving(false);
    }
  };

  const handleSaveRange = () => {
    if (onSaveTrimRange) {
      onSaveTrimRange(trimStart, trimEnd);
      onClose();
    }
  };

  if (!isOpen || !audio) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className={clsx(
        "w-full max-w-xl rounded-2xl shadow-2xl border p-6 flex flex-col gap-5",
        theme === 'ethereal'
          ? "bg-[#0c0c0e]/95 border-white/15 text-white shadow-purple-950/20"
          : "bg-neutral-900 border-neutral-800 text-neutral-100"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Scissors size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold truncate max-w-xs">{audio.name}</h2>
              <p className="text-xs text-neutral-400">Cortar e Editar Áudio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Player & Controls */}
        <div className="flex flex-col gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>Início: {trimStart.toFixed(2)}s</span>
            <span className="text-blue-400 font-semibold">{currentTime.toFixed(2)}s / {duration.toFixed(2)}s</span>
            <span>Fim: {trimEnd.toFixed(2)}s</span>
          </div>

          {/* Timeline Bar */}
          <div className="relative h-6 bg-neutral-800 rounded-lg overflow-hidden flex items-center select-none">
            {/* Highlighted Trim Region */}
            {duration > 0 && (
              <div
                className="absolute top-0 bottom-0 bg-blue-500/30 border-x-2 border-blue-500 transition-all"
                style={{
                  left: `${(trimStart / duration) * 100}%`,
                  width: `${((trimEnd - trimStart) / duration) * 100}%`
                }}
              />
            )}
            {/* Playhead */}
            {duration > 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 shadow-md z-10"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            )}
          </div>

          {/* Range Sliders */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-neutral-400 mb-1 flex justify-between">
                <span>Ponto de Início (Corte Inicial)</span>
                <span className="font-mono text-neutral-200">{trimStart.toFixed(2)}s</span>
              </label>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.05}
                value={trimStart}
                onChange={(e) => handleStartChange(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 mb-1 flex justify-between">
                <span>Ponto de Fim (Corte Final)</span>
                <span className="font-mono text-neutral-200">{trimEnd.toFixed(2)}s</span>
              </label>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.05}
                value={trimEnd}
                onChange={(e) => handleEndChange(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={togglePlay}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pausar Prévia' : 'Ouvir Prévia Cortada'}
            </button>
            <button
              onClick={stopPlayback}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
              title="Reiniciar Prévia"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Export / Save Section */}
        <div className="space-y-4 pt-2">
          {onSaveTrimmedCopy && (
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium block">Nome da Nova Cópia</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={copyName}
                  onChange={(e) => setCopyName(e.target.value)}
                  placeholder="Nome do arquivo..."
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={exportTrimmedCopy}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
                >
                  <Copy size={14} />
                  {isSaving ? 'Salvando...' : 'Salvar Cópia'}
                </button>
              </div>
            </div>
          )}

          {onSaveTrimRange && (
            <button
              onClick={handleSaveRange}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Check size={14} className="text-blue-400" />
              Aplicar Intervalo ao Botão
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple AudioBuffer to WAV converter utility
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const bufferLength = result.length * bytesPerSample;
  const headerLength = 44;
  const outBuffer = new ArrayBuffer(headerLength + bufferLength);
  const view = new DataView(outBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + bufferLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, bufferLength, true);

  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const sample = Math.max(-1, Math.min(1, result[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}
