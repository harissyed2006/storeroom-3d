"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Flag,
  MapPin,
  Minus,
  Move,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Hand,
} from "lucide-react";
import type { Container, Item } from "@/lib/types";
import { BOX_STYLE_LABELS } from "@/lib/types";
import {
  containerCode,
  containerLabel,
  containerWhere,
  itemMatches,
  KIND_GROUPS,
  matches,
  numericQty,
  ROW_NAMES,
  sortContainers,
} from "@/lib/format";
import { GRID } from "@/lib/layout";
import { NO_SPOT, type AppCtx } from "./appTypes";
import { Button, Chip, cx, Empty, IconButton, StatusBadge } from "./ui";

// ---------------------------------------------------------------------------
// Item row
// ---------------------------------------------------------------------------

export function ItemRow({ item, ctx, showLocation }: { item: Item; ctx: AppCtx; showLocation?: boolean }) {
  const qty = numericQty(item.quantity);
  const container = item.container_id ? ctx.byId.get(item.container_id) : undefined;
  const highlighted = ctx.selectedItemId === item.id;
  return (
    <li
      id={`item-${item.id}`}
      className={cx(
        "group rounded-xl border px-3 py-2.5 transition-colors",
        highlighted ? "border-cyan-400 bg-cyan-50/60 ring-2 ring-cyan-300/50" : "border-zinc-200 bg-white",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium leading-snug text-zinc-900">{item.name}</span>
            {item.quantity && <span className="text-sm tabular-nums text-zinc-600">×{item.quantity}</span>}
            {item.reorder && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-700">
                <Flag size={12} /> reorder
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {item.category && <Chip>{item.category}</Chip>}
            {item.status !== "Available" && <StatusBadge status={item.status} takenBy={item.taken_by} />}
            {showLocation && (
              <button
                type="button"
                onClick={() => ctx.select(item.container_id ?? NO_SPOT, item.id)}
                className="inline-flex items-center gap-1 text-xs text-brand-700 hover:underline"
              >
                <MapPin size={12} />
                {container ? containerLabel(container) : "No recorded spot"}
              </button>
            )}
          </div>
          {(item.spot || item.notes || item.condition) && (
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
              {[item.spot, item.condition, item.notes].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        {ctx.canEdit && (
          <div className="flex shrink-0 items-center gap-0.5">
            {qty !== null && (
              <>
                <IconButton label="One less" disabled={qty <= 0} onClick={() => ctx.patchItem(item, { quantity: String(qty - 1) })}>
                  <Minus size={15} />
                </IconButton>
                <IconButton label="One more" onClick={() => ctx.patchItem(item, { quantity: String(qty + 1) })}>
                  <Plus size={15} />
                </IconButton>
              </>
            )}
            <IconButton label="Edit item" onClick={() => ctx.openItemForm({ item })}>
              <Pencil size={15} />
            </IconButton>
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        {item.status === "Available" ? (
          <Button size="sm" onClick={() => ctx.takeItem(item)}>
            <Hand size={14} /> Take out
          </Button>
        ) : (
          <Button size="sm" onClick={() => ctx.patchItem(item, { status: "Available", taken_by: null })}>
            <RotateCcw size={14} /> Mark returned
          </Button>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Box wall mini-map: three 4×4 grids (front, middle, back row)
// ---------------------------------------------------------------------------

export function BoxGrid({
  boxes,
  activeId,
  onCell,
  movingId,
}: {
  boxes: Container[];
  activeId: string | null;
  onCell: (gx: number, gy: number, gz: number, box: Container | undefined) => void;
  movingId?: string | null;
}) {
  const at = new Map(boxes.map((b) => [`${b.gx},${b.gy},${b.gz}`, b]));
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((gz) => (
        <div key={gz}>
          <div className="mb-1 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">{ROW_NAMES[gz]} row</div>
          <div className="grid grid-cols-4 gap-0.5 rounded-md bg-zinc-200 p-0.5">
            {Array.from({ length: GRID.rows }, (_, r) => GRID.rows - r).flatMap((gy) =>
              Array.from({ length: GRID.cols }, (_, i) => i + 1).map((gx) => {
                const b = at.get(`${gx},${gy},${gz}`);
                const active = b && b.id === activeId;
                const moving = b && b.id === movingId;
                return (
                  <button
                    key={`${gx}${gy}`}
                    type="button"
                    title={b ? `${b.name} (${gx},${gy},${gz})` : `Empty (${gx},${gy},${gz})`}
                    onClick={() => onCell(gx, gy, gz, b)}
                    className={cx(
                      "h-5 rounded-[3px] transition-colors",
                      !b && (movingId ? "bg-cyan-100 hover:bg-cyan-300" : "bg-white/70 hover:bg-white"),
                      b && !active && !moving && styleSwatch(b),
                      active && "bg-amber-400 ring-2 ring-amber-500",
                      moving && "bg-cyan-500 ring-2 ring-cyan-600",
                    )}
                  />
                );
              }),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function styleSwatch(b: Container) {
  switch (b.style) {
    case "black":
      return "bg-zinc-800 hover:bg-zinc-600";
    case "grey":
      return "bg-zinc-500 hover:bg-zinc-400";
    case "cardboard":
      return "bg-amber-700/80 hover:bg-amber-600";
    case "pink":
      return "bg-pink-300 hover:bg-pink-400";
    case "bag":
      return "bg-slate-700 hover:bg-slate-500";
    default:
      return "bg-sky-100 hover:bg-sky-200 ring-1 ring-inset ring-sky-300";
  }
}

// ---------------------------------------------------------------------------
// Container detail
// ---------------------------------------------------------------------------

function ContainerPanel({ c, ctx }: { c: Container; ctx: AppCtx }) {
  const items = ctx.state.items.filter((i) => i.container_id === c.id);
  const boxes = ctx.state.containers.filter((b) => b.kind === "box");
  const unknownShelf = c.kind === "shelf" && c.gy ? ctx.state.containers.find((s) => s.kind === "shelf" && !s.gy) : undefined;
  const code = containerCode(c);
  const deletable = ["box", "top", "floor", "external"].includes(c.kind);
  // Boxes and things on top of the cabinets can be carried out; anything marked taken can be returned.
  const takeable = c.kind === "box" || c.kind === "top";

  return (
    <div className="space-y-4">
      <BackLink ctx={ctx} />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold leading-tight">{c.name}</h2>
          {code && <Chip className="bg-brand-100 text-brand-800">{code}</Chip>}
        </div>
        <p className="mt-1 text-sm text-zinc-600">{containerWhere(c)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={c.status} takenBy={c.taken_by} />
          {c.style && <Chip>{BOX_STYLE_LABELS[c.style]}</Chip>}
        </div>
        {c.notes && <p className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">{c.notes}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {c.status !== "Available" ? (
            <Button size="sm" onClick={() => ctx.returnContainer(c)}>
              <RotateCcw size={14} /> Mark returned
            </Button>
          ) : (
            takeable && (
              <Button size="sm" onClick={() => ctx.takeContainer(c)}>
                <Hand size={14} /> Take out
              </Button>
            )
          )}
          {c.kind === "box" && (
            <Button size="sm" onClick={() => ctx.startMove(c)}>
              <Move size={14} /> Move box
            </Button>
          )}
          {ctx.canEdit && (
            <Button size="sm" onClick={() => ctx.openContainerForm({ container: c })}>
              <Pencil size={14} /> Edit details
            </Button>
          )}
          {ctx.canEdit && deletable && (
            <Button size="sm" variant="danger" onClick={() => ctx.removeContainer(c)}>
              <Trash2 size={14} /> Delete
            </Button>
          )}
        </div>
      </div>

      {c.kind === "box" && (
        <div className="rounded-xl border border-zinc-200 p-3">
          <p className="mb-2 text-xs text-zinc-500">Where it sits on the box wall (looking in from the room, bottom level at the bottom):</p>
          <BoxGrid boxes={boxes} activeId={c.id} onCell={(_x, _y, _z, b) => b && ctx.select(b.id)} />
        </div>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-800">
            Inside <span className="font-normal text-zinc-500">({items.length})</span>
          </h3>
          {ctx.canEdit && (
            <Button size="sm" variant="primary" onClick={() => ctx.openItemForm({ containerId: c.id })}>
              <Plus size={14} /> Add item
            </Button>
          )}
        </div>
        {items.length ? (
          <ul className="space-y-2">
            {items.map((i) => (
              <ItemRow key={i.id} item={i} ctx={ctx} />
            ))}
          </ul>
        ) : (
          <Empty>Nothing recorded here yet.</Empty>
        )}
      </section>

      {unknownShelf && (ctx.counts.get(unknownShelf.id) ?? 0) > 0 && (
        <button
          type="button"
          onClick={() => ctx.select(unknownShelf.id)}
          className="flex w-full items-center justify-between rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
        >
          <span>
            {ctx.counts.get(unknownShelf.id)} more shelving items have no level recorded
          </span>
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function NoSpotPanel({ ctx }: { ctx: AppCtx }) {
  const items = ctx.state.items.filter((i) => !i.container_id);
  return (
    <div className="space-y-4">
      <BackLink ctx={ctx} />
      <div>
        <h2 className="text-lg font-semibold">No recorded spot</h2>
        <p className="mt-1 text-sm text-zinc-600">
          In the storeroom, but the stocktake didn&apos;t say exactly where. Edit an item to give it a home.
        </p>
      </div>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((i) => (
            <ItemRow key={i.id} item={i} ctx={ctx} />
          ))}
        </ul>
      ) : (
        <Empty>Everything has a spot. Nice.</Empty>
      )}
    </div>
  );
}

function BackLink({ ctx }: { ctx: AppCtx }) {
  return (
    <button type="button" onClick={() => ctx.select(null)} className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900">
      <ArrowLeft size={15} /> All locations
    </button>
  );
}

// ---------------------------------------------------------------------------
// Overview: stats + location browser
// ---------------------------------------------------------------------------

function Overview({ ctx }: { ctx: AppCtx }) {
  const { containers, items } = ctx.state;
  const taken = items.filter((i) => i.status !== "Available");
  const takenBoxes = containers.filter((c) => c.status !== "Available");
  const noSpot = items.filter((i) => !i.container_id).length;
  const [open, setOpen] = useState<string | null>("box");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Items" value={items.length} />
        <Stat label="Storage spots" value={containers.length} />
        <Stat label="Taken out" value={taken.length} tone={taken.length ? "warn" : undefined} />
      </div>

      {(taken.length > 0 || takenBoxes.length > 0) && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-zinc-800">Currently taken out</h3>
          <ul className="space-y-1.5">
            {takenBoxes.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => ctx.select(c.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
                >
                  <span className="truncate">{containerLabel(c)}</span>
                  <StatusBadge status={c.status} takenBy={c.taken_by} />
                </button>
              </li>
            ))}
            {taken.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => ctx.select(i.container_id ?? NO_SPOT, i.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
                >
                  <span className="truncate">{i.name}</span>
                  <StatusBadge status={i.status} takenBy={i.taken_by} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-800">Locations</h3>
          {ctx.canEdit && (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => ctx.openContainerForm({ kind: "box" })}>
                <Plus size={14} /> Box
              </Button>
              <Button size="sm" variant="ghost" onClick={() => ctx.openContainerForm({ kind: "external" })}>
                <Plus size={14} /> Other room
              </Button>
            </div>
          )}
        </div>
        <div className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200">
          {KIND_GROUPS.map((g) => {
            const list = sortContainers(containers.filter((c) => g.kinds.includes(c.kind)));
            if (!list.length) return null;
            const total = list.reduce((n, c) => n + (ctx.counts.get(c.id) ?? 0), 0);
            const isOpen = open === g.key;
            return (
              <div key={g.key}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : g.key)}
                  className="flex w-full items-center justify-between bg-zinc-50 px-3 py-2.5 text-left text-sm font-medium hover:bg-zinc-100"
                  aria-expanded={isOpen}
                >
                  <span>{g.title}</span>
                  <span className="flex items-center gap-2 text-xs font-normal text-zinc-500">
                    {total} items
                    <ChevronRight size={15} className={cx("transition-transform", isOpen && "rotate-90")} />
                  </span>
                </button>
                {isOpen && (
                  <ul className="py-1">
                    {list.map((c) => (
                      <LocationRow key={c.id} c={c} ctx={ctx} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => ctx.select(NO_SPOT)}
            className="flex w-full items-center justify-between bg-zinc-50 px-3 py-2.5 text-left text-sm font-medium hover:bg-zinc-100"
          >
            <span>No recorded spot</span>
            <span className="flex items-center gap-2 text-xs font-normal text-zinc-500">
              {noSpot} items <ChevronRight size={15} />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

function LocationRow({ c, ctx }: { c: Container; ctx: AppCtx }) {
  const n = ctx.counts.get(c.id) ?? 0;
  const code = containerCode(c);
  return (
    <li>
      <button
        type="button"
        onClick={() => ctx.select(c.id)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-brand-50"
      >
        <span className="min-w-0 flex-1 truncate">
          {c.kind === "external" ? `${c.place} – ${c.name}` : c.name}
        </span>
        {c.status !== "Available" && <span className="h-2 w-2 rounded-full bg-red-500" title={c.status} />}
        {code && <span className="shrink-0 font-mono text-[11px] text-zinc-400">{code}</span>}
        <span className="w-6 shrink-0 text-right text-xs tabular-nums text-zinc-500">{n}</span>
      </button>
    </li>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" }) {
  return (
    <div className={cx("rounded-xl border px-3 py-2", tone === "warn" ? "border-amber-200 bg-amber-50" : "border-zinc-200 bg-white")}>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search results
// ---------------------------------------------------------------------------

function SearchResults({ ctx, query }: { ctx: AppCtx; query: string }) {
  const items = useMemo(
    () =>
      ctx.state.items.filter((i) => itemMatches(query, i, i.container_id ? ctx.byId.get(i.container_id) : undefined)),
    [ctx.state.items, ctx.byId, query],
  );
  const places = ctx.state.containers.filter((c) => matches(query, c.name, c.place, containerCode(c)));
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        {items.length} item{items.length === 1 ? "" : "s"} matching <span className="font-medium text-zinc-900">“{query}”</span>. Their spots glow in the room.
      </p>
      {places.length > 0 && (
        <section>
          <h3 className="mb-1.5 text-sm font-semibold">Places</h3>
          <ul className="overflow-hidden rounded-xl border border-zinc-200 py-1">
            {places.slice(0, 12).map((c) => (
              <LocationRow key={c.id} c={c} ctx={ctx} />
            ))}
          </ul>
        </section>
      )}
      {items.length ? (
        <ul className="space-y-2">
          {items.slice(0, 80).map((i) => (
            <ItemRow key={i.id} item={i} ctx={ctx} showLocation />
          ))}
        </ul>
      ) : (
        !places.length && <Empty>Nothing matches. Try another word, or check the Inventory tab.</Empty>
      )}
    </div>
  );
}

export function SidePanel({ ctx, selectedId, query }: { ctx: AppCtx; selectedId: string | null; query: string }) {
  if (selectedId === NO_SPOT) return <NoSpotPanel ctx={ctx} />;
  const c = selectedId ? ctx.byId.get(selectedId) : undefined;
  if (c) return <ContainerPanel c={c} ctx={ctx} />;
  if (query.trim()) return <SearchResults ctx={ctx} query={query} />;
  return <Overview ctx={ctx} />;
}
