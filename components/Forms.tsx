"use client";

import { useState, type FormEvent } from "react";
import {
  BOX_STYLE_LABELS,
  BOX_STYLES,
  CATEGORY_SUGGESTIONS,
  STATUSES,
  type BoxStyle,
  type Container,
  type Item,
  type Status,
} from "@/lib/types";
import { containerLabel, KIND_GROUPS, ROW_NAMES, sortContainers } from "@/lib/format";
import { Button, Dialog, Field, inputClass } from "./ui";

type Save<T> = (value: T) => Promise<void>;

function useSubmit<T>(save: Save<T>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (value: T) => {
    setBusy(true);
    setError(null);
    try {
      await save(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>;
}

export function LocationSelect({
  containers,
  value,
  onChange,
}: {
  containers: Container[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">No recorded spot</option>
      {KIND_GROUPS.map((g) => {
        const list = sortContainers(containers.filter((c) => g.kinds.includes(c.kind)));
        if (!list.length) return null;
        return (
          <optgroup key={g.key} label={g.title}>
            {list.map((c) => (
              <option key={c.id} value={c.id}>
                {containerLabel(c)}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}

// ---------------------------------------------------------------------------

export interface ItemDraft {
  name: string;
  category: string;
  quantity: string;
  container_id: string;
  spot: string;
  status: Status;
  taken_by: string;
  condition: string;
  notes: string;
  reorder: boolean;
}

export function ItemForm({
  item,
  containerId,
  containers,
  onSave,
  onDelete,
  onClose,
}: {
  item?: Item;
  containerId?: string | null;
  containers: Container[];
  onSave: Save<ItemDraft>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const [d, setD] = useState<ItemDraft>({
    name: item?.name ?? "",
    category: item?.category ?? "",
    quantity: item?.quantity ?? "",
    container_id: item ? item.container_id ?? "" : containerId ?? "",
    spot: item?.spot ?? "",
    status: item?.status ?? "Available",
    taken_by: item?.taken_by ?? "",
    condition: item?.condition ?? "",
    notes: item?.notes ?? "",
    reorder: item?.reorder ?? false,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { busy, error, run } = useSubmit(onSave);
  const set = <K extends keyof ItemDraft>(k: K, v: ItemDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    run(d);
  };

  return (
    <Dialog
      title={item ? "Edit item" : "Add item"}
      onClose={onClose}
      wide
      footer={
        <>
          {onDelete && (
            <Button
              variant="danger"
              className="mr-auto"
              disabled={busy}
              onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            >
              {confirmDelete ? "Click again to delete" : "Delete item"}
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy || !d.name.trim()} onClick={() => submit()}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ErrorNote error={error} />
        <Field label="Name" className="sm:col-span-2">
          <input className={inputClass} value={d.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} />
        </Field>
        <Field label="Quantity" hint="A number, or things like “15+” or “4x20”">
          <input className={inputClass} value={d.quantity} onChange={(e) => set("quantity", e.target.value)} maxLength={30} />
        </Field>
        <Field label="Category">
          <input
            className={inputClass}
            list="category-options"
            value={d.category}
            onChange={(e) => set("category", e.target.value)}
            maxLength={40}
          />
          <datalist id="category-options">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Location" className="sm:col-span-2">
          <LocationSelect containers={containers} value={d.container_id} onChange={(v) => set("container_id", v)} />
        </Field>
        <Field label="Exact spot (optional)" className="sm:col-span-2" hint="e.g. “Bottom left”, “Also in the Totes 2 Bag”">
          <input className={inputClass} value={d.spot} onChange={(e) => set("spot", e.target.value)} maxLength={200} />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={d.status} onChange={(e) => set("status", e.target.value as Status)}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Taken by">
          <input
            className={inputClass}
            value={d.taken_by}
            onChange={(e) => set("taken_by", e.target.value)}
            disabled={d.status === "Available"}
            placeholder={d.status === "Available" ? "-" : "Who has it?"}
            maxLength={80}
          />
        </Field>
        <Field label="Condition" className="sm:col-span-2">
          <input className={inputClass} value={d.condition} onChange={(e) => set("condition", e.target.value)} maxLength={200} />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <textarea className={inputClass} rows={3} value={d.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} />
        </Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" className="h-4 w-4 accent-brand-700" checked={d.reorder} onChange={(e) => set("reorder", e.target.checked)} />
          Needs reordering
        </label>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------

export interface ContainerDraft {
  kind: Container["kind"];
  name: string;
  style: BoxStyle | "";
  place: string;
  status: Status;
  taken_by: string;
  notes: string;
  gx: number;
  gy: number;
  gz: number;
}

export function ContainerForm({
  container,
  kind,
  boxes,
  onSave,
  onClose,
}: {
  container?: Container;
  kind?: "box" | "external";
  boxes: Container[];
  onSave: Save<ContainerDraft>;
  onClose: () => void;
}) {
  const creating = !container;
  const firstFree = (() => {
    const taken = new Set(boxes.map((b) => `${b.gx},${b.gy},${b.gz}`));
    for (let gz = 1; gz <= 3; gz++)
      for (let gx = 1; gx <= 4; gx++) for (let gy = 1; gy <= 4; gy++) if (!taken.has(`${gx},${gy},${gz}`)) return { gx, gy, gz };
    return { gx: 1, gy: 1, gz: 1 };
  })();
  const [d, setD] = useState<ContainerDraft>({
    kind: container?.kind ?? kind ?? "box",
    name: container?.name ?? "",
    style: container?.style ?? (kind === "box" ? "clear" : ""),
    place: container?.place ?? (kind === "external" ? "Main Office" : ""),
    status: container?.status ?? "Available",
    taken_by: container?.taken_by ?? "",
    notes: container?.notes ?? "",
    gx: container?.gx ?? firstFree.gx,
    gy: container?.gy ?? firstFree.gy,
    gz: container?.gz ?? firstFree.gz,
  });
  const { busy, error, run } = useSubmit(onSave);
  const set = <K extends keyof ContainerDraft>(k: K, v: ContainerDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const occupant = creating && d.kind === "box" ? boxes.find((b) => b.gx === d.gx && b.gy === d.gy && b.gz === d.gz) : undefined;
  const title = creating ? (d.kind === "box" ? "Add a box to the box wall" : "Add another location") : `Edit ${container.name}`;
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    run(d);
  };

  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy || !d.name.trim() || !!occupant} onClick={() => submit()}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <ErrorNote error={error} />
        <Field label="Name">
          <input className={inputClass} value={d.name} onChange={(e) => set("name", e.target.value)} required maxLength={80} />
        </Field>
        {d.kind === "external" && (
          <Field label="Room / place" hint="e.g. Main Office, Reception">
            <input className={inputClass} value={d.place} onChange={(e) => set("place", e.target.value)} maxLength={80} />
          </Field>
        )}
        {(d.kind === "box" || d.kind === "top") && (
          <Field label="Looks like">
            <select className={inputClass} value={d.style} onChange={(e) => set("style", e.target.value as BoxStyle)}>
              {BOX_STYLES.map((s) => (
                <option key={s} value={s}>
                  {BOX_STYLE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        )}
        {creating && d.kind === "box" && (
          <div className="grid grid-cols-3 gap-2">
            <Field label="Column (from left)">
              <select className={inputClass} value={d.gx} onChange={(e) => set("gx", Number(e.target.value))}>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
            <Field label="Level (from floor)">
              <select className={inputClass} value={d.gy} onChange={(e) => set("gy", Number(e.target.value))}>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
            <Field label="Row">
              <select className={inputClass} value={d.gz} onChange={(e) => set("gz", Number(e.target.value))}>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {ROW_NAMES[n]}
                  </option>
                ))}
              </select>
            </Field>
            <p className={occupant ? "col-span-3 text-sm text-red-700" : "col-span-3 text-xs text-zinc-500"}>
              {occupant ? `(${d.gx},${d.gy},${d.gz}) already has “${occupant.name}”. Pick an empty spot.` : `Spot (${d.gx},${d.gy},${d.gz}) is free.`}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Status">
            <select className={inputClass} value={d.status} onChange={(e) => set("status", e.target.value as Status)}>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Taken by">
            <input
              className={inputClass}
              value={d.taken_by}
              disabled={d.status === "Available"}
              placeholder={d.status === "Available" ? "-" : "Who has it?"}
              onChange={(e) => set("taken_by", e.target.value)}
              maxLength={80}
            />
          </Field>
        </div>
        <Field label="Notes">
          <textarea className={inputClass} rows={3} value={d.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} />
        </Field>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------

/** Take out an item or a box: who has it, and whether it's only some of it. */
export function TakeDialog({
  name,
  defaultName,
  onSave,
  onClose,
}: {
  name: string;
  defaultName: string;
  onSave: Save<{ taken_by: string; status: Status }>;
  onClose: () => void;
}) {
  const [who, setWho] = useState(defaultName);
  const [partial, setPartial] = useState(false);
  const { busy, error, run } = useSubmit(onSave);
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    run({ taken_by: who.trim(), status: partial ? "Partly taken" : "Taken" });
  };
  return (
    <Dialog
      title={`Take out “${name}”`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy || !who.trim()} onClick={() => submit()}>
            {busy ? "Saving…" : "Mark as taken"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <ErrorNote error={error} />
        <Field label="Who is taking it?" hint="Add a date or event if it helps, e.g. “Alex (open day stall)”">
          <input className={inputClass} value={who} onChange={(e) => setWho(e.target.value)} maxLength={80} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-brand-700" checked={partial} onChange={(e) => setPartial(e.target.checked)} />
          Only taking some of them
        </label>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const { busy, error, run } = useSubmit(onConfirm);
  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={busy} onClick={() => run(undefined)} data-autofocus>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      <ErrorNote error={error} />
      <p className="text-sm text-zinc-700">{message}</p>
    </Dialog>
  );
}
