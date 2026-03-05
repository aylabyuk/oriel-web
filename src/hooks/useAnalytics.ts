import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectVisitorName,
  selectVisitorCompany,
} from '@/store/slices/visitor';
import { selectSnapshot } from '@/store/slices/game';
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
  const snapshot = useAppSelector(selectSnapshot);
  const prevPhaseRef = useRef<string | null>(null);

  // Sync consent to analytics service
  useEffect(() => {
    analytics.setConsent(consentGiven);
  }, [consentGiven]);

  // Initialize session when visitor clicks "Deal Me In"
  useEffect(() => {
    if (!disclaimerAcked || !visitorName) return;

    // Ensure consent is set before initializing (covers same-render-cycle case)
    analytics.setConsent(consentGiven);

    if (consentGiven) {
      analytics.initialize({ name: visitorName, company });
    }
  }, [consentGiven, disclaimerAcked, visitorName, company]);

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
