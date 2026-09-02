"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  isScrolled?: boolean;
  variant?: 'header' | 'footer';
  appName?: string;
}

export function BluLogo({ isScrolled, variant = 'header', appName = 'BluDecor' }: LogoProps) {
  const isTransparent = variant === 'header' && !isScrolled;

  return (
    <div className={cn(
      "flex items-center gap-3 transition-all duration-300",
      variant === 'footer' ? "flex-col lg:flex-row items-center lg:items-center" : "flex-row"
    )}>
      {/* Visual Logo Icon */}
      <div className={cn(
        "relative w-7 h-7 md:w-8 md:h-8 rounded-lg overflow-hidden shadow-lg transition-all duration-300 shrink-0",
        isTransparent ? "ring-2 ring-white/30" : "ring-1 ring-navy/5"
      )}>
        <img 
          src="/favicon_io/apple-touch-icon.png" 
          alt="BluDecor Icon" 
          width={180} 
          height={180}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col">
        <span className={cn(
          "font-headline font-black uppercase tracking-[0.25em] leading-none transition-all duration-300",
          variant === 'header' 
            ? (isScrolled ? "text-sm md:text-base text-navy" : "text-base md:text-lg text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]") 
            : "text-base md:text-lg text-navy"
        )}>
          {appName}
        </span>
      </div>
    </div>
  );
}