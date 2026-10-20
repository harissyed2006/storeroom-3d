"use client";

import type { Container } from "@/lib/types";
import { FLOOR_AREAS, P, type Vec3 } from "@/lib/layout";
import { handlers, HighlightVolume, HitBox, stateOf, type Interaction } from "./common";

function toWorld(n: number): { min: Vec3; max: Vec3 } {
  const a = FLOOR_AREAS[n] ?? FLOOR_AREAS[1];
  return { min: P(a.min[0], a.min[1], a.max[2]), max: P(a.max[0], a.max[1], a.min[2]) };
}

export function FloorAreas({ containers, ix }: { containers: Container[]; ix: Interaction }) {
  const areas = containers.filter((c) => c.kind === "floor");
  return (
    <group>
      {areas.map((c) => {
        const { min, max } = toWorld(c.gx ?? 1);
        return (
          <group key={c.id}>
            <HitBox min={min} max={max} {...handlers(c.id, ix)} />
            <HighlightVolume min={min} max={max} state={stateOf(c.id, ix)} />
          </group>
        );
      })}
      <Easels />
    </group>
  );
}

const WOOD = "#c9a46a";

/** Easels and a sign board leaning on the front wall by the door. */
function Easels() {
  const leg = (x: number, tilt: number) => (
    <mesh position={P(x, 0.68, 0.11)} rotation-x={tilt} castShadow raycast={() => null}>
      <boxGeometry args={[0.03, 1.4, 0.02]} />
      <meshStandardMaterial color={WOOD} roughness={0.8} />
    </mesh>
  );
  return (
    <group>
      {leg(0.15, -0.12)}
      {leg(0.45, -0.12)}
      {leg(0.3, -0.16)}
      <mesh position={P(0.3, 0.5, 0.16)} rotation-x={-0.12} raycast={() => null}>
        <boxGeometry args={[0.38, 0.03, 0.04]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      {/* sign board */}
      <mesh position={P(0.42, 0.55, 0.06)} rotation-x={-0.08} castShadow raycast={() => null}>
        <boxGeometry args={[0.6, 0.9, 0.01]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      <mesh position={P(0.42, 0.62, 0.068)} rotation-x={-0.08} raycast={() => null}>
        <boxGeometry args={[0.44, 0.12, 0.002]} />
        <meshStandardMaterial color="#0f766e" roughness={0.7} />
      </mesh>
    </group>
  );
}
