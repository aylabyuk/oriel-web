import { useCallback, useEffect, useMemo, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
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
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { useGameController } from '@/hooks/useGameController';
import { useDialogue } from '@/hooks/useDialogue';
import { useTranslation } from '@/hooks/useTranslation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToolbar } from '@/hooks/useToolbar';
import { useCardFlow } from '@/hooks/useCardFlow';
import { TRACK } from '@/services/analytics';
import { cn } from '@/utils/cn';
import {
  playGather,
  playUnoShout,
  playDramaticHit,
  playVictory,
  playDefeat,
} from '@/utils/sounds';

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
  const { dialogues, history, requestPersonalInfo } =
    useDialogue(dealingComplete);
  const { t } = useTranslation();

  // --- Analytics ---
  const [sceneReady, setSceneReady] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [disclaimerAcked, setDisclaimerAcked] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const { trackEvent } = useAnalytics({
    consentGiven: analyticsConsent,
    disclaimerAcked,
  });

  // --- Toolbar toggles ---
  const toolbar = useToolbar(trackEvent);

  // --- Draw + Wild card flows ---
  const cardFlow = useCardFlow({
    playCard,
    drawCard,
    passAfterDraw,
    cancelVisitorTimer,
    trackEvent,
  });

  // --- Onboarding callbacks ---
  const enteredVisitorName = useAppSelector(selectVisitorName);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleDealingComplete = useCallback(() => setDealingComplete(true), []);
  const handleWelcomeExited = useCallback(() => setWelcomeDismissed(true), []);
  const handleDisclaimerAck = useCallback(() => {
    setDisclaimerAcked(true);
    trackEvent(TRACK.DISCLAIMER_ACKNOWLEDGED);
  }, [trackEvent]);

  // --- Play again / restart ---
  const [challengeReady, setChallengeReady] = useState(false);

  const handlePlayAgain = useCallback(() => {
    toolbar.dismissRestartConfirm();
    cardFlow.reset();
    setChallengeReady(false);
    setDealingComplete(false);
    playGather();
    restartGame();
    trackEvent(TRACK.PLAY_AGAIN);
  }, [toolbar, cardFlow, restartGame, trackEvent]);

  // --- Game end ---
  const gameEnded = snapshot?.phase === 'ended';
  const endInfo = useMemo(
    () => (gameEnded ? getGameEndInfo() : null),
    [gameEnded, getGameEndInfo],
  );
  const isVisitorWinner = endInfo?.winner === snapshot?.players[0]?.name;

  useEffect(() => {
    if (!gameEnded) return;
    if (isVisitorWinner) playVictory();
    else playDefeat();
  }, [gameEnded, isVisitorWinner]);

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
    playUnoShout();
    callUno(visitorName);
  }, [visitorName, callUno, cancelVisitorTimer]);

  // --- WD4 Challenge flow ---
  const handleChallengeReady = useCallback(() => {
    const pending = snapshot?.pendingChallenge;
    if (!pending) return;
    const visitorName = snapshot?.players[0]?.name;
    if (pending.victimName === visitorName) {
      playDramaticHit();
      setChallengeReady(true);
    } else {
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
          onDrawCard={cardFlow.handleDrawCard}
          onAnimationIdle={cardFlow.handleAnimationIdle}
          onDealingComplete={handleDealingComplete}
          onWildCardPlayed={cardFlow.handleWildCardPlayed}
          onSceneReady={handleSceneReady}
          onChallengeReady={handleChallengeReady}
          entranceEnabled={welcomeDismissed}
          dealingEnabled={disclaimerAcked}
          freeLook={toolbar.freeLook}
          deckEnabled={
            !cardFlow.drawPending &&
            cardFlow.drawChoice === null &&
            !challengeReady
          }
          playableOverride={
            cardFlow.drawChoice
              ? [cardFlow.drawChoice.cardId]
              : cardFlow.drawnWildCardId
                ? [cardFlow.drawnWildCardId]
                : undefined
          }
          onDrawCardClicked={
            cardFlow.drawChoice ? cardFlow.handleDrawCardClicked : undefined
          }
          dialogues={dialogues}
        />
      </div>
      <DisclaimerModal
        open={welcomeDismissed && !disclaimerAcked}
        visitorName={enteredVisitorName}
        analyticsConsent={analyticsConsent}
        onConsentChange={setAnalyticsConsent}
        onAcknowledge={handleDisclaimerAck}
      />
      <DrawChoiceModal
        open={cardFlow.drawChoice !== null}
        onPlay={cardFlow.handleDrawPlay}
        onSkip={cardFlow.handleDrawSkip}
      />
      <WildColorPicker
        open={cardFlow.pendingWildCardId != null}
        onColorSelect={cardFlow.handleWildColorSelect}
        onDismiss={cardFlow.handleWildDismiss}
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
        open={toolbar.restartConfirmOpen && !gameEnded}
        onConfirm={handlePlayAgain}
        onCancel={toolbar.handleRestartCancel}
      />
      <FreeLookExplainer
        open={toolbar.freeLookExplainerOpen}
        onDismiss={toolbar.handleFreeLookExplainerDismiss}
      />
      <RulesModal open={toolbar.rulesOpen} onClose={toolbar.handleRulesClose} />
      <UnoButton
        mode={unoMode}
        targetName={unoTargetName}
        duration={unoDuration}
        onPress={handleUnoPress}
      />
      {disclaimerAcked && (
        <ChatHistoryPanel
          open={toolbar.chatOpen}
          history={history}
          onRequestInfo={requestPersonalInfo}
        />
      )}
      {disclaimerAcked && (
        <div
          className={cn(
            'fixed top-4 z-70 flex w-80 flex-row items-center justify-evenly',
            'rounded-full bg-neutral-100/70 px-1.5 py-1 backdrop-blur-sm',
            'dark:bg-neutral-900/70',
            'max-lg:portrait:left-1/2 max-lg:portrait:-translate-x-1/2',
            'lg:right-4 landscape:right-4',
          )}
        >
          <ThemeToggle />
          <SoundToggle
            active={toolbar.soundOn}
            onClick={toolbar.handleSoundToggle}
          />
          <MusicToggle
            active={toolbar.musicOn}
            onClick={toolbar.handleMusicToggle}
          />
          <HelpButton onClick={toolbar.handleRulesOpen} />
          <FreeLookToggle
            active={toolbar.freeLook}
            onClick={toolbar.handleFreeLookToggle}
          />
          <RestartButton
            onClick={toolbar.handleRestartClick}
            disabled={!snapshot}
          />
          <ChatToggle
            open={toolbar.chatOpen}
            onClick={toolbar.handleChatToggle}
          />
        </div>
      )}
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
      <InstallPrompt />
      <Analytics />
    </div>
  );
};
