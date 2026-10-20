import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Camera,
  ClipboardList,
  Code2,
  Database,
  Download,
  Eye,
  Hand,
  History,
  Layers,
  MapPin,
  Move,
  Ruler,
  Search,
  ShieldCheck,
  Smartphone,
  Table2,
} from "lucide-react";
import { ModelPreview } from "@/components/ModelPreview";

const STATS = [
  { value: "180+", label: "items mapped" },
  { value: "~60", label: "storage spots" },
  { value: "1 photo", label: "+ 2 short videos" },
  { value: "0", label: "3D modelling tools" },
];

const PROBLEMS = [
  {
    icon: Table2,
    title: "A spreadsheet nobody could picture",
    text: "The stocktake already said where things were (“box (2,1,1)”, “drawer 4.3”), but you had to already know the room to decode it.",
  },
  {
    icon: Hand,
    title: "Things went out and didn't come back",
    text: "Radios, lights and screens were borrowed for events with no record of who had them, so the stocktake was always out of date.",
  },
  {
    icon: Layers,
    title: "Boxes hidden behind boxes",
    text: "Tubs are stacked three deep in a low alcove. The one you need is usually in the back row, behind the one you can see.",
  },
];

const STEPS = [
  {
    icon: Camera,
    title: "Capture the room",
    text: "One photo from the doorway and two ten-second walkthrough videos were enough to see every wall, shelf and stack.",
  },
  {
    icon: Ruler,
    title: "Measure without a tape measure",
    text: "Sizes come from things with known dimensions: a 1.8 m boltless shelving unit, 1.32 m four-drawer filing cabinets, 600 mm ceiling tiles and an 850 mm door. That puts the room at about 2.4 × 2.9 m, with a 1.4 m deep alcove.",
  },
  {
    icon: ClipboardList,
    title: "Turn the spreadsheet's codes into geometry",
    text: "Boxes sit on a 4 × 4 × 3 grid (column, level, row), drawers are cabinet.drawer (1.2 = cabinet 1, drawer 2), and shelves are numbered 1–4 from the top. Each code maps to an exact position in the room.",
  },
  {
    icon: Code2,
    title: "Generate the model in code",
    text: "No Blender, no imported meshes. Every wall, shelf, cabinet, drawer and tub is built from one layout file, so measuring the room properly later just means changing a few numbers.",
  },
  {
    icon: Database,
    title: "Import the stocktake",
    text: "Each spreadsheet row became an item linked to its storage spot in a Postgres database, so the 3D view and the inventory list always agree.",
  },
  {
    icon: Smartphone,
    title: "Ship it",
    text: "A Next.js app on Vercel that works on a laptop or a phone, so you can look something up while standing in the storeroom.",
  },
];

const FEATURES = [
  {
    icon: Search,
    title: "Find anything in seconds",
    text: "Type “radio” and every spot holding a match glows. Click one and the camera flies there, and drawers even slide open.",
  },
  {
    icon: Hand,
    title: "Know who has it",
    text: "“Take out” records who borrowed what, and the home screen lists everything that's currently out.",
  },
  {
    icon: Eye,
    title: "See behind the boxes",
    text: "Fade out the front and middle rows of the box wall to see the back row, exactly as it's stacked in the room.",
  },
  {
    icon: Move,
    title: "Reorganise without confusion",
    text: "Move a box to an empty slot or swap two boxes, and the model and its location code update for everyone.",
  },
  {
    icon: History,
    title: "A history of every change",
    text: "Every take-out, return, edit and move is logged with who did it and when, so mistakes are easy to trace.",
  },
  {
    icon: Download,
    title: "Stocktake in one click",
    text: "Filter the inventory by category, status or area and export it as a CSV for reports or the next audit.",
  },
];

const WORKFLOW = [
  {
    when: "Before an event",
    text: "A volunteer searches for what's on the run sheet and walks straight to the right drawer, shelf or box.",
  },
  {
    when: "Picking things up",
    text: "They press Take out and add their name and the event, and it shows up under “Currently taken out”.",
  },
  {
    when: "After the event",
    text: "Mark it returned. Anything still out stays visible, so there's no chasing people weeks later.",
  },
  {
    when: "Reorganising",
    text: "Admins add new boxes, move tubs between slots and fix item details. The history keeps track of it all.",
  },
];

