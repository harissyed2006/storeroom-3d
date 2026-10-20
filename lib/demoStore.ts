/**
 * The demo's "backend": the same operations as the production API (items, storage spots,
 * box moves/swaps, history), run in the browser on made-up data and saved to localStorage.
 * Every visitor gets their own copy, so nobody can mess up the demo for anyone else.
 */
import { BOX_STYLES, STATUSES, type Activity, type Container, type ContainerKind, type Item, type StoreState, type Viewer } from "./types";
import { containerCode, containerLabel } from "./format";
import { buildDemoData } from "./demoData";

const STORAGE_KEY = "storeroom-3d-demo-v1";

export const DEMO_VIEWER: Viewer = { email: "demo@example.com", name: "You", role: "admin" };

interface Data {
  containers: Container[];
  items: Item[];
  activity: Activity[];
}

let data: Data | null = null;

function db(): Data {
  if (data) return data;
  try {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved) return (data = JSON.parse(saved) as Data);
  } catch {
    // corrupt or unavailable storage: start fresh
  }
  return (data = buildDemoData());
}

function save() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db()));
  } catch {
    // private mode etc.: changes just won't survive a reload
  }
}

export function resetDemo() {
  data = buildDemoData();
  save();
}

export function getDemoState(): StoreState {
  const d = db();
  return {
    containers: [...d.containers],
    items: [...d.items].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    activity: [...d.activity].sort((a, b) => b.id - a.id).slice(0, 150),
    me: DEMO_VIEWER,
  };
}

// ---------------------------------------------------------------------------
// Validation (mirrors the production API)
// ---------------------------------------------------------------------------

export class DemoError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Input = Record<string, unknown>;

function asObject(input: unknown): Input {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new DemoError(400, "Expected an object");
  return input as Input;
}

function text(v: unknown, field: string, max = 200): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string" && typeof v !== "number") throw new DemoError(400, `${field} must be text`);
  const s = String(v).trim();
  if (s.length > max) throw new DemoError(400, `${field} is too long (max ${max} characters)`);
  return s || null;
}

function requiredText(v: unknown, field: string, max = 200): string {
  const s = text(v, field, max);
  if (!s) throw new DemoError(400, `${field} is required`);
  return s;
}

function intIn(v: unknown, field: string, min: number, max: number): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new DemoError(400, `${field} must be a whole number from ${min} to ${max}`);
  return n;
}

function oneOf<T extends string>(v: unknown, field: string, allowed: readonly T[], fallback?: T): T {
  if ((v === undefined || v === null || v === "") && fallback) return fallback;
  if (typeof v === "string" && (allowed as readonly string[]).includes(v)) return v as T;
  throw new DemoError(400, `${field} must be one of: ${allowed.join(", ")}`);
}

const now = () => new Date().toISOString();
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

function log(action: string, summary: string) {
  const d = db();
  const id = d.activity.reduce((m, a) => Math.max(m, a.id), 0) + 1;
  d.activity.push({ id, at: now(), actor: DEMO_VIEWER.name, action, summary });
}

function findContainer(id: string | null): Container | null {
  return id ? db().containers.find((c) => c.id === id) ?? null : null;
}

function findItem(id: string): Item {
  const item = db().items.find((i) => i.id === id);
  if (!item) throw new DemoError(404, "That item no longer exists.");
  return item;
}

const where = (c: Container | null) => (c ? containerLabel(c) : "no recorded spot");

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

const ITEM_FIELDS = ["name", "category", "quantity", "container_id", "spot", "status", "taken_by", "condition", "notes", "reorder"] as const;
type ItemField = (typeof ITEM_FIELDS)[number];

function parseItemField(field: ItemField, v: unknown): unknown {
  switch (field) {
    case "name":
      return requiredText(v, "Name", 120);
    case "category":
      return text(v, "Category", 40)?.toUpperCase() ?? null;
    case "quantity":
      return text(v, "Quantity", 30);
    case "container_id":
      return text(v, "Location", 120);
    case "status":
      return oneOf(v, "Status", STATUSES, "Available");
    case "reorder":
      return v === true || v === "true";
    case "notes":
      return text(v, "Notes", 1000);
    default:
      return text(v, field, 200);
  }
}

function createItem(input: unknown): Item {
  const body = asObject(input);
  const fields = Object.fromEntries(ITEM_FIELDS.map((f) => [f, parseItemField(f, body[f])])) as Partial<Item>;
  const container = findContainer(fields.container_id ?? null);
  if (fields.container_id && !container) throw new DemoError(400, "That location does not exist");
  const item = { ...fields, id: newId(), updated_at: now() } as Item;
  db().items.push(item);
  log("item.create", `Added “${item.name}”${item.quantity ? ` ×${item.quantity}` : ""} to ${where(container)}`);
  return item;
}

