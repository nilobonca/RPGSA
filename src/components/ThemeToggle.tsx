import * as React from "react"
import { Moon, Sun, Sparkles, Flame, Terminal, Beer, Palette } from "lucide-react"
import { useTheme, Theme } from "@/components/theme-provider"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [isOpen, setIsOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const themes: { id: Theme; label: string; icon: React.ReactNode }[] = [
        { id: "ethereal", label: "Ethereal Arcane", icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
        { id: "grimdark", label: "Grimdark Horror", icon: <Flame className="w-4 h-4 text-red-500" /> },
        { id: "cyber", label: "Cyber HUD", icon: <Terminal className="w-4 h-4 text-cyan-400" /> },
        { id: "taverna", label: "Taverna Vintage", icon: <Beer className="w-4 h-4 text-amber-500" /> },
        { id: "dark", label: "Dark Standard", icon: <Moon className="w-4 h-4 text-slate-300" /> },
        { id: "light", label: "Light Studio", icon: <Sun className="w-4 h-4 text-amber-400" /> },
    ]

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-700/50 bg-neutral-900/60 backdrop-blur-md text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors shadow-sm"
                title="Atmosfera de Tema"
            >
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span className="capitalize hidden sm:inline">{theme}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-neutral-700/60 bg-neutral-900/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-400 font-semibold border-b border-neutral-800 mb-1">
                        Atmosfera da Mesa
                    </div>
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => {
                                setTheme(t.id)
                                setIsOpen(false)
                            }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                theme === t.id
                                    ? "bg-purple-600/20 text-purple-300 font-medium border border-purple-500/30"
                                    : "text-neutral-300 hover:bg-neutral-800/80"
                            }`}
                        >
                            {t.icon}
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
