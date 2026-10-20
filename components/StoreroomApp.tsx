"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Boxes, History, RotateCcw, Search, Table2, X } from "lucide-react";
import type { Container, Item, StoreState, Status } from "@/lib/types";
import { containerLabel, itemMatches, matches, containerCode, ROW_NAMES } from "@/lib/format";
import { focusOf, VIEW_LABELS, VIEWS, type ViewName } from "@/lib/layout";
import type { SceneProps } from "./scene/Scene";
import { NO_SPOT, type AppCtx } from "./appTypes";
import { SidePanel } from "./SidePanel";
import { Inventory } from "./Inventory";
import { ActivityList } from "./ActivityList";
import { ConfirmDialog, ContainerForm, ItemForm, TakeDialog, type ContainerDraft, type ItemDraft } from "./Forms";
import { demoApi, getDemoState, resetDemo } from "@/lib/demoStore";
import { Button, cx } from "./ui";

const Scene = dynamic(() => import("./scene/Scene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-zinc-500">Loading the 3D storeroom…</div>,
});

type Tab = "room" | "inventory" | "activity";

type DialogState =
  | { type: "item"; item?: Item; containerId?: string | null }
  | { type: "container"; container?: Container; kind?: "box" | "external" }
  | { type: "take"; item: Item }
  | { type: "takeContainer"; container: Container }
  | { type: "confirm"; title: string; message: string; confirmLabel: string; run: () => Promise<void> }
  | null;

const TABS: { key: Tab; label: string; icon: typeof Boxes }[] = [
  { key: "room", label: "Room", icon: Boxes },
  { key: "inventory", label: "Inventory", icon: Table2 },
  { key: "activity", label: "History", icon: History },
];

