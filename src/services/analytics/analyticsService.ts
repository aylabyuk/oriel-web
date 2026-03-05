import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  type DocumentReference,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { collectDeviceInfo } from './deviceInfo';
import { fetchGeoLocation } from './geoLocation';
import type { AnalyticsEvent, AnalyticsEventType, SessionFeedback } from './types';

const FLUSH_INTERVAL_MS = 30_000;

export const createAnalyticsService = () => {
  let sessionId: string | null = null;
  let sessionDocRef: DocumentReference | null = null;
  let eventBuffer: AnalyticsEvent[] = [];
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let sessionStartTime = 0;
  let gamesPlayed = 0;
  let gamesWon = 0;
  let totalScore = 0;
  let consentGiven = false;
  let initialized = false;

  const flush = async (): Promise<void> => {
    if (!consentGiven || !sessionDocRef || eventBuffer.length === 0) return;

    const eventsToFlush = [...eventBuffer];
    eventBuffer = [];

    try {
      await updateDoc(sessionDocRef, {
        events: arrayUnion(...eventsToFlush),
        lastActiveAt: serverTimestamp(),
        durationMs: Date.now() - sessionStartTime,
        gamesPlayed,
        gamesWon,
        totalScore,
      });
    } catch {
      // Re-add events on failure so they aren't lost
      eventBuffer = [...eventsToFlush, ...eventBuffer];
    }
  };

  const initialize = async (visitor: {
    name: string;
    company: string;
  }): Promise<void> => {
    if (!consentGiven || initialized) {
      console.warn('[analytics] init skipped — consent:', consentGiven, 'initialized:', initialized);
      return;
    }

    const db = getFirestoreDb();
    if (!db) {
      console.warn('[analytics] init skipped — Firestore DB not available (check env vars)');
      return;
    }

    sessionId = crypto.randomUUID();
    sessionDocRef = doc(db, 'sessions', sessionId);
    sessionStartTime = Date.now();
    initialized = true;

    const device = collectDeviceInfo();

    try {
      await setDoc(sessionDocRef, {
        sessionId,
        visitorName: visitor.name,
        company: visitor.company,
        consentGiven: true,
        device,
        geo: null,
        startedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        durationMs: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        events: [],
        deletedAt: null,
      });
    } catch (err) {
      console.error('[analytics] session write failed:', err);
      initialized = false;
      sessionDocRef = null;
      return;
    }

    // Fetch geo asynchronously — update doc when available
    fetchGeoLocation().then(async (geo) => {
      if (geo && sessionDocRef) {
        try {
          await updateDoc(sessionDocRef, { geo });
        } catch {
          // Geo update failure is non-critical
        }
      }
    });

    // Start periodic flush
    flushTimer = setInterval(() => {
      flush();
    }, FLUSH_INTERVAL_MS);
  };

  const trackEvent = (
    type: AnalyticsEventType,
    data?: Record<string, unknown>,
  ): void => {
    if (!consentGiven || !initialized) return;

    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now() - sessionStartTime,
      ...(data && Object.keys(data).length > 0 ? { data } : {}),
    };

    eventBuffer.push(event);
  };

  const trackGameEnd = (
    winner: string,
    score: number,
    visitorName: string,
  ): void => {
    gamesPlayed += 1;
    if (winner === visitorName) gamesWon += 1;
    totalScore += score;
    flush();
  };

  const submitFeedback = async (
    feedback: SessionFeedback,
  ): Promise<boolean> => {
    if (!consentGiven || !sessionDocRef) return false;
    try {
      await updateDoc(sessionDocRef, { feedback: arrayUnion(feedback) });
      trackEvent('feedback_submitted', {
        rating: feedback.rating,
        hasMessage: feedback.message.length > 0,
        hasEmail: feedback.email.length > 0,
      });
      await flush();
      return true;
    } catch {
      return false;
    }
  };

  const setConsent = (given: boolean): void => {
    consentGiven = given;
  };

  const destroy = (): void => {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    flush();
  };

  return { initialize, trackEvent, trackGameEnd, submitFeedback, flush, setConsent, destroy };
};

export const analytics = createAnalyticsService();
