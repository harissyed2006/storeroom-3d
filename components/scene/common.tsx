"use client";

import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import type { Vec3 } from "@/lib/layout";

export type HighlightState = "none" | "hover" | "hit" | "selected";

export interface Interaction {
  selectedId: string | null;
  hoverId: string | null;
  hitIds: Set<string>;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function stateOf(id: string, ix: Interaction): HighlightState {
  if (ix.selectedId === id) return "selected";
  if (ix.hitIds.has(id)) return "hit";
  if (ix.hoverId === id) return "hover";
  return "none";
}

/** Pointer handlers for a clickable container (stop propagation so the nearest object wins). */
export function handlers(id: string, ix: Interaction) {
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      ix.onSelect(id);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      ix.onHover(id);
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      ix.onHover(null);
      document.body.style.cursor = "";
    },
  };
}

export const SELECT_COLOR = "#f59e0b";
const HIT_COLOR = "#22d3ee";

/** Standard material that glows when hovered, selected or matched by search. */
export function SmartMaterial({
  color,
  state = "none",
  opacity = 1,
  roughness = 0.8,
  metalness = 0,
  side,
}: {
  color: string;
  state?: HighlightState;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  side?: THREE.Side;
}) {
  const ref = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    if (state === "selected") {
      m.emissive.set(SELECT_COLOR);
      m.emissiveIntensity = 0.45;
    } else if (state === "hit") {
      m.emissive.set(HIT_COLOR);
      m.emissiveIntensity = 0.3 + 0.25 * Math.sin(clock.elapsedTime * 5);
    } else if (state === "hover") {
      m.emissive.set("#ffffff");
      m.emissiveIntensity = 0.14;
    } else {
      m.emissiveIntensity = 0;
    }
  });
  // three.js bakes "opaque" into the shader, so switching transparency needs a fresh material (hence the key).
  return (
    <meshStandardMaterial
      key={opacity < 1 ? "t" : "o"}
      ref={ref}
      color={color}
      roughness={roughness}
      metalness={metalness}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity > 0.5}
      side={side}
    />
  );
}

/** Translucent box used to show a selected/hovered region (shelf level, floor area). */
export function HighlightVolume({ min, max, state }: { min: Vec3; max: Vec3; state: HighlightState }) {
  if (state === "none") return null;
  const size: Vec3 = [max[0] - min[0], max[1] - min[1], Math.abs(max[2] - min[2])];
  const center: Vec3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  const color = state === "selected" ? SELECT_COLOR : state === "hit" ? HIT_COLOR : "#ffffff";
  return (
    <mesh position={center} raycast={() => null} renderOrder={10}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} transparent opacity={state === "hover" ? 0.1 : 0.22} depthWrite={false} />
      {state !== "hover" && <Edges color={color} />}
    </mesh>
  );
}

/** Invisible but clickable box. */
export function HitBox({ min, max, ...rest }: { min: Vec3; max: Vec3 } & ReturnType<typeof handlers>) {
  const size: Vec3 = [max[0] - min[0], max[1] - min[1], Math.abs(max[2] - min[2])];
  const center: Vec3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  return (
    <mesh position={center} {...rest}>
      <boxGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}
