import "@/styles/globals.css";
import { IDBProvider } from "@/utils/indexedDB";
import { LogSystemProvider } from "@/utils/logSystem";
import { ThemeProvider } from "@/components/theme-provider";
import type { AppProps } from "next/app";

import { useEffect, useState } from "react";
import { FeedbackWidget } from "@/components/Feedback/FeedbackWidget";
import { PollsProvider } from "@/contexts/PollsContext";
import { useThemeStore } from "@/store/themeStore";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { Settings } from "lucide-react";
import clsx from "clsx";

export default function App({ Component, pageProps }: AppProps) {
  const { theme, isSettingsOpen, setIsSettingsOpen } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const activeTheme = mounted ? theme : 'ethereal';

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'ethereal', 'grimdark', 'cyber', 'taverna');
    if (activeTheme === 'ethereal' || activeTheme === 'grimdark' || activeTheme === 'cyber' || activeTheme === 'taverna') {
      root.classList.add('dark', activeTheme);
    } else if (activeTheme === 'dark') {
      root.classList.add('dark');
    } else if (activeTheme === 'light') {
      root.classList.add('light');
    }
  }, [activeTheme, mounted]);

  return (
    <LogSystemProvider>
      <ThemeProvider defaultTheme="ethereal" storageKey="vite-ui-theme">
        <PollsProvider>
            <IDBProvider>
              <div className={clsx("min-h-screen transition-colors duration-500", activeTheme, activeTheme === 'default' ? 'bg-neutral-950' : '')}>
                <Component {...pageProps} />
                <FeedbackWidget />
                
                {mounted && (
                  <>
                    <SettingsModal 
                      isOpen={isSettingsOpen} 
                      onClose={() => setIsSettingsOpen(false)} 
                    />
                  </>
                )}
              </div>
            </IDBProvider>
        </PollsProvider>
      </ThemeProvider>
    </LogSystemProvider>
  );
}
