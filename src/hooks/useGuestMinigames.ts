import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseGuestMinigamesOptions {
  channelRef: React.RefObject<any>;
  listenerId?: string;
  username?: string;
  handleSendMessage?: (text: string, isRoll?: boolean) => void;
  chatSoundEnabledRef?: React.RefObject<boolean>;
}

export function useGuestMinigames({
  channelRef,
  listenerId = '',
  username,
  handleSendMessage,
  chatSoundEnabledRef
}: UseGuestMinigamesOptions) {
  // Clicker & Coin Flip Minigame State
  const [isClickerActive, setIsClickerActive] = useState(false);
  const isClickerActiveRef = useRef(isClickerActive);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [clickerConfig, setClickerConfig] = useState<any>(null);
  const clickerConfigRef = useRef<any>(null);
  const [localClicks, setLocalClicks] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [clickEffect, setClickEffect] = useState(false);

  // Coin Flip specific state
  const [coinState, setCoinState] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [coinResultFace, setCoinResultFace] = useState<'heads' | 'tails' | null>(null);
  const [coinCanInteract, setCoinCanInteract] = useState(false);
  const coinSpinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const coinStateRef = useRef<'idle' | 'spinning' | 'result'>('idle');
  const resolveCoinFlipRef = useRef<((forcedResult?: 'heads' | 'tails') => void) | null>(null);
  const forcedCoinResultRef = useRef<'heads' | 'tails' | null>(null);

  // Clicker specific state
  const [clickerPermissions, setClickerPermissions] = useState({
    canSee: true,
    canInteract: true
  });
  const [cooperativeTotalClicks, setCooperativeTotalClicks] = useState(0);

  // Cards specific state
  const [cardState, setCardState] = useState<{ index: number | null; flipped: Record<number, boolean> }>({
    index: null,
    flipped: {}
  });
  const [cardPermissions, setCardPermissions] = useState({
    canSee: true,
    canInteract: true,
    canSeeResult: false
  });

  // Sync refs with state
  useEffect(() => {
    isClickerActiveRef.current = isClickerActive;
  }, [isClickerActive]);

  useEffect(() => {
    clickerConfigRef.current = clickerConfig;
  }, [clickerConfig]);

  const sendClickProgress = useCallback(
    (
      clicks: number,
      coinResult?: string,
      cardResult?: { index: number; card?: { type: string; value: string; title?: string }; imageUrl?: string }
    ) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'minigame_progress',
          payload: { clicks, coinResult, cardResult }
        });
      }
    },
    [channelRef]
  );

  const handleMinigameClick = useCallback(() => {
    if (!isClickerActive || gameOver || !clickerPermissions.canInteract) return;

    const newClicks = localClicks + 1;
    setLocalClicks(newClicks);

    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 100);

    if (chatSoundEnabledRef?.current ?? true) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60 + Math.random() * 20, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80 + Math.random() * 20, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.03);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } catch (e) {}
    }

    sendClickProgress(newClicks);

    const effectiveClicks = clickerConfig?.config?.isCooperative ? Math.max(newClicks, cooperativeTotalClicks) : newClicks;
    if (clickerConfig?.config?.autoClose && effectiveClicks >= (clickerConfig.config.targetClicks || 100)) {
      setGameOver(true);

      // Wait a moment so the user sees the final click (e.g., 100/100) before it starts fading out
      setTimeout(() => {
        setIsFadingOut(true);
        const fadeTime = clickerConfig.config.fadeoutTime !== undefined ? Number(clickerConfig.config.fadeoutTime) : 2;
        setTimeout(() => {
          setIsClickerActive(false);
          setIsFadingOut(false);
        }, fadeTime * 1000);
      }, 500);
    }
  }, [isClickerActive, gameOver, clickerPermissions, localClicks, cooperativeTotalClicks, sendClickProgress, clickerConfig, chatSoundEnabledRef]);

  const handleCardClick = useCallback(
    (index: number) => {
      if (!isClickerActive || gameOver || !cardPermissions.canInteract) return;

      // Prevent double clicking if already selected one
      if (cardState.index !== null) return;

      const cards = clickerConfig?.config?.cards || [];
      const card = cards.length > 0 ? cards[index % cards.length] : null;

      setCardState(prev => ({
        ...prev,
        index,
        flipped: { ...prev.flipped, [index]: true }
      }));

      sendClickProgress(localClicks + 1, undefined, { index, card });

      const initialFace = clickerConfig?.config?.initialFace || 'down';

      if (initialFace === 'down') {
        if (cardPermissions.canSeeResult) {
          handleSendMessage?.(`🃏 virou a carta **${index + 1}** e revelou sua escolha!`);
        } else {
          handleSendMessage?.(`🃏 escolheu a carta **${index + 1}** (secreta)!`);
        }
      } else {
        handleSendMessage?.(`🃏 escolheu a carta **${index + 1}**!`);
      }
    },
    [isClickerActive, gameOver, cardPermissions, cardState.index, clickerConfig, localClicks, sendClickProgress, handleSendMessage]
  );

  const resolveCoinFlip = useCallback(
    (forcedResult?: 'heads' | 'tails') => {
      if (coinSpinTimerRef.current) {
        clearTimeout(coinSpinTimerRef.current);
        coinSpinTimerRef.current = null;
      }
      const forced = forcedResult || forcedCoinResultRef.current;
      forcedCoinResultRef.current = null;
      const predefined = clickerConfig?.config?.predefinedResult;
      const result =
        forced ||
        (predefined === 'heads' || predefined === 'tails' ? predefined : undefined) ||
        (Math.random() > 0.5 ? 'heads' : 'tails');

      const newClicks = localClicks + 1;
      setLocalClicks(newClicks);
      setCoinResultFace(result);
      setCoinState('result');
      coinStateRef.current = 'result';
      sendClickProgress(newClicks, result);
      handleSendMessage?.(`🪙 girou a moeda e tirou **${result === 'heads' ? 'Cara' : 'Coroa'}**!`, true);
    },
    [clickerConfig, localClicks, sendClickProgress, handleSendMessage]
  );

  // Keep refs in sync
  useEffect(() => {
    resolveCoinFlipRef.current = resolveCoinFlip;
  }, [resolveCoinFlip]);

  const handleCoinClick = useCallback(() => {
    if (!isClickerActive || gameOver || !coinCanInteract || coinState !== 'idle') return;

    setCoinState('spinning');
    coinStateRef.current = 'spinning';
    if (channelRef.current) {
      channelRef.current.send({
        type: 'coin_spinning',
        payload: { spinning: true }
      });
    }

    if (coinSpinTimerRef.current) clearTimeout(coinSpinTimerRef.current);
    coinSpinTimerRef.current = setTimeout(() => {
      resolveCoinFlip();
    }, 4000);
  }, [isClickerActive, gameOver, coinCanInteract, coinState, channelRef, resolveCoinFlip]);

  // Incoming minigame payload handler
  const handleMinigamePayload = useCallback(
    (typeOrData: any, payloadArg?: any) => {
      let type: string;
      let payload: any;

      if (typeof typeOrData === 'string') {
        type = typeOrData;
        payload = payloadArg;
      } else if (typeOrData && typeof typeOrData === 'object') {
        type = typeOrData.type;
        payload = typeOrData.payload;
      } else {
        return false;
      }

      if (!type) return false;

      if (type === 'minigame_start') {
        if (!payload) return false;
        if (payload.gameType === 'coin_flip') {
          const permissions = payload.config?.permissions || {};
          const userPerms = permissions[listenerId] || { canSee: true, canInteract: false };

          if (userPerms.canSee) {
            setIsClickerActive(true);
            setIsFadingOut(false);
            setClickerConfig(payload);
            setCoinCanInteract(userPerms.canInteract);
            setCoinState('idle');
            coinStateRef.current = 'idle';
            setCoinResultFace(null);
            setGameOver(false);
            setTimeLeft(payload.config?.timeLimit || 30);
          }
        } else if (payload.gameType === 'cards') {
          const permissions = payload.config?.permissions || {};
          const userPerms = permissions[listenerId] || { canSee: true, canInteract: true, canSeeResult: false };

          if (userPerms.canSee) {
            setIsClickerActive(true);
            setIsFadingOut(false);
            setClickerConfig(payload);
            setCardPermissions(userPerms);
            setCardState({ index: null, flipped: {} });
            setGameOver(false);
            setTimeLeft(payload.config?.timeLimit || 0);
          }
        } else if (payload.gameType === 'dial_lock') {
          const permissions = payload.config?.permissions || {};
          const userPerms = permissions[listenerId] || { canSee: true, canInteract: true };

          if (userPerms.canSee) {
            setIsClickerActive(true);
            setIsFadingOut(false);
            setClickerConfig(payload);
            setClickerPermissions(userPerms);
            setLocalClicks(0);
            setGameOver(false);
          }
        } else {
          const permissions = payload.config?.permissions || {};
          const userPerms = permissions[listenerId] || { canSee: true, canInteract: true };

          if (userPerms.canSee) {
            setIsClickerActive(true);
            setIsFadingOut(false);
            setClickerConfig(payload);
            setClickerPermissions(userPerms);
            setLocalClicks(0);
            setCooperativeTotalClicks(0);
            setGameOver(false);
            setTimeLeft(payload.config?.timeLimit || 30);
          }
        }
        return true;
      }

      if (type === 'cooperative_click_update') {
        const totalClicks = payload?.totalClicks || 0;
        setCooperativeTotalClicks(totalClicks);
        if (clickerConfigRef.current?.config?.isCooperative && clickerConfigRef.current?.config?.autoClose && totalClicks >= (clickerConfigRef.current.config.targetClicks || 100)) {
          setGameOver(true);
          setTimeout(() => {
            setIsFadingOut(true);
            const fadeTime = clickerConfigRef.current.config.fadeoutTime !== undefined ? Number(clickerConfigRef.current.config.fadeoutTime) : 2;
            setTimeout(() => {
              setIsClickerActive(false);
              setIsFadingOut(false);
            }, fadeTime * 1000);
          }, 500);
        }
        return true;
      }

      if (type === 'update_clicker_permissions') {
        const permissions = payload?.config?.permissions || payload?.permissions || {};
        const userPerms = permissions[listenerId];
        if (userPerms) {
          setClickerPermissions(userPerms);
          if (!userPerms.canSee) {
            setIsClickerActive(false);
            setGameOver(true);
          } else {
            setIsClickerActive(true);
            setIsFadingOut(false);
            setGameOver(false);
          }
        }
        return true;
      }

      if (type === 'update_card_permissions') {
        if (clickerConfigRef.current?.gameType === 'cards') {
          const permissions = payload?.config?.permissions || payload?.permissions || {};
          const userPerms = permissions[listenerId];
          if (userPerms) {
            setCardPermissions(userPerms);
            if (payload?.config) {
              setClickerConfig(payload);
            }
            if (!userPerms.canSee) {
              setIsClickerActive(false);
              setGameOver(true);
            } else {
              setIsClickerActive(true);
              setIsFadingOut(false);
              setGameOver(false);
            }
          }
        }
        return true;
      }

      if (type === 'minigame_end') {
        setIsClickerActive(false);
        setGameOver(true);
        setTimeout(() => {
          setGameOver(false);
        }, 3000);
        return true;
      }

      if (type === 'force_coin_result') {
        if (coinStateRef.current === 'spinning') {
          forcedCoinResultRef.current = payload?.result;
        }
        return true;
      }

      return false;
    },
    [listenerId]
  );

  // Timer for clicker minigame
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isClickerActive && !gameOver && timeLeft > 0 && clickerConfig?.gameType !== 'coin_flip') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setTimeout(() => {
              setIsClickerActive(false);
              setGameOver(false);
            }, 3000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isClickerActive, gameOver, timeLeft, clickerConfig]);

  return {
    isClickerActive,
    setIsClickerActive,
    isFadingOut,
    setIsFadingOut,
    clickerConfig,
    setClickerConfig,
    localClicks,
    setLocalClicks,
    timeLeft,
    setTimeLeft,
    gameOver,
    setGameOver,
    clickEffect,
    setClickEffect,
    coinState,
    setCoinState,
    coinResultFace,
    setCoinResultFace,
    coinCanInteract,
    setCoinCanInteract,
    cardState,
    setCardState,
    cardPermissions,
    setCardPermissions,
    clickerPermissions,
    setClickerPermissions,
    cooperativeTotalClicks,
    setCooperativeTotalClicks,
    handleMinigameClick,
    handleCoinClick,
    handleCardClick,
    sendClickProgress,
    handleMinigamePayload
  };
}
