import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectHasEnteredWelcome } from '@/store/slices/visitor';
import { selectMode } from '@/store/slices/theme';
import { selectSnapshot } from '@/store/slices/game';
import { WelcomeScreen } from '@/sections/WelcomeScreen';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { RestartButton } from '@/components/ui/RestartButton';
import { WildColorPicker } from '@/components/ui/WildColorPicker';
import { DrawChoiceModal } from '@/components/ui/DrawChoiceModal';
import { ChallengeModal } from '@/components/ui/ChallengeModal';
import { GameEndOverlay } from '@/components/ui/GameEndOverlay';
import { UnoButton } from '@/components/ui/UnoButton';
import { BackgroundScene } from '@/scenes/BackgroundScene';
import { ChatToggle } from '@/components/ui/ChatToggle';
import { ChatHistoryPanel } from '@/components/ui/ChatHistoryPanel';
import { useGameController } from '@/hooks/useGameController';
import { useDialogue } from '@/hooks/useDialogue';
import type { Color } from 'uno-engine';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);
  const mode = useAppSelector(selectMode);
  const snapshot = useAppSelector(selectSnapshot);
  const { startGame, playCard, drawCard, passAfterDraw, resolveChallenge, tryAutoResolveChallenge, callUno, restartGame, getGameEndInfo, cancelVisitorTimer, devForceEnd, devTrimHand } = useGameController();
  const { dialogues, history } = useDialogue();
  const [chatOpen, setChatOpen] = useState(false);
  const handleChatToggle = useCallback(() => setChatOpen((prev) => !prev), []);
  const [sceneReady, setSceneReady] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);
  const [drawnWildCardId, setDrawnWildCardId] = useState<string | null>(null);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleWelcomeExited = useCallback(() => setWelcomeDismissed(true), []);
  const handleWildCardPlayed = useCallback((cardId: string) => {
    cancelVisitorTimer();
    setPendingWildCardId(cardId);
  }, [cancelVisitorTimer]);
  const handleWildDismiss = useCallback(() => {
    setPendingWildCardId(null);
    setDrawnWildCardId(null);
  }, []);
  const handleWildColorSelect = useCallback((color: Color) => {
    if (pendingWildCardId) playCard(pendingWildCardId, color);
    setPendingWildCardId(null);
    setDrawnWildCardId(null);
  }, [pendingWildCardId, playCard]);

  // --- Draw-choice flow ---
  const pendingDrawRef = useRef<{ cardId: string; isPlayable: boolean; isWild: boolean } | null>(null);
  const [drawPending, setDrawPending] = useState(false);
  const [drawChoice, setDrawChoice] = useState<{ cardId: string; isWild: boolean } | null>(null);

  const handleDrawCard = useCallback(() => {
    const result = drawCard();
    pendingDrawRef.current = result;
    if (result) setDrawPending(true);
  }, [drawCard]);

  const handleAnimationIdle = useCallback(() => {
    const pending = pendingDrawRef.current;
    if (!pending) return;
    pendingDrawRef.current = null;
    setDrawPending(false);
    if (pending.isPlayable) {
      setDrawChoice({ cardId: pending.cardId, isWild: pending.isWild });
    } else {
      passAfterDraw();
    }
  }, [passAfterDraw]);

  const handleDrawPlay = useCallback(() => {
    cancelVisitorTimer();
    if (!drawChoice) return;
    if (drawChoice.isWild) {
      setPendingWildCardId(drawChoice.cardId);
      setDrawnWildCardId(drawChoice.cardId);
    } else {
      playCard(drawChoice.cardId);
    }
    setDrawChoice(null);
  }, [drawChoice, playCard, cancelVisitorTimer]);

  const handleDrawCardClicked = useCallback((_cardId: string) => handleDrawPlay(), [handleDrawPlay]);

  const handleDrawSkip = useCallback(() => {
    setDrawChoice(null);
    passAfterDraw();
  }, [passAfterDraw]);

  // --- Play again / restart ---
  const handlePlayAgain = useCallback(() => {
    setPendingWildCardId(null);
    setDrawnWildCardId(null);
    setDrawChoice(null);
    setDrawPending(false);
    setChallengeReady(false);
    pendingDrawRef.current = null;
    restartGame();
  }, [restartGame]);

  // --- Game end ---
  const gameEnded = snapshot?.phase === 'ended';
  const endInfo = useMemo(() => gameEnded ? getGameEndInfo() : null, [gameEnded, getGameEndInfo]);
  const isVisitorWinner = endInfo?.winner === snapshot?.players[0]?.name;

  // DEV ONLY — Shift+E force end, Shift+W visitor win, Shift+U trim hand to 2. Remove before production.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'E') devForceEnd();
      if (e.shiftKey && e.key === 'W') devForceEnd(snapshot?.players[0]?.name);
      if (e.shiftKey && e.key === 'U') devTrimHand(2);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [devForceEnd, devTrimHand, snapshot]);

  // --- UNO shout / catch flow ---
  const UNO_SHOUT_WINDOW = 2500;
  const CATCH_WINDOW_DISPLAY = 3000;
  const unoCallable = snapshot?.unoCallable ?? null;
  const visitorName = snapshot?.players[0]?.name;
  const unoMode: 'shout' | 'catch' | null = unoCallable
    ? unoCallable.playerName === visitorName
      ? 'shout'
      : 'catch'
    : null;
  const unoDuration = unoMode === 'shout' ? UNO_SHOUT_WINDOW : CATCH_WINDOW_DISPLAY;
  const unoTargetName = unoMode === 'catch' ? unoCallable?.playerName : undefined;

  const handleUnoPress = useCallback(() => {
    cancelVisitorTimer();
    if (!visitorName) return;
    callUno(visitorName);
  }, [visitorName, callUno, cancelVisitorTimer]);

  // --- WD4 Challenge flow ---
  const [challengeReady, setChallengeReady] = useState(false);

  const handleChallengeReady = useCallback(() => {
    const pending = snapshot?.pendingChallenge;
    if (!pending) return;
    // If the victim is the human player, show the modal
    const visitorName = snapshot?.players[0]?.name;
    if (pending.victimName === visitorName) {
      setChallengeReady(true);
    } else {
      // AI victim — auto-decide
      tryAutoResolveChallenge();
    }
  }, [snapshot, tryAutoResolveChallenge]);

  const handleChallengeAccept = useCallback(() => {
    setChallengeReady(false);
    resolveChallenge(true);
  }, [resolveChallenge]);

  const handleChallengeIssue = useCallback(() => {
    setChallengeReady(false);
    resolveChallenge(false);
  }, [resolveChallenge]);

  return (
    <div
      className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-white"
      data-theme={mode}
    >
      <BackgroundScene
        showTable={hasEnteredWelcome}
        onStartGame={startGame}
        onPlayCard={playCard}
        onDrawCard={handleDrawCard}
        onAnimationIdle={handleAnimationIdle}
        onWildCardPlayed={handleWildCardPlayed}
        onSceneReady={handleSceneReady}
        onChallengeReady={handleChallengeReady}
        deckEnabled={!drawPending && drawChoice === null && !challengeReady}
        playableOverride={drawChoice ? [drawChoice.cardId] : drawnWildCardId ? [drawnWildCardId] : undefined}
        onDrawCardClicked={drawChoice ? handleDrawCardClicked : undefined}
        dialogues={dialogues}
      />
      <DrawChoiceModal open={drawChoice !== null} onPlay={handleDrawPlay} onSkip={handleDrawSkip} />
      <WildColorPicker open={pendingWildCardId != null} onColorSelect={handleWildColorSelect} onDismiss={handleWildDismiss} />
      <ChallengeModal
        open={challengeReady}
        blufferName={snapshot?.pendingChallenge?.blufferName ?? ''}
        onAccept={handleChallengeAccept}
        onChallenge={handleChallengeIssue}
      />
      <GameEndOverlay
        open={gameEnded}
        endInfo={endInfo}
        isVisitorWinner={isVisitorWinner}
        onPlayAgain={handlePlayAgain}
      />
      <UnoButton
        mode={unoMode}
        targetName={unoTargetName}
        duration={unoDuration}
        onPress={handleUnoPress}
      />
      <div className="relative z-10">
        <div className="fixed top-4 right-4 z-50 flex items-start gap-2">
          <ThemeToggle />
          <RestartButton onClick={handlePlayAgain} disabled={!snapshot} />
        </div>
        <ChatToggle open={chatOpen} onClick={handleChatToggle} />
        <ChatHistoryPanel open={chatOpen} history={history} />
        {welcomeDismissed ? (
          <div>
            <span className="p-4 text-xs font-medium text-neutral-400">orielvinci.com</span>
          </div>
        ) : (
          <WelcomeScreen
            loading={hasEnteredWelcome}
            exiting={sceneReady}
            onExited={handleWelcomeExited}
          />
        )}
      </div>
    </div>
  );
};
