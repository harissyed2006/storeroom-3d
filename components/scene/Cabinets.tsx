"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Container } from "@/lib/types";
import { CABINETS, cabinetDepth, CABINET_FRONT_X, DRAWER_H, drawerCenterY, P, ROOM, topSpot } from "@/lib/layout";
import { handlers, SELECT_COLOR, SmartMaterial, stateOf, type Interaction } from "./common";
import { labelTexture } from "./labels";

const OPEN = 0.42;

function Drawer({ cab, c, ix, count, color, fade }: { cab: number; c: Container; ix: Interaction; count: number; color: string; fade: number }) {
  const group = useRef<THREE.Group>(null);
  const state = stateOf(c.id, ix);
  const open = state === "selected";
  const along = CABINETS.along - 0.04;
  const h = DRAWER_H - 0.018;
  const dark = cab === 3;
  const label = useMemo(
    () =>
      labelTexture(c.name.startsWith("Drawer ") ? "-" : c.name, {
        aspect: 2.4,
        sub: `${c.gx}.${c.gy}${count ? ` · ${count}` : ""}`,
        accent: c.status !== "Available" ? "#dc2626" : null,
      }),
    [c, count],
  );

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const target = open ? -OPEN : 0;
    g.position.x += (target - g.position.x) * 0.15;
  });

  return (
    <group ref={group} {...handlers(c.id, ix)}>
      <group position={[-CABINETS.deep / 2, drawerCenterY(c.gy!), 0]}>
        {/* drawer front */}
        <mesh position={[-0.01, 0, 0]} castShadow>
          <boxGeometry args={[0.02, h, along]} />
          <SmartMaterial color={color} state={state} roughness={0.5} metalness={0.25} opacity={fade} />
          {state === "selected" && <Edges color={SELECT_COLOR} />}
        </mesh>
        {fade < 1 ? null : (
          <>
        {/* handle */}
        <mesh position={[-0.035, -h * 0.08, 0]}>
          <boxGeometry args={[0.025, 0.025, 0.15]} />
          <meshStandardMaterial color={dark ? "#9aa0a6" : "#6b6f73"} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* label holder */}
        <mesh position={[-0.0205, h * 0.22, 0]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.2, 0.083]} />
          <meshBasicMaterial map={label} toneMapped={false} />
        </mesh>
        {/* open-top drawer tray, visible when pulled out */}
        <Tray color={dark ? "#3b3f45" : "#bdb39a"} height={h - 0.03} width={along - 0.04} />
        {open && count > 0 && <DrawerContents count={count} floor={-(h - 0.03) / 2} />}
          </>
        )}
      </group>
    </group>
  );
}

