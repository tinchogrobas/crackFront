import { Inter, Space_Grotesk, Barlow_Condensed } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';
import MaintenancePage from '@/components/MaintenancePage';
import AnalyticsScripts from '@/components/analytics/AnalyticsScripts';
import ConsentBanner from '@/components/analytics/ConsentBanner';
import {
  ANALYTICS_ENABLED,
  GA4_ID,
  GOOGLE_ADS_ID,
  GTM_ID,
  META_PIXEL_ID,
  consentBootstrapScript,
} from '@/lib/analytics.config';
import {
  SITE_URL,
  SITE_NAME,
  BRAND_LEGAL,
  DEFAULT_LOCALE,
  GLOBAL_KEYWORDS,
  DEFAULT_OG_IMAGE,
  SOCIAL,
  CONTACT,
  BUSINESS,
} from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-bebas',
  display: 'swap',
});

const DEFAULT_TITLE = `${SITE_NAME} — Cartas Pokémon TCG en Argentina`;
const DEFAULT_DESCRIPTION =
  'Tienda oficial de cartas Pokémon TCG en Argentina. Singles, Slabs certificados PSA/BGS/CGC, sobres sellados, accesorios y Mystery Packs. Envíos a todo el país. Precios en pesos argentinos.';

export const viewport = {
  themeColor: '#1A1A1A',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: GLOBAL_KEYWORDS,
  authors: [{ name: BRAND_LEGAL }],
  creator: BRAND_LEGAL,
  publisher: BRAND_LEGAL,
  category: 'shopping',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: DEFAULT_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Tienda Pokémon TCG Argentina`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/favicon/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon/favicon.ico' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon/favicon.ico',
    apple: [{ url: '/favicon/apple-touch-icon.png', sizes: '180x180' }],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

function OrganizationJsonLd() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${SITE_URL}#organization`,
    name: SITE_NAME,
    legalName: BRAND_LEGAL,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.png`,
    image: DEFAULT_OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    sameAs: Object.values(SOCIAL).filter(Boolean),
    email: CONTACT.email,
    areaServed: { '@type': 'Country', name: CONTACT.country },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AR',
    },
    currenciesAccepted: 'ARS',
    paymentAccepted: 'Mercado Pago, Transferencia, Efectivo, Crypto',
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { '@id': `${SITE_URL}#organization` },
    inLanguage: 'es-AR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/tienda?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  /**
   * Local físico de Saavedra.
   *
   * `OnlineStore` describe la tienda web; esto describe el negocio con dirección
   * y horarios, que es lo que Google necesita para el paquete local (el mapa con
   * las tres fichas arriba de los resultados orgánicos) y para cruzar el sitio
   * con la ficha de Google Business Profile. Los datos tienen que ser idénticos
   * a los de la ficha, si no Google los descarta por inconsistentes.
   */
  const store = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SITE_URL}#store`,
    name: SITE_NAME,
    parentOrganization: { '@id': `${SITE_URL}#organization` },
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    telephone: BUSINESS.telephone,
    email: CONTACT.email,
    priceRange: '$$',
    currenciesAccepted: 'ARS',
    paymentAccepted: 'Mercado Pago, Transferencia, Efectivo, Crypto',
    hasMap: BUSINESS.mapUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.addressLocality,
      addressRegion: BUSINESS.addressRegion,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.latitude,
      longitude: BUSINESS.longitude,
    },
    areaServed: { '@type': 'Country', name: CONTACT.country },
    sameAs: Object.values(SOCIAL).filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(store) }}
      />
    </>
  );
}

/**
 * Fetches site configuration from the backend.
 * On any network error or unexpected response, defaults to is_active: true
 * so the site stays open as a safe fallback (fail-open design).
 */
async function getSiteConfig() {
  const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${BASE_URL}/site-config/`, {
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        is_active: true,
        maintenance_message: '',
        show_top_banner: true,
        top_banner_message: 'Envíos a todo el país — 15% OFF con código CRACK15',
      };
    }
    return res.json();
  } catch {
    // Backend unreachable or timeout → fail open, never falsely block users
    return {
      is_active: true,
      maintenance_message: '',
      show_top_banner: true,
      top_banner_message: 'Envíos a todo el país — 15% OFF con código CRACK15',
    };
  }
}

/**
 * Verifies the admin_bypass cookie against the backend.
 * Returns true only if the token belongs to a staff user.
 * Any failure (missing cookie, network error, non-staff) → false → maintenance stays.
 */
async function isAdminBypassValid() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_bypass')?.value;
  if (!token) return false;

  const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${BASE_URL}/auth/me/`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return false;
    const me = await res.json();
    return Boolean(me?.is_staff);
  } catch {
    return false;
  }
}

export default async function RootLayout({ children }) {
  const siteConfig = await getSiteConfig();
  let isMaintenance = !siteConfig.is_active;
  if (isMaintenance && (await isAdminBypassValid())) {
    isMaintenance = false;
  }
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable} ${barlowCondensed.variable}`}>
      <head>
        {/* hreflang — sitio mono-idioma (es-AR). Se emite manual porque Next.js
            dedup cuando canonical y language apuntan a la misma URL. */}
        <link rel="alternate" hrefLang="es-AR" href={SITE_URL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
        <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />

        {/* Preconnect a los dominios de tags: ahorra el DNS + TLS del primer
            hit y evita que el pixel arrastre el LCP. Condicionados, porque un
            preconnect a un dominio que nunca se pide es un handshake al pedo. */}
        {GTM_ID || GA4_ID || GOOGLE_ADS_ID ? (
          <link rel="preconnect" href="https://www.googletagmanager.com" />
        ) : null}
        {META_PIXEL_ID ? <link rel="preconnect" href="https://connect.facebook.net" /> : null}

        {/* Consent Mode v2 — TIENE que correr antes que cualquier tag. Si los
            defaults llegan después de gtag, Google ya mandó el primer hit sin
            señal de consentimiento y no aplica el modelado de conversiones. */}
        {ANALYTICS_ENABLED ? (
          <script dangerouslySetInnerHTML={{ __html: consentBootstrapScript() }} />
        ) : null}
      </head>
      <body
        className={
          isMaintenance
            ? 'bg-[#1A1A1A] text-white antialiased font-[family-name:var(--font-inter)] overflow-hidden'
            : 'bg-[#FAFAF7] text-[#1A1A1A] antialiased font-[family-name:var(--font-inter)]'
        }
      >
        {isMaintenance ? (
          <MaintenancePage message={siteConfig.maintenance_message} />
        ) : (
          <>
            {/* Los tags de marketing no se cargan en mantenimiento: no hay nada
                que medir y ensuciaría las sesiones del reporte. */}
            <AnalyticsScripts />
            <OrganizationJsonLd />
            <Navbar
              showTopBanner={siteConfig.show_top_banner}
              topBannerMessage={siteConfig.top_banner_message}
            />
            <main className="min-h-screen pt-8">{children}</main>
            <Footer />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 2500,
                style: {
                  background: '#FFFFFF',
                  color: '#1A1A1A',
                  border: '1px solid #E8E4DD',
                  fontSize: '13px',
                  borderRadius: '0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                },
              }}
            />
            <ConsentBanner />
          </>
        )}
      </body>
    </html>
  );
}
