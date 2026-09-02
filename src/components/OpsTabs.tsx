'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type TabItem = {
  value: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  count?: number;
};

export function OpsTabs({
  items,
  value,
  onChange,
  className,
}: {
  items: readonly TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-1.5 overflow-x-auto no-scrollbar pb-1', className)} role="tablist">
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'flex min-h-9 shrink-0 select-none items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
              active ? 'border-navy bg-navy text-white shadow-sm' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-500',
            )}
          >
            {Icon && <Icon size={14} />}
            {item.label}
            {typeof item.count === 'number' && (
              <span className={cn('ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px]', active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400')}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
