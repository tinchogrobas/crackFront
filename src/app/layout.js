import { Inter, Space_Grotesk, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';
import MaintenancePage from '@/components/MaintenancePage';

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

export const metadata = {
  title: 'CRACK® — Pokémon TCG Store',
  description: 'Tu tienda de cartas Pokémon TCG. Singles, Slabs, Sellados, Accesorios y Mystery Packs.',
};

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
