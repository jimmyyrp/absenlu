'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[1.8rem] flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-headline text-navy uppercase font-bold tracking-tight">Terjadi Gangguan Sistem</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
            Silakan coba lagi atau hubungi tim teknisi jika masalah berlanjut.
          </p>
        </div>
        <Button
          onClick={reset}
          className="bg-navy hover:bg-gold text-white rounded-full h-12 px-8 text-[10px] font-black uppercase tracking-[0.3em] shadow-xl border-none transition-all"
        >
          MUAT ULANG
        </Button>
      </div>
    </div>
  );
}
