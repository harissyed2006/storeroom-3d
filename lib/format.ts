import type { Container, Item } from "./types";

export const ROW_NAMES: Record<number, string> = { 1: "front", 2: "middle", 3: "back" };
export const SHELF_NAMES: Record<number, string> = { 1: "top", 2: "2nd from top", 3: "3rd from top", 4: "bottom" };

/** The code used in the stocktake spreadsheet, e.g. "(2,1,1)" for boxes or "1.2" for drawers. */
export function containerCode(c: Container): string | null {
  switch (c.kind) {
    case "box":
      return `(${c.gx},${c.gy},${c.gz})`;
    case "drawer":
      return `${c.gx}.${c.gy}`;
    case "shelf":
      return c.gy ? `Shelf ${c.gy}` : null;
    case "top":
      return `Top of ${c.gx}`;
    default:
      return null;
  }
}

/** Where a container physically is, in plain words. */
export function containerWhere(c: Container): string {
  switch (c.kind) {
    case "box":
      return `Box wall · column ${c.gx} from left · level ${c.gy} from floor · ${ROW_NAMES[c.gz ?? 1]} row`;
    case "drawer":
      return `Filing cabinet ${c.gx} (${ordinal(c.gx)} from door) · drawer ${c.gy} (${c.gy === 1 ? "top" : `${ordinal(c.gy)} from top`})`;
    case "shelf":
      return c.gy ? `Shelving unit · ${SHELF_NAMES[c.gy]} level` : "Shelving unit · level not recorded";
    case "top":
      return `On top of filing cabinet ${c.gx} (${c.gy === 2 ? "back" : "front"})`;
    case "floor":
      return "On the floor";
    case "external":
      return `Outside the storeroom · ${c.place ?? "elsewhere"}`;
  }
}

/** Short label used in the activity log and pickers, e.g. "Party Box (2,1,1)". */
export function containerLabel(c: Container): string {
  const code = containerCode(c);
  if (c.kind === "external") return `${c.place} – ${c.name}`;
  if (c.kind === "drawer") return `${c.name} (drawer ${code})`;
  return code && c.kind !== "shelf" ? `${c.name} ${code}` : c.name;
}

export function ordinal(n: number | null): string {
  if (!n) return "";
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}

export const KIND_GROUPS: { key: string; title: string; kinds: Container["kind"][] }[] = [
  { key: "box", title: "Box wall (back alcove)", kinds: ["box"] },
  { key: "cabinet", title: "Filing cabinets", kinds: ["drawer", "top"] },
  { key: "shelf", title: "Shelving unit", kinds: ["shelf"] },
  { key: "floor", title: "Floor", kinds: ["floor"] },
  { key: "external", title: "Outside the storeroom", kinds: ["external"] },
];

export function sortContainers(list: Container[]): Container[] {
  return [...list].sort((a, b) => {
    if (a.kind === "box" && b.kind === "box") return (a.gz! - b.gz!) || (a.gx! - b.gx!) || (b.gy! - a.gy!);
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return (a.gx ?? 9) - (b.gx ?? 9) || (a.gy ?? 9) - (b.gy ?? 9) || a.name.localeCompare(b.name);
  });
}

export function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = fields.filter(Boolean).join(" ").toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w));
}

export function itemMatches(query: string, item: Item, container?: Container): boolean {
  return matches(query, item.name, item.category, item.notes, item.spot, item.taken_by, container?.name);
}

/** Parse "15", "15+" or "4x20" into a number we can step with +/- (only plain integers). */
export function numericQty(q: string | null): number | null {
  if (q === null || q === "") return null;
  return /^\d+$/.test(q) ? Number(q) : null;
}

export function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}