function Tray({ color, height, width }: { color: string; height: number; width: number }) {
  const L = CABINETS.deep - 0.06;
  const t = 0.01;
  const parts: { pos: [number, number, number]; size: [number, number, number] }[] = [
    { pos: [L / 2, -height / 2 + t / 2, 0], size: [L, t, width] },
    { pos: [L / 2, 0, width / 2 - t / 2], size: [L, height, t] },
    { pos: [L / 2, 0, -width / 2 + t / 2], size: [L, height, t] },
    { pos: [L - t / 2, 0, 0], size: [t, height, width] },
  ];
  return (
    <group>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos} raycast={() => null}>
          <boxGeometry args={p.size} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** A few folders/boxes inside an open drawer so it doesn't look empty. */
function DrawerContents({ count, floor }: { count: number; floor: number }) {
  const n = Math.min(count, 5);
  return (
    <group position={[0.1, floor + 0.045, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[i * 0.08, 0, i % 2 ? 0.09 : -0.09]} raycast={() => null}>
          <boxGeometry args={[0.07, 0.07, 0.22]} />
          <meshStandardMaterial color={["#334155", "#e2e8f0", "#ca8a04", "#7c3aed", "#0f766e"][i]} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function TopContainer({ c, ix, count }: { c: Container; ix: Interaction; count: number }) {
  const state = stateOf(c.id, ix);
  const p = topSpot(c.gx!, c.gy);
  const label = useMemo(() => labelTexture(c.name, { aspect: 2.2, sub: count ? `${count} items` : null }), [c.name, count]);
  const w = 0.36;
  const h = 0.15;
  const d = 0.25;
  return (
    <group position={[p[0], p[1] + h / 2, p[2]]} {...handlers(c.id, ix)}>
      <mesh castShadow>
        <boxGeometry args={[w, h, d]} />
        <SmartMaterial color="#dfe7ec" state={state} opacity={0.6} roughness={0.2} />
        {state === "selected" && <Edges color={SELECT_COLOR} />}
      </mesh>
      <mesh position={[0, -0.02, 0]} raycast={() => null}>
        <boxGeometry args={[w * 0.85, h * 0.6, d * 0.8]} />
        <meshStandardMaterial color={c.name.toLowerCase().includes("stamp") ? "#475569" : "#f472b6"} roughness={0.8} />
      </mesh>
      {/* label on the aisle-facing side */}
      <mesh position={[-w / 2 - 0.002, 0, 0]} rotation-y={-Math.PI / 2} raycast={() => null}>
        <planeGeometry args={[d * 0.9, h * 0.8]} />
        <meshBasicMaterial map={label} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** xray makes the cabinets nearest the alcove see-through so the box wall behind them can be seen. */
export function Cabinets({ containers, ix, counts, xray }: { containers: Container[]; ix: Interaction; counts: Map<string, number>; xray: boolean }) {
  const drawers = containers.filter((c) => c.kind === "drawer" && c.gx && c.gy);
  const tops = containers.filter((c) => c.kind === "top" && c.gx);
  const x = ROOM.width - CABINETS.deep / 2;
  return (
    <group>
      {Array.from({ length: CABINETS.count }, (_, i) => {
        const cab = i + 1;
        const color = CABINETS.colors[i];
        const fade = xray && cab >= 3 ? 0.15 : 1;
        return (
          <group key={cab} position={P(x, 0, cabinetDepth(cab))}>
            {/* carcass */}
            <mesh position={[0.01, CABINETS.height / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[CABINETS.deep - 0.02, CABINETS.height, CABINETS.along]} />
              <meshStandardMaterial key={fade} color={color} roughness={0.55} metalness={0.25} transparent={fade < 1} opacity={fade} depthWrite={fade === 1} />
            </mesh>
            {/* recessed plinth */}
            <mesh position={[-CABINETS.deep / 2 + 0.02, CABINETS.plinth / 2, 0]}>
              <boxGeometry args={[0.02, CABINETS.plinth, CABINETS.along - 0.02]} />
              <meshStandardMaterial color="#3a3d42" roughness={0.8} />
            </mesh>
            {drawers
              .filter((d) => d.gx === cab)
              .map((d) => (
                <Drawer key={d.id} cab={cab} c={d} ix={ix} count={counts.get(d.id) ?? 0} color={color} fade={fade} />
              ))}
          </group>
        );
      })}
      {tops.map((t) => (
        <TopContainer key={t.id} c={t} ix={ix} count={counts.get(t.id) ?? 0} />
      ))}
      {!xray && <CabinetClutter />}
    </group>
  );
}

/** Things that live on the cabinets in the photos: hand sanitiser, a backpack, a pile of papers. */
function CabinetClutter() {
  const x = ROOM.width - CABINETS.deep / 2;
  const top = CABINETS.height;
  return (
    <group raycast={() => null}>
      {/* sanitiser on cabinet 2 */}
      <group position={P(x - 0.12, top, cabinetDepth(2) + 0.12)}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.16, 16]} />
          <meshStandardMaterial color="#d9f99d" transparent opacity={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.012, 0.015, 0.05, 8]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
      </group>
      {/* black backpack on cabinet 1 */}
      <RoundedBox args={[0.3, 0.36, 0.4]} radius={0.1} smoothness={4} position={P(x + 0.04, top + 0.17, cabinetDepth(1) - 0.02)} rotation={[0, 0.35, 0.12]} castShadow>
        <meshStandardMaterial color="#141518" roughness={0.9} />
      </RoundedBox>
      {/* papers on cabinet 4 */}
      <mesh position={P(x + 0.02, top + 0.03, cabinetDepth(4))} castShadow>
        <boxGeometry args={[0.42, 0.06, 0.5]} />
        <meshStandardMaterial color="#f4f1e8" roughness={0.9} />
      </mesh>
      <mesh position={P(CABINET_FRONT_X + 0.15, top + 0.07, cabinetDepth(4) - 0.1)} rotation-z={0.05}>
        <boxGeometry args={[0.3, 0.02, 0.32]} />
        <meshStandardMaterial color="#facc15" roughness={0.9} />
      </mesh>
    </group>
  );
}
