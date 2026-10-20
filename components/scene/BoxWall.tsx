"use client";

import { useMemo } from "react";
import { Edges, RoundedBox } from "@react-three/drei";
import type { BoxStyle, Container } from "@/lib/types";
import { boxCenter, GRID } from "@/lib/layout";
import { containerCode } from "@/lib/format";
import { handlers, SELECT_COLOR, SmartMaterial, stateOf, type HighlightState, type Interaction } from "./common";
import { labelTexture } from "./labels";

interface StyleDef {
  body: string;
  lid: string;
  bodyOpacity: number;
  lidOpacity: number;
  contents?: string;
  label: { bg: string; fg: string };
  roughness: number;
}

const STYLES: Record<BoxStyle, StyleDef> = {
  black: { body: "#1c1d20", lid: "#26282c", bodyOpacity: 1, lidOpacity: 1, label: { bg: "#bcd8f0", fg: "#0b1726" }, roughness: 0.55 },
  grey: { body: "#5a5f65", lid: "#676d74", bodyOpacity: 1, lidOpacity: 1, label: { bg: "#ffffff", fg: "#111827" }, roughness: 0.6 },
  clear: { body: "#dde4e9", lid: "#eef2f5", bodyOpacity: 0.5, lidOpacity: 0.8, contents: "#c9b9a2", label: { bg: "#ffffff", fg: "#111827" }, roughness: 0.25 },
  pink: { body: "#dde4e9", lid: "#e9a3bb", bodyOpacity: 0.5, lidOpacity: 0.9, contents: "#eab0c4", label: { bg: "#ffffff", fg: "#831843" }, roughness: 0.25 },
  cardboard: { body: "#b8874f", lid: "#c49659", bodyOpacity: 1, lidOpacity: 1, label: { bg: "#f3e8d2", fg: "#1f2937" }, roughness: 0.95 },
  bag: { body: "#2a2f3a", lid: "#2a2f3a", bodyOpacity: 1, lidOpacity: 1, label: { bg: "#ffffff", fg: "#111827" }, roughness: 0.9 },
};

const W = GRID.cellW - 0.05;
const H = GRID.cellH - 0.014;
const D = GRID.cellD - 0.05;
const LID = 0.03;

function Box({ c, ix, ghost, count }: { c: Container; ix: Interaction; ghost: boolean; count: number }) {
  const style = STYLES[c.style ?? "clear"] ?? STYLES.clear;
  const state: HighlightState = ghost ? "none" : stateOf(c.id, ix);
  const pos = boxCenter(c.gx!, c.gy!, c.gz!);
  const taken = c.status !== "Available";
  const label = useMemo(
    () =>
      labelTexture(c.name, {
        aspect: 2.1,
        bg: style.label.bg,
        fg: style.label.fg,
        sub: `${containerCode(c)}${count ? ` · ${count} item${count === 1 ? "" : "s"}` : ""}`,
        accent: taken ? "#dc2626" : null,
      }),
    [c, count, style, taken],
  );
  const fade = ghost ? 0.07 : 1;
  const events = ghost ? {} : handlers(c.id, ix);
  const noRay = ghost ? () => null : undefined;

  if (c.style === "bag") {
    return (
      <group position={pos} {...events}>
        <RoundedBox args={[W, H * 0.85, D]} radius={0.06} smoothness={3} position={[0, -H * 0.07, 0]} castShadow raycast={noRay}>
          <SmartMaterial color={style.body} state={state} opacity={fade} roughness={style.roughness} />
        </RoundedBox>
        {!ghost && (
          <mesh position={[0, -H * 0.05, D / 2 + 0.002]}>
            <planeGeometry args={[W * 0.78, H * 0.55]} />
            <meshBasicMaterial map={label} toneMapped={false} />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <group position={pos} {...events}>
      {/* body */}
      <mesh position={[0, -LID / 2, 0]} castShadow={!ghost} receiveShadow raycast={noRay}>
        <boxGeometry args={[W, H - LID, D]} />
        <SmartMaterial color={style.body} state={state} opacity={style.bodyOpacity * fade} roughness={style.roughness} />
        {state === "selected" && <Edges color={SELECT_COLOR} lineWidth={2} />}
      </mesh>
      {/* contents visible through clear tubs */}
      {style.contents && !ghost && (
        <mesh position={[0, -LID - 0.02, 0]} raycast={() => null}>
          <boxGeometry args={[W * 0.85, (H - LID) * 0.7, D * 0.85]} />
          <meshStandardMaterial color={style.contents} roughness={0.9} />
        </mesh>
      )}
      {/* lid */}
      <mesh position={[0, H / 2 - LID / 2, 0]} castShadow={!ghost} raycast={noRay}>
        <boxGeometry args={[W + 0.014, LID, D + 0.014]} />
        <SmartMaterial color={style.lid} state={state} opacity={style.lidOpacity * fade} roughness={style.roughness} />
      </mesh>
      {/* tape across cardboard */}
      {c.style === "cardboard" && !ghost && (
        <mesh position={[0, H / 2 + 0.001, 0]} raycast={() => null}>
          <boxGeometry args={[0.06, 0.002, D + 0.016]} />
          <meshStandardMaterial color="#d9b77d" roughness={0.6} />
        </mesh>
      )}
      {/* front label */}
      {!ghost && (
        <mesh position={[0, -LID / 2, D / 2 + 0.002]} raycast={() => null}>
          <planeGeometry args={[W * 0.82, (H - LID) * 0.62]} />
          <meshBasicMaterial map={label} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** Ghost outline of an empty slot, shown while moving or adding a box. */
function EmptySlot({ gx, gy, gz, onPick }: { gx: number; gy: number; gz: number; onPick: (gx: number, gy: number, gz: number) => void }) {
  return (
    <mesh
      position={boxCenter(gx, gy, gz)}
      onClick={(e) => {
        e.stopPropagation();
        onPick(gx, gy, gz);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <boxGeometry args={[W, H, D]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.12} depthWrite={false} />
      <Edges color="#22d3ee" />
    </mesh>
  );
}

export function BoxWall({
  boxes,
  ix,
  peel,
  counts,
  pickSlot,
}: {
  boxes: Container[];
  ix: Interaction;
  /** boxes in rows in front of this row (1 = front) are ghosted so hidden boxes can be seen */
  peel: number;
  counts: Map<string, number>;
  /** when set, empty slots in the peeled row are shown and clickable */
  pickSlot?: ((gx: number, gy: number, gz: number) => void) | null;
}) {
  const placed = boxes.filter((b) => b.gx && b.gy && b.gz);
  const occupied = new Set(placed.map((b) => `${b.gx},${b.gy},${b.gz}`));
  const empties: [number, number, number][] = [];
  if (pickSlot) {
    for (let gx = 1; gx <= GRID.cols; gx++)
      for (let gy = 1; gy <= GRID.rows; gy++) if (!occupied.has(`${gx},${gy},${peel}`)) empties.push([gx, gy, peel]);
  }
  return (
    <group>
      {placed.map((b) => (
        <Box key={b.id} c={b} ix={ix} ghost={b.gz! < peel} count={counts.get(b.id) ?? 0} />
      ))}
      {pickSlot && empties.map(([x, y, z]) => <EmptySlot key={`${x},${y},${z}`} gx={x} gy={y} gz={z} onPick={pickSlot} />)}
    </group>
  );
}
