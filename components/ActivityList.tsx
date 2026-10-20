"use client";

import type { Activity } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { Empty } from "./ui";

function dayOf(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function ActivityList({ activity }: { activity: Activity[] }) {
  if (!activity.length) return <Empty>No changes yet.</Empty>;
  const days: { day: string; entries: Activity[] }[] = [];
  for (const a of activity) {
    const day = dayOf(a.at);
    if (days.at(-1)?.day !== day) days.push({ day, entries: [] });
    days.at(-1)!.entries.push(a);
  }
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-5">
      <p className="mb-4 text-sm text-zinc-600">Every change made in the app, newest first (last 150).</p>
      {days.map(({ day, entries }) => (
        <section key={day} className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{day}</h3>
          <ol className="space-y-2">
            {entries.map((a) => (
              <li key={a.id} className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5">
                <p className="text-sm text-zinc-900">{a.summary}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {a.actor ?? (a.action === "seed" ? "Import" : "Someone")} · {timeAgo(a.at)} ·{" "}
                  {new Date(a.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
