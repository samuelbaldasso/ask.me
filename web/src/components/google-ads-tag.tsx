import Script from "next/script";

/**
 * Carrega o gtag.js do Google Ads só quando NEXT_PUBLIC_GOOGLE_ADS_ID está
 * configurado (Vercel > Environment Variables). Sem a variável, não injeta
 * nada — permite mergear isso antes de a tag existir no Google Ads.
 */
export function GoogleAdsTag() {
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

  if (!adsId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${adsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${adsId}');
        `}
      </Script>
    </>
  );
}
