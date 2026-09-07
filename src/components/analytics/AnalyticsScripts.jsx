'use client';
/**
 * Carga de tags de terceros + page_view en navegaciones del SPA.
 *
 * Cada tag es independiente: si falta su env var no se inyecta nada. Un deploy
 * sin IDs configurados no carga un solo script de terceros.
 *
 * Todo va con `afterInteractive`. Ningún pixel de marketing puede bloquear el
 * render: son scripts de terceros, y en LCP/INP —que Google usa como señal de
 * ranking— pagan caro si entran antes de la hidratación.
 */

import { Suspense, useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA4_ID, GOOGLE_ADS_ID, GTM_ID, META_PIXEL_ID } from '@/lib/analytics.config';
import { trackPageView } from '@/lib/analytics';

/** El primero que exista define desde qué ID se pide gtag.js; después se configuran todos. */
const GTAG_BOOTSTRAP_ID = GA4_ID || GOOGLE_ADS_ID;

function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // El primer page_view lo manda `gtag('config')` / `fbq('init')`. Sin esta
  // guarda, la home contaría dos veces cada visita.
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const qs = searchParams?.toString();
    trackPageView(`${window.location.origin}${pathname}${qs ? `?${qs}` : ''}`);
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsScripts() {
  return (
    <>
      {GTM_ID ? (
        <>
          <Script id="gtm-loader" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
          {/* Fallback sin JS. GTM lo pide en el manual de instalación y es lo
              que mira el Tag Assistant para dar el contenedor por instalado. */}
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="gtm"
            />
          </noscript>
        </>
      ) : null}

      {GTAG_BOOTSTRAP_ID ? (
        <>
          <Script
            id="gtag-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_BOOTSTRAP_ID}`}
          />
          <Script id="gtag-config" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
${
  GA4_ID
    ? // El page_view inicial lo manda este config; los de cada navegación
      // posterior los manda RouteChangeTracker, que por eso saltea el primero.
      `gtag('config', '${GA4_ID}', { send_page_view: true, currency: 'ARS', country: 'AR' });`
    : ''
}
${
  GOOGLE_ADS_ID
    ? // allow_enhanced_conversions habilita el user_data que manda setUserData()
      // en la compra: recupera conversiones que la cookie sola pierde.
      `gtag('config', '${GOOGLE_ADS_ID}', { allow_enhanced_conversions: true });`
    : ''
}`}
          </Script>
        </>
      ) : null}

      {META_PIXEL_ID ? (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              alt=""
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      {/* useSearchParams obliga a un límite de Suspense; sin él toda la ruta
          cae a render dinámico y se pierde el prerender estático. */}
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>
    </>
  );
}
