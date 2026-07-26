import React from 'react';
import clsx from 'clsx';
import BatchAudioUploadModal from '@/components/BatchAudioUploadModal';
import ImageEditor from '@/components/ImageEditor';
import { PinManager } from '@/components/PinManager';
import HistoryMenu from '@/components/HistoryMenu';
import { GlobalAudioEditorModal } from '@/components/AudioEditorModal/GlobalAudioEditorModal';
import { SessionChat } from '@/components/Chat/SessionChat';
import { DiceTray } from '@/components/Dice/DiceTray';
import { ActiveImage, ActivePin } from '@/interfaces/utils/indexedDB';
import { ChatMessage } from '@/interfaces/chat';
import { useCanvasGlobalStore } from '@/store/canvasStore';

export interface ProjectModalsContainerProps {
  // Batch Audio Upload Modal
  pendingUploads: File[] | null;
  uploadProgress: {
    isUploading: boolean;
    current: number;
    total: number;
    currentFileName: string;
  };
  onConfirmUpload: () => void;
  onCancelUpload: () => void;

  // Image Editor
  editingImageId: string | null;
  activeImages: ActiveImage[];
  onUpdateImage: (updatedImage: ActiveImage) => void;
  onCloseImageEditor: () => void;

  // Pin Manager
  pinManagerOpen: boolean;
  activePins: ActivePin[];
  updatePinPersisted: (pin: ActivePin) => void;
  deletePinPersisted: (id: string) => void;
  setPinManagerOpen: (open: boolean) => void;

  // History Menu
  historyOpen: boolean;
  history: any[];
  future: any[];
  handleUndo: () => void;
  handleRedo: () => void;
  setHistoryOpen: (open: boolean) => void;
  handleRestoreHistory: (state: any, index: number, type: 'history' | 'future') => void;

  // Session Chat
  isChatOpen: boolean;
  chatMessages: ChatMessage[];
  chatClearedAt: number | null;
  handleHostSendMessage: (text: string, isRoll?: boolean) => void;
  toggleChat: (open: boolean) => void;
  setChatClearedAt: (timestamp: number) => void;
  saveChatHistory: boolean;
  handleToggleSaveChat: () => void;
  chatSoundEnabled: boolean;
  setChatSoundEnabled: (enabled: boolean) => void;
  chatSoundEnabledRef?: React.MutableRefObject<boolean>;

  // Dice Tray
  isDiceTrayOpen: boolean;
  setIsDiceTrayOpen: (open: boolean) => void;

  // General UI / Z-index options
  isTheaterMode?: boolean;
  menuZIndices?: Record<string, number>;
  bringToFront?: (menu: any) => void;
}

export const ProjectModalsContainer: React.FC<ProjectModalsContainerProps> = ({
  // Batch Upload
  pendingUploads,
  uploadProgress,
  onConfirmUpload,
  onCancelUpload,

  // Image Editor
  editingImageId,
  activeImages,
  onUpdateImage,
  onCloseImageEditor,

  // Pin Manager
  pinManagerOpen,
  activePins,
  updatePinPersisted,
  deletePinPersisted,
  setPinManagerOpen,

  // History Menu
  historyOpen,
  history,
  future,
  handleUndo,
  handleRedo,
  setHistoryOpen,
  handleRestoreHistory,

  // Chat
  isChatOpen,
  chatMessages,
  chatClearedAt,
  handleHostSendMessage,
  toggleChat,
  setChatClearedAt,
  saveChatHistory,
  handleToggleSaveChat,
  chatSoundEnabled,
  setChatSoundEnabled,
  chatSoundEnabledRef,

  // Dice Tray
  isDiceTrayOpen,
  setIsDiceTrayOpen,

  // Z-index & Theater
  isTheaterMode = false,
  menuZIndices = {},
  bringToFront
}) => {
  const storeMenuZIndices = useCanvasGlobalStore(state => state.menuZIndices);
  const storeBringToFront = useCanvasGlobalStore(state => state.bringToFront);
  const activeZIndices = (menuZIndices && Object.keys(menuZIndices).length > 0) ? menuZIndices : storeMenuZIndices;
  const activeBringToFront = bringToFront || storeBringToFront;

  const editingImage = editingImageId ? activeImages.find(i => i.id === editingImageId) : null;

  return (
    <>
      {/* Session Chat Drawer */}
      {isChatOpen && (
        <div className={clsx(
          "absolute top-20 right-4 w-80 h-[500px] z-50 flex flex-col shadow-2xl rounded-xl border border-neutral-700 bg-neutral-900 animate-in slide-in-from-top-2 fade-in transition-opacity duration-500",
          isTheaterMode ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          <SessionChat
            messages={chatMessages.filter(m => !chatClearedAt || m.timestamp > chatClearedAt)}
            currentUserId="host"
            onSendMessage={handleHostSendMessage}
            onClose={() => toggleChat(false)}
            onClear={() => setChatClearedAt(Date.now())}
            isHost={true}
            saveChatEnabled={saveChatHistory}
            onToggleSaveChat={handleToggleSaveChat}
            soundEnabled={chatSoundEnabled}
            onToggleSound={() => {
              const nextState = !chatSoundEnabled;
              setChatSoundEnabled(nextState);
              if (chatSoundEnabledRef) {
                chatSoundEnabledRef.current = nextState;
              }
            }}
            className="w-full h-full border-0"
          />
        </div>
      )}

      {/* Dice Tray Drawer */}
      {isDiceTrayOpen && (
        <div className={clsx(
          "absolute top-20 right-4 z-50 transition-opacity duration-500",
          isTheaterMode ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          <DiceTray
            onRoll={(text, isPrivate) => {
              if (!isPrivate) {
                handleHostSendMessage(text, true);
              }
            }}
            onClose={() => setIsDiceTrayOpen(false)}
          />
        </div>
      )}

      {/* Pin Manager - Floating */}
      {pinManagerOpen && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: activeZIndices.pin }}
          onMouseDown={() => activeBringToFront?.('pin')}
        >
          <PinManager
            pins={activePins}
            onToggle={(pin) => updatePinPersisted({ ...pin, enabled: !pin.enabled })}
            onRename={(pin, newName) => updatePinPersisted({ ...pin, name: newName })}
            onUpdate={updatePinPersisted}
            onDelete={deletePinPersisted}
            onClose={() => setPinManagerOpen(false)}
            onInteraction={() => activeBringToFront?.('pin')}
          />
        </div>
      )}

      {/* History Menu - Floating */}
      {historyOpen && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: activeZIndices.history }}
          onMouseDown={() => activeBringToFront?.('history')}
        >
          <HistoryMenu
            history={history}
            future={future}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClose={() => setHistoryOpen(false)}
            onRestore={handleRestoreHistory}
            onInteraction={() => activeBringToFront?.('history')}
          />
        </div>
      )}

      {/* Global Audio Editor Modal */}
      <GlobalAudioEditorModal />

      {/* Batch Audio Upload Modal */}
      {pendingUploads && (
        <BatchAudioUploadModal
          files={pendingUploads}
          isUploading={uploadProgress.isUploading}
          progress={uploadProgress}
          onConfirm={onConfirmUpload}
          onCancel={onCancelUpload}
        />
      )}

      {/* Image Editor */}
      {editingImage && (
        <ImageEditor
          image={editingImage}
          onUpdate={onUpdateImage}
          onClose={onCloseImageEditor}
        />
      )}
    </>
  );
};

export default ProjectModalsContainer;