const FIELD_LABEL: Partial<Record<ItemField, string>> = { spot: "exact spot" };

function updateItem(id: string, input: unknown): Item {
  const body = asObject(input);
  const fields = ITEM_FIELDS.filter((f) => f in body);
  if (!fields.length) throw new DemoError(400, "Nothing to update");
  const item = findItem(id);
  const before = { ...item };
  const patch = Object.fromEntries(fields.map((f) => [f, parseItemField(f, body[f])])) as Partial<Item>;
  if (patch.status === "Available" && !("taken_by" in body)) patch.taken_by = null;
  if ("container_id" in patch && patch.container_id && !findContainer(patch.container_id)) throw new DemoError(400, "That location does not exist");
  Object.assign(item, patch, { updated_at: now() });

  const keys = Object.keys(patch) as ItemField[];
  const changes: string[] = [];
  for (const k of keys) {
    const a = before[k];
    const b = item[k];
    if ((a ?? null) === (b ?? null)) continue;
    if (k === "container_id") changes.push(`moved from ${where(findContainer(before.container_id))} to ${where(findContainer(item.container_id))}`);
    else if (k === "status")
      changes.push(
        item.status === "Available"
          ? `returned (was ${a}${before.taken_by ? ` by ${before.taken_by}` : ""})`
          : `marked ${b}${item.taken_by ? ` by ${item.taken_by}` : ""}`,
      );
    else if (k === "taken_by") {
      if (!keys.includes("status")) changes.push(b ? `taken by ${b}` : "cleared who has it");
    } else if (k === "reorder") changes.push(b ? "flagged to reorder" : "reorder flag cleared");
    else changes.push(`${FIELD_LABEL[k] ?? k} ${a ?? "-"} → ${b ?? "-"}`);
  }
  if (changes.length) log("item.update", `“${before.name}”: ${changes.join("; ")}`);
  return item;
}

function deleteItem(id: string) {
  const item = findItem(id);
  db().items = db().items.filter((i) => i.id !== id);
  log("item.delete", `Removed “${item.name}” from ${where(findContainer(item.container_id))}`);
}

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------

const CREATABLE: ContainerKind[] = ["box", "top", "floor", "external"];

function parseSlot(body: Input, kind: ContainerKind) {
  if (kind === "box")
    return { gx: intIn(body.gx, "Column", 1, 4), gy: intIn(body.gy, "Level", 1, 4), gz: intIn(body.gz, "Row", 1, 3) };
  if (kind === "top") return { gx: intIn(body.gx, "Cabinet", 1, 4), gy: intIn(body.gy, "Position", 1, 2), gz: null };
  if (kind === "floor") return { gx: intIn(body.gx, "Area", 1, 2), gy: null, gz: null };
  return { gx: null, gy: null, gz: null };
}

const boxAt = (gx: number | null, gy: number | null, gz: number | null, except?: string) =>
  db().containers.find((c) => c.kind === "box" && c.gx === gx && c.gy === gy && c.gz === gz && c.id !== except);

