import React, { useState } from 'react';
import { Dices, ShieldAlert, ShieldCheck } from 'lucide-react';
interface DiceTrayProps {
  onRoll: (resultText: string, isPrivate: boolean) => void;
  onClose?: () => void;
}

export const DiceTray: React.FC<DiceTrayProps> = ({ onRoll, onClose }) => {
  const [quantity, setQuantity] = useState<string>('1');
  const [customSides, setCustomSides] = useState<string>('');
  const [sendToChat, setSendToChat] = useState<boolean>(true);
  const [rollHistory, setRollHistory] = useState<{text: string, isPrivate: boolean, id: number}[]>([]);

  const classicDice = [4, 6, 8, 10, 12, 20, 100];

  const rollDice = (sides: number) => {
    const parsedQty = parseInt(quantity, 10) || 1;
    const qty = Math.max(1, Math.min(100, parsedQty));

    const results: number[] = [];
    const formattedResults: string[] = [];
    let total = 0;

    for (let i = 0; i < qty; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      results.push(roll);
      total += roll;
      
      let formattedRoll = roll.toString();
      if (sides === 20) {
        if (roll === 20) {
          formattedRoll = `<span class="text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">20</span>`;
        } else if (roll === 1) {
          formattedRoll = `<span class="text-rose-500 font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">1</span>`;
        }
      }
      formattedResults.push(formattedRoll);
    }

    let resultText = '';
    if (qty === 1) {
      resultText = `ðŸŽ² Rolou 1d${sides} e tirou: **${formattedResults[0]}**`;
    } else {
      resultText = `ðŸŽ² Rolou ${qty}d${sides} [${formattedResults.join(', ')}] = **${total}**`;
    }

    setRollHistory(prev => [{text: resultText, isPrivate: !sendToChat, id: Date.now()}, ...prev].slice(0, 20));
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
    <div className="w-80 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-neutral-200 animate-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-950 border-b border-neutral-800">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Dices size={16} className="text-indigo-400" />
          Rolagem de Dados
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            âœ•
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-neutral-400 mb-1 block">Quantidade</label>
            <input
              type="text"
              placeholder="Máx: 100"
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
              className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          
          <div className="flex-1 flex flex-col justify-end">
            <button
              onClick={() => setSendToChat(!sendToChat)}
              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors border ${
                sendToChat
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              {sendToChat ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {sendToChat ? 'Público' : 'Privado'}
            </button>
          </div>
        </div>

        {/* Classic Dice Grid */}
        <div>
          <label className="text-xs font-medium text-neutral-400 mb-2 block">Dados Clássicos</label>
          <div className="grid grid-cols-4 gap-2">
            {classicDice.map((sides) => (
              <button
                key={sides}
                onClick={() => rollDice(sides)}
                className="bg-neutral-800 hover:bg-indigo-600 border border-neutral-700 hover:border-indigo-500 text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-1"
              >
                d{sides}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Dice */}
        <form onSubmit={handleCustomRoll} className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">d</span>
            <input
              type="text"
              placeholder="Máx: 100 lados"
              value={customSides}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) {
                  if (val === '') {
                    setCustomSides('');
                  } else {
                    const num = parseInt(val, 10);
                    if (num <= 100) setCustomSides(num.toString());
                  }
                }
              }}
              className="w-full bg-neutral-800 border border-neutral-700 rounded pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!customSides}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
          >
            Rolar
          </button>
        </form>

        {/* Roll History Display */}
        {rollHistory.length > 0 && (
          <div className="mt-4 border-t border-neutral-800 pt-3">
            <h4 className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Histórico de Rolagens</h4>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 stylish-scroll">
              {rollHistory.map((roll) => (
                <div key={roll.id} className={`p-2 border rounded-lg text-sm ${roll.isPrivate ? 'bg-rose-950/20 border-rose-900/30' : 'bg-neutral-800/50 border-neutral-700/50'}`}>
                  {roll.isPrivate && <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider mb-1 block">Privado</span>}
                  <div dangerouslySetInnerHTML={{ __html: roll.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300">$1</strong>') }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
