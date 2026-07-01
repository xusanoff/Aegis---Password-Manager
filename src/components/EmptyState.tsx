"use client";

import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-panel text-accentInk">
        {icon}
      </div>
      <h3 className="text-[16px] font-medium text-ink">{title}</h3>
      <p className="mt-1.5 max-w-[320px] text-[13px] leading-relaxed text-dim">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
