export const STATUSES = ["Available", "Taken", "Partly taken", "Missing"] as const;
export type Status = (typeof STATUSES)[number];

/**
 * box      – a tub/carton in the back alcove, placed on the (x, y, z) box-wall grid
 * drawer   – filing cabinet drawer: gx = cabinet (1 = closest to the door), gy = drawer (1 = top)
 * shelf    – a level of the shelving unit: gy = level (1 = top … 4 = bottom), null = not recorded
 * top      – a container sitting on top of filing cabinet gx (gy = 1 front, 2 back)
 * floor    – an area of floor inside the storeroom
 * external – somewhere outside the storeroom (office cabinets, reception …)
 */
export const CONTAINER_KINDS = ["box", "drawer", "shelf", "top", "floor", "external"] as const;
export type ContainerKind = (typeof CONTAINER_KINDS)[number];

export const BOX_STYLES = ["black", "grey", "clear", "pink", "cardboard", "bag"] as const;
export type BoxStyle = (typeof BOX_STYLES)[number];

export const BOX_STYLE_LABELS: Record<BoxStyle, string> = {
  black: "Black tub",
  grey: "Grey tub",
  clear: "Clear tub",
  pink: "Clear tub (pink lid)",
  cardboard: "Cardboard box",
  bag: "Bag",
};

export interface Container {
  id: string;
  kind: ContainerKind;
  name: string;
  style: BoxStyle | null;
  gx: number | null;
  gy: number | null;
  gz: number | null;
  place: string | null;
  status: Status;
  taken_by: string | null;
  notes: string | null;
  updated_at: string;
}

export interface Item {
  id: string;
  name: string;
  category: string | null;
  quantity: string | null;
  container_id: string | null;
  spot: string | null;
  status: Status;
  taken_by: string | null;
  condition: string | null;
  notes: string | null;
  reorder: boolean;
  updated_at: string;
}

export interface Activity {
  id: number;
  at: string;
  actor: string | null;
  action: string;
  summary: string;
}

/** The production version has owner / admin / member roles; the demo always runs as an admin. */
export type Role = "owner" | "admin" | "member";

export interface Viewer {
  email: string;
  name: string;
  role: Role;
}

export interface StoreState {
  containers: Container[];
  items: Item[];
  activity: Activity[];
  me: Viewer;
}

export const CATEGORY_SUGGESTIONS = ["AV", "CATERING", "CRAFT", "DECOR", "EVENTS", "MERCH", "OFFICE", "SAFETY", "SIGNAGE", "TECH"];
