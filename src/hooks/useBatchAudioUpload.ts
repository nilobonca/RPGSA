import { useState } from 'react';

export interface UseBatchAudioUploadProps {
  saveAudio: (file: File) => Promise<any>;
}

export const useBatchAudioUpload = ({ saveAudio }: UseBatchAudioUploadProps) => {
  const [pendingUploads, setPendingUploads] = useState<File[] | null>(null);
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    current: 0,
    total: 0,
    currentFileName: '',
  });

  const handleConfirmUpload = async () => {
    if (!pendingUploads) return;
    setUploadProgress({ isUploading: true, current: 0, total: pendingUploads.length, currentFileName: '' });

    for (let i = 0; i < pendingUploads.length; i++) {
      const file = pendingUploads[i];
      setUploadProgress(prev => ({ ...prev, current: i + 1, currentFileName: file.name }));
      await saveAudio(file);
    }

    setPendingUploads(null);
    setUploadProgress({ isUploading: false, current: 0, total: 0, currentFileName: '' });
  };

  return {
    pendingUploads,
    setPendingUploads,
    uploadProgress,
    handleConfirmUpload,
  };
};
