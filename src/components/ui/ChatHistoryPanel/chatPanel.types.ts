import type { DialogueHistoryEntry } from '@/types/dialogue';

export type Tab = 'chat' | 'about';

export type ChatHistoryPanelProps = {
  open: boolean;
  history: DialogueHistoryEntry[];
  onRequestInfo?: () => void;
};

export type TopicMessage = { text: string; timestamp: number };

export type DiscoveredTopic = {
  topicKey: string;
  label: string;
  messages: TopicMessage[];
  firstSeen: number;
};
