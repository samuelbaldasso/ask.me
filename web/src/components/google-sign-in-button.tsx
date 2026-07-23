'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

interface CredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export function GoogleSignInButton() {
  const { signInWithGoogleIdToken } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!scriptLoaded || !clientId || !buttonRef.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => signInWithGoogleIdToken(response.credential),
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
    });
  }, [scriptLoaded, signInWithGoogleIdToken]);

  if (!clientId) {
    return (
      <p className="max-w-sm text-center text-sm text-foreground/60">
        Login com Google não configurado — defina NEXT_PUBLIC_GOOGLE_CLIENT_ID
        em .env.local.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptLoaded(true)}
      />
      <div ref={buttonRef} />
    </>
  );
}
