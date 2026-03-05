import { useCallback, useEffect, useState } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { TRACK } from '@/services/analytics';
import type { AnalyticsEventType } from '@/services/analytics';
import { setSoundEnabled } from '@/utils/sounds';
import { setMusicEnabled } from '@/utils/music';

type TrackEventFn = (
  type: AnalyticsEventType,
  data?: Record<string, unknown>,
) => void;

export const useToolbar = (trackEvent: TrackEventFn) => {
  // --- Sound ---
  const [soundOn, rawSoundToggle] = usePersistedState('sound', true);
  useEffect(() => setSoundEnabled(soundOn), [soundOn]);
  const handleSoundToggle = useCallback(() => {
    rawSoundToggle();
    trackEvent(TRACK.TOGGLE_SOUND, { enabled: !soundOn });
  }, [rawSoundToggle, soundOn, trackEvent]);

  // --- Music ---
  const [musicOn, rawMusicToggle] = usePersistedState('music', true);
  useEffect(() => setMusicEnabled(musicOn), [musicOn]);
  const handleMusicToggle = useCallback(() => {
    rawMusicToggle();
    trackEvent(TRACK.TOGGLE_MUSIC, { enabled: !musicOn });
  }, [rawMusicToggle, musicOn, trackEvent]);

  // --- Chat ---
  const [chatOpen, rawChatToggle] = usePersistedState('chat', true);
  const handleChatToggle = useCallback(() => {
    rawChatToggle();
    trackEvent(TRACK.TOGGLE_CHAT, { enabled: !chatOpen });
  }, [rawChatToggle, chatOpen, trackEvent]);

  // --- Free Look ---
  const [freeLook, toggleFreeLook] = usePersistedState('freeLook', false);
  const [freeLookExplainerOpen, setFreeLookExplainerOpen] = useState(false);
  const handleFreeLookToggle = useCallback(() => {
    setFreeLookExplainerOpen(!freeLook);
    toggleFreeLook();
    trackEvent(TRACK.TOGGLE_FREE_LOOK, { enabled: !freeLook });
  }, [freeLook, toggleFreeLook, trackEvent]);
  const handleFreeLookExplainerDismiss = useCallback(
    () => setFreeLookExplainerOpen(false),
    [],
  );

  // --- Rules ---
  const [rulesOpen, setRulesOpen] = useState(false);
  const handleRulesOpen = useCallback(() => {
    setRulesOpen(true);
    trackEvent(TRACK.OPEN_RULES);
  }, [trackEvent]);
  const handleRulesClose = useCallback(() => {
    setRulesOpen(false);
    trackEvent(TRACK.CLOSE_RULES);
  }, [trackEvent]);

  // --- Restart confirm ---
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const handleRestartClick = useCallback(() => {
    setRestartConfirmOpen(true);
    trackEvent(TRACK.RESTART_GAME);
  }, [trackEvent]);
  const handleRestartCancel = useCallback(
    () => setRestartConfirmOpen(false),
    [],
  );
  const dismissRestartConfirm = useCallback(
    () => setRestartConfirmOpen(false),
    [],
  );

  return {
    soundOn,
    handleSoundToggle,
    musicOn,
    handleMusicToggle,
    chatOpen,
    handleChatToggle,
    freeLook,
    handleFreeLookToggle,
    freeLookExplainerOpen,
    handleFreeLookExplainerDismiss,
    rulesOpen,
    handleRulesOpen,
    handleRulesClose,
    restartConfirmOpen,
    handleRestartClick,
    handleRestartCancel,
    dismissRestartConfirm,
  };
};
