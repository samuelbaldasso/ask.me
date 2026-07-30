import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/lib/chat-message';
import { PlaceCard } from './place-card';
import { TypingIndicator } from './typing-indicator';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'rounded-br-md bg-gradient-to-br from-primary to-[#a855f7] text-white'
            : message.isError
              ? 'rounded-bl-md bg-[#FEE2E2] text-[#171123]'
              : 'rounded-bl-md bg-[#F1EBFF] text-[#171123]'
        }`}
      >
        {message.isLoading ? (
          <TypingIndicator />
        ) : isUser ? (
          <p>{message.text}</p>
        ) : (
          <div className="chat-markdown">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        )}
      </div>

      {message.results && message.results.length > 0 && (
        <div className="flex w-full gap-3 overflow-x-auto pb-2">
          {message.results.map((place) => (
            <div key={place.id} className="w-72 shrink-0">
              <PlaceCard place={place} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
