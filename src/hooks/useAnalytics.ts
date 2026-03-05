import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectVisitorName,
  selectVisitorCompany,
} from '@/store/slices/visitor';
import { selectEvents, selectSnapshot } from '@/store/slices/game';
import { analytics } from '@/services/analytics';
import type { AnalyticsEventType } from '@/services/analytics';

type UseAnalyticsOptions = {
  consentGiven: boolean;
  disclaimerAcked: boolean;
};

export const useAnalytics = ({
  consentGiven,
  disclaimerAcked,
}: UseAnalyticsOptions) => {
  const visitorName = useAppSelector(selectVisitorName);
  const company = useAppSelector(selectVisitorCompany);
  const events = useAppSelector(selectEvents);
  const snapshot = useAppSelector(selectSnapshot);
  const prevEventsLengthRef = useRef(0);
  const prevPhaseRef = useRef<string | null>(null);

  // Update consent
  useEffect(() => {
    analytics.setConsent(consentGiven);
  }, [consentGiven]);

  // Initialize session after consent + disclaimer
  useEffect(() => {
    if (consentGiven && disclaimerAcked && visitorName) {
      analytics.initialize({ name: visitorName, company });
    }
  }, [consentGiven, disclaimerAcked, visitorName, company]);

  // Forward new game events from Redux to analytics
  useEffect(() => {
    const newEvents = events.slice(prevEventsLengthRef.current);
    prevEventsLengthRef.current = events.length;

    for (const event of newEvents) {
      analytics.trackEvent(event.type, {
        playerName: event.playerName,
        ...(event.card
          ? {
              cardId: event.card.id,
              cardValue: event.card.value,
              cardColor: event.card.color,
            }
          : {}),
        ...(event.data ?? {}),
      });
    }
  }, [events]);

  // Track game end results
  useEffect(() => {
    const phase = snapshot?.phase ?? null;
    if (
      prevPhaseRef.current !== 'ended' &&
      phase === 'ended' &&
      snapshot?.winner
    ) {
      const visitorPlayerName = snapshot.players[0]?.name ?? '';
      analytics.trackGameEnd(
        snapshot.winner,
        snapshot.score ?? 0,
        visitorPlayerName,
      );
    }
    prevPhaseRef.current = phase;
  }, [snapshot?.phase, snapshot?.winner, snapshot?.score, snapshot?.players]);

  // Flush on visibility change and beforeunload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        analytics.flush();
      }
    };

    const handleBeforeUnload = () => {
      analytics.flush();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      analytics.destroy();
    };
  }, []);

  const trackEvent = (
    type: AnalyticsEventType,
    data?: Record<string, unknown>,
  ) => {
    analytics.trackEvent(type, data);
  };

  return { trackEvent };
};
