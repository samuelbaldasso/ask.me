import Script from 'next/script';

/**
 * Carrega o gtag.js do Google Analytics 4 quando NEXT_PUBLIC_GA_MEASUREMENT_ID
 * está configurado. Complementa google-ads-tag.tsx (que só registra
 * conversões de assinatura): este tag mede tráfego geral por origem/mídia,
 * o que permite comparar tráfego pago (Google Ads) x orgânico (busca,
 * direto, social) ao longo do tempo.
 */
export function AnalyticsTag() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
