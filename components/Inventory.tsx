"use client";

import { useMemo, useState } from "react";
import { Download, MapPin, Pencil, Plus, Flag } from "lucide-react";
import { STATUSES, type Item } from "@/lib/types";
import { containerLabel, itemMatches, KIND_GROUPS } from "@/lib/format";
import { NO_SPOT, type AppCtx } from "./appTypes";
import { Button, Chip, cx, Empty, IconButton, inputClass, StatusBadge } from "./ui";

type SortKey = "name" | "category" | "location" | "status";

function csvCell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function Inventory({ ctx, query, onShow }: { ctx: AppCtx; query: string; onShow: (item: Item) => void }) {
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [group, setGroup] = useState("");
  const [sort, setSort] = useState<SortKey>("name");

  const categories = useMemo(
    () => [...new Set(ctx.state.items.map((i) => i.category).filter(Boolean) as string[])].sort(),
    [ctx.state.items],
  );
  const locationOf = (i: Item) => (i.container_id ? ctx.byId.get(i.container_id) : undefined);
  const locationText = (i: Item) => {
    const c = locationOf(i);
    return c ? containerLabel(c) : "No recorded spot";
  };

  const rows = useMemo(() => {
    const g = KIND_GROUPS.find((k) => k.key === group);
    const list = ctx.state.items.filter((i) => {
      const c = locationOf(i);
      if (category && i.category !== category) return false;
      if (status && i.status !== status) return false;
      if (group === NO_SPOT && c) return false;
      if (g && (!c || !g.kinds.includes(c.kind))) return false;
      return itemMatches(query, i, c);
    });
    const key = (i: Item) =>
      sort === "category" ? `${i.category ?? "~"} ${i.name}` : sort === "location" ? `${locationText(i)} ${i.name}` : sort === "status" ? `${i.status} ${i.name}` : i.name;
    return list.sort((a, b) => key(a).localeCompare(key(b), undefined, { numeric: true, sensitivity: "base" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.state.items, ctx.byId, query, category, status, group, sort]);

  const exportCsv = () => {
    const header = ["Item", "Quantity", "Category", "Location", "Exact spot", "Status", "Taken by", "Condition", "Notes", "Reorder"];
    const lines = rows.map((i) =>
      [i.name, i.quantity, i.category, locationText(i), i.spot, i.status, i.taken_by, i.condition, i.notes, i.reorder ? "yes" : ""]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `storeroom-demo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 overflow-hidden px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className={cx(inputClass, "w-auto")} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className={cx(inputClass, "w-auto")} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className={cx(inputClass, "w-auto")} value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Location">
          <option value="">Everywhere</option>
          {KIND_GROUPS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.title}
            </option>
          ))}
          <option value={NO_SPOT}>No recorded spot</option>
        </select>
        <span className="text-sm text-zinc-500">{rows.length} items</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={exportCsv}>
            <Download size={14} /> Export CSV
          </Button>
          {ctx.canEdit && (
            <Button size="sm" variant="primary" onClick={() => ctx.openItemForm({})}>
              <Plus size={14} /> Add item
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-zinc-200 bg-white">
        {rows.length ? (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                {(
                  [
                    ["name", "Item"],
                    [null, "Qty"],
                    ["category", "Category"],
                    ["location", "Location"],
                    ["status", "Status"],
                  ] as const
                ).map(([key, label]) => (
                  <th key={label} className="border-b border-zinc-200 px-3 py-2 font-medium">
                    {key ? (
                      <button type="button" onClick={() => setSort(key)} className={cx("uppercase", sort === key && "text-brand-700")}>
                        {label}
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                ))}
                <th className="border-b border-zinc-200 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((i) => (
                <tr key={i.id} className="hover:bg-zinc-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-zinc-900">
                      {i.name}
                      {i.reorder && <Flag size={12} className="ml-1 inline text-amber-600" aria-label="Needs reorder" />}
                    </div>
                    {(i.spot || i.notes) && <div className="text-xs text-zinc-500">{[i.spot, i.notes].filter(Boolean).join(" · ")}</div>}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-zinc-700">{i.quantity ?? "-"}</td>
                  <td className="px-3 py-2">{i.category && <Chip>{i.category}</Chip>}</td>
                  <td className="px-3 py-2 text-zinc-700">{locationText(i)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={i.status} takenBy={i.taken_by} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right">
                    <IconButton label="Show in the room" onClick={() => onShow(i)}>
                      <MapPin size={15} />
                    </IconButton>
                    {ctx.canEdit && (
                      <IconButton label="Edit item" onClick={() => ctx.openItemForm({ item: i })}>
                        <Pencil size={15} />
                      </IconButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6">
            <Empty>No items match these filters.</Empty>
          </div>
        )}
      </div>
    </div>
  );
}
