import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
  type QueryConstraint,
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

  return snapshot.docs.map((doc) => doc.data() as SessionDocument);
};
