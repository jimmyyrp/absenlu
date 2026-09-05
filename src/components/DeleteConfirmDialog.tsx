'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

/**
 * Reusable Delete Confirmation Dialog - Blu Decor Padang
 * Consistent delete confirmation across all admin and public pages.
 * Dual confirm: step 1 confirms intent, step 2 activates the red button.
 */

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Pindahkan ke Sampah?",
  description = "Data akan disembunyikan. Retensi 7 hari aktif.",
  confirmText = "BUANG"
}: DeleteConfirmDialogProps) {
  const [armed, setArmed] = useState(false);
  const handleOpenChange = (o: boolean) => {
    if (!o) setArmed(false);
    onOpenChange(o);
  };
  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="rounded-[2.5rem] border-none p-10 bg-white shadow-4xl text-center w-[92vw] max-sm:max-w-sm">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[1.8rem] flex items-center justify-center mx-auto mb-4">
          <Trash2 size={32} />
        </div>
        <AlertDialogTitle className="text-base font-headline text-navy uppercase font-bold">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-[10px] text-slate-400 uppercase tracking-widest italic mb-6">
          {description}
        </AlertDialogDescription>
        <div className="flex gap-2">
          <AlertDialogCancel className="rounded-xl h-12 text-[10px] font-black bg-slate-50 border-none flex-1">
            BATAL
          </AlertDialogCancel>
          {!armed ? (
            <button
              type="button"
              onClick={() => setArmed(true)}
              className="rounded-xl h-12 flex-1 text-[10px] font-black border border-slate-200 bg-white text-navy shadow-sm active:scale-95 transition-all"
            >
              YA, LANJUTKAN
            </button>
          ) : (
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-red-500 text-white rounded-xl h-12 flex-1 text-[10px] font-black border-none shadow-lg active:scale-95 transition-all"
            >
              {confirmText}
            </AlertDialogAction>
          )}
        </div>
        <p className="text-[8px] text-slate-300 uppercase tracking-widest mt-3">Konfirmasi ganda aktif — dua langkah.</p>
      </AlertDialogContent>
    </AlertDialog>
  );
}
