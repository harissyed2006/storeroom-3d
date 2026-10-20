/**
 * Physical layout of the storeroom, in metres.
 *
 * These measurements were estimated from the photo and walkthrough videos
 * (a standard 1.8 m boltless shelving unit, 4-drawer filing cabinets, 600 mm
 * ceiling tiles). Tweak them here once the room has been measured with a tape;
 * everything in the 3D view is derived from these numbers.
 *
 * Coordinates: x runs left → right as you stand in the doorway, y is height,
 * d is depth from the door wall into the room. three.js uses z = -d.
 */
import type { Container } from "./types";

export type Vec3 = [number, number, number];

export const ROOM = { width: 2.4, depth: 2.9, height: 2.45, wall: 0.1 };

/** Door in the front wall, centred on the walkway. */
export const DOOR = { x: 1.2, width: 0.85, height: 2.04 };

/** Low recess under the back wall where the tubs are stacked. */
export const ALCOVE = { x0: 0.04, x1: 2.36, height: 1.15, depth: 1.42 };

/** Box grid in the alcove: x = column from left (1-4), y = level from floor (1-4), z = row from front (1-3). */
export const GRID = { cols: 4, rows: 4, layers: 3, x0: 0.08, cellW: 0.56, cellH: 0.282, cellD: 0.46, inset: 0.03 };

/** Black boltless shelving along the left wall. levels[n] = deck height of level n (1 = top). */
export const SHELVING = { x0: 0.03, deep: 0.6, d0: 0.25, length: 1.8, height: 2.0, post: 0.04, levels: [0, 1.86, 1.34, 0.82, 0.3] };

/** Four filing cabinets along the right wall, drawers facing the walkway. Cabinet 1 is closest to the door. */
export const CABINETS = {
  count: 4,
  deep: 0.62,
  along: 0.6,
  gap: 0.03,
  d0: 0.3,
  height: 1.32,
  plinth: 0.06,
  top: 0.03,
  drawers: 4,
  colors: ["#dcd2b6", "#d6cbad", "#2f3237", "#a9adb2"],
};

/** Floor areas (x, y, d boxes). 1 = by the door, 2 = back-left corner with the banner poles. */
export const FLOOR_AREAS: Record<number, { min: Vec3; max: Vec3 }> = {
  1: { min: [0.04, 0, 0.03], max: [0.72, 1.55, 0.23] },
  2: { min: [0.04, 0, 2.08], max: [0.66, 2.05, 2.88] },
};

/** Convert room coordinates (x, y, depth) to three.js world coordinates. */
export const P = (x: number, y: number, d: number): Vec3 => [x, y, -d];

export const DRAWER_H = (CABINETS.height - CABINETS.plinth - CABINETS.top) / CABINETS.drawers;
export const CABINET_FRONT_X = ROOM.width - CABINETS.deep;

export function boxCenter(gx: number, gy: number, gz: number): Vec3 {
  return P(GRID.x0 + (gx - 0.5) * GRID.cellW, (gy - 0.5) * GRID.cellH, ROOM.depth + GRID.inset + (gz - 0.5) * GRID.cellD);
}

export function cabinetDepth(i: number): number {
  return CABINETS.d0 + (i - 1) * (CABINETS.along + CABINETS.gap) + CABINETS.along / 2;
}

export function drawerCenterY(gy: number): number {
  return CABINETS.plinth + (CABINETS.drawers - gy + 0.5) * DRAWER_H;
}

export function topSpot(gx: number, gy: number | null): Vec3 {
  return P(ROOM.width - CABINETS.deep / 2, CABINETS.height, cabinetDepth(gx) + (gy === 2 ? 0.15 : -0.13));
}

function areaCenter(n: number): Vec3 {
  const a = FLOOR_AREAS[n] ?? FLOOR_AREAS[1];
  return P((a.min[0] + a.max[0]) / 2, Math.min(1, (a.min[1] + a.max[1]) / 2), (a.min[2] + a.max[2]) / 2);
}

