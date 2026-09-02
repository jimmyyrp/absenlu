'use client';

import React from 'react';

import { Eye, Trash2, Edit2, Copy, MoreHorizontal, Check } from 'lucide-react';
import { formatViews } from '@/lib/formatters';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Reusable PostCard Component - Blu Decor Padang
 * Used on homepage and can be extended for other listing views.
 * v4: Added bulk select support with checkbox overlay.
 */

type PostCardProps = {
  post: any;
  isAdmin?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onClick?: () => void;
  selected?: boolean;
  selectMode?: boolean;
  onToggleSelect?: () => void;
};

export function PostCard({ post, isAdmin, onDelete, onEdit, onDuplicate, onClick, selected, selectMode, onToggleSelect }: PostCardProps) {
  const handleCardClick = () => {
    if (selectMode && onToggleSelect) {
      onToggleSelect();
      return;
    }
    onClick?.();
  };

  return (
    <div className="group flex flex-col gap-2 relative animate-fade-up">
      <div
        className={cn(
          "aspect-[3/4] relative overflow-hidden rounded-[1.2rem] bg-slate-50 border cursor-pointer shadow-sm group-hover:shadow-xl transition-all duration-500",
          selected ? "border-gold ring-2 ring-gold/30" : "border-slate-50"
        )}
        onClick={handleCardClick}
      >
        <img
          src={post.images?.[0]?.url_images || `https://picsum.photos/seed/blu_${post.id}/800/1000`}
          alt={post.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* Bulk select checkbox */}
        {selectMode && (
          <div className="absolute top-2 left-2 z-40">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all border-2",
                selected
                  ? "bg-gold border-gold text-white shadow-lg"
                  : "bg-white/80 backdrop-blur-md border-white/40 text-navy hover:bg-white"
              )}
            >
              {selected && <Check size={14} strokeWidth={3} />}
            </button>
          </div>
        )}

        {/* Admin dropdown (hidden in select mode) */}
        {isAdmin && !selectMode && (
          <div className="absolute top-2 left-2 z-30">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Opsi karya"
                  className="w-8 h-8 rounded-full bg-navy/80 backdrop-blur-md text-white shadow-xl hover:bg-gold hover:text-navy flex items-center justify-center transition-colors"
                >
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 rounded-2xl border-none shadow-5xl bg-white p-1.5">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="rounded-xl text-[10px] font-bold uppercase tracking-wider text-navy gap-2 py-2.5 cursor-pointer">
                  <Edit2 size={13} className="text-blue-500" /> Sunting
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }} className="rounded-xl text-[10px] font-bold uppercase tracking-wider text-navy gap-2 py-2.5 cursor-pointer">
                    <Copy size={13} className="text-purple-500" /> Salin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="rounded-xl text-[10px] font-bold uppercase tracking-wider text-red-500 gap-2 py-2.5 cursor-pointer focus:text-red-600 focus:bg-red-50">
                  <Trash2 size={13} /> Buang
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="absolute bottom-2 right-2 bg-navy/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-black uppercase tracking-widest border border-white/10 z-10 flex items-center gap-1.5 text-[9px] md:text-[10px]">
          <Eye size={12} /> {formatViews(post.views)}
        </div>
      </div>

      <div className="px-0.5 text-left mt-0.5 space-y-0.5">
        <h3 className={cn(
          "text-[11px] md:text-[13px] font-bold uppercase tracking-wide line-clamp-2 leading-snug transition-colors",
          selected ? "text-gold" : "text-navy group-hover:text-gold"
        )}>
          {post.title}
        </h3>
      </div>
    </div>
  );
}
