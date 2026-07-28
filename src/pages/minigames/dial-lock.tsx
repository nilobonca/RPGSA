import React, { useState } from 'react';
import Head from 'next/head';
import { DialLockpicker } from '@/components/minigames/DialLockpicker';
import { Sparkles, Trophy, Skull } from 'lucide-react';

export default function DialLockDemoPage() {
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <Head>
        <title>Minigame: Lockpicker de Precisão</title>
      </Head>

      <div className="max-w-xl w-full flex flex-col items-center gap-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Demo Interativa de Minigame
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
            Lockpicking de Precisão & Rotação
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            1. Arraste a agulha ao redor do círculo. A agulha treme menos conforme aproxima do ponto exato.<br />
            2. Clique em <strong>Inserir Agulha</strong>.<br />
            3. Arraste o cilindro central em movimento circular para girar como uma chave!
          </p>
        </div>

        {/* Componente do Minigame */}
        <DialLockpicker
          stages={3}
          tolerance={6}
          maxAttempts={5}
          onSuccess={() => setResultMessage('Parabéns! Você destravou o cofre e pegou o tesouro!')}
          onFail={() => setResultMessage('A gazua quebrou e o cofre permaneceu trancado.')}
        />

        {/* Mensagem de resultado na Demo */}
        {resultMessage && (
          <div className="w-full max-w-md p-4 rounded-xl bg-slate-900 border border-slate-800 text-center flex items-center justify-center gap-3">
            {resultMessage.includes('Parabéns') ? (
              <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            ) : (
              <Skull className="w-6 h-6 text-rose-400" />
            )}
            <span className="text-sm font-medium text-slate-200">{resultMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
