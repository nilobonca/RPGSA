import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useThemeStore } from '@/store/themeStore';
import { X, Check, DownloadCloud, UploadCloud, MessageSquareText, Palette, Monitor, Database, Keyboard, Gamepad2 } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import { useIDB } from '@/utils/indexedDB';
import { ExportModal } from '@/components/ExportModal';
import { ImportConflictModal } from '@/components/ImportConflictModal';
import { parseBackupFile, ParsedImportData } from '@/utils/exportSystem/importUtils';
import { ChatLogModal } from './ChatLogModal';
import { useShortcutStore } from '@/store/shortcutStore';
import { useMinigamesStore } from '@/store/minigamesStore';

type Tab = 'appearance' | 'system' | 'backup' | 'shortcuts' | 'minigames';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcutCategories = [
  {
    name: 'Menus e Painéis',
    actions: [
      { id: 'toggleChat', label: 'Chat' },
      { id: 'toggleDiceTray', label: 'Bandeja de Dados' },
      { id: 'toggleHistory', label: 'Histórico' },
      { id: 'toggleSoundboard', label: 'Soundboard' },
      { id: 'toggleGlobalAudio', label: 'Áudio Global' },
      { id: 'toggleLayers', label: 'Camadas' },
      { id: 'toggleSettings', label: 'Configurações' }
    ]
  },
  {
    name: 'Ferramentas',
    actions: [
      { id: 'toolCursor', label: 'Cursor' },
      { id: 'toolArea', label: 'Área' },
      { id: 'toolWall', label: 'Parede' },
      { id: 'toolPin', label: 'Pino' },
      { id: 'toolNote', label: 'Nota' },
      { id: 'toolEraser', label: 'Borracha' },
    ]
  },
  {
    name: 'Controle de Áudio',
    actions: [
      { id: 'muteMaster', label: 'Mutar Master' },
      { id: 'stopAllAudio', label: 'Parar Áudio' }
    ]
  },
  {
    name: 'Sistema',
    actions: [
      { id: 'toggleTheaterMode', label: 'Modo Teatro' },
      { id: 'togglePreviewMode', label: 'Modo Preview' },
      { id: 'undo', label: 'Desfazer' },
      { id: 'redo', label: 'Refazer' },
      { id: 'deleteSelection', label: 'Deletar Seleção' },
    ]
  }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    theme, 
    setTheme,
    isSettingsOpen,
    setIsSettingsOpen,
    audioVizEnabled,
    audioVizColor,
    audioVizIntensity,
    setAudioVizEnabled,
    setAudioVizColor,
    setAudioVizIntensity,
    areaRippleEnabled,
    setAreaRippleEnabled,
  } = useThemeStore();
  
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { activeLayers, isPreviewMode, startPreview, discardPreview } = useIDB();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [parsedImportData, setParsedImportData] = useState<ParsedImportData | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isChatLogModalOpen, setIsChatLogModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  
  const { bindings, setBinding } = useShortcutStore();
  const [listeningFor, setListeningFor] = useState<string | null>(null);
  const { addGame } = useMinigamesStore();  
  // Extract project/page ID from URL if inside a project
  const currentProjectId = router.query.id as string | undefined;
  const currentPageId = router.query.page as string | undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!listeningFor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      if (e.key === 'Escape') {
        setBinding(listeningFor, 'Escape');
        setListeningFor(null);
        return;
      }
      
      const keys = [];
      if (e.ctrlKey) keys.push('Control');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');
      
      const keyName = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(keyName)) {
        keys.push(keyName);
        setBinding(listeningFor, keys.join('+'));
        setListeningFor(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listeningFor, setBinding]);

  useEffect(() => {
    if (!isOpen || listeningFor) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, listeningFor, onClose]);

  if (!isOpen || !mounted) return null;

  const renderTabButton = (id: Tab, icon: React.ReactNode, label: string) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={clsx(
          "flex items-center gap-3 p-3 w-full rounded-lg transition-all text-sm font-medium",
          isActive 
            ? (theme === 'ethereal' ? "bg-white/10 text-white" : "bg-neutral-800 text-white") 
            : (theme === 'ethereal' ? "text-neutral-400 hover:text-white hover:bg-white/5" : "text-neutral-400 hover:text-white hover:bg-neutral-800")
        )}
      >
        {icon}
        {label}
      </button>
    );
  };

  const renderAppearanceTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className={clsx("mb-4 text-sm font-semibold tracking-wide uppercase", theme === 'ethereal' ? "text-neutral-500" : "text-neutral-400")}>
          Tema
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('default')}
            className={clsx(
              "relative flex flex-col items-start p-4 text-left border transition-all duration-300 group",
              theme === 'default'
                ? "border-blue-500 bg-blue-500/10"
                : "border-neutral-800 hover:border-neutral-600",
              theme === 'ethereal' ? "rounded-[1.5rem]" : "rounded-lg"
            )}
          >
            <div className="w-full h-24 mb-4 rounded bg-neutral-950 border border-neutral-800 p-2 flex flex-col gap-2">
               <div className="w-1/2 h-4 rounded bg-neutral-800"></div>
               <div className="w-full h-8 rounded bg-neutral-900 border border-neutral-800"></div>
            </div>
            <span className="font-medium text-neutral-200">Padrão</span>
            <span className="text-xs text-neutral-500">Design original</span>
            {theme === 'default' && <div className="absolute top-4 right-4 text-blue-500"><Check size={18} /></div>}
          </button>
          <button
            onClick={() => setTheme('ethereal')}
            className={clsx(
              "relative flex flex-col items-start p-4 text-left border transition-all duration-300 group",
              theme === 'ethereal'
                ? "border-white/20 bg-white/5"
                : "border-neutral-800 hover:border-neutral-600",
              theme === 'ethereal' ? "rounded-[1.5rem]" : "rounded-lg"
            )}
          >
            <div className="w-full h-24 mb-4 rounded-[1rem] bg-black border border-white/10 p-2 flex flex-col gap-2">
               <div className="w-1/2 h-4 rounded-full bg-white/10"></div>
               <div className="w-full h-8 rounded-full bg-white/5 border border-white/10"></div>
            </div>
            <span className="font-medium text-white">Ethereal Glass</span>
            <span className="text-xs text-neutral-500">Luxo, dark tech, blur</span>
            {theme === 'ethereal' && <div className="absolute top-4 right-4 text-white"><Check size={18} /></div>}
          </button>
        </div>
      </div>

      <div>
        <h3 className={clsx("mb-4 text-sm font-semibold tracking-wide uppercase", theme === 'ethereal' ? "text-neutral-500" : "text-neutral-400")}>
          Efeito Visual de Áudio
        </h3>
        <div className={clsx(
          "p-4 border transition-all duration-300 space-y-5",
          theme === 'ethereal' ? "border-white/10 bg-white/5 rounded-[1.5rem]" : "border-neutral-800 bg-neutral-950 rounded-lg"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm text-neutral-200">Brilho nas Bordas</div>
              <div className="text-xs text-neutral-500">Tela pulsa com o ritmo da música</div>
            </div>
            <button
              onClick={() => setAudioVizEnabled(!audioVizEnabled)}
              className={clsx(
                "relative w-11 h-6 rounded-full transition-colors duration-200",
                audioVizEnabled ? "bg-indigo-500" : "bg-neutral-700"
              )}
            >
              <span className={clsx(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                audioVizEnabled && "translate-x-5"
              )} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm text-neutral-200">Ondas nas Áreas</div>
              <div className="text-xs text-neutral-500">Ondas sonoras emanam do centro das áreas ativas</div>
            </div>
            <button
              onClick={() => setAreaRippleEnabled(!areaRippleEnabled)}
              className={clsx(
                "relative w-11 h-6 rounded-full transition-colors duration-200",
                areaRippleEnabled ? "bg-indigo-500" : "bg-neutral-700"
              )}
            >
              <span className={clsx(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                areaRippleEnabled && "translate-x-5"
              )} />
            </button>
          </div>
          {audioVizEnabled && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-neutral-200">Cor do Efeito</div>
                  <div className="text-xs text-neutral-500">Escolha a cor do brilho</div>
                </div>
                <div className="flex items-center gap-2">
                  {['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#f87171', '#a78bfa'].map(color => (
                    <button
                      key={color}
                      onClick={() => setAudioVizColor(color)}
                      className={clsx(
                        "w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110",
                        audioVizColor === color ? "border-white scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={audioVizColor}
                    onChange={(e) => setAudioVizColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
                    title="Cor personalizada"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm text-neutral-200">Intensidade</div>
                    <div className="text-xs text-neutral-500">Controla o tamanho e força do brilho</div>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">{Math.round(audioVizIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={Math.round(audioVizIntensity * 100)}
                  onChange={(e) => setAudioVizIntensity(Number(e.target.value) / 100)}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-neutral-700 accent-indigo-500"
                />
              </div>
              <div 
                className="relative h-16 rounded-xl overflow-hidden border border-white/10"
                style={{ boxShadow: `inset 0 0 80px ${audioVizColor}88`, backgroundColor: '#0a0a0a' }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">
                  Prévia do efeito
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className={clsx("mb-4 text-sm font-semibold tracking-wide uppercase", theme === 'ethereal' ? "text-neutral-500" : "text-neutral-400")}>
          Geral
        </h3>
        <div className={clsx("p-4 border", theme === 'ethereal' ? "border-white/10 bg-white/5 rounded-[1.5rem]" : "border-neutral-800 bg-neutral-900/50 rounded-xl")}>
          <div className="flex items-center justify-between">
            <div className="pr-4">
              <h4 className="font-medium text-neutral-200">Modo Preview</h4>
              <p className="text-sm text-neutral-400 mt-1">
                Faça alterações no mapa sem afetar o que os jogadores veem.
              </p>
            </div>
            <button
              onClick={() => {
                if (isPreviewMode) discardPreview?.();
                else startPreview?.();
              }}
              className={clsx(
                "px-4 py-2 font-medium transition-all text-sm rounded-lg whitespace-nowrap",
                isPreviewMode 
                  ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30" 
                  : (theme === 'ethereal' ? "bg-white/10 hover:bg-white/20 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-white")
              )}
            >
              {isPreviewMode ? 'Desativar Preview' : 'Ativar Preview'}
            </button>
          </div>
        </div>
      </div>

      {currentProjectId && (
        <div>
          <h3 className={clsx("mb-4 text-sm font-semibold tracking-wide uppercase", theme === 'ethereal' ? "text-neutral-500" : "text-neutral-400")}>
            Logs da Sessão
          </h3>
          <button
            onClick={() => setIsChatLogModalOpen(true)}
            className={clsx(
              "flex items-center gap-3 p-4 border transition-all duration-300 w-full hover:scale-[1.01]",
              theme === 'ethereal'
                ? "border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
                : "border-neutral-800 bg-neutral-950 hover:border-purple-600 text-neutral-300 hover:text-purple-500",
              theme === 'ethereal' ? "rounded-[1.5rem]" : "rounded-lg"
            )}
          >
            <MessageSquareText size={24} className="flex-shrink-0" />
            <div className="text-left">
              <div className="font-medium text-inherit">Histórico do Chat</div>
              <div className="text-xs opacity-70">Visualize, baixe ou apague o log permanente de mensagens e rolagens.</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );

  const renderBackupTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className={clsx("mb-4 text-sm font-semibold tracking-wide uppercase", theme === 'ethereal' ? "text-neutral-500" : "text-neutral-400")}>
          Exportação e Backup
        </h3>
        <div className="flex gap-4">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className={clsx(
              "flex items-center gap-3 p-4 border transition-all duration-300 w-1/2 hover:scale-[1.02]",
              theme === 'ethereal'
                ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                : "border-neutral-800 bg-neutral-950 hover:border-emerald-600 text-neutral-300 hover:text-emerald-500",
              theme === 'ethereal' ? "rounded-[1.5rem]" : "rounded-lg"
            )}
          >
            <DownloadCloud size={24} className="flex-shrink-0" />
            <div className="text-left">
              <div className="font-medium text-inherit">Exportar Dados</div>
              <div className="text-xs opacity-70">Faça o download.</div>
            </div>
          </button>

          <label
            className={clsx(
              "flex items-center gap-3 p-4 border transition-all duration-300 w-1/2 hover:scale-[1.02] cursor-pointer",
              theme === 'ethereal'
                ? "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                : "border-neutral-800 bg-neutral-950 hover:border-blue-600 text-neutral-300 hover:text-blue-500",
              theme === 'ethereal' ? "rounded-[1.5rem]" : "rounded-lg"
            )}
          >
            <UploadCloud size={24} className="flex-shrink-0" />
            <div className="text-left">
              <div className="font-medium text-inherit">Importar Backup</div>
              <div className="text-xs opacity-70">Carregar arquivo .zip.</div>
            </div>
            <input 
              type="file" 
              accept=".zip" 
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const parsed = await parseBackupFile(file);
                  setParsedImportData(parsed);
                  setIsImportModalOpen(true);
                } catch (err) {
                  console.error(err);
                  alert("Arquivo zip inválido ou corrompido.");
                }
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderShortcutsTab = () => (
    <div className="space-y-6">
      {shortcutCategories.map((category) => (
        <div key={category.name}>
          <h3 className={clsx("mb-3 text-sm font-semibold tracking-wide uppercase", theme === 'ethereal' ? "text-neutral-500" : "text-neutral-400")}>
            {category.name}
          </h3>
          <div className={clsx("divide-y border", theme === 'ethereal' ? "divide-white/10 border-white/10 bg-white/5 rounded-[1.5rem]" : "divide-neutral-800 border-neutral-800 bg-neutral-900/50 rounded-xl")}>
            {category.actions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-neutral-200">{action.label}</span>
                <button
                  onClick={() => setListeningFor(action.id)}
                  className={clsx(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
                    listeningFor === action.id 
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse" 
                      : (theme === 'ethereal' ? "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:text-white" : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700 hover:text-white")
                  )}
                >
                  {listeningFor === action.id ? "Pressione..." : (bindings[action.id] || "Não definido")}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );


  const renderMinigamesTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className={clsx("mb-4 text-sm font-semibold tracking-wide uppercase", theme === 'ethereal' ? "text-neutral-500" : "text-neutral-400")}>
          Minigames e Desafios
        </h3>
        <div className="space-y-4">
          
          {/* Clicker Minigame */}
          <div className={clsx("p-4 border", theme === 'ethereal' ? "border-white/10 bg-white/5 rounded-[1.5rem]" : "border-neutral-800 bg-neutral-900/50 rounded-xl")}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <h4 className="font-medium text-neutral-200">Desafio de Cliques</h4>
                  <p className="text-sm text-neutral-400 mt-1">
                    Inicie um minigame onde os jogadores devem clicar rapidamente para atingir uma meta.
                  </p>
                </div>
                <button
                  onClick={() => {
                    addGame({
                      id: uuidv4(),
                      gameId: 'clicker',
                      title: 'Desafio de Cliques',
                      isMinimized: false,
                      status: 'idle',
                      config: { targetClicks: 100, timeLimit: 30 }
                    });
                    onClose();
                  }}
                  className={clsx(
                    "px-4 py-2 font-medium transition-all text-sm rounded-lg whitespace-nowrap",
                    theme === 'ethereal' ? "bg-white/10 hover:bg-white/20 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-white"
                  )}
                >
                  Novo Desafio
                </button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-neutral-800 dark:border-white/10">
                <div className="text-sm text-neutral-400">Fixar botão no menu lateral</div>
                <button
                  onClick={() => useThemeStore.getState().togglePinnedMinigame('clicker')}
                  className={clsx(
                    "relative w-11 h-6 rounded-full transition-colors duration-200",
                    useThemeStore.getState().pinnedMinigames.includes('clicker') ? "bg-indigo-500" : "bg-neutral-700"
                  )}
                >
                  <span className={clsx(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                    useThemeStore.getState().pinnedMinigames.includes('clicker') && "translate-x-5"
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* Coin Flip Minigame */}
          <div className={clsx("p-4 border", theme === 'ethereal' ? "border-white/10 bg-white/5 rounded-[1.5rem]" : "border-neutral-800 bg-neutral-900/50 rounded-xl")}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <h4 className="font-medium text-neutral-200">Cara ou Coroa</h4>
                  <p className="text-sm text-neutral-400 mt-1">
                    Gire uma moeda 3D em tempo real. Você pode predefinir ou forçar o resultado.
                  </p>
                </div>
                <button
                  onClick={() => {
                    addGame({
                      id: `coin_flip_${Date.now()}`,
                      gameId: 'coin_flip',
                      title: 'Cara ou Coroa',
                      isMinimized: false,
                      status: 'idle',
                      config: { maxFlips: 1, permissions: {} }
                    });
                    onClose();
                  }}
                  className={clsx(
                    "px-4 py-2 font-medium transition-all text-sm rounded-lg whitespace-nowrap",
                    theme === 'ethereal' ? "bg-white/10 hover:bg-white/20 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-white"
                  )}
                >
                  Novo Desafio
                </button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-neutral-800 dark:border-white/10">
                <div className="text-sm text-neutral-400">Fixar botão no menu lateral</div>
                <button
                  onClick={() => useThemeStore.getState().togglePinnedMinigame('coin_flip')}
                  className={clsx(
                    "relative w-11 h-6 rounded-full transition-colors duration-200",
                    useThemeStore.getState().pinnedMinigames.includes('coin_flip') ? "bg-indigo-500" : "bg-neutral-700"
                  )}
                >
                  <span className={clsx(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                    useThemeStore.getState().pinnedMinigames.includes('coin_flip') && "translate-x-5"
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* Cartas Minigame */}
          <div className={clsx(
            "p-6 rounded-2xl border transition-all",
            theme === 'ethereal' ? "bg-white/5 border-white/10" : "bg-neutral-800/50 border-neutral-800"
          )}>
            <div className="flex items-center gap-4 mb-4">
              <div className={clsx(
                "p-3 rounded-xl",
                theme === 'ethereal' ? "bg-white/10 text-white" : "bg-indigo-500/10 text-indigo-400"
              )}>
                <Gamepad2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-200">Cartas</h3>
                <span className="text-xs text-indigo-400 font-medium">Novo</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <h4 className="font-medium text-neutral-200">Distribuição de Cartas</h4>
                  <p className="text-sm text-neutral-400 mt-1">
                    Exiba cartas personalizadas para os ouvintes, com opções de face inicial e revelação (secreta ou pública).
                  </p>
                </div>
                <button
                  onClick={() => {
                    addGame({
                      id: `cards_${Date.now()}`,
                      gameId: 'cards',
                      title: 'Escolha uma Carta',
                      isMinimized: false,
                      status: 'idle',
                      config: { permissions: {} }
                    });
                    onClose();
                  }}
                  className={clsx(
                    "px-4 py-2 font-medium transition-all text-sm rounded-lg whitespace-nowrap",
                    theme === 'ethereal' ? "bg-white/10 hover:bg-white/20 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-white"
                  )}
                >
                  Novo Desafio
                </button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-neutral-800 dark:border-white/10">
                <div className="text-sm text-neutral-400">Fixar botão no menu lateral</div>
                <button
                  onClick={() => useThemeStore.getState().togglePinnedMinigame('cards')}
                  className={clsx(
                    "relative w-11 h-6 rounded-full transition-colors duration-200",
                    useThemeStore.getState().pinnedMinigames.includes('cards') ? "bg-indigo-500" : "bg-neutral-700"
                  )}
                >
                  <span className={clsx(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                    useThemeStore.getState().pinnedMinigames.includes('cards') && "translate-x-5"
                  )} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={clsx(
          "w-full max-w-4xl flex flex-col overflow-hidden transition-all duration-300 h-[80vh]",
          theme === 'ethereal' 
            ? "bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl" 
            : "bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className={clsx("text-xl font-medium", theme === 'ethereal' ? "text-white" : "text-neutral-200")}>
            Configurações
          </h2>
          <button 
            onClick={onClose}
            className={clsx(
              "p-2 rounded-full transition-colors",
              theme === 'ethereal' ? "hover:bg-white/10 text-neutral-400 hover:text-white" : "hover:bg-neutral-800 text-neutral-400"
            )}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/10 p-4 flex flex-col gap-2 overflow-y-auto shrink-0">
            {renderTabButton('appearance', <Palette size={18} />, 'Aparência')}
            {renderTabButton('system', <Monitor size={18} />, 'Sistema')}
            {renderTabButton('backup', <Database size={18} />, 'Backup')}
            {renderTabButton('shortcuts', <Keyboard size={18} />, 'Atalhos')}
            {renderTabButton('minigames', <Gamepad2 size={18} />, 'Minigames')}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'appearance' && renderAppearanceTab()}
            {activeTab === 'system' && renderSystemTab()}
            {activeTab === 'backup' && renderBackupTab()}
            {activeTab === 'shortcuts' && renderShortcutsTab()}
            {activeTab === 'minigames' && renderMinigamesTab()}
          </div>
        </div>
      </div>
      
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeLayers={activeLayers}
        currentProjectId={currentProjectId}
        currentPageId={currentPageId}
      />
      <ImportConflictModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        parsedData={parsedImportData}
        onSuccess={() => {
          setIsImportModalOpen(false);
          alert('Importação concluída com sucesso! A página será recarregada.');
          window.location.reload();
        }}
      />
      
      {currentProjectId && (
        <ChatLogModal
          isOpen={isChatLogModalOpen}
          onClose={() => setIsChatLogModalOpen(false)}
          projectId={currentProjectId}
        />
      )}
    </div>
  );
};
