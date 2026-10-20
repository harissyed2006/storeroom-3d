"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ALCOVE, DOOR, P, ROOM, type Vec3 } from "@/lib/layout";
import { labelTexture } from "./labels";

const WALL = "#e8e2cf";
const WALL_ALCOVE = "#d5cdb8";
const FLOOR = "#a3a6a7";
const T = ROOM.wall;

/**
 * A wall slab that fades out when the camera is on its outside, so the room
 * always reads like a dollhouse with the near walls cut away.
 */
function Wall({ min, max, normal, color = WALL }: { min: Vec3; max: Vec3; normal: Vec3; color?: string }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const size: Vec3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const center = useMemo(
    () => new THREE.Vector3((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2),
    [min, max],
  );
  const n = useMemo(() => new THREE.Vector3(...normal), [normal]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    const m = mat.current;
    if (!m) return;
    // Interior face of the slab: centre pushed half a thickness along the inward normal.
    const half = Math.abs(n.x) * size[0] + Math.abs(n.y) * size[1] + Math.abs(n.z) * size[2];
    tmp.copy(camera.position).sub(center).addScaledVector(n, -half / 2);
    const outside = tmp.dot(n) < 0;
    const target = outside ? 0.07 : 1;
    m.opacity += (target - m.opacity) * 0.2;
    m.depthWrite = m.opacity > 0.9;
  });

  return (
    <mesh position={center} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial ref={mat} color={color} roughness={0.95} transparent opacity={1} />
    </mesh>
  );
}

/** Convert (x, y, d) corner pairs into three.js min/max (z is negated so min/max swap). */
function slab(x0: number, y0: number, d0: number, x1: number, y1: number, d1: number): { min: Vec3; max: Vec3 } {
  return { min: [x0, y0, -d1], max: [x1, y1, -d0] };
}

export function Room() {
  const W = ROOM.width;
  const D = ROOM.depth;
  const H = ROOM.height;
  const A = ALCOVE;
  const doorL = DOOR.x - DOOR.width / 2;
  const doorR = DOOR.x + DOOR.width / 2;

  return (
    <group>
      {/* Floor: room + alcove */}
      <mesh rotation-x={-Math.PI / 2} position={P(W / 2, 0, (D + A.depth) / 2)} receiveShadow>
        <planeGeometry args={[W, D + A.depth]} />
        <meshStandardMaterial color={FLOOR} roughness={0.85} />
      </mesh>
      {/* Thin base so the cut-away floor edge has some thickness */}
      <mesh position={P(W / 2, -0.045, (D + A.depth) / 2)}>
        <boxGeometry args={[W + 2 * T, 0.08, D + A.depth + 2 * T]} />
        <meshStandardMaterial color="#6f7376" roughness={1} />
      </mesh>

      {/* Left & right walls */}
      <Wall {...slab(-T, 0, -T, 0, H, D + T)} normal={[1, 0, 0]} />
      <Wall {...slab(W, 0, -T, W + T, H, D + T)} normal={[-1, 0, 0]} />

      {/* Front wall with the door opening */}
      <Wall {...slab(-T, 0, -T, doorL, H, 0)} normal={[0, 0, -1]} />
      <Wall {...slab(doorR, 0, -T, W + T, H, 0)} normal={[0, 0, -1]} />
      <Wall {...slab(doorL, DOOR.height, -T, doorR, H, 0)} normal={[0, 0, -1]} />

      {/* Back wall above the alcove, plus the slivers beside it */}
      <Wall {...slab(-T, A.height, D, W + T, H, D + T)} normal={[0, 0, 1]} />
      <Wall {...slab(-T, 0, D, A.x0, A.height, D + T)} normal={[0, 0, 1]} />
      <Wall {...slab(A.x1, 0, D, W + T, A.height, D + T)} normal={[0, 0, 1]} />

      {/* Alcove shell */}
      <Wall {...slab(A.x0 - T, A.height, D, A.x1 + T, A.height + 0.1, D + A.depth + T)} normal={[0, -1, 0]} color={WALL_ALCOVE} />
      <Wall {...slab(A.x0 - T, 0, D + A.depth, A.x1 + T, A.height, D + A.depth + T)} normal={[0, 0, 1]} color={WALL_ALCOVE} />
      <Wall {...slab(A.x0 - T, 0, D + T, A.x0, A.height, D + A.depth)} normal={[1, 0, 0]} color={WALL_ALCOVE} />
      <Wall {...slab(A.x1, 0, D + T, A.x1 + T, A.height, D + A.depth)} normal={[-1, 0, 0]} color={WALL_ALCOVE} />

      {/* Seam line on the back wall like the real bulkhead */}
      <mesh position={P(W / 2, 1.93, D - 0.002)}>
        <boxGeometry args={[W, 0.012, 0.004]} />
        <meshStandardMaterial color="#cfc8b3" />
      </mesh>

      <FloorMarks />
    </group>
  );
}

/** Scuffs and a threshold strip so the floor doesn't look like a flat plastic plane. */
function FloorMarks() {
  const doorLabel = useMemo(() => labelTexture("ENTRANCE", { aspect: 3.2, bg: "#0f766e", fg: "#ffffff" }), []);
  const marks = useMemo(() => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: 26 }, () => ({
      x: 0.7 + rnd() * 1.0,
      d: 0.3 + rnd() * 2.4,
      r: 0.03 + rnd() * 0.12,
      o: 0.05 + rnd() * 0.08,
    }));
  }, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={P(DOOR.x, 0.002, -0.05)}>
        <planeGeometry args={[DOOR.width, 0.1]} />
        <meshStandardMaterial color="#8a8f93" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={P(DOOR.x, 0.003, -0.32)} raycast={() => null}>
        <planeGeometry args={[0.7, 0.22]} />
        <meshBasicMaterial map={doorLabel} transparent toneMapped={false} />
      </mesh>
      {marks.map((m, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={P(m.x, 0.001, m.d)} raycast={() => null}>
          <circleGeometry args={[m.r, 16]} />
          <meshBasicMaterial color="#5d6164" transparent opacity={m.o} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
