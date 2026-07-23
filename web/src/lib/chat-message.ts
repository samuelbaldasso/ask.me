import type { Place } from './types';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  results?: Place[];
  isLoading?: boolean;
  isError?: boolean;
}
