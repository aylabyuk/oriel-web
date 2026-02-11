import { useCallback, useMemo, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectHasEnteredWelcome,
  selectVisitorName,
} from '@/store/slices/visitor';
import { selectMode } from '@/store/slices/theme';
import { selectSnapshot } from '@/store/slices/game';
import { WelcomeScreen } from '@/sections/WelcomeScreen';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { RestartButton } from '@/components/ui/RestartButton';
import { WildColorPicker } from '@/components/ui/WildColorPicker';
import { DrawChoiceModal } from '@/components/ui/DrawChoiceModal';
import { ChallengeModal } from '@/components/ui/ChallengeModal';
import { GameEndOverlay } from '@/components/ui/GameEndOverlay';
import { DisclaimerModal } from '@/components/ui/DisclaimerModal';
import { FreeLookToggle } from '@/components/ui/FreeLookToggle';
import { UnoButton } from '@/components/ui/UnoButton';
import { BackgroundScene } from '@/scenes/BackgroundScene';
import { ChatToggle } from '@/components/ui/ChatToggle';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { MusicToggle } from '@/components/ui/MusicToggle';
import { ChatHistoryPanel } from '@/components/ui/ChatHistoryPanel';
import { RestartConfirmModal } from '@/components/ui/RestartConfirmModal';
import { FreeLookExplainer } from '@/components/ui/FreeLookExplainer';
import { HelpButton } from '@/components/ui/HelpButton';
import { RulesModal } from '@/components/ui/RulesModal';
import { useGameController } from '@/hooks/useGameController';
import { useDialogue } from '@/hooks/useDialogue';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/utils/cn';
import type { Color } from 'uno-engine';

