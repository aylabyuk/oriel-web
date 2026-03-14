import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectSound,
  selectMusic,
  selectFreeLook,
  selectFreeLookExplainerOpen,
  selectChat,
  dismissFreeLookExplainer,
} from '@/store/slices/preferences';
import { TRACK } from '@/services/analytics';
import type { AnalyticsEventType } from '@/services/analytics';
import { setSoundEnabled } from '@/utils/sounds';
import { setMusicEnabled } from '@/utils/music';

type TrackEventFn = (
  type: AnalyticsEventType,
  data?: Record<string, unknown>,
) => void;

export const useToolbar = (trackEvent: TrackEventFn, audioReady: boolean) => {
  const dispatch = useAppDispatch();
  const soundOn = useAppSelector(selectSound);
  const musicOn = useAppSelector(selectMusic);
  const freeLook = useAppSelector(selectFreeLook);
  const freeLookExplainerOpen = useAppSelector(selectFreeLookExplainerOpen);
  const chatOpen = useAppSelector(selectChat);

  // --- Audio side effects ---
  useEffect(() => setSoundEnabled(audioReady && soundOn), [audioReady, soundOn]);
  useEffect(() => setMusicEnabled(audioReady && musicOn), [audioReady, musicOn]);

  // --- Analytics: track preference toggles ---
  // Use a ref for trackEvent so the effects only re-fire when the
  // actual toggle state changes, not when trackEvent's identity changes.
  const mountedRef = useRef(false);
  const trackEventRef = useRef(trackEvent);
  trackEventRef.current = trackEvent;
  useEffect(() => {
    if (!mountedRef.current) return;
    trackEventRef.current(TRACK.TOGGLE_SOUND, { enabled: soundOn });
  }, [soundOn]);
  useEffect(() => {
    if (!mountedRef.current) return;
    trackEventRef.current(TRACK.TOGGLE_MUSIC, { enabled: musicOn });
  }, [musicOn]);
  useEffect(() => {
    if (!mountedRef.current) return;
    trackEventRef.current(TRACK.TOGGLE_CHAT, { enabled: chatOpen });
  }, [chatOpen]);
  useEffect(() => {
    if (!mountedRef.current) return;
    trackEventRef.current(TRACK.TOGGLE_FREE_LOOK, { enabled: freeLook });
  }, [freeLook]);
  // Mark mounted after first render so initial values don't trigger analytics
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // --- Free Look explainer ---
  const handleFreeLookExplainerDismiss = useCallback(
    () => dispatch(dismissFreeLookExplainer()),
    [dispatch],
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
