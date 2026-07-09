import React, { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { X, Download, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { ChatMessage } from '@/interfaces/chat';

interface ChatLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const ChatLogModal: React.FC<ChatLogModalProps> = ({ isOpen, onClose, projectId }) => {
  const { theme } = useThemeStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (isOpen && projectId) {
      const stored = localStorage.getItem(`chat_history_${projectId}`);
      if (stored) {
        try {
          setMessages(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        setMessages([]);
      }
    }
  }, [isOpen, projectId]);

  const handleDownload = () => {
    let content = `Log do Chat - Projeto ${projectId}\n\n`;
    messages.forEach(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      if (msg.isRoll) {
        content += `[${time}] ${msg.senderName} (ROLAGEM): ${msg.text}\n`;
      } else {
        content += `[${time}] ${msg.senderName}: ${msg.text}\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_log_${projectId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm("Tem certeza que deseja apagar o histórico salvo permanentemente? Isso não poderá ser desfeito.")) {
      localStorage.removeItem(`chat_history_${projectId}`);
      setMessages([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        className={clsx(
          "w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden transition-all duration-300",
          theme === 'ethereal' 
            ? "bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl" 
            : "bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className={clsx("text-xl font-medium", theme === 'ethereal' ? "text-white" : "text-neutral-200")}>
            Histórico do Chat
          </h2>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleDownload}
              disabled={messages.length === 0}
              className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
              title="Baixar Log (.txt)"
            >
              <Download size={20} />
            </button>
            <button
              onClick={handleClear}
              disabled={messages.length === 0}
              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
              title="Apagar Histórico"
            >
              <Trash2 size={20} />
            </button>
            <div className="w-px h-6 bg-neutral-800 mx-2 self-center"></div>
            <button 
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm">
          {messages.length === 0 ? (
            <div className="text-center text-neutral-500 mt-10">Nenhum histórico encontrado.</div>
          ) : (
            <div className="space-y-2">
              {messages.map(msg => (
                <div key={msg.id} className="flex gap-3">
                  <span className="text-neutral-500 shrink-0">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                  <span className={clsx("font-bold shrink-0", msg.senderId === 'host' ? "text-indigo-400" : "text-emerald-400")}>
                    {msg.senderName}:
                  </span>
                  <span className={clsx("text-neutral-300 break-words flex-1", msg.isRoll && "text-purple-300")}>
                    {msg.isRoll ? `[ROLAGEM] ${msg.text}` : msg.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