/** A point on/in the container, used for tooltips and camera targets. */
export function anchorOf(c: Container): Vec3 | null {
  switch (c.kind) {
    case "box":
      return c.gx && c.gy && c.gz ? boxCenter(c.gx, c.gy, c.gz) : null;
    case "drawer":
      return c.gx && c.gy ? P(CABINET_FRONT_X, drawerCenterY(c.gy), cabinetDepth(c.gx)) : null;
    case "shelf":
      return P(SHELVING.x0 + SHELVING.deep / 2, c.gy ? SHELVING.levels[c.gy] + 0.18 : 1.0, SHELVING.d0 + SHELVING.length / 2);
    case "top": {
      if (!c.gx) return null;
      const p = topSpot(c.gx, c.gy);
      return [p[0], p[1] + 0.1, p[2]];
    }
    case "floor":
      return areaCenter(c.gx ?? 1);
    default:
      return null;
  }
}

export interface CameraView {
  pos: Vec3;
  target: Vec3;
}

/** Where the camera flies to when a container is selected. */
export function focusOf(c: Container): CameraView | null {
  const a = anchorOf(c);
  if (!a) return null;
  switch (c.kind) {
    case "box": {
      // Stand a little to one side so the cabinets don't block the right-hand columns.
      const camX = a[0] < ROOM.width / 2 ? a[0] + 0.35 : a[0] - 0.6;
      return { pos: [camX, a[1] + 0.55, -(ROOM.depth - 1.25)], target: a };
    }
    case "drawer":
      return { pos: [CABINET_FRONT_X - 1.2, a[1] + 0.6, a[2] + 0.35], target: [CABINET_FRONT_X - 0.25, a[1], a[2]] };
    case "shelf":
      return c.gy
        ? { pos: [1.72, a[1] + 0.4, a[2]], target: [SHELVING.x0 + 0.3, a[1] - 0.05, a[2]] }
        : VIEWS.shelving;
    case "top":
      return { pos: [ROOM.width - 1.45, a[1] + 0.75, a[2] + 0.55], target: a };
    case "floor":
      return c.gx === 2
        ? { pos: [1.55, 1.7, -1.0], target: [0.35, 0.6, -2.45] }
        : { pos: [1.6, 1.55, -1.75], target: [0.35, 0.55, -0.15] };
    default:
      return null;
  }
}

export const VIEWS = {
  // From above the doorway, slightly right, so the box wall is visible down the walkway.
  overview: { pos: P(ROOM.width + 0.3, 3.5, -3.4), target: P(ROOM.width / 2 - 0.05, 0.45, ROOM.depth * 0.66) },
  door: { pos: P(DOOR.x + 0.05, 1.6, -0.45), target: P(DOOR.x + 0.05, 0.95, ROOM.depth) },
  boxes: { pos: P(ROOM.width / 2, 1.05, ROOM.depth - 1.85), target: P(ROOM.width / 2, 0.5, ROOM.depth + 0.5) },
  shelving: { pos: P(3.25, 2.65, SHELVING.d0 + SHELVING.length / 2), target: P(0.35, 0.95, SHELVING.d0 + SHELVING.length / 2) },
  cabinets: { pos: P(1.0, 1.95, -1.25), target: P(2.0, 0.6, 1.75) },
  // Nearly straight down (exactly vertical confuses the orbit controls), door at the bottom of the screen.
  plan: { pos: P(ROOM.width / 2, 6.4, ROOM.depth / 2 + 0.3), target: P(ROOM.width / 2, 0, ROOM.depth / 2 + 0.55) },
} satisfies Record<string, CameraView>;

export type ViewName = keyof typeof VIEWS;

export const VIEW_LABELS: Record<ViewName, string> = {
  overview: "Overview",
  door: "From the door",
  boxes: "Box wall",
  shelving: "Shelving",
  cabinets: "Cabinets",
  plan: "Floor plan",
};
