'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Image, Plus, Trash2, Download, CloudDownload, AlertTriangle } from 'lucide-react';
import { useOps, userFirst } from '@/lib/ops/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader, SectionCard, EmptyState, formatDateTime, ConfirmDialog } from '../ops-ui';
import { useToast } from '@/hooks/use-toast';
import { useSubmitLock } from '@/hooks/use-submit-lock';
import { decorScheduleLocked, decorScheduleLockReason } from '@/lib/ops/reports';
import JSZip from 'jszip';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'foto';
}

export default function DokumentasiPage() {
  const { state, selectedDecor, photosForProject, addPhoto, deletePhoto } = useOps();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<(typeof decorPhotos)[number] | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { locked, run } = useSubmitLock();
  const scheduleLocked = decorScheduleLocked(selectedDecor);
  const scheduleLockReason = decorScheduleLockReason(selectedDecor);

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

  const save = async () => {
    if (!selectedDecor || !preview || decorScheduleLocked(selectedDecor)) return;
    await run(() => {
      addPhoto({ decorId: selectedDecor.id, userId: state.currentUserId, dataUrl: preview, caption: caption.trim() || undefined });
      setPreview('');
      setCaption('');
      toast({ title: 'Foto disimpan' });
    });
  };

  const downloadSingle = (p: (typeof decorPhotos)[number]) => {
    const a = document.createElement('a');
    a.href = p.dataUrl;
    a.download = `${slugify(selectedDecor?.name || 'decor')}-${p.caption ? slugify(p.caption) : p.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Foto diunduh' });
  };

  const downloadAll = async () => {
    if (!selectedDecor || decorPhotos.length === 0) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      decorPhotos.forEach((p, idx) => {
        const name = `${slugify(selectedDecor.name)}-${String(idx + 1).padStart(2, '0')}${p.caption ? '-' + slugify(p.caption) : ''}.jpg`;
        const base64 = (p.dataUrl || '').split(',')[1] || '';
        if (base64) zip.file(name, base64, { base64: true });
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugify(selectedDecor.name)}-dokumentasi.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Semua foto diunduh', description: `${decorPhotos.length} foto dalam satu file ZIP` });
    } catch {
      toast({ title: 'Gagal mengunduh', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Dokumentasi"
        subtitle={selectedDecor ? `Foto & dokumentasi — ${selectedDecor.name}` : 'Pilih decor untuk melihat dokumentasi'}
        action={
          !selectedDecor ? undefined : (
            <div className="flex items-center gap-2">
              {decorPhotos.length > 0 && (
                <Button variant="outline" onClick={downloadAll} disabled={downloading}>
                  <CloudDownload size={15} /> {downloading ? 'Mengunduh...' : 'Unduh Semua'}
                </Button>
              )}
              <Button onClick={() => fileRef.current?.click()} disabled={scheduleLocked} className="bg-navy hover:bg-gold text-white">
                <Plus size={15} /> Tambah Foto
              </Button>
            </div>
          )
        }
      />

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} disabled={scheduleLocked} />

      {scheduleLocked && (
        <SectionCard className="mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-red-600">Upload terkunci</p>
              <p className="text-[10px] text-red-400 mt-0.5">{scheduleLockReason} Dokumentasi tidak dapat diunggah di luar jadwal kerja decor.</p>
            </div>
          </div>
        </SectionCard>
      )}

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
                <Button onClick={save} disabled={locked} className="bg-navy hover:bg-gold text-white">{locked ? 'Menyimpan...' : 'Simpan'}</Button>
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
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {p.dataUrl && (
                    <button
                      onClick={() => downloadSingle(p)}
                      className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
                      aria-label="unduh foto"
                    >
                      <Download size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(p)}
                    className="h-7 w-7 rounded-full bg-black/50 hover:bg-red-600 text-white flex items-center justify-center"
                    aria-label="hapus foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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

      {/* Mobile: floating download all */}
      {selectedDecor && decorPhotos.length > 0 && (
        <div className="md:hidden mt-4">
          <Button variant="outline" className="w-full" onClick={downloadAll} disabled={downloading}>
            <CloudDownload size={15} /> {downloading ? 'Mengunduh...' : 'Unduh Semua Foto'}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Hapus foto ini?"
        description={
          confirmDelete
            ? <>
                Foto <span className="font-semibold text-navy">{confirmDelete.caption || '(tanpa keterangan)'}</span>{' '}
                akan dihapus permanen dari dokumentasi. Tindakan ini tidak dapat dibatalkan.
              </>
            : ''
        }
        confirmText="Ya, Hapus"
        onConfirm={() => {
          if (confirmDelete) {
            deletePhoto(confirmDelete.id);
            setConfirmDelete(null);
            toast({ title: 'Foto dihapus' });
          }
        }}
      />
    </div>
  );
}