function createContainer(input: unknown): Container {
  const body = asObject(input);
  const kind = oneOf(body.kind, "Type", CREATABLE);
  const name = requiredText(body.name, "Name", 80);
  const style = kind === "box" || kind === "top" ? oneOf(body.style, "Style", BOX_STYLES, "clear") : null;
  const slot = parseSlot(body, kind);
  if (kind === "box" && (!slot.gx || !slot.gy || !slot.gz)) throw new DemoError(400, "Pick a spot on the box wall");
  const place = kind === "external" ? requiredText(body.place, "Room", 80) : null;
  if (kind === "box") {
    const taken = boxAt(slot.gx, slot.gy, slot.gz);
    if (taken) throw new DemoError(409, `That spot already has “${taken.name}”`);
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const c: Container = {
    id: `${kind}-${slug || "new"}-${newId().slice(0, 6)}`,
    kind,
    name,
    style,
    ...slot,
    place,
    status: oneOf(body.status, "Status", STATUSES, "Available"),
    taken_by: text(body.taken_by, "Taken by", 80),
    notes: text(body.notes, "Notes", 1000),
    updated_at: now(),
  };
  db().containers.push(c);
  log("container.create", `Added ${containerLabel(c)}`);
  return c;
}

function updateContainer(id: string, input: unknown): Container {
  const body = asObject(input);
  const c = findContainer(id);
  if (!c) throw new DemoError(404, "That storage spot no longer exists");
  const before = { ...c };

  const patch: Partial<Container> = {};
  if ("name" in body) patch.name = requiredText(body.name, "Name", 80);
  if ("style" in body && (c.kind === "box" || c.kind === "top")) patch.style = oneOf(body.style, "Style", BOX_STYLES);
  if ("status" in body) patch.status = oneOf(body.status, "Status", STATUSES);
  if ("taken_by" in body) patch.taken_by = text(body.taken_by, "Taken by", 80);
  if ("notes" in body) patch.notes = text(body.notes, "Notes", 1000);
  if ("place" in body && c.kind === "external") patch.place = requiredText(body.place, "Room", 80);
  if (patch.status === "Available" && !("taken_by" in body)) patch.taken_by = null;

  let swappedWith: Container | undefined;
  if (["gx", "gy", "gz"].some((k) => k in body) && ["box", "top", "floor"].includes(c.kind)) {
    const slot = parseSlot({ gx: c.gx, gy: c.gy, gz: c.gz, ...body }, c.kind);
    if (c.kind === "box" && (!slot.gx || !slot.gy || !slot.gz)) throw new DemoError(400, "Pick a spot on the box wall");
    if (c.kind === "box") {
      swappedWith = boxAt(slot.gx, slot.gy, slot.gz, id);
      if (swappedWith) Object.assign(swappedWith, { gx: c.gx, gy: c.gy, gz: c.gz, updated_at: now() });
    }
    Object.assign(patch, slot);
  }
  Object.assign(c, patch, { updated_at: now() });

  const changes: string[] = [];
  if (c.name !== before.name) changes.push(`renamed to “${c.name}”`);
  if (c.style !== before.style) changes.push(`style ${before.style ?? "-"} → ${c.style}`);
  if (c.status !== before.status) changes.push(`marked ${c.status}${c.taken_by ? ` by ${c.taken_by}` : ""}`);
  else if (c.taken_by !== before.taken_by) changes.push(c.taken_by ? `taken by ${c.taken_by}` : "cleared who has it");
  if (c.notes !== before.notes) changes.push("notes updated");
  if (c.place !== before.place) changes.push(`room ${before.place} → ${c.place}`);
  if (swappedWith) changes.push(`swapped places with “${swappedWith.name}”`);
  else if (c.gx !== before.gx || c.gy !== before.gy || c.gz !== before.gz) changes.push(`moved to ${containerCode(c) ?? containerLabel(c)}`);
  if (changes.length) log("container.update", `“${before.name}”: ${changes.join("; ")}`);
  return c;
}

function deleteContainer(id: string) {
  const c = findContainer(id);
  if (!c) throw new DemoError(404, "That storage spot no longer exists");
  if (!CREATABLE.includes(c.kind)) throw new DemoError(400, "Drawers and shelves are part of the furniture and can't be deleted. Rename them instead");
  let moved = 0;
  for (const i of db().items)
    if (i.container_id === id) {
      i.container_id = null;
      i.spot ??= `Was in ${c.name}`;
      moved++;
    }
  db().containers = db().containers.filter((x) => x.id !== id);
  log("container.delete", `Removed ${containerLabel(c)}${moved ? `; ${moved} item(s) now have no recorded spot` : ""}`);
}

// ---------------------------------------------------------------------------
// A tiny router so the app can keep calling the same REST-style paths as production.
// ---------------------------------------------------------------------------

export async function demoApi(method: string, url: string, body?: unknown): Promise<unknown> {
  const [, , kind, id] = url.split("/"); // "/api/items/123" → ["", "api", "items", "123"]
  let result: unknown;
  if (kind === "items" && !id && method === "POST") result = createItem(body);
  else if (kind === "items" && id && method === "PATCH") result = updateItem(decodeURIComponent(id), body);
  else if (kind === "items" && id && method === "DELETE") result = deleteItem(decodeURIComponent(id));
  else if (kind === "containers" && !id && method === "POST") result = createContainer(body);
  else if (kind === "containers" && id && method === "PATCH") result = updateContainer(decodeURIComponent(id), body);
  else if (kind === "containers" && id && method === "DELETE") result = deleteContainer(decodeURIComponent(id));
  else throw new DemoError(404, `Unknown demo request ${method} ${url}`);
  save();
  return result ?? { ok: true };
}
