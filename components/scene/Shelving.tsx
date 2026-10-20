"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { Container } from "@/lib/types";
import { P, SHELVING, type Vec3 } from "@/lib/layout";
import { handlers, HighlightVolume, HitBox, stateOf, type Interaction } from "./common";
import { labelTexture } from "./labels";

const STEEL = "#1d1f22";
const DECK = "#d8b884";
const { x0, deep, d0, length, height, post, levels } = SHELVING;
const front = x0 + deep;

/** Local helper: a mesh from (x, y, d) min/max corners. */
function Block({ a, b, color, roughness = 0.6, metalness = 0 }: { a: Vec3; b: Vec3; color: string; roughness?: number; metalness?: number }) {
  const size: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  return (
    <mesh position={P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)} castShadow receiveShadow raycast={() => null}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

function Frame() {
  const posts: [number, number][] = [
    [x0, d0],
    [front - post, d0],
    [x0, d0 + length - post],
    [front - post, d0 + length - post],
  ];
  return (
    <group>
      {posts.map(([x, d], i) => (
        <Block key={i} a={[x, 0, d]} b={[x + post, height, d + post]} color={STEEL} metalness={0.5} roughness={0.45} />
      ))}
      {levels.slice(1).map((y, i) => (
        <group key={i}>
          {/* front & back beams */}
          <Block a={[front - post, y - 0.05, d0]} b={[front, y, d0 + length]} color={STEEL} metalness={0.5} roughness={0.45} />
          <Block a={[x0, y - 0.05, d0]} b={[x0 + post, y, d0 + length]} color={STEEL} metalness={0.5} roughness={0.45} />
          {/* MDF deck */}
          <Block a={[x0 + 0.005, y, d0 + 0.005]} b={[front - 0.005, y + 0.016, d0 + length - 0.005]} color={DECK} roughness={0.9} />
        </group>
      ))}
    </group>
  );
}

function Level({ c, ix, count }: { c: Container; ix: Interaction; count: number }) {
  const lvl = c.gy!;
  const y = levels[lvl];
  const top = lvl === 1 ? y + 0.45 : levels[lvl - 1] - 0.05;
  const state = stateOf(c.id, ix);
  const label = useMemo(
    () => labelTexture(c.name, { aspect: 3.4, sub: count ? `${count} item${count === 1 ? "" : "s"}` : null }),
    [c.name, count],
  );
  const min: Vec3 = P(x0, y + 0.016, d0 + length);
  const max: Vec3 = P(front, top, d0);
  return (
    <group>
      <HitBox min={min} max={max} {...handlers(c.id, ix)} />
      <HighlightVolume min={min} max={max} state={state} />
      {/* label stuck on the front beam */}
      <mesh position={P(front + 0.001, y - 0.025, d0 + 0.32)} rotation-y={Math.PI / 2} raycast={() => null}>
        <planeGeometry args={[0.2, 0.059]} />
        <meshBasicMaterial map={label} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Shelving({ containers, ix, counts }: { containers: Container[]; ix: Interaction; counts: Map<string, number> }) {
  const shelves = containers.filter((c) => c.kind === "shelf" && c.gy && levels[c.gy] !== undefined);
  return (
    <group>
      <Frame />
      {shelves.map((s) => (
        <Level key={s.id} c={s} ix={ix} count={counts.get(s.id) ?? 0} />
      ))}
      <ShelfStuff />
    </group>
  );
}

/** Things on the shelves, modelled on the photo of the storeroom. Purely visual. */
function ShelfStuff() {
  const L = levels;
  const bag = (x: number, y: number, d: number, size: Vec3, color = "#141518", rot = 0) => (
    <RoundedBox
      args={size}
      radius={Math.min(...size) * 0.35}
      smoothness={3}
      position={P(x, y + size[1] / 2, d)}
      rotation-y={rot}
      castShadow
      raycast={() => null}
    >
      <meshStandardMaterial color={color} roughness={0.85} />
    </RoundedBox>
  );
  const box = (x: number, y: number, d: number, size: Vec3, color: string, opacity = 1) => (
    <mesh position={P(x, y + size[1] / 2, d)} castShadow raycast={() => null}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={opacity < 1 ? 0.2 : 0.9} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
  const cyl = (x: number, y: number, d: number, r: number, h: number, color: string, rotZ = 0) => (
    <mesh position={P(x, y + (rotZ ? r : h / 2), d)} rotation-z={rotZ} castShadow raycast={() => null}>
      <cylinderGeometry args={[r, r, h, 24]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
  const y1 = L[1] + 0.016;
  const y2 = L[2] + 0.016;
  const y3 = L[3] + 0.016;
  const y4 = L[4] + 0.016;
  return (
    <group>
      {/* Top: rolled black screens / banner bags and a clear tub */}
      {bag(0.3, y1, d0 + 0.45, [0.5, 0.2, 0.75])}
      {bag(0.32, y1 + 0.2, d0 + 0.55, [0.42, 0.16, 0.6], "#1d1e22", 0.2)}
      {box(0.33, y1, d0 + 1.3, [0.48, 0.32, 0.5], "#e4eaee", 0.55)}
      {bag(0.35, y1, d0 + 1.66, [0.4, 0.12, 0.25], "#222428")}
      {/* Level 2: podcast stands and long black bags */}
      {bag(0.3, y2, d0 + 0.5, [0.45, 0.24, 0.85])}
      {bag(0.36, y2, d0 + 1.3, [0.4, 0.14, 0.9], "#1a1b1f")}
      {cyl(0.5, y2, d0 + 1.0, 0.012, 1.0, "#2b2d31", Math.PI / 2)}
      {/* Level 3: projector box, clear tub, extension reel, cooler */}
      {box(0.32, y3, d0 + 0.25, [0.44, 0.28, 0.4], "#c09a64")}
      {box(0.3, y3, d0 + 0.72, [0.45, 0.28, 0.48], "#e8edf0", 0.55)}
      {cyl(0.35, y3, d0 + 1.12, 0.14, 0.12, "#f2c40f", Math.PI / 2)}
      {cyl(0.36, y3, d0 + 1.45, 0.09, 0.2, "#1e3a8a")}
      {cyl(0.36, y3 + 0.2, d0 + 1.45, 0.092, 0.04, "#f8fafc")}
      {/* Bottom: grey tub with yellow leads and soft bags */}
      {box(0.32, y4, d0 + 0.3, [0.45, 0.32, 0.5], "#4b5056")}
      {cyl(0.3, y4 + 0.3, d0 + 0.3, 0.12, 0.05, "#eab308")}
      {bag(0.33, y4, d0 + 0.95, [0.42, 0.22, 0.55], "#3b2f63")}
      {bag(0.32, y4, d0 + 1.5, [0.44, 0.3, 0.55])}
      {/* Floor under the bottom deck */}
      {bag(0.33, 0, d0 + 0.6, [0.45, 0.24, 0.7], "#121316")}
      {bag(0.3, 0, d0 + 1.35, [0.4, 0.22, 0.6], "#121316")}
    </group>
  );
}
