"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Container } from "@/lib/types";
import { anchorOf, focusOf, P, ROOM, VIEWS, type CameraView, type ViewName } from "@/lib/layout";
import { containerCode } from "@/lib/format";
import { Room } from "./Room";
import { BoxWall } from "./BoxWall";
import { Cabinets } from "./Cabinets";
import { Shelving } from "./Shelving";
import { FloorAreas } from "./FloorAreas";
import type { Interaction } from "./common";

export interface SceneProps {
  containers: Container[];
  counts: Map<string, number>;
  selectedId: string | null;
  hitIds: Set<string>;
  peel: number;
  /** bump nonce to re-run the camera move even if the target didn't change */
  camera: { view?: ViewName; focusId?: string; nonce: number };
  boxView: boolean;
  pickSlot: ((gx: number, gy: number, gz: number) => void) | null;
  onSelect: (id: string | null) => void;
}

function CameraRig({ camera, containers }: { camera: SceneProps["camera"]; containers: Container[] }) {
  const ref = useRef<CameraControls>(null);
  const first = useRef(true);
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    let v: CameraView | null = null;
    if (camera.focusId) {
      const c = containers.find((x) => x.id === camera.focusId);
      v = c ? focusOf(c) : null;
    } else if (camera.view) {
      v = VIEWS[camera.view];
    }
    if (!v) return;
    controls.setLookAt(...v.pos, ...v.target, !first.current);
    first.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera.nonce]);
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={0.25}
      maxDistance={11}
      smoothTime={0.4}
      dollySpeed={0.7}
      maxPolarAngle={Math.PI * 0.53}
    />
  );
}

function Tooltip({ c, count }: { c: Container; count: number }) {
  const a = anchorOf(c);
  if (!a) return null;
  const code = containerCode(c);
  return (
    <Html position={[a[0], a[1] + 0.12, a[2]]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div className="whitespace-nowrap rounded-md bg-zinc-900/90 px-2 py-1 text-xs text-white shadow-lg">
        <span className="font-semibold">{c.name}</span>
        {code && <span className="ml-1.5 text-zinc-400">{code}</span>}
        <span className="ml-1.5 text-zinc-300">
          · {count} item{count === 1 ? "" : "s"}
        </span>
      </div>
    </Html>
  );
}

export default function Scene(props: SceneProps) {
  const { containers, counts, selectedId, hitIds, peel, camera, boxView, pickSlot, onSelect } = props;
  const [hoverId, setHoverId] = useState<string | null>(null);

  const ix: Interaction = useMemo(
    () => ({ selectedId, hoverId, hitIds, onSelect: (id) => onSelect(id), onHover: setHoverId }),
    [selectedId, hoverId, hitIds, onSelect],
  );
  const boxes = useMemo(() => containers.filter((c) => c.kind === "box"), [containers]);
  const hovered = hoverId ? containers.find((c) => c.id === hoverId) : null;

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      camera={{ fov: 50, near: 0.05, far: 60, position: VIEWS.overview.pos }}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#eef0f3"]} />
      <hemisphereLight args={["#ffffff", "#b8b2a3", 1.1]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[ROOM.width / 2 + 1.2, 6, 1.5]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={15}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      {/* the fluorescent panel in the ceiling */}
      <pointLight position={P(ROOM.width * 0.62, ROOM.height - 0.1, ROOM.depth * 0.45)} intensity={2.2} distance={6} decay={1.4} />
      {/* fill light inside the alcove */}
      <pointLight position={P(ROOM.width / 2, 0.9, ROOM.depth - 0.3)} intensity={0.9} distance={3} decay={1.5} />

      <Room />
      <Shelving containers={containers} ix={ix} counts={counts} />
      <Cabinets containers={containers} ix={ix} counts={counts} xray={boxView} />
      <BoxWall boxes={boxes} ix={ix} peel={peel} counts={counts} pickSlot={pickSlot} />
      <FloorAreas containers={containers} ix={ix} />

      {hovered && hovered.id !== selectedId && <Tooltip c={hovered} count={counts.get(hovered.id) ?? 0} />}
      <CameraRig camera={camera} containers={containers} />
    </Canvas>
  );
}
