declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Dispara a conversão de inscrição no Google Ads — só quando o gtag.js foi
 * carregado (ver components/google-ads-tag.tsx) e o backend confirma que é
 * o primeiro login do usuário, pra não contar logins recorrentes como
 * novas inscrições.
 */
export function trackSignupConversion(): void {
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL;

  if (!adsId || !label) return;
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'conversion', { send_to: `${adsId}/${label}` });
}
