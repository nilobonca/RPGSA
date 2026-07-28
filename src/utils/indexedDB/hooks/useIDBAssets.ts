import { useState, useCallback, useRef } from 'react';
import { Audios, Images, AssetFolder, Players, ActiveImage } from '../../../interfaces/utils/indexedDB';
import { v4 as uuidv4 } from 'uuid';

interface UseIDBAssetsOptions {
    setMessage: (msg: string) => void;
    setActivePlayers: React.Dispatch<React.SetStateAction<Players[]>>;
    setActiveImages: React.Dispatch<React.SetStateAction<ActiveImage[]>>;
    deleteItemPersisted: (id: string) => void;
}

export function useIDBAssets(db: IDBDatabase | null, options: UseIDBAssetsOptions) {
    const { setMessage, setActivePlayers, setActiveImages, deleteItemPersisted } = options;
    const dbRef = useRef(db);
    dbRef.current = db;

    const [savedAudios, setSavedAudios] = useState<Audios[]>([]);
    const [savedImages, setSavedImages] = useState<Images[]>([]);
    const [assetFolders, setAssetFolders] = useState<AssetFolder[]>([]);

    const findaudio = useCallback((id: number) => {
        return savedAudios.find(a => a.id === id);
    }, [savedAudios]);

    const loadAssetFolders = useCallback((database: IDBDatabase) => {
        return new Promise<void>((resolve) => {
            if (!database.objectStoreNames.contains('asset_folders')) {
                resolve();
                return;
            }
            const transaction = database.transaction(['asset_folders'], 'readonly');
            const store = transaction.objectStore('asset_folders');
            const request = store.getAll();
            request.onsuccess = () => {
                const folders: AssetFolder[] = request.result;
                const sorted = folders.sort((a, b) => (a.order || 0) - (b.order || 0));
                setAssetFolders(sorted);
                resolve();
            };
            request.onerror = () => {
                console.error('Erro ao carregar pastas.');
                resolve();
            };
        });
    }, []);

    const loadAudios = useCallback((database: IDBDatabase) => {
        return new Promise<void>((resolve) => {
            if (!database.objectStoreNames.contains('audios')) {
                resolve();
                return;
            }
            const transaction = database.transaction(['audios'], 'readonly');
            const store = transaction.objectStore('audios');
            const request = store.getAll();
            request.onsuccess = () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const audiosWithUrls = request.result.map((audio: any) => ({
                    ...audio,
                    url: URL.createObjectURL(audio.file)
                }));
                setSavedAudios(audiosWithUrls);
                resolve();
            };
        });
    }, []);

    const loadImages = useCallback((database: IDBDatabase) => {
        return new Promise<void>((resolve) => {
            if (!database.objectStoreNames.contains('images')) {
                resolve();
                return;
            }
            const transaction = database.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const request = store.getAll();
            request.onsuccess = () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const imagesWithUrls = request.result.map((image: any) => ({
                    ...image,
                    url: URL.createObjectURL(image.file)
                }));
                setSavedImages(imagesWithUrls);
                resolve();
            };
        });
    }, []);

    const saveAudio = useCallback((file: File): Promise<Audios | undefined> => {
        return new Promise((resolve) => {
            const currentDb = dbRef.current;
            if (!currentDb || !currentDb.objectStoreNames.contains('audios')) {
                resolve(undefined);
                return;
            }
            const transaction = currentDb.transaction(['audios'], 'readwrite');
            const store = transaction.objectStore('audios');
            const request = store.add({
                file,
                name: file.name,
                createdAt: new Date(),
                order: savedAudios.length
            });

            request.onsuccess = () => {
                const id = request.result as number;
                const newAudio = {
                    id,
                    file,
                    name: file.name,
                    createdAt: new Date(),
                    order: savedAudios.length,
                    url: URL.createObjectURL(file)
                };
                setSavedAudios(prev => [...prev, newAudio]);
                setMessage('Áudio salvo com sucesso!');

                resolve(newAudio);
            };
            request.onerror = () => {
                setMessage('Erro ao salvar áudio.');
                resolve(undefined);
            };
        });
    }, [savedAudios.length, setMessage]);

    const deleteAudio = useCallback((id: number) => {
        const currentDb = dbRef.current;
        if (!currentDb || !currentDb.objectStoreNames.contains('audios')) return;
        const transaction = currentDb.transaction(['audios'], 'readwrite');
        const store = transaction.objectStore('audios');
        store.delete(id);

        transaction.oncomplete = () => {
            setSavedAudios(prev => prev.filter(a => a.id !== id));
            setMessage('Áudio excluído.');

            setActivePlayers(prev => {
                const playersToRemove = prev.filter(p => p.audio.id === id);

                playersToRemove.forEach(p => deleteItemPersisted(p.id));
                return prev.filter(p => p.audio.id !== id);
            });
        };

        transaction.onerror = (e) => {
            console.error('[deleteAudio] Erro:', (e.target as IDBRequest).error);
            setMessage('Erro ao excluir áudio.');
        };
    }, [deleteItemPersisted, setActivePlayers, setMessage]);

    const updateAudioPersisted = useCallback((audio: Audios) => {
        const currentDb = dbRef.current;
        if (!currentDb || !currentDb.objectStoreNames.contains('audios')) return;
        const transaction = currentDb.transaction(['audios'], 'readwrite');
        const store = transaction.objectStore('audios');
        store.put(audio);
        transaction.oncomplete = () => {
            setSavedAudios(prev => prev.map(a => a.id === audio.id ? audio : a));
        };
    }, []);

    const saveImage = useCallback((file: File): Promise<Images | undefined> => {
        return new Promise((resolve) => {
            const currentDb = dbRef.current;
            if (!currentDb || !currentDb.objectStoreNames.contains('images')) {
                resolve(undefined);
                return;
            }
            const transaction = currentDb.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.add({
                file,
                name: file.name,
                createdAt: new Date(),
                order: savedImages.length
            });

            request.onsuccess = () => {
                const id = request.result as number;
                const newImage = {
                    id,
                    file,
                    name: file.name,
                    createdAt: new Date(),
                    order: savedImages.length,
                    url: URL.createObjectURL(file)
                };
                setSavedImages(prev => [...prev, newImage]);
                setMessage('Imagem salva com sucesso!');

                resolve(newImage);
            };
            request.onerror = () => {
                setMessage('Erro ao salvar imagem.');
                resolve(undefined);
            };
        });
    }, [savedImages.length, setMessage]);

    const deleteImage = useCallback((id: number) => {
        const currentDb = dbRef.current;
        if (!currentDb || !currentDb.objectStoreNames.contains('images')) return;
        const transaction = currentDb.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        store.delete(id);

        transaction.oncomplete = () => {
            setSavedImages(prev => prev.filter(i => i.id !== id));
            setMessage('Imagem excluída.');

            setActiveImages(prev => {
                const imagesToRemove = prev.filter(i => i.image.id === id);
                imagesToRemove.forEach(i => deleteItemPersisted(i.id));
                return prev.filter(i => i.image.id !== id);
            });
        };

        transaction.onerror = () => {
            setMessage('Erro ao excluir imagem.');
        };
    }, [deleteItemPersisted, setActiveImages, setMessage]);

    const addAssetFolder = useCallback((name: string): Promise<AssetFolder | undefined> => {
        return new Promise((resolve) => {
            const currentDb = dbRef.current;
            if (!currentDb || !currentDb.objectStoreNames.contains('asset_folders')) {
                resolve(undefined);
                return;
            }
            const transaction = currentDb.transaction(['asset_folders'], 'readwrite');
            const store = transaction.objectStore('asset_folders');
            const newFolder: AssetFolder = {
                id: uuidv4(),
                name,
                createdAt: new Date(),
                order: assetFolders.length
            };
            const request = store.add(newFolder);
            request.onsuccess = () => {
                setAssetFolders(prev => [...prev, newFolder]);
                resolve(newFolder);
            };
            request.onerror = () => resolve(undefined);
        });
    }, [assetFolders.length]);

    const updateAssetFolder = useCallback((folder: AssetFolder) => {
        const currentDb = dbRef.current;
        if (!currentDb || !currentDb.objectStoreNames.contains('asset_folders')) return;
        const transaction = currentDb.transaction(['asset_folders'], 'readwrite');
        const store = transaction.objectStore('asset_folders');
        store.put(folder);
        transaction.oncomplete = () => {
            setAssetFolders(prev => prev.map(f => f.id === folder.id ? folder : f));
        };
    }, []);

    const deleteAssetFolder = useCallback((id: string) => {
        const currentDb = dbRef.current;
        if (!currentDb || !currentDb.objectStoreNames.contains('asset_folders')) return;
        const transaction = currentDb.transaction(['asset_folders'], 'readwrite');
        const store = transaction.objectStore('asset_folders');
        store.delete(id);
        transaction.oncomplete = () => {
            setAssetFolders(prev => prev.filter(f => f.id !== id));
        };
    }, []);

    const reorderAudios = useCallback((audios: Audios[]) => {
        const updatedAudios = audios.map((a, index) => ({ ...a, order: index }));
        setSavedAudios(updatedAudios);

        const currentDb = dbRef.current;
        if (!currentDb || !currentDb.objectStoreNames.contains('audios')) return;
        const transaction = currentDb.transaction(['audios'], 'readwrite');
        const store = transaction.objectStore('audios');
        updatedAudios.forEach(audio => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { url, ...audioData } = audio;
            store.put(audioData);
        });
    }, []);

    const reorderImages = useCallback((images: Images[]) => {
        const updatedImages = images.map((i, index) => ({ ...i, order: index }));
        setSavedImages(updatedImages);

        const currentDb = dbRef.current;
        if (!currentDb || !currentDb.objectStoreNames.contains('images')) return;
        const transaction = currentDb.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        updatedImages.forEach(image => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { url, ...imageData } = image;
            store.put(imageData);
        });
    }, []);

    return {
        savedAudios,
        setSavedAudios,
        savedImages,
        setSavedImages,
        assetFolders,
        setAssetFolders,
        findaudio,
        loadAssetFolders,
        loadAudios,
        loadImages,
        saveAudio,
        deleteAudio,
        updateAudioPersisted,
        saveImage,
        deleteImage,
        addAssetFolder,
        updateAssetFolder,
        deleteAssetFolder,
        reorderAudios,
        reorderImages
    };
}
