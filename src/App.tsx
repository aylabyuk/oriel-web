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
import { UnoButton } from '@/components/ui/UnoButton';
import { BackgroundScene } from '@/scenes/BackgroundScene';
import { ChatHistoryPanel } from '@/components/ui/ChatHistoryPanel';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { Toolbar } from '@/components/ui/Toolbar';
import { GameModals } from '@/components/ui/GameModals';
import { useGameController } from '@/hooks/useGameController';
import { useDialogue } from '@/hooks/useDialogue';
import { useTranslation } from '@/hooks/useTranslation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToolbar } from '@/hooks/useToolbar';
import { useCardFlow } from '@/hooks/useCardFlow';
import { TRACK } from '@/services/analytics';
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
  });

  // --- Onboarding callbacks ---
  const enteredVisitorName = useAppSelector(selectVisitorName);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleDealingComplete = useCallback(() => {
    setDealingComplete(true);
    trackEvent(TRACK.GAME_STARTED);
  }, [trackEvent]);
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
      <GameModals
        disclaimerOpen={welcomeDismissed && !disclaimerAcked}
        visitorName={enteredVisitorName}
        analyticsConsent={analyticsConsent}
        onConsentChange={setAnalyticsConsent}
        onDisclaimerAck={handleDisclaimerAck}
        drawChoiceOpen={cardFlow.drawChoice !== null}
        onDrawPlay={cardFlow.handleDrawPlay}
        onDrawSkip={cardFlow.handleDrawSkip}
        wildPickerOpen={cardFlow.pendingWildCardId != null}
        onWildColorSelect={cardFlow.handleWildColorSelect}
        onWildDismiss={cardFlow.handleWildDismiss}
        challengeOpen={challengeReady}
        blufferName={snapshot?.pendingChallenge?.blufferName ?? ''}
        onChallengeAccept={handleChallengeAccept}
        onChallengeIssue={handleChallengeIssue}
        gameEnded={gameEnded}
        endInfo={endInfo}
        isVisitorWinner={isVisitorWinner}
        onPlayAgain={handlePlayAgain}
        restartConfirmOpen={toolbar.restartConfirmOpen && !gameEnded}
        onRestartConfirm={handlePlayAgain}
        onRestartCancel={toolbar.handleRestartCancel}
        freeLookExplainerOpen={toolbar.freeLookExplainerOpen}
        onFreeLookExplainerDismiss={toolbar.handleFreeLookExplainerDismiss}
        rulesOpen={toolbar.rulesOpen}
        onRulesClose={toolbar.handleRulesClose}
      />
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
        <Toolbar
          soundOn={toolbar.soundOn}
          onSoundToggle={toolbar.handleSoundToggle}
          musicOn={toolbar.musicOn}
          onMusicToggle={toolbar.handleMusicToggle}
          freeLook={toolbar.freeLook}
          onFreeLookToggle={toolbar.handleFreeLookToggle}
          chatOpen={toolbar.chatOpen}
          onChatToggle={toolbar.handleChatToggle}
          onRulesOpen={toolbar.handleRulesOpen}
          onRestartClick={toolbar.handleRestartClick}
          restartDisabled={!snapshot}
        />
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
