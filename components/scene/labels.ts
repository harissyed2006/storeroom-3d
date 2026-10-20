import * as THREE from "three";

export interface LabelOptions {
  /** width / height of the label */
  aspect?: number;
  bg?: string;
  fg?: string;
  /** small line above the main text, e.g. the "(2,1,1)" code */
  sub?: string | null;
  /** coloured strip on the left edge, e.g. red when taken */
  accent?: string | null;
  bold?: boolean;
}

const cache = new Map<string, THREE.CanvasTexture>();

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** A sticker-style label drawn on a canvas, so no font files are needed. Cached by content. */
export function labelTexture(text: string, o: LabelOptions = {}): THREE.CanvasTexture {
  const { aspect = 2, bg = "#ffffff", fg = "#111827", sub = null, accent = null, bold = true } = o;
  const key = JSON.stringify([text, aspect, bg, fg, sub, accent, bold]);
  const hit = cache.get(key);
  if (hit) return hit;

  const W = 512;
  const H = Math.round(W / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const r = Math.min(W, H) * 0.08;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(4, 4, W - 8, H - 8, r);
  ctx.fill();
  if (accent) {
    ctx.fillStyle = accent;
    ctx.fillRect(4, 4, W * 0.05, H - 8);
  }

  const padX = W * (accent ? 0.09 : 0.06);
  const maxW = W - padX - W * 0.05;
  let top = H * 0.08;
  if (sub) {
    const subSize = Math.round(H * 0.17);
    ctx.font = `600 ${subSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.fillStyle = fg;
    ctx.globalAlpha = 0.6;
    ctx.textBaseline = "top";
    ctx.fillText(sub, padX, top);
    ctx.globalAlpha = 1;
    top += subSize * 1.15;
  }

  const avail = H - top - H * 0.08;
  let size = Math.round(H * (sub ? 0.24 : 0.3));
  let lines: string[] = [];
  for (; size > 10; size -= 2) {
    ctx.font = `${bold ? 700 : 500} ${size}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    lines = wrap(ctx, text, maxW);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (lines.length * size * 1.12 <= avail && widest <= maxW) break;
  }
  ctx.fillStyle = fg;
  ctx.textBaseline = "top";
  const block = lines.length * size * 1.12;
  let y = top + Math.max(0, (avail - block) / 2);
  for (const l of lines) {
    ctx.fillText(l, padX, y);
    y += size * 1.12;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
}
