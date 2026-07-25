import React, { ChangeEvent, DragEvent, useRef, useEffect, useState, useCallback } from "react";
import { GripHorizontal, SquareX, Music, Image as ImageIcon, X, FolderPlus, Folder, ChevronDown, ChevronRight, FolderOpen, LayoutGrid, List } from 'lucide-react';
import { useLogSystem } from "@/utils/logSystem";
import { useIDB } from "@/utils/indexedDB";
import GButton from "../ButtonGeneric";
import { Audios, Images, AssetFolder } from "@/interfaces/utils/indexedDB";
import ContextMenu from "../ContextMenu";

import { motion, useDragControls, Reorder } from "framer-motion";
import { useViewportResize } from "@/hooks/useViewportResize";
import { ThemeToggle } from "../ThemeToggle";

const DragHandleIcon = () => (
  <div>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500">
      <circle cx="9" cy="12" r="1"></circle>
      <circle cx="9" cy="5" r="1"></circle>
      <circle cx="9" cy="19" r="1"></circle>
      <circle cx="15" cy="12" r="1"></circle>
      <circle cx="15" cy="5" r="1"></circle>
      <circle cx="15" cy="19" r="1"></circle>
    </svg>
  </div>
)

const NativeDraggable = ({ children, item, onDragStart, className, style }: any) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // By attaching native listeners with capture: true, we intercept the event 
    // before Framer Motion's listeners (which are attached to parent elements) can see it.
    const stopPropagation = (e: Event) => {
      e.stopPropagation();
    };

    el.addEventListener('pointerdown', stopPropagation, { capture: true });
    el.addEventListener('mousedown', stopPropagation, { capture: true });
    el.addEventListener('touchstart', stopPropagation, { capture: true });

    return () => {
      el.removeEventListener('pointerdown', stopPropagation, { capture: true });
      el.removeEventListener('mousedown', stopPropagation, { capture: true });
      el.removeEventListener('touchstart', stopPropagation, { capture: true });
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      draggable={true}
      style={style}
      onDragStart={(e) => onDragStart(e, item)}
    >
      {children}
    </div>
  );
};

const ReorderAudioItem = ({ audio, onContextMenu, onDragStart }: any) => {
  const controls = useDragControls();
  return (
    <Reorder.Item value={audio} dragListener={false} dragControls={controls} style={{ touchAction: 'none' }}>
      <div
        className="p-1 flex items-center gap-4 animate-fade-in bg-white dark:bg-neutral-700 rounded shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
        onContextMenu={(e) => onContextMenu(e, audio.id)}
      >
        <div className="flex items-center gap-3 flex-grow min-w-0">
          <div className="cursor-grab active:cursor-grabbing p-1 -m-1" onPointerDown={(e) => controls.start(e)}>
            <DragHandleIcon />
          </div>
          <NativeDraggable 
            item={audio}
            className="flex items-center gap-3 flex-grow min-w-0 cursor-grab active:cursor-grabbing" 
            style={{ WebkitUserDrag: 'element', userSelect: 'auto' }}
            onDragStart={onDragStart} 
          >
            <Music size={16} className="text-blue-500 flex-shrink-0" />
            <div className="flex-grow min-w-0" >
              <p className="text-xs truncate dark:text-neutral-200" title={audio.name}>{audio.name}</p>
              {audio.createdAt && (
                <p className="text-[10px] text-gray-400 dark:text-neutral-400">{new Date(audio.createdAt).toLocaleDateString()}</p>
              )}
            </div>
          </NativeDraggable>
        </div>
      </div>
    </Reorder.Item>
  );
};

