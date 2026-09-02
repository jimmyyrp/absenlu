
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrdersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.push('/admin');
  }, [router]);
  return <div className="p-20 text-center text-[8px] font-black uppercase text-slate-200">Menghapus Modul Reservasi...</div>;
}