export default function StoreroomApp() {
  const [state, setState] = useState<StoreState | null>(null);
  const [loadError, setLoadError] = useState<{ message: string; code?: string } | null>(null);
  const [tab, setTab] = useState<Tab>("room");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [peel, setPeel] = useState(1);
  const [camera, setCamera] = useState<SceneProps["camera"]>({ view: "overview", nonce: 0 });
  const [activeView, setActiveView] = useState<ViewName | null>("overview");
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const closeDialog = useCallback(() => setDialog(null), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // ---- data -----------------------------------------------------------------

  // The demo keeps its data in this browser (lib/demoStore.ts) instead of a server database.
  const load = useCallback(async () => {
    try {
      setState(getDemoState());
      setLoadError(null);
    } catch (e) {
      setLoadError({ message: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Same REST-style calls as production, answered by the in-browser demo store.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = useCallback(
    async (method: string, url: string, body?: unknown): Promise<any> => {
      const result = await demoApi(method, url, body);
      await load();
      return structuredClone(result);
    },
    [load],
  );

  const [showIntro, setShowIntro] = useState(true);
  const reset = async () => {
    resetDemo();
    setSelectedId(null);
    setSelectedItemId(null);
    setMovingId(null);
    setQuery("");
    await load();
    setCamera((p) => ({ view: "overview", nonce: p.nonce + 1 }));
    setActiveView("overview");
    setToast("Demo reset to the starting data");
  };

  // ---- derived ----------------------------------------------------------------

  const containers = useMemo(() => state?.containers ?? [], [state]);
  const byId = useMemo(() => new Map(containers.map((c) => [c.id, c])), [containers]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of state?.items ?? []) if (i.container_id) m.set(i.container_id, (m.get(i.container_id) ?? 0) + 1);
    return m;
  }, [state]);
  const hitIds = useMemo(() => {
    const ids = new Set<string>();
    if (!query.trim() || !state) return ids;
    for (const i of state.items) {
      const c = i.container_id ? byId.get(i.container_id) : undefined;
      if (c && itemMatches(query, i, c)) ids.add(c.id);
    }
    for (const c of containers) if (matches(query, c.name, containerCode(c))) ids.add(c.id);
    return ids;
  }, [query, state, byId, containers]);

  // Drop a selection that no longer exists (e.g. deleted by someone else).
  useEffect(() => {
    if (selectedId && selectedId !== NO_SPOT && state && !byId.has(selectedId)) setSelectedId(null);
  }, [selectedId, byId, state]);

  useEffect(() => {
    if (!selectedItemId) return;
    const t = setTimeout(() => document.getElementById(`item-${selectedItemId}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 120);
    return () => clearTimeout(t);
  }, [selectedItemId, selectedId]);

  // ---- navigation -----------------------------------------------------------------

  const flyTo = (c: Container) => {
    if (!focusOf(c)) return;
    setCamera((p) => ({ focusId: c.id, nonce: p.nonce + 1 }));
    setActiveView(null);
  };

  const select = useCallback(
    (id: string | null, itemId: string | null = null) => {
      setSelectedId(id);
      setSelectedItemId(itemId);
      setTab("room");
      const c = id ? byId.get(id) : undefined;
      setPeel(c?.kind === "box" ? c.gz ?? 1 : 1);
      if (c) flyTo(c);
    },
    [byId],
  );

  const showView = (v: ViewName) => {
    setSelectedId(null);
    setSelectedItemId(null);
    setPeel(1);
    setActiveView(v);
    setCamera((p) => ({ view: v, nonce: p.nonce + 1 }));
  };

  // ---- editing ------------------------------------------------------------------

  const me = state?.me;
  const canEdit = true;

  const moveBoxTo = async (gx: number, gy: number, gz: number) => {
    const id = movingId;
    if (!id) return;
    try {
      await api("PATCH", `/api/containers/${id}`, { gx, gy, gz });
      setToast(`Moved to (${gx},${gy},${gz})`);
      setMovingId(null);
      setSelectedId(id);
      setPeel(gz);
      setCamera((p) => ({ focusId: id, nonce: p.nonce + 1 }));
    } catch (e) {
      setToast((e as Error).message);
    }
  };

  const onSceneSelect = useCallback(
    (id: string | null) => {
      if (movingId) {
        const target = id ? byId.get(id) : undefined;
        if (target?.kind === "box" && target.id !== movingId) moveBoxTo(target.gx!, target.gy!, target.gz!);
        return;
      }
      select(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [movingId, byId, select],
  );

  const ctx: AppCtx | null = state
    ? {
        state,
        byId,
        counts,
        me: state.me,
        canEdit,
        selectedItemId,
        select,
        openItemForm: (o) => setDialog({ type: "item", ...o }),
        openContainerForm: (o) => setDialog({ type: "container", ...o }),
        patchItem: async (item, patch) => {
          try {
            await api("PATCH", `/api/items/${item.id}`, patch);
          } catch (e) {
            setToast((e as Error).message);
          }
        },
        takeItem: (item) => setDialog({ type: "take", item }),
        takeContainer: (c) => setDialog({ type: "takeContainer", container: c }),
        returnContainer: async (c) => {
          try {
            await api("PATCH", `/api/containers/${c.id}`, { status: "Available", taken_by: null });
            setToast(`${c.name} marked as returned`);
          } catch (e) {
            setToast((e as Error).message);
          }
        },
        startMove: (c) => {
          setMovingId(c.id);
          setSelectedId(c.id);
          setPeel(c.gz ?? 1);
          setActiveView("boxes");
          setCamera((p) => ({ view: "boxes", nonce: p.nonce + 1 }));
        },
        removeContainer: (c) =>
          setDialog({
            type: "confirm",
            title: `Delete ${c.name}?`,
            message: `${counts.get(c.id) ?? 0} item(s) inside will be kept, but marked as having no recorded spot.`,
            confirmLabel: "Delete",
            run: async () => {
              await api("DELETE", `/api/containers/${c.id}`);
              setDialog(null);
              setSelectedId(null);
              setToast(`${c.name} deleted`);
            },
          }),
      }
    : null;

  const saveItem = async (d: ItemDraft, item?: Item) => {
    const body = {
      ...d,
      container_id: d.container_id || null,
      taken_by: d.status === "Available" ? null : d.taken_by || null,
    };
    if (item) await api("PATCH", `/api/items/${item.id}`, body);
    else await api("POST", "/api/items", body);
    setDialog(null);
    setToast(item ? "Item saved" : "Item added");
  };

  const saveContainer = async (d: ContainerDraft, c?: Container) => {
    const common = { name: d.name, status: d.status, taken_by: d.status === "Available" ? null : d.taken_by || null, notes: d.notes || null };
    if (c) {
      await api("PATCH", `/api/containers/${c.id}`, {
        ...common,
        ...(c.kind === "box" || c.kind === "top" ? { style: d.style || "clear" } : {}),
        ...(c.kind === "external" ? { place: d.place } : {}),
      });
      setToast("Saved");
    } else {
      const created: Container = await api("POST", "/api/containers", {
        ...common,
        kind: d.kind,
        style: d.style || null,
        place: d.place || null,
        gx: d.gx,
        gy: d.gy,
        gz: d.gz,
      });
      setToast(`${created.name} added`);
      setSelectedId(created.id);
      setPeel(created.gz ?? 1);
      if (focusOf(created)) setCamera((p) => ({ focusId: created.id, nonce: p.nonce + 1 }));
    }
    setDialog(null);
  };

  // ---- render -----------------------------------------------------------------

  if (!state || !me) {
    return (
      <div className="grid h-dvh place-items-center bg-zinc-50 p-6">
        {loadError ? (
          <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold">Couldn&apos;t load the demo</h1>
            <p className="mt-2 text-sm text-zinc-600">{loadError.message}</p>
            <Button className="mt-4" onClick={load}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Boxes size={40} className="animate-pulse text-brand-700" />
            <p className="text-sm text-zinc-500">Loading the storeroom…</p>
          </div>
        )}
      </div>
    );
  }

  const selected = selectedId ? byId.get(selectedId) : undefined;
  const boxView = activeView === "boxes" || selected?.kind === "box" || !!movingId;
  const moving = movingId ? byId.get(movingId) : undefined;

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 text-zinc-900">
      {/* Header */}
      <header className="z-20 flex flex-wrap items-center gap-x-2 gap-y-2 bg-brand-700 px-3 py-2 text-white shadow-sm sm:gap-x-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 hover:bg-white/25"
            aria-label="Back to the project page"
            title="Back to the project page"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-wide">
              Storeroom <span className="font-normal text-brand-100">3D</span>
            </div>
            <div className="hidden text-[11px] text-brand-200 sm:block">Interactive demo · made-up data</div>
          </div>
        </div>

        <nav className="flex gap-0.5 sm:gap-1" aria-label="Views">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-current={tab === key ? "page" : undefined}
              aria-label={label}
              className={cx(
                "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium sm:px-3",
                tab === key ? "bg-white/15 text-white ring-1 ring-inset ring-white/20" : "text-brand-100 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>

        <div className="relative order-last w-full min-w-0 sm:order-none sm:ml-auto sm:w-auto sm:max-w-sm sm:flex-1">
          <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedId(null);
              setSelectedItemId(null);
            }}
            placeholder="Find an item, e.g. walkie talkie"
            aria-label="Search the storeroom"
            className="h-9 w-full rounded-lg border border-white/20 bg-white pl-8 pr-8 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-zinc-700"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <span className="hidden rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-950 lg:inline">
            Demo
          </span>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-brand-50 hover:bg-white/10"
            title="Put the demo back to its starting data"
          >
            <RotateCcw size={16} />
            <span className="hidden lg:inline">Reset demo</span>
          </button>
        </div>
      </header>

      {/* Body */}
      {tab === "room" && ctx && (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="relative h-[46dvh] shrink-0 bg-zinc-100 lg:h-auto lg:min-w-0 lg:flex-1">
            <Scene
              containers={containers}
              counts={counts}
              selectedId={selectedId}
              hitIds={hitIds}
              peel={peel}
              camera={camera}
              boxView={boxView}
              pickSlot={movingId ? moveBoxTo : null}
              onSelect={onSceneSelect}
            />

            {/* Camera presets */}
            <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] gap-1 overflow-x-auto rounded-xl bg-white/90 p-1 shadow-sm ring-1 ring-zinc-200 backdrop-blur">
              {(Object.keys(VIEWS) as ViewName[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => showView(v)}
                  className={cx(
                    "whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium",
                    activeView === v ? "bg-brand-700 text-white" : "text-zinc-700 hover:bg-zinc-100",
                  )}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>

            {/* Row peeling for the box wall */}
            {boxView && (
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl bg-white/90 p-1 shadow-sm ring-1 ring-zinc-200 backdrop-blur">
                <span className="px-2 text-xs text-zinc-500">Show</span>
                {[1, 2, 3].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPeel(r)}
                    className={cx(
                      "whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium capitalize",
                      peel === r ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100",
                    )}
                  >
                    {ROW_NAMES[r]} row
                  </button>
                ))}
              </div>
            )}

            {moving && (
              <div className="absolute inset-x-2 top-14 mx-auto flex max-w-lg items-center gap-2 rounded-xl bg-cyan-900 px-3 py-2 text-sm text-white shadow-lg">
                <span className="flex-1">
                  Moving <b>{moving.name}</b>: click a highlighted empty slot, or another box to swap. Use the row buttons to reach the back rows.
                </span>
                <Button size="sm" onClick={() => setMovingId(null)}>
                  Cancel
                </Button>
              </div>
            )}

            {!boxView && (
              <p className="pointer-events-none absolute bottom-2 left-2 hidden rounded-md bg-white/80 px-2 py-1 text-[11px] text-zinc-600 sm:block">
                Drag to look around · scroll to zoom · right-drag to pan · click a box, drawer or shelf
              </p>
            )}
          </div>

          <aside className="min-h-0 flex-1 overflow-y-auto border-t border-zinc-200 bg-white p-4 lg:w-[420px] lg:flex-none lg:border-l lg:border-t-0">
            {moving && (
              <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 p-3">
                <p className="mb-2 text-sm text-cyan-900">Pick the new spot for {moving.name}:</p>
                <MovePicker boxes={containers.filter((c) => c.kind === "box")} movingId={moving.id} onPick={moveBoxTo} />
              </div>
            )}
            {showIntro && !selectedId && !query && !moving && (
              <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-950">
                <p className="font-medium">Welcome to the demo</p>
                <p className="mt-1 text-brand-900">
                  All the data here is made up. Try searching for <b>radio</b>, opening a drawer, taking an item out, or moving a box on
                  the box wall. Changes are saved only in this browser, and <b>Reset demo</b> starts over.
                </p>
                <button type="button" onClick={() => setShowIntro(false)} className="mt-2 text-xs font-medium text-brand-800 underline">
                  Got it
                </button>
              </div>
            )}
            <SidePanel ctx={ctx} selectedId={selectedId} query={query} />
          </aside>
        </div>
      )}

      {tab === "inventory" && ctx && (
        <Inventory ctx={ctx} query={query} onShow={(i) => select(i.container_id ?? NO_SPOT, i.id)} />
      )}
      {tab === "activity" && <ActivityList activity={state.activity} />}

      {/* Dialogs */}
      {dialog?.type === "item" && (
        <ItemForm
          item={dialog.item}
          containerId={dialog.containerId}
          containers={containers}
          onClose={() => setDialog(null)}
          onSave={(d) => saveItem(d, dialog.item)}
          onDelete={
            dialog.item
              ? async () => {
                  try {
                    await api("DELETE", `/api/items/${dialog.item!.id}`);
                    setDialog(null);
                    setToast("Item deleted");
                  } catch (e) {
                    setToast((e as Error).message);
                  }
                }
              : undefined
          }
        />
      )}
      {dialog?.type === "container" && (
        <ContainerForm
          container={dialog.container}
          kind={dialog.kind}
          boxes={containers.filter((c) => c.kind === "box")}
          onClose={() => setDialog(null)}
          onSave={(d) => saveContainer(d, dialog.container)}
        />
      )}
      {dialog?.type === "take" && (
        <TakeDialog
          name={dialog.item.name}
          defaultName={me.name}
          onClose={() => setDialog(null)}
          onSave={async ({ taken_by, status }: { taken_by: string; status: Status }) => {
            await api("PATCH", `/api/items/${dialog.item.id}`, { status, taken_by });
            setDialog(null);
            setToast(`${dialog.item.name} marked as taken`);
          }}
        />
      )}
      {dialog?.type === "takeContainer" && (
        <TakeDialog
          name={dialog.container.name}
          defaultName={me.name}
          onClose={() => setDialog(null)}
          onSave={async ({ taken_by, status }: { taken_by: string; status: Status }) => {
            await api("PATCH", `/api/containers/${dialog.container.id}`, { status, taken_by });
            setDialog(null);
            setToast(`${dialog.container.name} marked as taken`);
          }}
        />
      )}
      {dialog?.type === "confirm" && (
        <ConfirmDialog title={dialog.title} message={dialog.message} confirmLabel={dialog.confirmLabel} onConfirm={dialog.run} onClose={() => setDialog(null)} />
      )}

      {toast && (
        <div role="status" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function MovePicker({ boxes, movingId, onPick }: { boxes: Container[]; movingId: string; onPick: (gx: number, gy: number, gz: number) => void }) {
  const at = new Map(boxes.map((b) => [`${b.gx},${b.gy},${b.gz}`, b]));
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((gz) => (
        <div key={gz}>
          <div className="mb-1 text-center text-[11px] font-medium uppercase tracking-wide text-cyan-800">{ROW_NAMES[gz]} row</div>
          <div className="grid grid-cols-4 gap-0.5 rounded-md bg-cyan-200 p-0.5">
            {[4, 3, 2, 1].flatMap((gy) =>
              [1, 2, 3, 4].map((gx) => {
                const b = at.get(`${gx},${gy},${gz}`);
                const self = b?.id === movingId;
                return (
                  <button
                    key={`${gx}${gy}`}
                    type="button"
                    disabled={self}
                    title={b ? (self ? "This box" : `Swap with ${containerLabel(b)}`) : `Empty (${gx},${gy},${gz})`}
                    onClick={() => onPick(gx, gy, gz)}
                    className={cx(
                      "h-6 rounded-[3px] text-[9px] font-semibold",
                      self ? "bg-cyan-600 text-white" : b ? "bg-white/90 text-zinc-500 hover:bg-amber-200" : "bg-cyan-50 hover:bg-emerald-300",
                    )}
                  >
                    {self ? "●" : b ? "" : "+"}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
