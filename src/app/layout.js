import { Inter, Space_Grotesk, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';

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

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable} ${barlowCondensed.variable}`}>
      <body className="bg-[#FAFAF7] text-[#1A1A1A] antialiased font-[family-name:var(--font-inter)]">
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
      </body>
    </html>
  );
}
