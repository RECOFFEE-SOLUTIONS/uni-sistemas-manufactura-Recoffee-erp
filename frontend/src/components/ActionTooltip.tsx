"use client";

import React from "react";

interface ActionTooltipButtonProps {
  icon: React.ElementType;
  tooltip: string;
  onClick: (e?: React.MouseEvent) => void;
  variant?: "default" | "danger" | "success" | "warning" | "amber" | "blue";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export default function ActionTooltipButton({
  icon: Icon,
  tooltip,
  onClick,
  variant = "default",
  disabled = false,
  className = "",
  type = "button",
}: ActionTooltipButtonProps) {
  const variantStyles = {
    default:
      "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
    danger:
      "text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30",
    success:
      "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
    warning:
      "text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30",
    amber:
      "text-slate-400 hover:text-amber-500 hover:bg-amber-500/10",
    blue:
      "text-slate-400 hover:text-blue-500 hover:bg-blue-500/10",
  };

  return (
    <div className="relative group inline-flex items-center">
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        aria-label={tooltip}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${variantStyles[variant]} ${className}`}
      >
        <Icon className="w-4 h-4 shrink-0" />
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] rounded-md font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-30">
        {tooltip}
      </div>
    </div>
  );
}
