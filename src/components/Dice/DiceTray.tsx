import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, ShieldAlert, ShieldCheck, X, Sparkles, Skull, RotateCcw, Plus, Minus, Zap } from 'lucide-react';

interface DiceTrayProps {
  onRoll: (resultText: string, isPrivate: boolean) => void;
  onClose?: () => void;
}

interface RollHistoryItem {
  id: number;
  text: string;
  isPrivate: boolean;
  sides: number;
  qty: number;
  modifier: number;
  results: number[];
  total: number;
  isNat20: boolean;
  isNat1: boolean;
  timestamp: string;
}

export const DiceTray: React.FC<DiceTrayProps> = ({ onRoll, onClose }) => {
  const [quantity, setQuantity] = useState<string>('1');
  const [customSides, setCustomSides] = useState<string>('');
  const [modifier, setModifier] = useState<number>(0);
  const [sendToChat, setSendToChat] = useState<boolean>(true);
  const [rollHistory, setRollHistory] = useState<RollHistoryItem[]>([]);
  const [lastRoll, setLastRoll] = useState<RollHistoryItem | null>(null);
  const [activeRollEffect, setActiveRollEffect] = useState<'nat20' | 'nat1' | 'normal' | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const classicDice = [4, 6, 8, 10, 12, 20, 100];

  const triggerRollEffect = (effect: 'nat20' | 'nat1' | 'normal') => {
    setActiveRollEffect(effect);
    setIsRolling(true);
    setTimeout(() => setIsRolling(false), 400);
  };

  const rollDice = (sides: number) => {
    const parsedQty = parseInt(quantity, 10) || 1;
    const qty = Math.max(1, Math.min(100, parsedQty));

    const results: number[] = [];
    const formattedResults: string[] = [];
    let rawTotal = 0;

    let hasNat20 = false;
    let hasNat1 = false;

    for (let i = 0; i < qty; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      results.push(roll);
      rawTotal += roll;

      if (sides === 20) {
        if (roll === 20) {
          hasNat20 = true;
          formattedResults.push(
            `<span class="inline-flex items-center gap-1 font-extrabold text-amber-300 bg-emerald-950/80 border border-amber-400/50 px-1.5 py-0.5 rounded shadow-[0_0_12px_rgba(16,185,129,0.6)] font-mono animate-pulse">✨ 20</span>`
          );
        } else if (roll === 1) {
          hasNat1 = true;
          formattedResults.push(
            `<span class="inline-flex items-center gap-1 font-extrabold text-rose-400 bg-rose-950/80 border border-rose-500/60 px-1.5 py-0.5 rounded shadow-[0_0_12px_rgba(244,63,94,0.6)] font-mono">💀 1</span>`
          );
        } else {
          formattedResults.push(roll.toString());
        }
      } else {
        formattedResults.push(roll.toString());
      }
    }

    const finalTotal = rawTotal + modifier;
    const modifierText = modifier !== 0 ? (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`) : '';

    let resultText = '';
    if (qty === 1) {
      resultText = `🎲 Rolou 1d${sides}${modifierText} e tirou: **${formattedResults[0]}**${modifier !== 0 ? ` (Total: **${finalTotal}**)` : ''}`;
    } else {
      resultText = `🎲 Rolou ${qty}d${sides}${modifierText} [${formattedResults.join(', ')}] = **${finalTotal}**`;
    }

    const isNat20 = sides === 20 && hasNat20;
    const isNat1 = sides === 20 && hasNat1 && !hasNat20;

    const effectType = isNat20 ? 'nat20' : isNat1 ? 'nat1' : 'normal';
    triggerRollEffect(effectType);

    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newRollItem: RollHistoryItem = {
      id: Date.now(),
      text: resultText,
      isPrivate: !sendToChat,
      sides,
      qty,
      modifier,
      results,
      total: finalTotal,
      isNat20,
      isNat1,
      timestamp,
    };

    setLastRoll(newRollItem);
    setRollHistory(prev => [newRollItem, ...prev].slice(0, 30));
    onRoll(resultText, !sendToChat);
  };

  const handleCustomRoll = (e: React.FormEvent) => {
    e.preventDefault();
    const sides = parseInt(customSides, 10);
    if (!isNaN(sides) && sides > 1) {
      rollDice(sides);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.2 }}
      className={`w-88 bg-neutral-900/95 backdrop-blur-xl border rounded-xl shadow-2xl flex flex-col overflow-hidden text-neutral-200 transition-all duration-300 ${
        activeRollEffect === 'nat20'
          ? 'border-amber-400/80 shadow-[0_0_35px_rgba(16,185,129,0.45),0_0_20px_rgba(245,158,11,0.35)] ring-2 ring-emerald-500/50'
          : activeRollEffect === 'nat1'
          ? 'border-rose-600/90 shadow-[0_0_35px_rgba(225,29,72,0.5)] ring-2 ring-rose-500/50 animate-shake'
          : 'border-neutral-700/80 shadow-neutral-950/50'
      }`}
    >
      {/* Inline styles for custom animations */}
      <style jsx global>{`
        @keyframes emeraldGoldAura {
          0%, 100% {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.4), 0 0 35px rgba(245, 158, 11, 0.25);
            border-color: rgba(245, 158, 11, 0.7);
          }
          50% {
            box-shadow: 0 0 35px rgba(245, 158, 11, 0.6), 0 0 50px rgba(16, 185, 129, 0.5);
            border-color: rgba(16, 185, 129, 0.9);
          }
        }

        @keyframes criticalFailurePulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(225, 29, 72, 0.5);
            border-color: rgba(225, 29, 72, 0.8);
          }
          50% {
            box-shadow: 0 0 40px rgba(225, 29, 72, 0.9);
            border-color: rgba(244, 63, 94, 1);
          }
        }

        @keyframes shakeEffect {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px) rotate(-1deg); }
          40% { transform: translateX(5px) rotate(1deg); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        .animate-shake {
          animation: shakeEffect 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .font-cinzel {
          font-family: 'Cinzel', Georgia, serif;
        }

        .font-jetbrains {
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>

      {/* Header with Cinzel Font */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-950/90 border-b border-neutral-800">
        <h3 className="font-cinzel text-sm font-bold tracking-wider uppercase flex items-center gap-2 text-neutral-100">
          <Dices size={18} className={`transition-transform duration-300 ${isRolling ? 'rotate-180 text-amber-400' : 'text-indigo-400'}`} />
          Bandeja de Dados
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800/60 p-1 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Controls Grid */}
        <div className="grid grid-cols-12 gap-2">
          {/* Quantity Input */}
          <div className="col-span-5">
            <label className="font-cinzel text-[11px] font-semibold text-neutral-400 mb-1 block uppercase tracking-wider">
              Qtd Dados
            </label>
            <input
              type="text"
              placeholder="1"
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) {
                  if (val === '') {
                    setQuantity('');
                  } else {
                    const num = parseInt(val, 10);
                    if (num <= 100) setQuantity(num.toString());
                  }
                }
              }}
              className="font-jetbrains w-full bg-neutral-800/90 border border-neutral-700/80 rounded-lg px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Modifier Input */}
          <div className="col-span-4">
            <label className="font-cinzel text-[11px] font-semibold text-neutral-400 mb-1 block uppercase tracking-wider">
              Mod. (+/-)
            </label>
            <div className="flex items-center bg-neutral-800/90 border border-neutral-700/80 rounded-lg overflow-hidden">
              <button
                onClick={() => setModifier(prev => prev - 1)}
                className="px-1.5 py-1 text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition-colors"
              >
                <Minus size={12} />
              </button>
              <input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(parseInt(e.target.value, 10) || 0)}
                className="font-jetbrains w-full bg-transparent text-center text-sm text-neutral-100 focus:outline-none py-1.5"
              />
              <button
                onClick={() => setModifier(prev => prev + 1)}
                className="px-1.5 py-1 text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Public / Private Toggle */}
          <div className="col-span-3 flex flex-col justify-end">
            <button
              onClick={() => setSendToChat(!sendToChat)}
              title={sendToChat ? "Visível para a mesa" : "Visível apenas para você"}
              className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                sendToChat
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              {sendToChat ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              <span className="font-cinzel text-[10px]">{sendToChat ? 'Pub' : 'Priv'}</span>
            </button>
          </div>
        </div>

        {/* Classic Dice Grid with Cinzel Font */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-cinzel text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              Dados Clássicos
            </label>
            {modifier !== 0 && (
              <span className="font-jetbrains text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                Mod: {modifier > 0 ? `+${modifier}` : modifier}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {classicDice.map((sides) => {
              const isD20 = sides === 20;
              return (
                <motion.button
                  key={sides}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => rollDice(sides)}
                  className={`font-cinzel relative py-2 rounded-lg text-xs font-extrabold tracking-wider transition-all border flex items-center justify-center gap-1 shadow-sm ${
                    isD20
                      ? 'bg-gradient-to-br from-indigo-950/80 via-neutral-800 to-amber-950/60 border-amber-500/50 text-amber-300 hover:border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-neutral-800/80 hover:bg-indigo-900/60 border-neutral-700/80 hover:border-indigo-500/80 text-neutral-200 hover:text-white'
                  }`}
                >
                  d{sides}
                  {isD20 && <Sparkles size={11} className="text-amber-400 animate-pulse" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Custom Dice Form */}
        <form onSubmit={handleCustomRoll} className="flex gap-2">
          <div className="flex-1 relative">
            <span className="font-cinzel absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-bold">d</span>
            <input
              type="text"
              placeholder="Outro (ex: 100 Lados)"
              value={customSides}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) {
                  if (val === '') {
                    setCustomSides('');
                  } else {
                    const num = parseInt(val, 10);
                    if (num <= 1000) setCustomSides(num.toString());
                  }
                }
              }}
              className="font-jetbrains w-full bg-neutral-800/90 border border-neutral-700/80 rounded-lg pl-7 pr-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!customSides}
            className="font-cinzel bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md"
          >
            Rolar
          </motion.button>
        </form>

        {/* Featured Showcase for Latest Roll */}
        <AnimatePresence mode="wait">
          {lastRoll && (
            <motion.div
              key={lastRoll.id}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className={`p-3 rounded-xl border relative overflow-hidden transition-all shadow-lg ${
                lastRoll.isNat20
                  ? 'bg-gradient-to-r from-emerald-950/70 via-neutral-900 to-amber-950/70 border-amber-400/80 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                  : lastRoll.isNat1
                  ? 'bg-gradient-to-r from-rose-950/80 via-neutral-900 to-rose-950/80 border-rose-600/90 shadow-[0_0_25px_rgba(225,29,72,0.4)]'
                  : 'bg-neutral-800/60 border-neutral-700/70'
              }`}
            >
              {/* Nat 20 Aura Banner Header */}
              {lastRoll.isNat20 && (
                <div className="flex items-center justify-between mb-1.5 border-b border-amber-500/30 pb-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                    <span className="font-cinzel text-xs font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-yellow-400 tracking-wider">
                      SUCESSO CRÍTICO (NAT 20)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400/80 font-bold">NATURAL 20</span>
                </div>
              )}

              {/* Nat 1 Aura Banner Header */}
              {lastRoll.isNat1 && (
                <div className="flex items-center justify-between mb-1.5 border-b border-rose-500/30 pb-1">
                  <div className="flex items-center gap-1.5">
                    <Skull className="w-4 h-4 text-rose-400 animate-bounce" />
                    <span className="font-cinzel text-xs font-extrabold text-rose-400 uppercase tracking-wider">
                      FALHA CRÍTICA (NAT 1)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400/80 font-bold">DESASTRE!</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-cinzel text-[11px] text-neutral-400 block font-medium">
                    {lastRoll.qty}d{lastRoll.sides} {lastRoll.modifier !== 0 ? `(Mod: ${lastRoll.modifier > 0 ? `+${lastRoll.modifier}` : lastRoll.modifier})` : ''}
                  </span>
                  <div className="font-jetbrains text-xs text-neutral-300 font-mono mt-0.5">
                    Valores: [{lastRoll.results.join(', ')}]
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-cinzel text-[9px] text-neutral-500 uppercase tracking-wider block">Total</span>
                  <span
                    className={`font-jetbrains text-2xl font-black tracking-tight ${
                      lastRoll.isNat20
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-amber-300 to-yellow-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                        : lastRoll.isNat1
                        ? 'text-rose-400 drop-shadow-[0_0_10px_rgba(225,29,72,0.8)]'
                        : 'text-indigo-300'
                    }`}
                  >
                    {lastRoll.total}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roll History Display with JetBrains Mono */}
        {rollHistory.length > 0 && (
          <div className="border-t border-neutral-800/80 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-cinzel text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                Histórico de Rolagens
              </h4>
              <button
                onClick={() => {
                  setRollHistory([]);
                  setLastRoll(null);
                  setActiveRollEffect(null);
                }}
                className="text-[10px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
                title="Limpar histórico"
              >
                <RotateCcw size={10} />
                <span className="font-cinzel">Limpar</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1 stylish-scroll font-jetbrains">
              {rollHistory.map((roll) => (
                <div
                  key={roll.id}
                  className={`p-2.5 border rounded-lg text-xs transition-all ${
                    roll.isNat20
                      ? 'bg-gradient-to-r from-emerald-950/40 via-neutral-900/90 to-amber-950/40 border-amber-400/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : roll.isNat1
                      ? 'bg-gradient-to-r from-rose-950/50 via-neutral-900/90 to-rose-950/50 border-rose-600/60 shadow-[0_0_15px_rgba(225,29,72,0.25)]'
                      : roll.isPrivate
                      ? 'bg-rose-950/20 border-rose-900/30 text-neutral-300'
                      : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-cinzel text-[10px] font-bold tracking-wider text-neutral-400 flex items-center gap-1">
                      {roll.isNat20 && <Sparkles size={11} className="text-amber-400" />}
                      {roll.isNat1 && <Skull size={11} className="text-rose-400" />}
                      {roll.isPrivate ? (
                        <span className="text-rose-400 font-semibold uppercase">Privado</span>
                      ) : (
                        <span className="text-neutral-500 font-medium">Público</span>
                      )}
                    </span>
                    <span className="font-jetbrains text-[10px] text-neutral-500">{roll.timestamp}</span>
                  </div>

                  <div
                    className="font-jetbrains leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: roll.text.replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong class="text-indigo-300 font-bold font-mono">$1</strong>'
                      ),
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