const ReorderImageItem = ({ image, onContextMenu, onDragStart }: any) => {
  const controls = useDragControls();
  return (
    <Reorder.Item value={image} dragListener={false} dragControls={controls} style={{ touchAction: 'none' }}>
      <div
        className="p-1 flex items-center gap-4 animate-fade-in bg-white dark:bg-neutral-700 rounded shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
        onContextMenu={(e) => onContextMenu(e, image.id)}
      >
        <div className="flex items-center gap-3 flex-grow min-w-0">
          <div className="cursor-grab active:cursor-grabbing p-1 -m-1" onPointerDown={(e) => controls.start(e)}>
            <DragHandleIcon />
          </div>
          <NativeDraggable 
            item={image}
            className="flex items-center gap-3 flex-grow min-w-0 cursor-grab active:cursor-grabbing" 
            style={{ WebkitUserDrag: 'element', userSelect: 'auto' }}
            onDragStart={onDragStart} 
          >
            <ImageIcon size={16} className="text-green-500 flex-shrink-0" />
            <div className="flex-grow min-w-0" >
              <p className="text-xs truncate dark:text-neutral-200" title={image.name}>{image.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-neutral-400">{new Date(image.createdAt).toLocaleDateString()}</p>
            </div>
          </NativeDraggable>
        </div>
      </div>
    </Reorder.Item>
  );
};

interface HeaderProps {
  HandleDragStart: (e: DragEvent, item: Audios | Images, type: 'audio' | 'image') => void;
  HandleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  IsLoading: boolean;
  SetMessage: (msg: string) => void;
  SavedAudios: Audios[];
  DeleteAudio: (id: number) => void;
  activeAudioIds?: Set<number>;
  proximityVolumes?: Map<number, number>;
  highlightedAudioId?: number | null;
  onInteraction?: () => void;
  onClose?: () => void;
  onAssetContextMenu?: (e: React.MouseEvent, id: number | string, type: 'audio' | 'image' | 'folder') => void;
}

const HeaderCab: React.FC<HeaderProps> = ({
  HandleDragStart,
  HandleFileChange,
  SavedAudios,
  DeleteAudio,
  activeAudioIds = new Set(),
  onInteraction,
  onClose,
  onAssetContextMenu
}) => {

  const dragControls = useDragControls();

  const {
    usageLog,
    saveImage,
    savedImages,
    reorderAudios,
    reorderImages,
    assetFolders,
    addAssetFolder,
    updateAssetFolder,
    updateAudioPersisted,
    updateImagePersisted
  } = useIDB()

  const [isAdding, setIsAdding] = React.useState(false);
  const [contextMenuState, setContextMenuState] = useState<{ x: number, y: number } | null>(null);

  const {
    lastLog,
  } = useLogSystem()

  /*
  // Unused function
  const handleDuplicateAudio = async (audio: Audios) => {
    const copiedAudio = await saveAudio(audio.file);
    if (copiedAudio) {

    }
  };
  */

  const holderFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    HandleFileChange(e)
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      saveImage(e.target.files[0]);
    }
  }

  const { size, position, handleResizeStart, onDragEnd, width, height } = useViewportResize({
    initialSize: { width: 300, height: 500 },
    initialPosition: { x: 16, y: 80 },
    minWidth: 240,
    minHeight: 400
  });

  const [groupByType, setGroupByType] = useState(false);

  useEffect(() => {
    const savedPref = localStorage.getItem('assetGroupByType');
    if (savedPref !== null) {
      setGroupByType(savedPref === 'true');
    }
  }, []);

  const toggleGroupByType = () => {
    setGroupByType(prev => {
      const next = !prev;
      localStorage.setItem('assetGroupByType', String(next));
      return next;
    });
  };
  type MixedItem = 
    | { type: 'folder', item: AssetFolder }
    | { type: 'audio', item: Audios }
    | { type: 'image', item: Images };

  const getSortedItems = useCallback((folderId?: string): MixedItem[] => {
    let items: MixedItem[] = [];
    
    if (!folderId) {
      items.push(...(assetFolders || []).map(f => ({ type: 'folder' as const, item: f })));
    }
    
    items.push(...(SavedAudios || []).filter(a => (!folderId ? !a.folderId : a.folderId === folderId)).map(a => ({ type: 'audio' as const, item: a })));
    items.push(...(savedImages || []).filter(i => (!folderId ? !i.folderId : i.folderId === folderId)).map(i => ({ type: 'image' as const, item: i })));

    if (groupByType) {
      items.sort((a, b) => {
        const typeWeight = { folder: 1, audio: 2, image: 3 };
        if (typeWeight[a.type] !== typeWeight[b.type]) {
          return typeWeight[a.type] - typeWeight[b.type];
        }
        return ((a.item as any).order || 0) - ((b.item as any).order || 0);
      });
    } else {
      items.sort((a, b) => ((a.item as any).order || 0) - ((b.item as any).order || 0));
    }
    return items;
  }, [assetFolders, SavedAudios, savedImages, groupByType]);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  const [editingAssetId, setEditingAssetId] = useState<{ id: number, type: 'audio' | 'image' } | null>(null);
  const [editingAssetName, setEditingAssetName] = useState('');

  const [draggedItem, setDraggedItem] = useState<{ type: 'audio' | 'image' | 'folder', id: number | string, originalFolderId?: string } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ type: 'audio' | 'image' | 'folder' | 'root', id: number | string, folderId?: string } | null>(null);

  useEffect(() => {
    const handleStartRename = (e: CustomEvent) => {
      const { id, type } = e.detail;
      let assetName = '';
      
      if (type === 'folder') {
        const folder = assetFolders.find(f => f.id === id);
        if (folder) assetName = folder.name;
        if (assetName) {
          setEditingFolderId(id);
          setEditingFolderName(assetName);
        }
      } else {
        const numericId = Number(id);
        if (type === 'audio') {
          const audio = SavedAudios.find(a => a.id === numericId);
          if (audio) assetName = audio.name;
        } else {
          const image = savedImages.find(img => img.id === numericId);
          if (image) assetName = image.name;
        }
        
        if (assetName) {
          setEditingAssetId({ id: numericId, type });
          setEditingAssetName(assetName);
        }
      }
    };
    
    window.addEventListener('start-asset-rename' as any, handleStartRename);
    return () => window.removeEventListener('start-asset-rename' as any, handleStartRename);
  }, [SavedAudios, savedImages, assetFolders]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleCreateFolder = async () => {
    const newFolder = await addAssetFolder("Nova Pasta");
    if (newFolder) {
      setEditingFolderId(newFolder.id);
      setEditingFolderName(newFolder.name);
      setExpandedFolders(prev => new Set(prev).add(newFolder.id));
    }
  };

  const handleRenameFolderSubmit = (folder: any) => {
    if (editingFolderName.trim() && editingFolderName.trim() !== folder.name) {
      updateAssetFolder({ ...folder, name: editingFolderName.trim() });
    }
    setEditingFolderId(null);
  };

  const handleRenameAssetSubmit = (item: any, type: 'audio' | 'image') => {
    if (editingAssetName.trim() && editingAssetName.trim() !== item.name) {
      if (type === 'audio') {
        updateAudioPersisted({ ...item, name: editingAssetName.trim() });
      } else {
        updateImagePersisted({ ...item, name: editingAssetName.trim() });
      }
    }
    setEditingAssetId(null);
  };

  const handleDragStartItem = (e: React.DragEvent, item: any, type: 'audio' | 'image' | 'folder', folderId?: string) => {
    setDraggedItem({ type, id: item.id, originalFolderId: folderId });
    if (type !== 'folder') {
      HandleDragStart(e, item, type as any);
    } else {
      // e.dataTransfer.setData('folder', item.id); // Or anything if we want to drag folders later
    }
  };

  const handleDragOverItem = (e: React.DragEvent, type: 'audio' | 'image' | 'folder' | 'root', id: number | string, folderId?: string) => {
    e.preventDefault(); // Necessary to allow dropping
    e.stopPropagation();
    if (draggedItem?.id !== id || draggedItem?.type !== type) {
      setDragOverItem({ type, id, folderId });
    }
  };

  const handleDropItem = (e: React.DragEvent, type: 'audio' | 'image' | 'folder' | 'root', id: number | string, targetFolderId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;
    if (draggedItem.id === id && draggedItem.type === type) {
      setDraggedItem(null); setDragOverItem(null); return;
    }

    const isDropIntoFolder = type === 'folder' && targetFolderId === id;
    const destFolderId = isDropIntoFolder ? (id as string) : (type === 'root' ? undefined : targetFolderId);
    
    // Don't drop a folder inside itself or another folder
    if (draggedItem.type === 'folder' && destFolderId !== undefined) {
      setDraggedItem(null); setDragOverItem(null); return;
    }

    // Get the full list of items in the destination (root or folder)
    let destItems = getSortedItems(destFolderId);
    
    // Find the item being dragged
    let draggedMixedItem: MixedItem | undefined;
    if (draggedItem.type === 'folder') {
      const f = assetFolders.find(f => f.id === draggedItem.id);
      if (f) draggedMixedItem = { type: 'folder', item: f };
    } else if (draggedItem.type === 'audio') {
      const a = SavedAudios.find(a => a.id === draggedItem.id);
      if (a) draggedMixedItem = { type: 'audio', item: a };
    } else if (draggedItem.type === 'image') {
      const i = savedImages.find(i => i.id === draggedItem.id);
      if (i) draggedMixedItem = { type: 'image', item: i };
    }

    if (!draggedMixedItem) {
       setDraggedItem(null); setDragOverItem(null); return;
    }

    // Update folderId of the dragged item
    if (draggedMixedItem.type !== 'folder') {
       (draggedMixedItem.item as any).folderId = destFolderId;
    }

    // Remove the dragged item from the destItems if it's already there
    destItems = destItems.filter(i => !(i.type === draggedItem.type && i.item.id === draggedItem.id));

    // Find the insertion index
    let dropIndex = -1;
    if (type !== 'root' && !isDropIntoFolder) {
        dropIndex = destItems.findIndex(i => i.type === type && i.item.id === id);
    } else if (type === 'root') {
        const container = (e.currentTarget as HTMLElement).querySelector('.space-y-3');
        if (container) {
            const children = Array.from(container.children);
            let closestType = '';
            let closestId = '';
            
            for (let i = 0; i < children.length; i++) {
                const child = children[i] as HTMLElement;
                const rect = child.getBoundingClientRect();
                const childMiddleY = rect.top + rect.height / 2;
                if (e.clientY < childMiddleY) {
                    closestType = child.getAttribute('data-item-type') || '';
                    closestId = child.getAttribute('data-item-id') || '';
                    break;
                }
            }
            
            if (closestType && closestId) {
                dropIndex = destItems.findIndex(i => i.type === closestType && String(i.item.id) === closestId);
            }
        }
    }
    
    if (dropIndex !== -1) {
       destItems.splice(dropIndex, 0, draggedMixedItem);
    } else {
       destItems.push(draggedMixedItem);
    }

    // Assign new orders and persist
    destItems.forEach((mixed, index) => {
       const newOrder = index;
       if ((mixed.item as any).order !== newOrder || (mixed.item.id === draggedItem.id)) {
           mixed.item.order = newOrder;
           if (mixed.type === 'folder') {
               updateAssetFolder({ ...mixed.item } as any);
           } else if (mixed.type === 'audio') {
               updateAudioPersisted({ ...mixed.item } as any);
           } else if (mixed.type === 'image') {
               updateImagePersisted({ ...mixed.item } as any);
           }
       }
    });

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const renderItem = (item: Audios | Images, itemType: 'audio' | 'image') => {
    const isDragging = draggedItem?.type === itemType && draggedItem.id === item.id;
    const isDragOver = dragOverItem?.type === itemType && dragOverItem.id === item.id;
    const dropIndicatorClass = isDragOver ? 'border-t-2 border-blue-500 pt-2 mt-2' : '';

    return (
      <div 
        key={`${itemType}-${item.id}`} 
        data-item-type={itemType}
        data-item-id={item.id}
        className={`group p-2 flex items-center gap-3 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl border border-transparent shadow-sm hover:border-violet-500/30 hover:shadow-md hover:bg-white dark:hover:bg-neutral-700 transition-all duration-300 ease-out cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 scale-95 z-50 shadow-xl border-violet-500/50 bg-white dark:bg-neutral-700' : ''} ${dropIndicatorClass}`} 
        draggable={true} 
        onDragStart={(e) => handleDragStartItem(e, item, itemType, item.folderId)} 
        onDragOver={(e) => handleDragOverItem(e, itemType, item.id, item.folderId)}
        onDragLeave={() => setDragOverItem(null)}
        onDragEnd={() => { setDraggedItem(null); setDragOverItem(null); }}
        onDrop={(e) => handleDropItem(e, itemType, item.id, item.folderId)}
        onContextMenu={(e) => { e.stopPropagation(); if (onAssetContextMenu) { e.preventDefault(); onAssetContextMenu(e, item.id as number, itemType); } }}
      >
        <div className="flex items-center gap-3 flex-grow min-w-0"
             onDoubleClick={(e) => {
               e.stopPropagation();
               setEditingAssetId({ id: item.id, type: itemType });
               setEditingAssetName(item.name);
             }}>
          <GripHorizontal size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${itemType === 'audio' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-900/50'}`}>
            {itemType === 'audio' ? <Music size={16} /> : <ImageIcon size={16} />}
          </div>
          <div className="flex-grow min-w-0">
            {editingAssetId?.id === item.id && editingAssetId?.type === itemType ? (
              <input
                type="text"
                value={editingAssetName}
                onChange={(e) => setEditingAssetName(e.target.value)}
                onBlur={() => handleRenameAssetSubmit(item, itemType)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameAssetSubmit(item, itemType);
                  if (e.key === 'Escape') setEditingAssetId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="text-xs font-medium bg-white dark:bg-neutral-900 text-black dark:text-white px-2 py-1 rounded-md outline-none border border-violet-500 shadow-sm w-full focus:ring-2 focus:ring-violet-500/20"
              />
            ) : (
              <p className="text-[13px] font-medium truncate text-gray-700 dark:text-neutral-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" title={item.name}>{item.name}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const rootItems = getSortedItems(undefined);

    const renderMixedItem = (mixed: MixedItem) => {
      if (mixed.type === 'audio' || mixed.type === 'image') {
        return renderItem(mixed.item as any, mixed.type);
      }

      const folder = mixed.item as AssetFolder;
      const isExpanded = expandedFolders.has(folder.id);
      const folderItems = getSortedItems(folder.id);
      const isDragOver = dragOverItem?.type === 'folder' && dragOverItem.id === folder.id;
      const isDragging = draggedItem?.type === 'folder' && draggedItem.id === folder.id;

      return (
        <div 
          key={`folder-${folder.id}`} 
          data-item-type="folder"
          data-item-id={folder.id}
          className={`group/folder rounded-xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-sm transition-all duration-300 border ${isDragOver ? 'border-violet-500 shadow-md' : 'border-transparent hover:border-violet-500/20 hover:shadow-md'} ${isDragging ? 'opacity-50 scale-95 z-50 shadow-xl border-violet-500/50' : ''}`}
          draggable={true}
          onDragStart={(e) => handleDragStartItem(e, folder, 'folder')}
          onDragOver={(e) => handleDragOverItem(e, 'folder', folder.id)}
          onDragLeave={() => setDragOverItem(null)}
          onDragEnd={() => { setDraggedItem(null); setDragOverItem(null); }}
          onDrop={(e) => handleDropItem(e, 'folder', folder.id)}
          onContextMenu={(e) => { e.stopPropagation(); if (onAssetContextMenu) { e.preventDefault(); onAssetContextMenu(e, folder.id, 'folder'); } }}
        >
          <div 
            className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-white dark:hover:bg-neutral-700 rounded-xl transition-colors"
            onClick={() => { if (editingFolderId !== folder.id) toggleFolder(folder.id); }}
            onDoubleClick={() => {
              setEditingFolderId(folder.id);
              setEditingFolderName(folder.name);
            }}
          >
            <div className="flex items-center gap-3 flex-grow min-w-0">
              <GripHorizontal size={14} className="text-gray-400 opacity-0 group-hover/folder:opacity-100 transition-opacity flex-shrink-0" />
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex-shrink-0 group-hover/folder:bg-amber-200 dark:group-hover/folder:bg-amber-900/50 transition-colors">
                {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
              </div>
              
              {editingFolderId === folder.id ? (
                <input
                  type="text"
                  value={editingFolderName}
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  onBlur={() => handleRenameFolderSubmit(folder)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameFolderSubmit(folder);
                    if (e.key === 'Escape') setEditingFolderId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="text-xs font-medium bg-white dark:bg-neutral-900 text-black dark:text-white px-2 py-1 rounded-md outline-none border border-amber-500 shadow-sm w-full focus:ring-2 focus:ring-amber-500/20"
                />
              ) : (
                <span className="text-[13px] font-medium text-gray-700 dark:text-neutral-200 group-hover/folder:text-amber-600 dark:group-hover/folder:text-amber-400 transition-colors truncate">{folder.name}</span>
              )}
              
              {editingFolderId !== folder.id && (
                <span className="text-[11px] font-medium text-gray-400 bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full flex-shrink-0">{folderItems.length}</span>
              )}
            </div>
            {isExpanded ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}
          </div>
          
          {isExpanded && (
            <div className="p-2 pt-1 pl-11 space-y-2 bg-transparent rounded-b-xl min-h-[30px]"
                 onDragOver={(e) => handleDragOverItem(e, 'folder', folder.id, folder.id)}
                 onDrop={(e) => handleDropItem(e, 'folder', folder.id, folder.id)}
            >
              {folderItems.length === 0 ? (
                <div className="flex items-center gap-2 py-2 px-1 text-gray-400 dark:text-neutral-500 opacity-70">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-neutral-600"></div>
                  <p className="text-[11px] italic">Pasta vazia</p>
                </div>
              ) : (
                folderItems.map(item => renderMixedItem(item))
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col pt-1">
        <div className="flex justify-between items-center px-1 mb-3">
          <span className="text-[11px] font-bold tracking-widest text-gray-400 dark:text-neutral-500 uppercase">Assets</span>
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-neutral-800/50 px-2 py-1 rounded-md border border-gray-200 dark:border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-medium text-gray-500 dark:text-neutral-400">{usageLog}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 shrink-0">
          <label htmlFor={"audio-input"} title="Adicionar Áudio" className="group relative flex flex-col items-center justify-center h-[72px] bg-white/50 dark:bg-neutral-800/50 backdrop-blur-md border border-gray-200/60 dark:border-white/10 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-neutral-700 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/10 transition-all duration-300" />
            <Music className="text-blue-500 group-hover:scale-110 transition-transform duration-300" size={18} />
            <span className="text-[10px] font-medium text-gray-600 dark:text-neutral-300 mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Áudio</span>
            <input onChange={holderFileChange} id={"audio-input"} accept="audio/*" type="file" className="hidden" multiple />
          </label>

          <label htmlFor={"image-input"} title="Adicionar Imagem" className="group relative flex flex-col items-center justify-center h-[72px] bg-white/50 dark:bg-neutral-800/50 backdrop-blur-md border border-gray-200/60 dark:border-white/10 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-neutral-700 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-green-500/10 transition-all duration-300" />
            <ImageIcon className="text-green-500 group-hover:scale-110 transition-transform duration-300" size={18} />
            <span className="text-[10px] font-medium text-gray-600 dark:text-neutral-300 mt-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Imagem</span>
            <input onChange={handleImageChange} id={"image-input"} accept="image/*" type="file" className="hidden" />
          </label>
        </div>

        <div className="w-full flex flex-col min-h-0 flex-1 relative rounded-xl group/list"
             onDragOver={(e) => handleDragOverItem(e, 'root', 'root')}
             onDrop={(e) => handleDropItem(e, 'root', 'root')}
             onContextMenu={(e) => {
               e.preventDefault();
               setContextMenuState({ x: e.clientX, y: e.clientY });
             }}
        >
          <div className="absolute inset-0 bg-gray-50/50 dark:bg-neutral-800/30 rounded-xl pointer-events-none border border-transparent group-hover/list:border-gray-200/50 dark:group-hover/list:border-white/5 transition-colors" />
          {rootItems.length > 0 ? (
            <div className="space-y-2 overflow-y-auto p-2 flex-1 z-10 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent">
              {rootItems.map(item => renderMixedItem(item))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 h-full z-10 text-gray-400 dark:text-neutral-500 py-10 space-y-4">
              <div className="p-5 bg-white dark:bg-neutral-800 rounded-full shadow-sm border border-gray-100 dark:border-neutral-700">
                <FolderOpen size={32} className="opacity-40 text-violet-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-gray-500 dark:text-neutral-400">Sua biblioteca está vazia</p>
                <p className="text-xs opacity-70">Arraste arquivos ou use os botões acima</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      layoutRoot
      layout={false}
      initial={{ x: 16, y: 80 }}
      style={{
        width: width,
        height: height,
        maxHeight: '80vh',
        x: position.x,
        y: position.y,
        zIndex: 500,
      }}
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      onDragEnd={onDragEnd}
      className={`absolute flex flex-col bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden pointer-events-auto p-5 animate-in fade-in zoom-in-95`}
      onPointerDownCapture={onInteraction}
    >
      {/* Expanded View */}
      <div className={`flex flex-col h-full block`}>
        <div
          className="w-full flex justify-between items-center mb-2 relative flex-shrink-0 touch-none cursor-move group/header"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-1 rounded-full bg-gray-300 dark:bg-neutral-600 transition-colors group-hover/header:bg-violet-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                onPointerDown={(e) => e.stopPropagation()}
                title="Fechar"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div onPointerDown={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          {renderContent()}
        </div>

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize touch-none"
          onPointerDown={handleResizeStart as any}
        >
          <svg viewBox="0 0 24 24" className="w-full h-full text-gray-400">
            <path fill="currentColor" d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM14 22H12V20H14V22ZM22 10H20V8H22V10ZM10 22H8V20H10V22Z" />
          </svg>
        </div>
      </div>

      {contextMenuState && (
        <ContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          onClose={() => setContextMenuState(null)}
          options={[
            {
              label: 'Nova Pasta',
              icon: <FolderPlus size={16} />,
              onClick: handleCreateFolder
            },
            {
              label: groupByType ? 'Misturar Itens' : 'Separar por Tipo',
              icon: groupByType ? <LayoutGrid size={16} /> : <List size={16} />,
              onClick: toggleGroupByType
            }
          ]}
        />
      )}
    </motion.div>
  );
};

export default HeaderCab;
