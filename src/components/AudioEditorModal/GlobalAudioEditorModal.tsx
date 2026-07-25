import React from 'react';
import { useAudioEditorStore } from '@/store/audioEditorStore';
import { AudioEditorModal } from './index';
import { useIDB } from '@/utils/indexedDB';

export const GlobalAudioEditorModal: React.FC = () => {
    const { isOpen, config, closeEditor } = useAudioEditorStore();
    const { saveAudio } = useIDB();

    if (!isOpen || !config) return null;

    return (
        <AudioEditorModal
            isOpen={isOpen}
            onClose={closeEditor}
            audio={config.audio}
            initialTrimStart={config.initialTrimStart}
            initialTrimEnd={config.initialTrimEnd}
            onSaveTrimRange={config.onSaveTrimRange}
            onSaveTrimmedCopy={async (trimmedFile) => {
                if (saveAudio) {
                    await saveAudio(trimmedFile);
                }
            }}
        />
    );
};
