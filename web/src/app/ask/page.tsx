'use client';

import { useRef, useState } from 'react';
import { ChatBubble } from '@/components/chat-bubble';
import { ask } from '@/lib/api/endpoints';
import { RequireAuth } from '@/lib/auth/require-auth';
import type { ChatMessage } from '@/lib/chat-message';
import { usePlaceCache } from '@/lib/place-cache';
import { useGeolocation } from '@/lib/use-geolocation';

function AskChat() {
  const geo = useGeolocation();
  const placeCache = usePlaceCache();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const idRef = useRef(0);
  const nextId = () => String(idRef.current++);

  const sendQuery = async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query || isSending) return;

    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', text: query },
      { id: nextId(), role: 'assistant', text: '', isLoading: true },
    ]);
    setIsSending(true);

    const replaceLoading = (message: ChatMessage) =>
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = message;
        return next;
      });

    if (geo.status !== 'ready' || !geo.coords) {
      replaceLoading({
        id: nextId(),
        role: 'assistant',
        text:
          geo.errorMessage ??
          'Precisamos da sua localização para responder. Habilite o acesso e tente novamente.',
        isError: true,
      });
      setIsSending(false);
      return;
    }

    try {
      const result = await ask(query, geo.coords.lat, geo.coords.lng);
      placeCache.put(result.results.data);
      replaceLoading({
        id: nextId(),
        role: 'assistant',
        text: result.answer,
        results: result.results.data,
      });
    } catch {
      replaceLoading({
        id: nextId(),
        role: 'assistant',
        text: 'Não foi possível buscar agora. Verifique sua conexão e tente novamente.',
        isError: true,
      });
    }

    setIsSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div>
        <span className="w-fit rounded-full bg-surface-dim px-3 py-1 text-xs font-semibold text-primary">
          Busca por IA
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          Pergunte ao ask.me
        </h1>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto rounded-[20px] bg-white/90 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-foreground/70">
            <p className="font-semibold">Pergunte algo como:</p>
            <p className="max-w-xs italic">
              &quot;onde tem sushi aberto agora perto de mim e que aceite
              pet&quot;
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>

      <form
        className="mt-4 flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          sendQuery(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isSending}
          placeholder="Ex: farmácia 24h perto de mim"
          className="flex-1 rounded-full bg-surface-dim px-5 py-3 outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="rounded-full bg-gradient-to-br from-primary to-[#a855f7] px-6 py-3 font-bold text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

export default function AskPage() {
  return (
    <RequireAuth>
      <AskChat />
    </RequireAuth>
  );
}
