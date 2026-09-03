import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/Providers';

/**
 * RootLayout - SERVER COMPONENT (SSR/SEO enabled)
 * All client-side logic moved to ClientProviders component.
 */

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bludecor.id'),
  title: 'BLUDECOR OPS – Operasional, Aktivitas & Keuangan Dekorasi',
  description: 'Sistem operasional internal BluDecor: kelola decor, to-do, kegiatan, absensi, dokumentasi, dan keuangan (omzet, pengeluaran, profit).',
  keywords: 'bludecor ops, sistem operasional dekorasi, manajemen dekorasi, keuangan dekorasi, absensi crew',
  authors: [{ name: 'BluDecor' }],
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  alternates: {
    canonical: 'https://bludecor.id',
  },
  verification: {
    google: ['Iy5VkcUCWoZTEPy9rDiS74suwWeosGr59b4n_gsgz10', 'google9ebfa35b4f681d04', 'dQgWgAtCHpdEvJFkmzUc0mHv_MMga6XfjmRTHO1pg6M', 'CWeZNutdteXJK7LFrBr5uGuMl8Sh_C9hEmlUO1xnwjA'],
  },
  openGraph: {
    type: 'website',
    siteName: 'BluDecor',
    title: 'BluDecor – Arsitek Event Premium',
    description: 'Spesialis dekorasi event premium dan wedding planner di Kota Padang. Estetika bersih, presisi arsitektural.',
    images: ['/favicon_io/apple-touch-icon.png'],
    url: 'https://bludecor.id',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BluDecor – Mewujudkan Momen Arsitektural',
    images: ['/favicon_io/apple-touch-icon.png'],
  },
  icons: {
    icon: '/favicon_io/favicon.ico',
    apple: '/favicon_io/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'BluDecor OPS',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0B2447',
  userScalable: true,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "BluDecor",
  "image": "https://bludecor.id/favicon_io/apple-touch-icon.png",
  "@id": "https://bludecor.id",
  "url": "https://bludecor.id",
  "telephone": "+6281266465639",
  "priceRange": "IDR 5.000.000 - IDR 50.000.000",
  "description": "Jasa dekorasi event premium dan wedding planner terbaik di Kota Padang, Sumatera Barat. Spesialis pernikahan, lamaran, aqiqah, dan party planner dengan presisi arsitektural.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Kota Padang",
    "addressLocality": "Padang",
    "addressRegion": "Sumatera Barat",
    "postalCode": "25000",
    "addressCountry": "ID"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -0.947,
    "longitude": 100.417
  },
  "areaServed": {
    "@type": "State",
    "name": "Sumatera Barat"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Layanan Dekorasi Event Premium",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Dekorasi Pernikahan" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Dekorasi Lamaran" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Dekorasi Aqiqah" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Party Planner" } }
    ]
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "08:00",
    "closes": "22:00"
  },
  "sameAs": [
    "https://instagram.com/bludecor.id",
    "https://www.tiktok.com/@bludecor.id"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <meta name="google-adsense-account" content="ca-pub-1531721070664110" />
        <link rel="icon" href="/favicon_io/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon_io/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} font-body antialiased selection:bg-gold/30 selection:text-navy overflow-x-hidden min-w-[300px]`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}