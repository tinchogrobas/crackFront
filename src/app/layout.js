import { Inter, Space_Grotesk, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';
import MaintenancePage from '@/components/MaintenancePage';
import {
  SITE_URL,
  SITE_NAME,
  BRAND_LEGAL,
  DEFAULT_LOCALE,
  GLOBAL_KEYWORDS,
  DEFAULT_OG_IMAGE,
  SOCIAL,
  CONTACT,
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
    languages: {
      'es-AR': '/',
      'x-default': '/',
    },
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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

    if (!res.ok) return { is_active: true, maintenance_message: '' };
    return res.json();
  } catch {
    // Backend unreachable or timeout → fail open, never falsely block users
    return { is_active: true, maintenance_message: '' };
  }
}

export default async function RootLayout({ children }) {
  const siteConfig = await getSiteConfig();
  const isMaintenance = !siteConfig.is_active;
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable} ${barlowCondensed.variable}`}>
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
            <OrganizationJsonLd />
            <Navbar />
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
          </>
        )}
      </body>
    </html>
  );
}
