"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Chain = "evm" | "sol" | "btc";
type Tok = { label: string; id: string; sym: string; net: string; chain: Chain };
type Slots = { to: string; tok: Tok | null; amount: string; refund: string };
type Msg = { from: "bot" | "user"; text: string };

const TOKENS: Tok[] = [
  { label: "USDC on Arbitrum", id: "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near", sym: "usdc", net: "arbitrum", chain: "evm" },
  { label: "USDC on Base", id: "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near", sym: "usdc", net: "base", chain: "evm" },
  { label: "USDC on Ethereum", id: "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near", sym: "usdc", net: "ethereum", chain: "evm" },
  { label: "USDT on Ethereum", id: "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near", sym: "usdt", net: "ethereum", chain: "evm" },
  { label: "ETH on Ethereum", id: "nep141:eth.omft.near", sym: "eth", net: "ethereum", chain: "evm" },
  { label: "SOL on Solana", id: "nep141:sol.omft.near", sym: "sol", net: "solana", chain: "sol" },
  { label: "BTC on Bitcoin", id: "nep141:btc.omft.near", sym: "btc", net: "bitcoin", chain: "btc" },
];

const T_ADDR = /^t[13][a-zA-Z0-9]{25,40}$/;
const KEY_CHAT = "zecpay_chat";
const KEY_HIST = "zecpay_history";
const GREETING = "Hi! I am Zephyr, your payment assistant. I will collect a few details and set up your payment. The recipient gets ZEC.";
const badge = (s: string) => (s === "SUCCESS" ? "text-emerald-300" : s === "REFUNDED" || s === "FAILED" ? "text-red-300" : "text-[var(--gold)]");

function validRefund(chain: Chain, a: string) {
  if (T_ADDR.test(a)) return false;
  if (chain === "evm") return /^0x[a-fA-F0-9]{40}$/.test(a);
  if (chain === "sol") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
  return /^(bc1[a-z0-9]{20,70}|[13][a-km-zA-HJ-NP-Z1-9]{25,40})$/.test(a);
}

function matchToken(text: string): Tok | null {
  const low = text.toLowerCase();
  const hit = (w: string) => new RegExp("\\b" + w + "\\b").test(low);
  const symHits = TOKENS.filter((t) => hit(t.sym));
  const netHits = TOKENS.filter((t) => hit(t.net));
  if (symHits.length && netHits.length) {
    const both = symHits.filter((t) => netHits.includes(t));
    if (both.length === 1) return both[0];
  }
  if (symHits.length === 1) return symHits[0];
  if (!symHits.length && netHits.length === 1) return netHits[0];
  return null;
}

function fill(s: Slots, text: string): { slots: Slots; bad: "to" | "refund" | null } {
  const words = text.split(/\s+/).filter(Boolean);
  const longs = words.filter((w) => w.length >= 26);
  const plain = words.filter((w) => w.length < 26).join(" ");
  const slots: Slots = { ...s };
  let bad: "to" | "refund" | null = null;
  if (!slots.to) {
    const t = longs.find((w) => T_ADDR.test(w));
    if (t) slots.to = t;
    else if (longs.length) bad = "to";
  }
  if (!slots.tok) slots.tok = matchToken(plain);
  if (!slots.amount) {
    const m = plain.match(/(\d+(?:\.\d+)?)/);
    if (m && Number(m[1]) > 0) slots.amount = m[1];
  }
  const tok = slots.tok;
  if (tok && !slots.refund && slots.to) {
    const r = longs.find((w) => validRefund(tok.chain, w));
    if (r) slots.refund = r;
    else if (longs.some((w) => !T_ADDR.test(w))) bad = "refund";
  }
  return { slots, bad };
}

