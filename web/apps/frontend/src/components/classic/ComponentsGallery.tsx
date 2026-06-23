"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { COMPONENT_IMAGES, CATEGORY_TITLES, type ComponentCategory } from "./componentsManifest";
import { RandBanner } from "./RandBanner";

/** Map of sheet key ("IMG_6171") → individual card crop filenames (under /classic-assets/cards/). */
type CropIndex = Record<string, string[]>;
const MIN_CROPS = 3; // fewer than this → detection unreliable, show the full sheet instead

function PhotoCard({ href, src, label, sub, tall }: { href: string; src: string; label: string; sub?: string; tall?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="block border border-bg-line rounded-sm overflow-hidden hover:border-amber-500/60 transition-colors">
      <img src={src} alt={label} loading="lazy"
        className={`w-full ${tall ? "h-56 object-contain bg-bg-base" : "h-40 object-cover"} bg-bg-panel`} />
      <div className="px-2 py-1.5">
        <p className="font-mono text-[10px] text-zinc-300 leading-snug">{label}</p>
        {sub && <p className="font-mono text-[9px] text-zinc-600">{sub}</p>}
      </div>
    </a>
  );
}

export function ComponentsGallery() {
  const [crops, setCrops] = useState<CropIndex | null>(null);

  useEffect(() => {
    fetch("/classic-assets/cards/index.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setCrops(j))
      .catch(() => setCrops({}));
  }, []);

  const simpleSections: ComponentCategory[] = ["board", "placemat", "chips"];

  return (
    <main className="min-h-screen flex flex-col">
      <RandBanner />
      <div className="px-8 py-6 max-w-6xl mx-auto w-full">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="font-serif text-2xl">
            <span className="text-amber-400">HEDGEMONY</span> — Component Reference
          </h1>
          <a href="/classic/cards" className="font-mono text-[11px] text-amber-400 hover:underline">
            Card Workshop ↗
          </a>
        </div>
        <p className="font-mono text-[11px] text-zinc-500 mb-6">
          Photographs of the physical RAND TL301 components (local reference). Card sheets are
          split into individual cards where detection was clean; the rest show the full sheet.
          Click any image to open it full-size. Type cards into digital form in the Card Workshop.
        </p>

        {simpleSections.map((cat) => {
          const items = COMPONENT_IMAGES.filter((c) => c.category === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat} className="mb-8">
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3 border-b border-bg-line pb-1">
                {CATEGORY_TITLES[cat]} <span className="text-zinc-700">· {items.length}</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((c) => (
                  <PhotoCard key={c.file} href={`/classic-assets/${c.file}`} src={`/classic-assets/${c.file}`} label={c.label} sub={c.file} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Cards — individual where split succeeded, else the full sheet. */}
        <section className="mb-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3 border-b border-bg-line pb-1">
            {CATEGORY_TITLES.cards}
          </h2>
          {COMPONENT_IMAGES.filter((c) => c.category === "cards").map((sheet) => {
            const key = sheet.file.replace(".jpg", "");
            const sheetCrops = crops?.[key] ?? [];
            const useCrops = sheetCrops.length >= MIN_CROPS;
            return (
              <div key={sheet.file} className="mb-5">
                <p className="font-mono text-[11px] text-zinc-400 mb-2">
                  {sheet.label}{" "}
                  <span className="text-zinc-600">
                    · {useCrops ? `${sheetCrops.length} cards` : "full sheet"} · {sheet.file}
                  </span>
                </p>
                {useCrops ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {sheetCrops.map((crop) => (
                      <a key={crop} href={`/classic-assets/cards/${crop}`} target="_blank" rel="noreferrer"
                        className="block border border-bg-line rounded-sm overflow-hidden hover:border-amber-500/60">
                        <img src={`/classic-assets/cards/${crop}`} alt={crop} loading="lazy"
                          className="w-full h-44 object-contain bg-bg-base" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <PhotoCard href={`/classic-assets/${sheet.file}`} src={`/classic-assets/${sheet.file}`} label={sheet.label} sub="full sheet (auto-split unavailable)" />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
