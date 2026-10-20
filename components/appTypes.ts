import type { Container, Item, StoreState, Viewer } from "@/lib/types";

/** Pseudo container id for items that have no recorded spot. */
export const NO_SPOT = "__none";

/** Everything the panels need from the main app. */
export interface AppCtx {
  state: StoreState;
  byId: Map<string, Container>;
  counts: Map<string, number>;
  me: Viewer;
  /** Admins and the owner: add, edit and delete. Everyone signed in can take, return and move boxes. */
  canEdit: boolean;
  selectedItemId: string | null;
  select(id: string | null, itemId?: string | null): void;
  openItemForm(opts: { item?: Item; containerId?: string | null }): void;
  openContainerForm(opts: { container?: Container; kind?: "box" | "external" }): void;
  patchItem(item: Item, patch: Partial<Item>): Promise<void>;
  takeItem(item: Item): void;
  takeContainer(c: Container): void;
  returnContainer(c: Container): void;
  startMove(c: Container): void;
  removeContainer(c: Container): void;
}
