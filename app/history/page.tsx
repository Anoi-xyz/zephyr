"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type P = { id: string; created: number; token: string; amount: string; to: string; status: string; zecOut?: string };
const KEY = "zecpay_history";
const FINAL = ["SUCCESS", "REFUNDED", "FAILED"];
const explorer = (a: string) => "https://explorer.near-intents.org/transactions/" + encodeURIComponent(a);
const load = (): P[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};
const save = (l: P[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(l));
  } catch {}
};
const badge = (s: string) =>
  s === "SUCCESS" ? "bg-emerald-400/15 text-emerald-300" : s === "REFUNDED" || s === "FAILED" ? "bg-red-400/15 text-red-300" : "bg-[rgba(244,183,40,0.15)] text-[var(--gold)]";

export default function History() {
  const [list, setList] = useState<P[]>([]);

  useEffect(() => {
    const items = load();
    setList(items);
    items
      .filter((p) => !FINAL.includes(p.status))
      .forEach(async (p) => {
        try {
          const res = await fetch("/api/status?depositAddress=" + p.id + "&t=" + Date.now(), { cache: "no-store" });
          const d = await res.json();
          if (d.status && d.status !== p.status) {
            save(load().map((x) => (x.id === p.id ? { ...x, status: d.status } : x)));
            setList(load());
          }
        } catch {}
      });
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-12">
      <nav className="flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold [font-family:var(--head)]">
          <img src="/logo.png" alt="" className="h-[30px] w-auto" />
          Zephyr
        </Link>
        <Link href="/agent" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:border-[var(--gold)]">New payment</Link>
      </nav>
      <h1 className="mt-4 text-3xl font-bold">Payment history</h1>
      <p className="mb-6 mt-2 text-sm text-[var(--muted)]">Saved in this browser only. Nothing is stored on a server.</p>
      {list.length === 0 && <p className="text-[var(--muted)]">No payments yet.</p>}
      <div className="space-y-3">
        {list.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{p.amount} {p.token}</p>
              <span className={"rounded-full px-3 py-1 text-xs font-semibold " + badge(p.status)}>{p.status}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{new Date(p.created).toLocaleString()}{p.zecOut ? " - about " + p.zecOut + " ZEC" : ""}</p>
            <p className="mt-1 break-all text-xs text-[var(--muted)]">To {p.to}</p>
            <a href={explorer(p.id)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-[var(--gold)] underline">View on NEAR Intents explorer</a><button type="button" onClick={() => { save(load().filter((x) => x.id !== p.id)); setList(load()); }} className="ml-4 mt-2 text-sm text-[var(--muted)] hover:text-[var(--gold)]">Remove</button>
          </div>
        ))}
      </div>
      {list.length > 0 && (
        <button type="button" onClick={() => { localStorage.removeItem(KEY); setList([]); }} className="mt-6 text-sm text-[var(--muted)]">Clear history</button>
      )}
    </div>
  );
}



