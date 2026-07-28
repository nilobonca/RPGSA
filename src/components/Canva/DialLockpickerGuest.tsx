import React from 'react';
import { DialLockpicker } from '../minigames/DialLockpicker';

interface DialLockpickerGuestProps {
  clickerConfig: any;
  clickerPermissions: { canSee: boolean; canInteract: boolean };
  onProgress: (completedPins: number, status: 'success' | 'failed' | 'playing') => void;
  gameOver: boolean;
}

export const DialLockpickerGuest: React.FC<DialLockpickerGuestProps> = ({
  clickerConfig,
  clickerPermissions,
  onProgress,
  gameOver
}) => {
  if (!clickerPermissions.canSee) return null;

  const stages = clickerConfig?.config?.stages ?? 3;
  const tolerance = clickerConfig?.config?.tolerance ?? 6;
  const maxAttempts = clickerConfig?.config?.maxAttempts ?? 5;
  const fakeSpotsCount = clickerConfig?.config?.fakeSpotsCount ?? 0;
  const title = clickerConfig?.title || 'Decodificador de Fechadura Rúnica';

  return (
    <div className="relative z-10 flex flex-col items-center justify-center p-4 w-full max-w-lg font-sans">
      <DialLockpicker
        title={title}
        stages={stages}
        tolerance={tolerance}
        maxAttempts={maxAttempts}
        fakeSpotsCount={fakeSpotsCount}
        showRestart={false}
        onSuccess={() => {
          onProgress(stages, 'success');
        }}
        onFail={() => {
          onProgress(0, 'failed');
        }}
      />
    </div>
  );
};
