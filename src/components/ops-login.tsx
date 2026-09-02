'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, LogIn, Eye, EyeOff } from 'lucide-react';
import { opsLogin, roleLabel, type OpsRole, OPS_ROLE_PASSWORDS } from '@/lib/ops/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function OpsLogin() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Masukkan username dan password.');
      return;
    }
    const role: OpsRole | null = opsLogin(username, password);
    if (role) {
      toast({ title: `Masuk sebagai ${roleLabel(role)}`, description: 'Peran aktif mengikuti role login.' });
      router.replace('/ops');
    } else {
      setError('Username atau password tidak cocok dengan akun OPS.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B2447] flex items-center justify-center p-4 font-body relative overflow-hidden">
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-6">
          <p className="font-headline font-bold text-2xl uppercase tracking-[0.35em] text-gold leading-none">BluDecor</p>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mt-2">Operasional, Aktivitas &amp; Keuangan</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h1 className="text-lg font-headline font-bold text-navy">Masuk ke OPS</h1>
          <p className="text-xs text-slate-400 mt-1 mb-5">Akses internal tim dekorasi · password menentukan peran.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username</Label>
              <div className="relative mt-1.5">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nama kamu"
                  className="pl-9"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</Label>
              <div className="relative mt-1.5">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy"
                  aria-label="tampilkan password"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

            <Button type="submit" className="w-full bg-navy hover:bg-gold text-white h-11">
              <LogIn size={16} /> Masuk
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="mt-4 w-full text-[10px] text-slate-400 hover:text-navy text-left underline underline-offset-2"
          >
            {showHint ? 'Sembunyikan' : 'Demo: lihat password per peran'}
          </button>
          {showHint && (
            <div className="mt-2 rounded-xl bg-slate-50 border border-slate-100 p-3 text-[10px] text-slate-500 space-y-1">
              {(Object.entries(OPS_ROLE_PASSWORDS) as [OpsRole, string][]).map(([role, pw]) => (
                <p key={role} className="flex justify-between">
                  <span className="font-black uppercase tracking-widest text-slate-400">{roleLabel(role)}</span>
                  <code className="font-mono text-navy">{pw}</code>
                </p>
              ))}
              <p className="text-slate-400 pt-1">Role mengubah menu &amp; akses di dalam OPS.</p>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-white/30 mt-4">© {new Date().getFullYear()} BluDecor · Internal Use Only</p>
      </div>
    </div>
  );
}