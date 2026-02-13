import { useMemo } from 'react';
import type { DialogueHistoryEntry } from '@/types/dialogue';
import { TOPIC_LABELS } from '@/data/personalInfoTopics';
import type { DiscoveredTopic, TopicMessage } from './chatPanel.types';

export const useDiscoveredTopics = (
  history: DialogueHistoryEntry[],
): DiscoveredTopic[] =>
  useMemo(() => {
    const topicMap = new Map<
      string,
      { messages: TopicMessage[]; firstSeen: number }
    >();

    for (const entry of history) {
      if (entry.kind !== 'dialogue' || !entry.topicKey) continue;
      const existing = topicMap.get(entry.topicKey);
      if (existing) {
        // Avoid duplicate messages (e.g. from game restart replaying same topic)
        if (!existing.messages.some((m) => m.text === entry.message)) {
          existing.messages.push({
            text: entry.message,
            timestamp: entry.timestamp,
          });
        }
      } else {
        topicMap.set(entry.topicKey, {
          messages: [{ text: entry.message, timestamp: entry.timestamp }],
          firstSeen: entry.timestamp,
        });
      }
    }

    return Array.from(topicMap.entries())
      .sort(([, a], [, b]) => a.firstSeen - b.firstSeen)
      .map(([key, data]) => ({
        topicKey: key,
        label: TOPIC_LABELS[key] ?? key,
        messages: data.messages,
        firstSeen: data.firstSeen,
      }));
  }, [history]);
