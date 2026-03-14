import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
  serverTimestamp,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import type { SessionDocument } from './types';

const SESSIONS_COLLECTION = 'sessions';

export type FetchSessionsOptions = {
  limitCount?: number;
  since?: Date;
};

export const fetchAllSessions = async (
  options: FetchSessionsOptions = {},
): Promise<SessionDocument[]> => {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not available');

  const constraints: QueryConstraint[] = [];

  if (options.since) {
    constraints.push(
      where('startedAt', '>=', Timestamp.fromDate(options.since)),
    );
  }

  constraints.push(orderBy('startedAt', 'desc'));
  constraints.push(limit(options.limitCount ?? 500));

  const q = query(collection(db, SESSIONS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  // Filter soft-deleted sessions client-side to avoid composite index requirement
  return snapshot.docs
    .map((d) => d.data() as SessionDocument)
    .filter((s) => !s.deletedAt);
};

export const subscribeToSessions = (
  onData: (sessions: SessionDocument[]) => void,
  onError: (error: Error) => void,
  options: FetchSessionsOptions = {},
): Unsubscribe => {
  const db = getFirestoreDb();
  if (!db) {
    onError(new Error('Firestore not available'));
    return () => {};
  }

  const constraints: QueryConstraint[] = [];

  if (options.since) {
    constraints.push(
      where('startedAt', '>=', Timestamp.fromDate(options.since)),
    );
  }

  constraints.push(orderBy('startedAt', 'desc'));
  constraints.push(limit(options.limitCount ?? 500));

  const q = query(collection(db, SESSIONS_COLLECTION), ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs
        .map((d) => d.data() as SessionDocument)
        .filter((s) => !s.deletedAt);
      onData(sessions);
    },
    (err) => {
      onError(err);
    },
  );
};

export const softDeleteSession = async (sessionId: string): Promise<void> => {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not available');

  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId), {
    deletedAt: serverTimestamp(),
  });
};
