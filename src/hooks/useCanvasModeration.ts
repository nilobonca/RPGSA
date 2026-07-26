import { useCallback } from 'react';
import { ActivePin } from '@/interfaces/utils/indexedDB';

export interface UseCanvasModerationProps {
  activePins: ActivePin[];
  connectionsRef: React.RefObject<any>;
  canvasRef: React.RefObject<any>;
}

export const useCanvasModeration = ({
  activePins,
  connectionsRef,
  canvasRef,
}: UseCanvasModerationProps) => {
  const handleLocateListener = useCallback((listenerId: string) => {
    const pinId = `listener:${listenerId}`;
    const pin = activePins.find(p => p.id === pinId);
    if (pin) {
      canvasRef.current?.centerOn(pin.position.x, pin.position.y);
    }
  }, [activePins, canvasRef]);

  const handleLocatePlayer = useCallback((x: number, y: number) => {
    canvasRef.current?.centerOn(x, y);
  }, [canvasRef]);

  const handleKickListener = useCallback((listenerId: string) => {
    const conn = connectionsRef.current?.[listenerId];
    if (conn && conn.open) {
      conn.send({
        type: 'kick_listener',
        payload: { listenerId }
      });
      setTimeout(() => {
        conn.close();
      }, 500);
    }
  }, [connectionsRef]);

  return {
    handleLocateListener,
    handleLocatePlayer,
    handleKickListener,
  };
};
