'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChatBubble } from '@/components/chat-bubble';
import { ApiError } from '@/lib/api/client';
import { ask, getSubscriptionStatus } from '@/lib/api/endpoints';
import { RequireAuth } from '@/lib/auth/require-auth';
import type { ChatMessage } from '@/lib/chat-message';
import { usePlaceCache } from '@/lib/place-cache';
import { useGeolocation } from '@/lib/use-geolocation';

type AccessStatus = 'checking' | 'allowed' | 'denied' | 'error';

/**
 * Busca por IA é benefício exclusivo do plano Premium (ver
 * backend/src/middleware/auth.ts requireActiveSubscription). Checa antes de
 * abrir o chat para não deixar o usuário digitar e só descobrir no meio da
 * conversa que precisa assinar.
 */
function usePremiumAccess(): AccessStatus {
  const [access, setAccess] = useState<AccessStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    getSubscriptionStatus()
      .then((sub) => {
        if (!cancelled) setAccess(sub.status === 'active' ? 'allowed' : 'denied');
      })
      .catch(() => {
        if (!cancelled) setAccess('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return access;
}

function PremiumUpsell() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[28px] bg-white p-8 text-center shadow-[0_10px_30px_rgba(124,58,237,0.08)]">
      <span className="text-5xl" aria-hidden>
        👑
      </span>
      <h1 className="text-xl font-extrabold text-[#171123]">
        Busca por IA é exclusiva do Premium
      </h1>
      <p className="max-w-sm text-sm text-[#171123]/70">
        Pergunte em linguagem natural — &quot;sushi aberto agora que aceite pet&quot; — e deixe
        a IA interpretar sua intenção. Assine para desbloquear.
      </p>
      <Link
        href="/subscription"
        className="mt-2 rounded-2xl bg-gradient-to-br from-primary to-[#a855f7] px-6 py-3 font-bold text-white transition hover:opacity-90"
      >
        Ver planos
      </Link>
    </div>
  );
}

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
    } catch (err) {
      const isSubscriptionRequired = err instanceof ApiError && err.status === 402;
      replaceLoading({
        id: nextId(),
        role: 'assistant',
        text: isSubscriptionRequired
          ? 'Essa busca por IA é exclusiva do plano Premium. Acesse "Assinatura" para desbloquear.'
          : 'Não foi possível buscar agora. Verifique sua conexão e tente novamente.',
        isError: true,
      });
    }

    setIsSending(false);
  };

  const suggestions = [
    'sushi aberto agora perto de mim',
    'farmácia 24h que aceite cartão',
    'parque pet friendly próximo',
  ];

  return (
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col sm:h-[calc(100dvh-11rem)]">
      <div>
        <span className="w-fit rounded-full bg-surface-dim px-3 py-1 text-xs font-semibold text-primary">
          Busca por IA
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Pergunte ao ask.me
        </h1>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto rounded-[20px] bg-white/90 p-4 shadow-[0_6px_16px_rgba(124,58,237,0.06)]">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-[#171123]/70">
            <span className="text-4xl" aria-hidden>
              💬
            </span>
            <p className="font-semibold">Pergunte algo como:</p>
            <div className="flex flex-col gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendQuery(suggestion)}
                  className="rounded-full bg-surface-dim px-4 py-2 text-sm font-medium text-[#3A2E5C] transition hover:bg-surface-dim/70"
                >
                  &quot;{suggestion}&quot;
                </button>
              ))}
            </div>
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
        className="mt-4 flex gap-2 sm:gap-3"
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
          className="min-w-0 flex-1 rounded-full bg-surface-dim px-5 py-3 outline-none ring-primary/40 transition focus:ring-2 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="shrink-0 rounded-full bg-gradient-to-br from-primary to-[#a855f7] px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

function PremiumGate() {
  const access = usePremiumAccess();

  if (access === 'checking') {
    return <p className="py-16 text-center text-foreground/70">Carregando...</p>;
  }

  if (access === 'denied') {
    return (
      <div className="flex justify-center py-6 sm:py-10">
        <PremiumUpsell />
      </div>
    );
  }

  // 'error': falha ao checar assinatura (ex: rede) — não bloqueia o acesso,
  // deixa o próprio /ask responder 402 se de fato não tiver assinatura.
  return <AskChat />;
}

export default function AskPage() {
  return (
    <RequireAuth>
      <PremiumGate />
    </RequireAuth>
  );
}
