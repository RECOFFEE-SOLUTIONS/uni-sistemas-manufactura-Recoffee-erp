"use client";

import React from "react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  className?: string;
  label?: string;
}

export default function InfoTooltip({ content, className = "", label }: InfoTooltipProps) {
  return (
    <div className={`relative group inline-flex items-center gap-1 ${className}`}>
      {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
      <button
        type="button"
        aria-label="Información detallada"
        className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-help"
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
      </button>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2.5 bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] leading-relaxed rounded-xl shadow-xl border border-slate-700/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 text-left font-normal">
        {content}
        <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800" />
      </div>
    </div>
  );
}
