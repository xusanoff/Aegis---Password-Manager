"use client";

import { Suspense } from "react";
import { Wand2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Generator } from "@/components/Generator";

function GeneratorView() {
  return (
    <AppShell active="generator">
      <div className="mx-auto max-w-[480px] px-6 py-8">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accentDim text-accentInk">
            <Wand2 size={18} />
          </div>
          <div>
            <h1 className="text-[17px] font-medium text-ink">
              Password generator
            </h1>
            <p className="text-[12px] text-faint">
              Cryptographically random, generated on your device
            </p>
          </div>
        </div>
        <Generator />
      </div>
    </AppShell>
  );
}

export default function GeneratorPage() {
  return (
    <Suspense fallback={null}>
      <GeneratorView />
    </Suspense>
  );
}
