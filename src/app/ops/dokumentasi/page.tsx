'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Image, Plus, Trash2, X } from 'lucide-react';
import { useOps, userFirst } from '@/lib/ops/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader, SectionCard, EmptyState, formatDateTime } from '../ops-ui';
import { useToast } from '@/hooks/use-toast';

export default function DokumentasiPage() {
  const { state, selectedDecor, photosForProject, addPhoto, deletePhoto } = useOps();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');

  const decorPhotos = useMemo(
    () => (selectedDecor ? photosForProject(selectedDecor.id) : []),
    [selectedDecor, photosForProject],
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!selectedDecor || !preview) return;
    addPhoto({
      decorId: selectedDecor.id,
      userId: state.currentUserId,
      dataUrl: preview,
      caption: caption.trim() || undefined,
    });
    setPreview('');
    setCaption('');
    toast({ title: 'Foto disimpan' });
  };

  return (
    <div>
      <PageHeader
        title="Dokumentasi"
        subtitle={selectedDecor ? `Foto & dokumentasi — ${selectedDecor.name}` : 'Pilih decor untuk melihat dokumentasi'}
        action={
          !selectedDecor ? undefined : (
            <Button onClick={() => fileRef.current?.click()} className="bg-navy hover:bg-gold text-white">
              <Plus size={15} /> Tambah Foto
            </Button>
          )
        }
      />

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />

      {preview && (
        <SectionCard className="mb-4" title="Unggah Foto Baru">
          <div className="flex flex-wrap gap-4 items-start">
            <img src={preview} alt="preview" className="h-40 w-40 object-cover rounded-xl border border-slate-200" />
            <div className="flex-1 min-w-[200px] space-y-3">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Keterangan</Label>
                <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="cth. Backdrop pelaminan" className="mt-1" />
              </div>
              <div className="flex gap-2">
                <Button onClick={save} className="bg-navy hover:bg-gold text-white">Simpan</Button>
                <Button variant="outline" onClick={() => { setPreview(''); setCaption(''); }}>Batal</Button>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {!selectedDecor ? (
        <EmptyState icon={<Image size={20} />} title="Pilih decor terlebih dahulu" sub="Dokumentasi dikelompokkan per project decor." />
      ) : decorPhotos.length === 0 ? (
        <EmptyState icon={<Image size={20} />} title="Belum ada dokumentasi" sub="Unggah foto proses pengerjaan decor ini." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {decorPhotos.map((p) => {
            const user = state.users.find((u) => u.id === p.userId);
            return (
              <div key={p.id} className="group relative bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                {p.dataUrl ? (
                  <img src={p.dataUrl} alt={p.caption || 'foto'} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-slate-100 flex items-center justify-center text-slate-300"><Image size={24} /></div>
                )}
                <button
                  onClick={() => { deletePhoto(p.id); toast({ title: 'Foto dihapus' }); }}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label="hapus foto"
                >
                  <Trash2 size={14} />
                </button>
                <div className="p-2.5">
                  {p.caption && <p className="text-[11px] font-semibold text-navy truncate">{p.caption}</p>}
                  <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <span className={cn("h-3 w-3 rounded-full bg-navy text-white text-[7px] font-bold flex items-center justify-center")}>{userFirst(state, p.userId)}</span>
                    {user?.name.split(' ')[0]} · {formatDateTime(p.at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
