import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, ShieldAlert, KeyRound, RotateCcw, Sparkles } from 'lucide-react';

interface DialLockpickerProps {
  stages?: number;
  tolerance?: number; // Tolerância em graus (ex: 6°)
  maxAttempts?: number;
  fakeSpotsCount?: number; // Quantidade de pinos/pontos falsos por etapa
  onSuccess?: () => void;
  onFail?: () => void;
  title?: string;
  showRestart?: boolean;
}

type Phase = 'positioning' | 'inserted' | 'turning' | 'success' | 'failed';

export const DialLockpicker: React.FC<DialLockpickerProps> = ({
  stages = 3,
  tolerance = 6,
  maxAttempts = 5,
  fakeSpotsCount = 0,
  onSuccess,
  onFail,
  title = "Decodificador de Fechadura Rúnica",
  showRestart = true
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [phase, setPhase] = useState<Phase>('positioning');
  const [needleAngle, setNeedleAngle] = useState(0);
  const [cylinderAngle, setCylinderAngle] = useState(0);
  const [targetAngles, setTargetAngles] = useState<number[]>([]);
  const [fakeAnglesPerStage, setFakeAnglesPerStage] = useState<number[][]>([]);
  const [attemptsRemaining, setAttemptsRemaining] = useState(maxAttempts);
  const [jitterOffset, setJitterOffset] = useState({ x: 0, y: 0, rot: 0 });
  const [isJamming, setIsJamming] = useState(false);
  const [feedbackText, setFeedbackText] = useState("Posicione a agulha no ponto correto");

  const dialRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startDragAngleRef = useRef(0);
  const startCylinderAngleRef = useRef(0);

  // Distância angular circular (0 a 180°)
  const getAngularDistance = useCallback((a: number, b: number) => {
    const diff = Math.abs((a - b + 360) % 360);
    return diff > 180 ? 360 - diff : diff;
  }, []);

  // Inicializar ângulos secretos (reais e falsos) para cada etapa
  const initGame = useCallback(() => {
    const targets: number[] = [];
    const fakesPerStage: number[][] = [];

    for (let i = 0; i < stages; i++) {
      const realTarget = Math.floor(Math.random() * 330) + 15;
      targets.push(realTarget);

      const fakes: number[] = [];
      let attempts = 0;
      while (fakes.length < fakeSpotsCount && attempts < 100) {
        attempts++;
        const candidate = Math.floor(Math.random() * 330) + 15;
        const distToReal = getAngularDistance(candidate, realTarget);
        const distToFakes = fakes.map((f) => getAngularDistance(candidate, f));
        if (distToReal >= 30 && distToFakes.every((d) => d >= 30)) {
          fakes.push(candidate);
        }
      }
      fakesPerStage.push(fakes);
    }

    setTargetAngles(targets);
    setFakeAnglesPerStage(fakesPerStage);
    setCurrentStage(0);
    setPhase('positioning');
    setNeedleAngle(0);
    setCylinderAngle(0);
    setAttemptsRemaining(maxAttempts);
    setIsJamming(false);
    setFeedbackText(
      fakeSpotsCount > 0
        ? "Cuidado com pinos falsos! Apenas 1 ponto destrava a chave."
        : "Gire a agulha até sentir o ponto de estabilidade"
    );
  }, [stages, maxAttempts, fakeSpotsCount, getAngularDistance]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const targetAngle = targetAngles[currentStage] ?? 180;
  const currentFakes = fakeAnglesPerStage[currentStage] || [];

  // Calcular distâncias em relação ao ponto real e aos pontos falsos
  const distReal = getAngularDistance(needleAngle, targetAngle);
  const distFakes = currentFakes.map((f) => getAngularDistance(needleAngle, f));
  // O tremor responde ao ponto mais próximo (seja o verdadeiro ou qualquer um dos falsos)
  const effectiveDistance = Math.min(distReal, ...distFakes);

  // Tremor dinâmico baseado na proximidade do ponto mais próximo
  useEffect(() => {
    if (phase !== 'positioning') {
      setJitterOffset({ x: 0, y: 0, rot: 0 });
      return;
    }

    const normalizedDist = Math.min(effectiveDistance / 40, 1);

    if (normalizedDist < 0.05) {
      setJitterOffset({ x: 0, y: 0, rot: 0 });
      return;
    }

    const interval = setInterval(() => {
      const maxJitterPx = 4 * normalizedDist;
      const maxJitterRot = 3 * normalizedDist;

      setJitterOffset({
        x: (Math.random() - 0.5) * maxJitterPx,
        y: (Math.random() - 0.5) * maxJitterPx,
        rot: (Math.random() - 0.5) * maxJitterRot
      });
    }, 40);

    return () => clearInterval(interval);
  }, [effectiveDistance, phase]);

  // Função auxiliar para calcular o ângulo do evento do mouse/touch em relação ao centro do dial
  const getAngleFromEvent = (e: MouseEvent | TouchEvent) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rad = Math.atan2(clientY - centerY, clientX - centerX);
    let deg = rad * (180 / Math.PI) + 90; // 0° no topo
    if (deg < 0) deg += 360;
    return deg;
  };

  // Handlers para arrastar agulha ou girar chave
  const handlePointerDown = (e: React.PointerEvent) => {
    if (phase === 'success' || phase === 'failed' || isJamming) return;
    isDraggingRef.current = true;
    const angle = getAngleFromEvent(e.nativeEvent);
    
    if (phase === 'positioning') {
      setNeedleAngle(angle);
    } else if (phase === 'inserted') {
      setPhase('turning');
      startDragAngleRef.current = angle;
      startCylinderAngleRef.current = cylinderAngle;
    }
  };

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || isJamming) return;

      const angle = getAngleFromEvent(e);

      if (phase === 'positioning') {
        setNeedleAngle(angle);
      } else if (phase === 'turning' || phase === 'inserted') {
        const delta = angle - startDragAngleRef.current;
        // Ajustar delta para ciclo circular
        let adjustedDelta = delta;
        if (adjustedDelta > 180) adjustedDelta -= 360;
        if (adjustedDelta < -180) adjustedDelta += 360;

        const newCylinderAngle = Math.max(0, Math.min(90, startCylinderAngleRef.current + adjustedDelta));
        setCylinderAngle(newCylinderAngle);

        // Se completou a rotação de 90° (girou a chave até o fim)
        if (newCylinderAngle >= 80) {
          isDraggingRef.current = false;
          verifyTurn();
        }
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      if (phase === 'turning' && cylinderAngle < 80) {
        // Voltar suavemente se não completou o giro
        setCylinderAngle(0);
        setPhase('inserted');
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [phase, cylinderAngle, isJamming, needleAngle]);

  // Ação de Inserir a agulha
  const handleInsertNeedle = () => {
    if (phase !== 'positioning' || isJamming) return;

    const isRealCorrect = distReal <= tolerance;
    const isFakeSpot = distFakes.some((d) => d <= tolerance);

    if (isRealCorrect) {
      // Ponto verdadeiro -> A agulha encaixa no cilindro e permite girar a chave!
      setPhase('inserted');
      setCylinderAngle(0);
      setFeedbackText("Pino verdadeiro encontrado! Agora clique e gire o cilindro como uma chave.");
    } else {
      // Pino falso ou ângulo errado -> NÃO encaixa! Treme e consome durabilidade
      setIsJamming(true);
      const newAttempts = attemptsRemaining - 1;
      setAttemptsRemaining(newAttempts);

      if (isFakeSpot) {
        setFeedbackText("Pino falso! A agulha não encaixa neste ponto.");
      } else {
        setFeedbackText("A agulha não encaixou! O ângulo estava incorreto.");
      }

      if (newAttempts <= 0) {
        setTimeout(() => {
          setIsJamming(false);
          setPhase('failed');
          setFeedbackText("A agulha quebrou! Você falhou em abrir o cofre.");
          onFail?.();
        }, 500);
      } else {
        setTimeout(() => {
          setIsJamming(false);
        }, 500);
      }
    }
  };

  // Ejetar agulha se quiser reposicionar
  const handleRetractNeedle = () => {
    if (phase !== 'inserted' && phase !== 'turning') return;
    setPhase('positioning');
    setCylinderAngle(0);
    setFeedbackText("Agulha solta. Ajuste o ângulo da agulha.");
  };

  // Verificar resultado da rotação da chave
  const verifyTurn = () => {
    // Como a agulha só encaixa no ponto verdadeiro, o giro da chave completa a etapa!
    const nextStage = currentStage + 1;
    if (nextStage >= stages) {
      setPhase('success');
      setFeedbackText("Fechadura Rúnica Destravada com Sucesso!");
      onSuccess?.();
    } else {
      setCurrentStage(nextStage);
      setPhase('positioning');
      setCylinderAngle(0);
      setNeedleAngle(0);
      setFeedbackText(`Pino ${currentStage + 1} liberado! Encontre o próximo ponto.`);
    }
  };

  // Indicador de estabilidade visual (0% longe, 100% no alvo mais próximo)
  const stabilityPercent = Math.max(0, Math.min(100, Math.round(100 - (effectiveDistance / 90) * 100)));

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full select-none font-sans">
      {/* Cabeçalho & Título */}
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-slate-100 tracking-wide">{title}</h2>
        </div>
        {showRestart && (
          <button
            onClick={initGame}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
            title="Reiniciar Minigame"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Indicadores de Estágio (Pinos) & Durabilidade */}
      <div className="w-full flex justify-between items-center mb-6 px-2">
        {/* Pinos do Cofre */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pinos:</span>
          <div className="flex gap-1.5">
            {Array.from({ length: stages }).map((_, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  idx < currentStage
                    ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    : idx === currentStage
                    ? 'bg-amber-500/20 border-amber-400 animate-pulse'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                {idx < currentStage && <Sparkles className="w-2.5 h-2.5 text-slate-950" />}
              </div>
            ))}
          </div>
        </div>

        {/* Tentativas / Durabilidade */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Durabilidade:</span>
          <div className="flex gap-1">
            {Array.from({ length: maxAttempts }).map((_, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-sm transition-all ${
                  idx < attemptsRemaining
                    ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]'
                    : 'bg-slate-800 opacity-40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dial Circular Principal */}
      <div className="relative my-4 flex items-center justify-center">
        <motion.div
          ref={dialRef}
          onPointerDown={handlePointerDown}
          animate={isJamming ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.5 }}
          className={`relative w-72 h-72 rounded-full border-4 border-slate-800 bg-slate-950 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none ${
            phase === 'success' ? 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.3)]' : ''
          }`}
        >
          {/* Marcações Graduadas Rúnicas em Volta do Dial */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 100 100">
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = i * 10;
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 44 * Math.sin(rad);
              const y1 = 50 - 44 * Math.cos(rad);
              const x2 = 50 + (i % 3 === 0 ? 39 : 42) * Math.sin(rad);
              const y2 = 50 - (i % 3 === 0 ? 39 : 42) * Math.cos(rad);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={i % 3 === 0 ? '#fbbf24' : '#94a3b8'}
                  strokeWidth={i % 3 === 0 ? '1' : '0.5'}
                />
              );
            })}
          </svg>

          {/* CILINDRO CENTRAL (Muda de rotação ao girar a chave na Fase 2) */}
          <motion.div
            style={{ rotate: cylinderAngle }}
            transition={{ type: isJamming ? 'spring' : 'tween', stiffness: 300, damping: 20 }}
            className={`relative w-44 h-44 rounded-full border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl flex items-center justify-center ${
              phase === 'inserted' || phase === 'turning' ? 'border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : ''
            }`}
          >
            {/* Ranhura Central do Cilindro */}
            <div className="w-4 h-16 bg-slate-950 rounded-full border border-slate-800 shadow-inner flex flex-col justify-between py-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>

            {/* Iluminação de Encaixe */}
            {(phase === 'inserted' || phase === 'turning') && (
              <div className="absolute inset-0 rounded-full bg-amber-400/5 animate-pulse pointer-events-none" />
            )}
          </motion.div>

          {/* AGULHA / GAZUA (Gira ao redor do dial na Fase 1) */}
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            style={{
              transform: `rotate(${needleAngle + jitterOffset.rot}deg) translate(${jitterOffset.x}px, ${jitterOffset.y}px)`,
              transition: phase === 'positioning' ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            {/* Haste da Agulha */}
            <div className="relative w-full h-full flex justify-center">
              <div
                className={`w-1.5 h-36 origin-bottom rounded-t-full transition-colors duration-200 ${
                  phase === 'inserted' || phase === 'turning'
                    ? 'bg-gradient-to-t from-amber-500 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                    : effectiveDistance <= tolerance
                    ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                    : 'bg-gradient-to-t from-slate-400 to-slate-200 shadow-md'
                }`}
                style={{ marginTop: '12px' }}
              >
                {/* Ponta Fina da Agulha */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-amber-300" />
              </div>
            </div>
          </div>

          {/* Feedback Visual Central em Telas de Vitória / Derrota */}
          {phase === 'success' && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs rounded-full flex flex-col items-center justify-center p-4 text-center">
              <Unlock className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
              <span className="text-emerald-300 font-bold text-sm">COFRE ABERTO!</span>
            </div>
          )}

          {phase === 'failed' && (
            <div className="absolute inset-0 bg-rose-950/85 backdrop-blur-xs rounded-full flex flex-col items-center justify-center p-4 text-center">
              <ShieldAlert className="w-12 h-12 text-rose-400 mb-2 animate-pulse" />
              <span className="text-rose-300 font-bold text-sm">FECHADURA TRAVADA</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Barra de Estabilidade / Sintonia Visual */}
      <div className="w-full mt-2 mb-4 px-2">
        <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
          <span>Estabilidade Tátil:</span>
          <span className={stabilityPercent > 85 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
            {phase === 'positioning' ? `${stabilityPercent}%` : phase === 'inserted' ? 'Encaixada' : 'Girando...'}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-150 ${
              phase === 'inserted' || phase === 'turning'
                ? 'bg-amber-400'
                : stabilityPercent > 85
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                : stabilityPercent > 50
                ? 'bg-amber-500'
                : 'bg-slate-700'
            }`}
            style={{ width: `${phase === 'inserted' || phase === 'turning' ? 100 : stabilityPercent}%` }}
          />
        </div>
      </div>

      {/* Mensagem de Orientações */}
      <div className="w-full text-center py-2 px-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 mb-4 min-h-[38px] flex items-center justify-center">
        {feedbackText}
      </div>

      {/* Botões de Ação */}
      <div className="w-full flex gap-3">
        {phase === 'positioning' && (
          <button
            onClick={handleInsertNeedle}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Inserir Agulha
          </button>
        )}

        {(phase === 'inserted' || phase === 'turning') && (
          <button
            onClick={handleRetractNeedle}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Soltar Agulha
          </button>
        )}

        {(phase === 'success' || phase === 'failed') && showRestart && (
          <button
            onClick={initGame}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Jogar Novamente
          </button>
        )}
      </div>
    </div>
  );
};
