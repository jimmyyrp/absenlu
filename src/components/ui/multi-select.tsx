"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MultiSelectOption = {
  label: string;
  value: string | number;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  selected: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Pilih...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const toggle = (val: string | number) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const remove = (val: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== val));
  };

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex h-10 sm:h-12 w-full items-center justify-between rounded-xl sm:rounded-2xl bg-slate-50 border-none shadow-inner px-3 py-2 text-[11px] font-bold uppercase text-left cursor-pointer",
          "hover:bg-slate-100 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-gold/30",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          selected.length === 0 && "text-slate-400"
        )}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selectedLabels.length === 0 ? (
            <span>{placeholder}</span>
          ) : (
            selectedLabels.map((label, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-gold/10 text-gold rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
              >
                {label}
                <span
                  onClick={(e) => remove(selected[i], e)}
                  className="cursor-pointer hover:text-red-500 transition-colors"
                >
                  <X size={10} />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "ml-2 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown - renders inline, no Portal */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-[40vh] overflow-y-auto p-1.5 rounded-xl border-none shadow-5xl bg-white z-[1100]">
          {options.length === 0 ? (
            <p className="text-[10px] text-slate-400 text-center py-4 font-medium">
              Tidak ada opsi
            </p>
          ) : (
            <div className="space-y-0.5">
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left transition-all",
                      isSelected
                        ? "bg-gold/10 text-gold"
                        : "text-navy hover:bg-slate-50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                        isSelected
                          ? "bg-gold border-gold"
                          : "border-slate-200 bg-white"
                      )}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
