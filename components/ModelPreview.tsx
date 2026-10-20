"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { buildDemoData } from "@/lib/demoData";
import type { ViewName } from "@/lib/layout";
import { cx } from "./ui";

const Scene = dynamic(() => import("./scene/Scene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-zinc-500">Loading the 3D model…</div>,
});

const VIEWS: [ViewName, string][] = [
  ["door", "From the door"],
  ["overview", "Overview"],
  ["boxes", "Box wall"],
  ["plan", "Floor plan"],
];

/** A read-only, explorable copy of the model for the project page. */
export function ModelPreview({ initial = "door" }: { initial?: ViewName }) {
  const data = useMemo(() => buildDemoData(), []);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of data.items) if (i.container_id) m.set(i.container_id, (m.get(i.container_id) ?? 0) + 1);
    return m;
  }, [data]);
  const noHits = useMemo(() => new Set<string>(), []);
  const [view, setView] = useState<ViewName>(initial);
  const [camera, setCamera] = useState({ view: initial as ViewName, nonce: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const onSelect = useCallback((id: string | null) => setSelectedId(id), []);
  const selected = selectedId ? data.containers.find((c) => c.id === selectedId) : undefined;

  return (
    <div className="relative h-full w-full">
      <Scene
        containers={data.containers}
        counts={counts}
        selectedId={selectedId}
        hitIds={noHits}
        peel={selected?.kind === "box" ? selected.gz ?? 1 : 1}
        camera={camera}
        boxView={view === "boxes" || selected?.kind === "box"}
        pickSlot={null}
        onSelect={onSelect}
      />
      <div className="absolute inset-x-2 bottom-2 flex flex-wrap justify-center gap-1">
        {VIEWS.map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setView(v);
              setSelectedId(null);
              setCamera((p) => ({ view: v, nonce: p.nonce + 1 }));
            }}
            className={cx(
              "rounded-lg px-2.5 py-1 text-xs font-medium shadow-sm ring-1 backdrop-blur",
              view === v ? "bg-brand-700 text-white ring-brand-700" : "bg-white/90 text-zinc-700 ring-zinc-200 hover:bg-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