function nextQuestion(s: Slots): string {
  if (!s.to) return "What Zcash transparent address (starts with t1 or t3) should receive the payment?";
  if (!s.tok) return "Which token and chain will you pay from? Tap an option or type it, like \"USDC on Base\".";
  if (!s.amount) return "How much " + s.tok.label.split(" ")[0] + " do you want to send? Just the number.";
  if (!s.refund) {
    const kind = s.tok.chain === "evm" ? "0x (EVM)" : s.tok.chain === "sol" ? "Solana" : "Bitcoin";
    return "Last one: what " + kind + " address should get a refund if the swap fails? It must be a wallet you control.";
  }
  return "";
}

function Agent() {
  const params = useSearchParams();
  const startTo = params.get("to") || "";
  const [slots, setSlots] = useState<Slots>({ to: "", tok: null, amount: "", refund: "" });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [ready, setReady] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState("");
  const [recent, setRecent] = useState<any[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  function fresh() {
    const s: Slots = { to: T_ADDR.test(startTo) ? startTo : "", tok: null, amount: "", refund: "" };
    setSlots(s);
    setMsgs([{ from: "bot", text: GREETING }, { from: "bot", text: nextQuestion(s) }]);
  }

  useEffect(() => {
    let loaded = false;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY_CHAT) || "null");
      if (saved && saved.msgs && saved.msgs.length) {
        setSlots(saved.slots);
        setMsgs(saved.msgs);
        loaded = true;
      }
    } catch {}
    if (!loaded) fresh();
    try {
      setRecent(JSON.parse(localStorage.getItem(KEY_HIST) || "[]").slice(0, 3));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY_CHAT, JSON.stringify({ slots, msgs }));
    } catch {}
  }, [slots, msgs, ready]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs, thinking]);

  const done = !!(slots.to && slots.tok && slots.amount && slots.refund);
  const filled = [slots.to, slots.tok, slots.amount, slots.refund].filter(Boolean).length;
  const link = done
    ? "/pay?to=" + slots.to + "&token=" + encodeURIComponent(slots.tok!.id) + "&amount=" + encodeURIComponent(slots.amount)
    : "";

  function send(text: string) {
    const t = text.trim();
    if (!t || thinking) return;
    const { slots: s2, bad } = fill(slots, t);
    const replies: string[] = [];
    const changed = s2.to !== slots.to || s2.tok !== slots.tok || s2.amount !== slots.amount || s2.refund !== slots.refund;
    if (bad === "to") replies.push("That does not look like a valid transparent Zcash address. It should start with t1 or t3.");
    else if (bad === "refund") replies.push("That address does not match the chain you picked. Check it and send it again.");
    else if (!changed) replies.push("Sorry, I did not catch that.");
    const q = nextQuestion(s2);
    replies.push(q ? q : "All set. Your payment page is ready below.");
    setMsgs((m) => [...m, { from: "user", text: t }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setSlots(s2);
      setMsgs((m) => [...m, ...replies.map((r) => ({ from: "bot" as const, text: r }))]);
      setThinking(false);
    }, 500);
  }

  function reset() {
    setThinking(false);
    fresh();
  }

  const avatar = "mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--gold-ink)]";

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-10">
      <nav className="flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold [font-family:var(--head)]">
          <img src="/logo.png" alt="" className="h-[30px] w-auto" />
          Zephyr
        </Link>
        <Link href="/history" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:border-[var(--gold)]">
          History
        </Link>
      </nav>

      <div className="mb-6 mt-4 text-center">
        <h1 className="text-3xl font-bold md:text-4xl">Set up your payment</h1>
        <p className="mt-2 text-[var(--muted)]">Type it all in one message, or answer one question at a time.</p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[rgba(244,183,40,0.10)] blur-3xl" />
        <div className="rounded-3xl bg-gradient-to-b from-[rgba(244,183,40,0.55)] via-[rgba(244,183,40,0.12)] to-transparent p-px shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
          <div className="overflow-hidden rounded-[calc(1.5rem-1px)] bg-[#12110d]/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Zephyr
              </div>
              <div className="flex flex-1 justify-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={"h-1 w-10 rounded-full " + (i < filled ? "bg-[var(--gold)]" : "bg-white/10")} />
                ))}
              </div>
              <button type="button" onClick={reset} className="text-sm text-[var(--muted)]">Start over</button>
            </div>

            <div className="h-[48vh] space-y-4 overflow-y-auto px-5 py-5">
              {msgs.map((m, i) =>
                m.from === "bot" ? (
                  <div key={i} className="flex items-start gap-3">
                    <span className={avatar}>Z</span>
                    <p className="max-w-[85%] break-words rounded-2xl rounded-tl-sm bg-white/5 px-4 py-2.5 text-[15px]">{m.text}</p>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end">
                    <p className="max-w-[85%] break-all rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#ffd466] to-[#f4b728] px-4 py-2.5 text-[15px] font-medium text-[#1a1305]">{m.text}</p>
                  </div>
                )
              )}
              {thinking && (
                <div className="flex items-start gap-3">
                  <span className={avatar}>Z</span>
                  <p className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                    <span className="ml-1.5 text-xs text-[var(--muted)]">thinking</span>
                  </p>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {slots.to && !slots.tok && !done && !thinking && (
              <div className="flex flex-wrap gap-2 px-5 pb-3">
                {TOKENS.map((t) => (
                  <button key={t.id} type="button" onClick={() => send(t.label)} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm">{t.label}</button>
                ))}
              </div>
            )}

            {done && (
              <div className="mx-4 mb-4 rounded-2xl border border-[rgba(244,183,40,0.4)] bg-[rgba(244,183,40,0.07)] p-4">
                <p className="mb-2 text-sm font-semibold">Summary</p>
                <div className="flex justify-between gap-4 py-1 text-sm"><span className="text-[var(--muted)]">You pay</span><span>{slots.amount} {slots.tok!.label}</span></div>
                <div className="flex justify-between gap-4 py-1 text-sm"><span className="flex-none text-[var(--muted)]">Recipient gets ZEC at</span><span className="break-all text-right">{slots.to}</span></div>
                <div className="flex justify-between gap-4 py-1 text-sm"><span className="flex-none text-[var(--muted)]">Refund address</span><span className="break-all text-right">{slots.refund}</span></div>
                <div className="mt-3 flex gap-2">
                  <Link href={link} onClick={() => sessionStorage.setItem("zecpay_refund", slots.refund)} className="send flex-1 rounded-full bg-gradient-to-br from-[#ffd466] to-[#f4b728] px-5 py-3 text-center font-semibold text-[#1a1305]">Open payment page</Link>
                  <button type="button" onClick={reset} className="rounded-full border border-white/10 px-5 py-3 text-sm">Start over</button>
                </div>
              </div>
            )}

            {!done && (
              <form
                className="m-4 mt-0 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 py-1.5 pl-5 pr-1.5 focus-within:border-[rgba(244,183,40,0.6)]"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <input className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[15px] outline-none" placeholder="Type here, e.g. 10 usdc on base" value={input} disabled={thinking} onChange={(e) => setInput(e.target.value)} aria-label="Your message" />
                <button type="submit" disabled={thinking} aria-label="Send" className="send grid h-10 w-10 flex-none place-items-center rounded-full bg-gradient-to-br from-[#ffd466] to-[#f4b728] text-[#1a1305]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Recent payments</p>
            <Link href="/history" className="text-sm text-[var(--gold)] underline">See all</Link>
          </div>
          {recent.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 border-t border-white/10 py-2 text-sm">
              <span>{p.amount} {p.token}</span>
              <span className="flex items-center gap-3">
                <b className={"text-xs " + badge(p.status)}>{p.status}</b>
                <a href={"https://explorer.near-intents.org/transactions/" + encodeURIComponent(p.id)} target="_blank" rel="noreferrer" className="text-[var(--gold)] underline">Explorer</a>
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-center text-sm text-[var(--muted)]">The app checks every address before it creates a link.</p>
    </div>
  );
}

export default function AgentPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading...</main>}>
      <Agent />
    </Suspense>
  );
}



