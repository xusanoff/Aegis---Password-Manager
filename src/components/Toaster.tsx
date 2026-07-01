"use client";

import { useEffect, useState } from "react";
import { Check, Info } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  kind: "success" | "info";
}

export function toast(message: string, kind: "success" | "info" = "success") {
  window.dispatchEvent(
    new CustomEvent("aegis-toast", { detail: { message, kind } })
  );
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let counter = 0;
    function onToast(e: Event) {
      const detail = (e as CustomEvent).detail as {
        message: string;
        kind: "success" | "info";
      };
      const id = ++counter;
      setItems((prev) => [...prev, { id, ...detail }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 2200);
    }
    window.addEventListener("aegis-toast", onToast);
    return () => window.removeEventListener("aegis-toast", onToast);
  }, []);

  return (
    <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="animate-fade flex items-center gap-2 rounded-xl border border-line2 bg-panel2 px-4 py-2.5 text-sm text-ink shadow-lg"
        >
          {t.kind === "success" ? (
            <Check size={16} className="text-strong" />
          ) : (
            <Info size={16} className="text-accentInk" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