export const App = () => {
  const hasEnteredWelcome = useAppSelector(selectHasEnteredWelcome);
  const mode = useAppSelector(selectMode);
  const snapshot = useAppSelector(selectSnapshot);
  const {
    startGame,
    playCard,
    drawCard,
    passAfterDraw,
    resolveChallenge,
    tryAutoResolveChallenge,
    callUno,
    restartGame,
    getGameEndInfo,
    cancelVisitorTimer,
  } = useGameController();
  const [dealingComplete, setDealingComplete] = useState(false);
  const { dialogues, history } = useDialogue(dealingComplete);
  const { t } = useTranslation();
  const [chatOpen, setChatOpen] = useState(() => window.innerWidth >= 640);
  const handleChatToggle = useCallback(() => setChatOpen((prev) => !prev), []);
  const [sceneReady, setSceneReady] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [disclaimerAcked, setDisclaimerAcked] = useState(false);
  const [freeLook, setFreeLook] = useState(false);
  const [freeLookExplainerOpen, setFreeLookExplainerOpen] = useState(false);
  const handleFreeLookToggle = useCallback(() => {
    setFreeLook((prev) => {
      if (!prev) setFreeLookExplainerOpen(true);
      else setFreeLookExplainerOpen(false);
      return !prev;
    });
  }, []);
  const handleFreeLookExplainerDismiss = useCallback(() => setFreeLookExplainerOpen(false), []);
  const [soundOn, setSoundOn] = useState(true);
  const handleSoundToggle = useCallback(() => setSoundOn((prev) => !prev), []);
  const [musicOn, setMusicOn] = useState(true);
  const handleMusicToggle = useCallback(() => setMusicOn((prev) => !prev), []);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const handleRestartClick = useCallback(() => setRestartConfirmOpen(true), []);
  const handleRestartCancel = useCallback(() => setRestartConfirmOpen(false), []);
  const [rulesOpen, setRulesOpen] = useState(false);
  const handleRulesOpen = useCallback(() => setRulesOpen(true), []);
  const handleRulesClose = useCallback(() => setRulesOpen(false), []);
  const enteredVisitorName = useAppSelector(selectVisitorName);
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(
    null,
  );
  const [drawnWildCardId, setDrawnWildCardId] = useState<string | null>(null);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleDealingComplete = useCallback(() => setDealingComplete(true), []);
  const handleWelcomeExited = useCallback(() => setWelcomeDismissed(true), []);
  const handleDisclaimerAck = useCallback(() => setDisclaimerAcked(true), []);
  const handleWildCardPlayed = useCallback(
    (cardId: string) => {
      cancelVisitorTimer();
      setPendingWildCardId(cardId);
    },
    [cancelVisitorTimer],
  );
  const handleWildDismiss = useCallback(() => {
    setPendingWildCardId(null);
    setDrawnWildCardId(null);
  }, []);
  const handleWildColorSelect = useCallback(
    (color: Color) => {
      if (pendingWildCardId) playCard(pendingWildCardId, color);
      setPendingWildCardId(null);
      setDrawnWildCardId(null);
    },
    [pendingWildCardId, playCard],
  );

  // --- Draw-choice flow ---
  const pendingDrawRef = useRef<{
    cardId: string;
    isPlayable: boolean;
    isWild: boolean;
  } | null>(null);
  const [drawPending, setDrawPending] = useState(false);
  const [drawChoice, setDrawChoice] = useState<{
    cardId: string;
    isWild: boolean;
  } | null>(null);

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

  const handleDrawCardClicked = useCallback(
    (_cardId: string) => handleDrawPlay(),
    [handleDrawPlay],
  );

  const handleDrawSkip = useCallback(() => {
    setDrawChoice(null);
    passAfterDraw();
  }, [passAfterDraw]);

  // --- Play again / restart ---
  const handlePlayAgain = useCallback(() => {
    setRestartConfirmOpen(false);
    setPendingWildCardId(null);
    setDrawnWildCardId(null);
    setDrawChoice(null);
    setDrawPending(false);
    setChallengeReady(false);
    setDealingComplete(false);
    pendingDrawRef.current = null;
    restartGame();
  }, [restartGame]);

  // --- Game end ---
  const gameEnded = snapshot?.phase === 'ended';
  const endInfo = useMemo(
    () => (gameEnded ? getGameEndInfo() : null),
    [gameEnded, getGameEndInfo],
  );
  const isVisitorWinner = endInfo?.winner === snapshot?.players[0]?.name;

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
  const unoDuration =
    unoMode === 'shout' ? UNO_SHOUT_WINDOW : CATCH_WINDOW_DISPLAY;
  const unoTargetName =
    unoMode === 'catch' ? unoCallable?.playerName : undefined;

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
      <div className="fixed inset-0 z-0">
        <BackgroundScene
          showTable={hasEnteredWelcome}
          onStartGame={startGame}
          onPlayCard={playCard}
          onDrawCard={handleDrawCard}
          onAnimationIdle={handleAnimationIdle}
          onDealingComplete={handleDealingComplete}
          onWildCardPlayed={handleWildCardPlayed}
          onSceneReady={handleSceneReady}
          onChallengeReady={handleChallengeReady}
          entranceEnabled={welcomeDismissed}
          dealingEnabled={disclaimerAcked}
          freeLook={freeLook}
          deckEnabled={!drawPending && drawChoice === null && !challengeReady}
          playableOverride={
            drawChoice
              ? [drawChoice.cardId]
              : drawnWildCardId
                ? [drawnWildCardId]
                : undefined
          }
          onDrawCardClicked={drawChoice ? handleDrawCardClicked : undefined}
          dialogues={dialogues}
        />
      </div>
      <DisclaimerModal
        open={welcomeDismissed && !disclaimerAcked}
        visitorName={enteredVisitorName}
        onAcknowledge={handleDisclaimerAck}
      />
      <DrawChoiceModal
        open={drawChoice !== null}
        onPlay={handleDrawPlay}
        onSkip={handleDrawSkip}
      />
      <WildColorPicker
        open={pendingWildCardId != null}
        onColorSelect={handleWildColorSelect}
        onDismiss={handleWildDismiss}
      />
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
      <RestartConfirmModal
        open={restartConfirmOpen && !gameEnded}
        onConfirm={handlePlayAgain}
        onCancel={handleRestartCancel}
      />
      <FreeLookExplainer
        open={freeLookExplainerOpen}
        onDismiss={handleFreeLookExplainerDismiss}
      />
      <RulesModal open={rulesOpen} onClose={handleRulesClose} />
      <UnoButton
        mode={unoMode}
        targetName={unoTargetName}
        duration={unoDuration}
        onPress={handleUnoPress}
      />
      {/* Floating chat panel — desktop + landscape */}
      {disclaimerAcked && (
        <div className="hidden landscape:block lg:block">
          <ChatHistoryPanel open={chatOpen} history={history} />
        </div>
      )}
      {/* Portrait mobile: chat drawer + toolbar flex container */}
      {disclaimerAcked && (
        <div
          className={cn(
            'fixed inset-x-0 bottom-0 z-70 flex flex-col p-2',
            'lg:hidden landscape:hidden',
            'transition-transform duration-300 ease-out',
            chatOpen ? 'translate-y-0' : 'translate-y-full',
          )}
          style={{ pointerEvents: chatOpen ? 'auto' : 'none' }}
        >
          <ChatHistoryPanel
            open={chatOpen}
            history={history}
            variant="drawer"
          />
          {/* Separator */}
          <div className="h-px w-full bg-neutral-400/40" />
          {/* Toolbar */}
          <div className="flex flex-row items-center justify-center gap-2 p-2">
            <ThemeToggle />
            <SoundToggle active={soundOn} onClick={handleSoundToggle} />
            <MusicToggle active={musicOn} onClick={handleMusicToggle} />
            <HelpButton onClick={handleRulesOpen} />
            <FreeLookToggle active={freeLook} onClick={handleFreeLookToggle} />
            <RestartButton onClick={handleRestartClick} disabled={!snapshot} />
            <ChatToggle open={chatOpen} onClick={handleChatToggle} />
          </div>
        </div>
      )}
      {/* Portrait mobile: standalone toolbar (when chat is closed) */}
      <div
        className={cn(
          'fixed bottom-4 left-1/2 z-70 flex -translate-x-1/2 flex-row items-center gap-2',
          'lg:hidden landscape:hidden',
          chatOpen && 'hidden',
        )}
      >
        <ThemeToggle />
        {disclaimerAcked && (
          <>
            <SoundToggle active={soundOn} onClick={handleSoundToggle} />
            <MusicToggle active={musicOn} onClick={handleMusicToggle} />
            <HelpButton onClick={handleRulesOpen} />
            <FreeLookToggle active={freeLook} onClick={handleFreeLookToggle} />
            <RestartButton onClick={handleRestartClick} disabled={!snapshot} />
            <ChatToggle open={chatOpen} onClick={handleChatToggle} />
          </>
        )}
      </div>
      {/* Desktop + landscape toolbar (pill) */}
      <div
        className={cn(
          'fixed z-70 hidden landscape:flex lg:flex',
          'top-4 right-4 flex-row items-center justify-evenly w-80',
          'rounded-full bg-neutral-100/70 px-1.5 py-1 backdrop-blur-sm',
          'dark:bg-neutral-900/70',
        )}
      >
        <ThemeToggle />
        {disclaimerAcked && (
          <>
            <SoundToggle active={soundOn} onClick={handleSoundToggle} />
            <MusicToggle active={musicOn} onClick={handleMusicToggle} />
            <HelpButton onClick={handleRulesOpen} />
            <FreeLookToggle active={freeLook} onClick={handleFreeLookToggle} />
            <RestartButton onClick={handleRestartClick} disabled={!snapshot} />
            <ChatToggle open={chatOpen} onClick={handleChatToggle} />
          </>
        )}
      </div>
      {welcomeDismissed ? (
        <div>
          <span className="p-4 text-xs font-medium text-neutral-400">
            {t('app.siteUrl')}
          </span>
        </div>
      ) : (
        <WelcomeScreen
          loading={hasEnteredWelcome}
          exiting={sceneReady}
          onExited={handleWelcomeExited}
        />
      )}
    </div>
  );
};
