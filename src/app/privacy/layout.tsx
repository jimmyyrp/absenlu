import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | BluDecor – Protokol Perlindungan Data Klien',
  description: 'Kebijakan privasi BluDecor. Perlindungan data klien, enkripsi SSL, hak kedaulatan data, dan kebijakan cookie untuk layanan dekorasi event premium.',
  keywords: 'kebijakan privasi blu decor, perlindungan data dekorasi padang, privacy policy wedding planner, cookie policy blu decor',
  alternates: {
    canonical: 'https://bludecor.id/privacy',
  },
  openGraph: {
    title: 'Kebijakan Privasi – BluDecor',
    description: 'Protokol perlindungan data dan privasi klien BluDecor.',
    url: 'https://bludecor.id/privacy',
    images: ['/favicon_io/apple-touch-icon.png'],
    siteName: 'BluDecor',
    type: 'website',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