const STACK = [
  ["Next.js 16 (App Router)", "routing, server API and deployment"],
  ["React 19 + TypeScript", "the app and its panels"],
  ["three.js · React Three Fiber · drei", "the procedurally generated 3D room"],
  ["Tailwind CSS 4", "styling, with a phone-friendly layout"],
  ["Postgres (Neon)", "items, storage spots and the change history"],
  ["Vercel", "hosting, previews and environment config"],
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-white text-zinc-900">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-white">
              <Boxes size={18} />
            </span>
            Storeroom 3D
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-sm text-zinc-600 md:flex">
            <a href="#problem" className="hover:text-zinc-900">
              Problem
            </a>
            <a href="#process" className="hover:text-zinc-900">
              How I built it
            </a>
            <a href="#features" className="hover:text-zinc-900">
              Features
            </a>
            <a href="#stack" className="hover:text-zinc-900">
              Tech
            </a>
          </nav>
          <Link
            href="/demo"
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 text-sm font-medium text-white hover:bg-brand-800 md:ml-0"
          >
            Live demo <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-brand-50 to-white" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Case study · 3D web app</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            A digital twin of a real storeroom
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 text-pretty">
            I turned one photo of a cramped events storeroom and its stocktake spreadsheet into a to-scale 3D model. Anyone on the team can
            now see exactly where something lives, who has it, and what's hiding in the back row.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 font-medium text-white shadow-sm hover:bg-brand-800"
            >
              Try the live demo <ArrowRight size={17} />
            </Link>
          </div>

          <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="order-2 text-sm text-zinc-500">{s.label}</dt>
                <dd className="order-1 text-2xl font-bold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>

          {/* Photo vs model */}
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <figure className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm">
              <div className="relative aspect-[3/4]">
                <Image
                  src="/storeroom-photo.jpg"
                  alt="The real storeroom, photographed from the doorway: black shelving on the left, filing cabinets on the right and stacked tubs in a low alcove at the back."
                  fill
                  priority
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="flex items-center gap-2 border-t border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                <Camera size={16} className="text-zinc-400" /> The real room: the one photo the model started from.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm">
              <div className="relative aspect-[3/4]">
                <ModelPreview initial="door" />
              </div>
              <figcaption className="flex items-center gap-2 border-t border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                <Boxes size={16} className="text-zinc-400" /> The 3D model, from the same spot. Drag to look around, click anything.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="scroll-mt-16 border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionTitle eyebrow="The problem" title="Everyone knew the storeroom was full. Nobody knew where anything was." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PROBLEMS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <Icon size={22} className="text-brand-700" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="scroll-mt-16 border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionTitle eyebrow="How I built it" title="From one photo to a working model" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_minmax(0,420px)]">
            <ol className="space-y-6">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                      <Icon size={19} />
                    </span>
                    {i < STEPS.length - 1 && <span className="mt-2 w-px flex-1 bg-zinc-200" />}
                  </div>
                  <div className="pb-2">
                    <h3 className="font-semibold">
                      <span className="mr-2 text-sm font-medium text-zinc-400">0{i + 1}</span>
                      {title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm">
                <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5 text-xs text-zinc-400">
                  <Code2 size={14} /> lib/layout.ts: the whole room in a few numbers
                </div>
                <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed text-zinc-200">
                  <code>{`// metres, estimated from known object sizes
export const ROOM = { width: 2.4, depth: 2.9, height: 2.45 };
export const DOOR = { x: 1.2, width: 0.85, height: 2.04 };

// low recess at the back where tubs are stacked
export const ALCOVE = { height: 1.15, depth: 1.42 };

// box wall: 4 columns × 4 levels × 3 rows deep
export const GRID = { cols: 4, rows: 4, layers: 3,
                      cellW: 0.56, cellH: 0.282, cellD: 0.46 };

// 1.8 m boltless shelving, levels 1 (top) … 4
export const SHELVING = { length: 1.8, deep: 0.6,
                          levels: [0, 1.86, 1.34, 0.82, 0.3] };

// four 4-drawer filing cabinets, drawers facing the aisle
export const CABINETS = { count: 4, height: 1.32, drawers: 4 };`}</code>
                </pre>
              </div>
              <p className="text-sm leading-relaxed text-zinc-600">
                The walls work like a dollhouse: whichever side faces the camera fades away, so you can orbit freely and never lose
                sight of what's inside. Box and drawer labels are drawn on the fly, so renaming a box updates its label in 3D straight
                away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionTitle eyebrow="What it does" title="Built for the people who actually use the room" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <Icon size={22} className="text-brand-700" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold">How a team uses it</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                It replaces “has anyone seen the radios?” in the group chat with a single place everyone can check.
              </p>
              <ol className="mt-6 space-y-4">
                {WORKFLOW.map((w, i) => (
                  <li key={w.when} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-medium">{w.when}</div>
                      <p className="text-sm leading-relaxed text-zinc-600">{w.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <ShieldCheck size={22} className="text-brand-700" />
              <h3 className="mt-3 text-xl font-semibold">Ready for real use</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-600">
                <li className="flex gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-zinc-400" />
                  The full version signs people in with their own accounts and roles: members can take, return and move things, while
                  admins can also add, edit and delete.
                </li>
                <li className="flex gap-2">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-zinc-400" />
                  Optional two-step sign-in with an authenticator app, and repeated wrong passwords are locked out.
                </li>
                <li className="flex gap-2">
                  <Database size={16} className="mt-0.5 shrink-0 text-zinc-400" />
                  Data lives in Postgres and every change is validated on the server and written to the history.
                </li>
                <li className="flex gap-2">
                  <Eye size={16} className="mt-0.5 shrink-0 text-zinc-400" />
                  This public demo skips sign-in and runs entirely in your browser on made-up data, so you can't break anything.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stack */}
      <section id="stack" className="scroll-mt-16 border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionTitle eyebrow="Tech" title="What it's made with" />
          <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {STACK.map(([name, use]) => (
              <div key={name} className="border-l-2 border-brand-200 pl-4">
                <dt className="font-semibold">{name}</dt>
                <dd className="text-sm text-zinc-600">{use}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 bg-brand-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Try it yourself</h2>
            <p className="mt-2 max-w-xl text-brand-100">
              Search for something, open a drawer, take an item out or rearrange the box wall. The demo uses made-up inventory, and
              your changes stay in your browser.
            </p>
          </div>
          <Link
            href="/demo"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
          >
            Open the live demo <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm text-zinc-500 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-semibold text-zinc-900">Credits</h2>
            <p className="mt-1">
              Built by Haris Syed (
              <a href="https://github.com/harissyed2006" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-900">
                @harissyed2006
              </a>
              ). Developed with AI-assisted tooling. All data in the demo are fictional though the image of the room is real.
            </p>
          </div>
          <Link href="/demo" className="ml-auto hover:text-zinc-900">
            Live demo
          </Link>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance">{title}</h2>
    </div>
  );
}
