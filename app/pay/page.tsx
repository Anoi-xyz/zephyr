"use client";
import Link from "next/link";
import QRCode from "qrcode";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const TOKENS = [
  { sym: "USDC", chain: "Arbitrum", id: "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near", decimals: 6 },
  { sym: "USDC", chain: "Base", id: "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near", decimals: 6 },
  { sym: "USDC", chain: "Ethereum", id: "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near", decimals: 6 },
  { sym: "USDT", chain: "Ethereum", id: "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near", decimals: 6 },
  { sym: "ETH", chain: "Ethereum", id: "nep141:eth.omft.near", decimals: 18 },
  { sym: "SOL", chain: "Solana", id: "nep141:sol.omft.near", decimals: 9 },
  { sym: "BTC", chain: "Bitcoin", id: "nep141:btc.omft.near", decimals: 8 },
];

const FINAL = ["SUCCESS", "REFUNDED", "FAILED"]; const txLink = (chain: string, h: string) => ({ Base: "https://basescan.org/tx/", Arbitrum: "https://arbiscan.io/tx/", Ethereum: "https://etherscan.io/tx/", Solana: "https://solscan.io/tx/", Bitcoin: "https://mempool.space/tx/" } as Record<string, string>)[chain] + h;
const KEY = "zecpay_history";
const explorer = (a: string) => "https://explorer.near-intents.org/transactions/" + encodeURIComponent(a);
const short = (a: string) => (a.length > 20 ? a.slice(0, 8) + "..." + a.slice(-6) : a);
const ring = "rounded-3xl bg-gradient-to-b from-[rgba(244,183,40,0.5)] via-[rgba(244,183,40,0.1)] to-transparent p-px shadow-[0_30px_90px_rgba(0,0,0,0.5)]";
const card = "rounded-[calc(1.5rem-1px)] bg-[#12110d]/90 p-6 backdrop-blur-xl";
const field = "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-[rgba(244,183,40,0.6)] disabled:opacity-60";
const goldBtn = "send rounded-full bg-gradient-to-br from-[#ffd466] to-[#f4b728] px-6 py-3 font-semibold text-[#1a1305] disabled:opacity-50";

function toUnits(amount: string, decimals: number) {
  const [whole, frac = ""] = amount.trim().split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return ((whole || "") + padded).replace(/^0+/, "") || "0";
}
function mmss(s: number) {
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
function store(fn: (l: any[]) => any[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(fn(JSON.parse(localStorage.getItem(KEY) || "[]")).slice(0, 50)));
  } catch {}
}
function stepOf(s: string) {
  if (s === "SUCCESS") return 3;
  if (s === "REFUNDED" || s === "FAILED") return -1;
  if (!s || s === "PENDING_DEPOSIT" || s === "INCOMPLETE_DEPOSIT") return 0;
  return 1;
}
function hashList(x: any): { hash: string; url: string }[] {
  if (!Array.isArray(x)) return [];
  return x
    .map((i: any) => (typeof i === "string" ? { hash: i, url: "" } : { hash: i?.hash || i?.txHash || "", url: i?.explorerUrl || i?.explorer_url || i?.url || "" }))
    .filter((i) => i.hash);
}
function msg(s: string) {
  if (s === "SUCCESS") return "Successful. ZEC was delivered to the recipient.";
  if (s === "REFUNDED") return "The swap did not complete. Your funds were returned to your refund address.";
  if (s === "FAILED") return "The swap failed. Check the explorer link for details.";
  if (s === "INCOMPLETE_DEPOSIT") return "Partial deposit received. Send the rest to the same address before the deadline.";
  return "Deposit detected. Swapping to ZEC.";
}

function Row({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-white/10 py-2.5 text-sm">
      <span className="flex-none text-[var(--muted)]">{a}</span>
      <span className="break-all text-right">{b}</span>
    </div>
  );
}
function Hashes({ label, items }: { label: string; items: { hash: string; url: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 text-sm">
      <p className="text-[var(--muted)]">{label}</p>
      {items.map((h) =>
        h.url.startsWith("https://") ? (
          <a key={h.hash} href={h.url} target="_blank" rel="noreferrer" className="block break-all text-[var(--gold)] underline">{h.hash}</a>
        ) : (
          <p key={h.hash} className="break-all">{h.hash}</p>
        )
      )}
    </div>
  );
}
function Boxes({ q, t }: { q: any; t: any }) {
  return (
    <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-1.5 text-sm text-[var(--muted)]">You pay</p>
        <p className="text-2xl font-bold [font-family:var(--head)]">{q.amountInFormatted} {t.sym}</p>
        <span className="mt-2 inline-block rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-[var(--muted)]">on {t.chain}</span>
      </div>
      <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#ffd466] to-[#f4b728] text-[#1a1305]">&rarr;</div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-1.5 text-sm text-[var(--muted)]">Recipient gets</p>
        <p className="text-2xl font-bold [font-family:var(--head)]">~{q.amountOutFormatted} ZEC</p>
        <span className="mt-2 inline-block rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-[var(--muted)]">on Zcash</span>
      </div>
    </div>
  );
}

function PayForm() {
  const params = useSearchParams(); const router = useRouter();
  const to = params.get("to") || "";
  const [idx, setIdx] = useState(Math.max(0, TOKENS.findIndex((t) => t.id === params.get("token"))));
  const [amount, setAmount] = useState(params.get("amount") || "");
  const [refundTo, setRefundTo] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [live, setLive] = useState(false);
  const [status, setStatus] = useState("");
  const [details, setDetails] = useState<any>(null);
  const [events, setEvents] = useState<string[]>([]); const [checked, setChecked] = useState(0); const [cancelled, setCancelled] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [total, setTotal] = useState(1800);
  const [now, setNow] = useState(0);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = sessionStorage.getItem("zecpay_refund");
    if (r) {
      setRefundTo(r);
      sessionStorage.removeItem("zecpay_refund");
    }
  }, []);

  async function getQuote(dry: boolean) {
    setError("");
    if (!/^\d*\.?\d+$/.test(amount.trim()) || Number(amount) <= 0) return setError("Enter a valid amount.");
    if (!refundTo.trim()) return setError("Enter a refund address on the chain you are paying from.");
    setLoading(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originAsset: TOKENS[idx].id, amount: toUnits(amount, TOKENS[idx].decimals), recipient: to, refundTo: refundTo.trim(), dry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Quote failed");
      setQuote(data);
      setLive(!dry);
      if (!dry) {
        const a = data.quote.depositAddress;
        const dl = new Date(data.quoteRequest.deadline).getTime();
        setDeadline(dl);
        setTotal(Math.max(1, (dl - Date.now()) / 1000));
        setStatus("PENDING_DEPOSIT");
        setEvents(["Deposit address created. Send exactly " + data.quote.amountInFormatted + " " + TOKENS[idx].sym + " on " + TOKENS[idx].chain + " before the countdown ends."]);
        store((l) => [{ id: a, created: Date.now(), token: TOKENS[idx].sym + " on " + TOKENS[idx].chain, amount: data.quote.amountInFormatted, to, deadline: data.quoteRequest.deadline, status: "PENDING_DEPOSIT", zecOut: data.quote.amountOutFormatted }, ...l.filter((x) => x.id !== a)]);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  function cancelPay() { if (!window.confirm("Cancel this payment? Never send funds to this address after cancelling.")) return; setCancelled(true); store((l) => l.map((x) => (x.id === addr ? { ...x, status: "CANCELLED" } : x))); } function copy(label: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  const q = quote?.quote;
  const addr = q?.depositAddress;

  useEffect(() => {
    if (!live || !addr || cancelled) return;
    let last = "PENDING_DEPOSIT";
    const poll = async () => {
      try {
        const res = await fetch("/api/status?depositAddress=" + addr + "&t=" + Date.now(), { cache: "no-store" });
        const data = await res.json();
        if (!data.status) return;
        setDetails(data);
        setStatus(data.status); setChecked(Date.now());
        store((l) => l.map((x) => (x.id === addr ? { ...x, status: data.status } : x)));
        if (data.status !== last) {
          last = data.status;
          setEvents((e) => [...e, msg(data.status)]);
        }
        if (FINAL.includes(data.status)) clearInterval(timer);
      } catch {}
    };
    const timer = setInterval(poll, 3000); const onVis = () => { if (!document.hidden) poll(); }; document.addEventListener("visibilitychange", onVis);
    poll();
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [live, addr, cancelled]);

  useEffect(() => {
    if (!live) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);

  useEffect(() => {
    if (addr) QRCode.toDataURL(addr, { margin: 1, width: 240 }).then(setQr).catch(() => {});
  }, [addr]);

  useEffect(() => { if (status !== "SUCCESS") return; const id = setTimeout(() => router.push("/agent"), 4600); return () => clearTimeout(id); }, [status, router]); if (!to) return <main className="p-6">Missing payment link. Ask the creator for a new one.</main>;

  const t = TOKENS[idx];
  const step = stepOf(status);
  const left = deadline && now ? Math.max(0, Math.floor((deadline - now) / 1000)) : total;
  const expired = live && step === 0 && (cancelled || (!!deadline && !!now && left === 0));
  const ended = step === 3 || step === -1 || expired;
  const feeUsd = q ? Math.max(0, Number(q.amountInUsd) - Number(q.amountOutUsd)) : 0;
  const mins = q ? Math.max(1, Math.round((q.timeEstimate / 60) * 2) / 2) : 0;
  const bar = !live ? ["now", "", "", ""] : expired ? ["done", "bad", "", ""] : step === 0 ? ["done", "now", "", ""] : step === 1 ? ["done", "done", "now", ""] : step === 3 ? ["done", "done", "done", "done"] : ["done", "done", "bad", ""];
  const tl = expired ? ["bad", "", ""] : step === 0 ? ["now", "", ""] : step === 1 ? ["done", "now", ""] : step === 3 ? ["done", "done", "done"] : ["done", "bad", ""];
  const col = (s: string) => (s === "done" ? "bg-emerald-400" : s === "now" ? "bg-[var(--gold)]" : s === "bad" ? "bg-red-400" : "bg-white/10");
  const origin = hashList(details?.swapDetails?.originChainTxHashes).map((h) => ({ ...h, url: h.url || txLink(t.chain, h.hash) }));
  const dest = hashList(details?.swapDetails?.destinationChainTxHashes).map((h) => ({ ...h, url: h.url || "https://blockchair.com/zcash/transaction/" + h.hash }));

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-5 pb-12">{status === "SUCCESS" && (<div className="fixed inset-0 z-50 grid place-items-center bg-black/75 backdrop-blur-sm"><div className="check text-center"><div className="text-8xl">{"\u2705"}</div><p className="mt-3 text-lg font-semibold">Payment confirmed</p><p className="text-sm text-[var(--muted)]">Taking you back to the assistant...</p></div></div>)}
      <nav className="flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold [font-family:var(--head)]">
          <img src="/logo.png" alt="" className="h-[30px] w-auto" />
          Zephyr
        </Link>
      </nav>
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">Pay in any token</h1>
      <p className="mb-5 mt-2 text-sm text-[var(--muted)]">Recipient receives ZEC at {short(to)}</p>
      <div className="mb-5 flex gap-2">
        {["Review", "Deposit", "Swap", "Delivered"].map((s, i) => (
          <div key={s} className={"flex-1 text-xs " + (bar[i] ? "text-[var(--text)]" : "text-[var(--muted)]")}>
            <div className={"mb-2 h-1 rounded-full " + col(bar[i])} />
            {s}
          </div>
        ))}
      </div>

      {!live && (
        <div className={"mx-auto max-w-xl " + ring}>
          <div className={card + " space-y-4"}>
            <label className="block text-sm text-[var(--muted)]">Pay with</label>
            <select className={field} value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
              {TOKENS.map((x, i) => (
                <option key={x.id} value={i}>{x.sym} on {x.chain}</option>
              ))}
            </select>
            <label className="block text-sm text-[var(--muted)]">Amount</label>
            <input className={field} placeholder="10" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <label className="block text-sm text-[var(--muted)]">Your refund address (on {t.chain})</label>
            <input className={field} value={refundTo} onChange={(e) => setRefundTo(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-full border border-white/10 px-6 py-3" disabled={loading} onClick={() => getQuote(true)}>Get quote</button>
              {q && <button type="button" className={goldBtn} disabled={loading} onClick={() => getQuote(false)}>Create deposit address</button>}
            </div>
            {error && <p className="text-red-400">{error}</p>}
            {q && <Boxes q={q} t={t} />}
          </div>
        </div>
      )}

      {live && q && (
        <div className="grid items-start gap-5 md:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className={ring}>
              <div className={card}>
                <Boxes q={q} t={t} />
                <div className="mt-4">
                  <Row a="Swap and network fees" b={"about $" + feeUsd.toFixed(2)} />
                  <Row a="Estimated time" b={"about " + mins + " min"} />
                  <Row a="Refund address" b={short(refundTo)} />
                </div>
              </div>
            </div>

            <div className={ring}>
              <div className={card}>
                <p className="mb-2 text-sm text-[var(--muted)]">Progress</p>
                <ul className="space-y-4">
                  {[
                    ["Waiting for your deposit", "Send the exact amount to the address."],
                    ["Swapping to ZEC", "Usually about 2 to 3 minutes."],
                    ["ZEC delivered", "Sent to the recipient Zcash address."],
                  ].map(([a, b], i) => (
                    <li key={a} className={"flex gap-3 " + (tl[i] ? "text-[var(--text)]" : "text-[var(--muted)]")}>
                      <i className={"mt-1 h-[17px] w-[17px] flex-none rounded-full " + (tl[i] ? col(tl[i]) : "border-[1.5px] border-white/20")} />
                      <div>{a}<small className="block text-[13px] text-[var(--muted)]">{b}</small></div>
                    </li>
                  ))}
                </ul>
                {step === 3 && <p className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-300">{msg("SUCCESS")}</p>}
                {(step === -1 || expired) && <p className="mt-4 rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">{expired ? (cancelled ? "You cancelled this payment. Do not send funds to this address." : "This quote has expired. Do not send funds.") : msg(status)}</p>}
                {dest.length > 0 && step !== 3 && step !== -1 && (<p className="mt-4 rounded-xl border border-[rgba(244,183,40,0.4)] bg-[rgba(244,183,40,0.07)] p-3 text-sm">ZEC sent. Waiting for final confirmation.</p>)}<Hashes label="Your deposit transaction" items={origin} />
                <Hashes label="ZEC delivery transaction" items={dest} />
                <a href={explorer(addr)} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-[var(--gold)] underline">View this payment on the NEAR Intents explorer</a><p className="mt-2 text-xs text-[var(--muted)]">API status: {status || "none"}{checked && now ? " - checked " + Math.max(0, Math.floor((now - checked) / 1000)) + "s ago" : ""}</p>
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {events.map((e, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-[var(--gold)] text-xs font-bold text-[#1a1305]">Z</span>
                      <p className="rounded-2xl rounded-tl-sm bg-white/5 px-3.5 py-2 text-sm">{e}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={"md:sticky md:top-4 " + ring}>
            <div className={card + " text-center"}>
              {!ended ? (
                <>
                  <div className="mb-4 flex items-center justify-center gap-4">
                    <svg viewBox="0 0 76 76" className="h-[76px] w-[76px] -rotate-90">
                      <circle cx="38" cy="38" r="33" fill="none" stroke="rgba(255,248,230,0.1)" strokeWidth="6" />
                      <circle cx="38" cy="38" r="33" fill="none" stroke="#f4b728" strokeWidth="6" strokeLinecap="round" strokeDasharray="207.3" strokeDashoffset={207.3 * (1 - Math.min(1, left / total))} />
                    </svg>
                    <div className="text-left">
                      <b className="block text-3xl [font-family:var(--head)]">{mmss(left)}</b>
                      <span className="text-sm text-[var(--muted)]">{step === 0 ? "left to send" : "deposit received"}</span>
                    </div>
                  </div>
                  {qr && <img src={qr} alt="Deposit address QR code" className="mx-auto h-44 w-44 rounded-2xl bg-white p-2" />}
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[rgba(244,183,40,0.5)] px-3 py-2.5 text-left text-sm">
                    <div className="min-w-0"><small className="block text-xs text-[var(--muted)]">Deposit address</small><span className="break-all">{addr}</span></div>
                    <button type="button" onClick={() => copy("addr", addr)} className="send flex-none rounded-lg bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[#1a1305]">{copied === "addr" ? "Copied" : "Copy"}</button>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[rgba(244,183,40,0.5)] px-3 py-2.5 text-left text-sm">
                    <div><small className="block text-xs text-[var(--muted)]">Exact amount</small>{q.amountInFormatted} {t.sym}</div>
                    <button type="button" onClick={() => copy("amt", q.amountInFormatted)} className="send flex-none rounded-lg bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[#1a1305]">{copied === "amt" ? "Copied" : "Copy"}</button>
                  </div>
                  <p className="mt-3.5 rounded-lg bg-[rgba(244,183,40,0.08)] px-3 py-2 text-left text-[13px] text-amber-300">Send only {t.sym} on {t.chain}, and the exact amount. Other tokens or chains can be lost.</p>{step === 0 && (<button type="button" onClick={cancelPay} className="mt-3 w-full rounded-full border border-white/10 px-5 py-2.5 text-sm text-[var(--muted)] hover:border-red-400 hover:text-red-300">Cancel this payment</button>)}
                </>
              ) : (
                <div className="py-6">
                  <div className={"mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full text-3xl " + (step === 3 ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300")}>{step === 3 ? "\u2713" : step === -1 ? "\u21A9" : "!"}</div>
                  <h3 className="text-xl font-bold [font-family:var(--head)]">{step === 3 ? "Payment complete" : step === -1 ? "Refunded" : cancelled ? "Payment cancelled" : "Quote expired"}</h3>
                  <p className="mt-2 text-[15px] text-[var(--muted)]">
                    {step === 3 ? "About " + q.amountOutFormatted + " ZEC reached the recipient. Shield it in a Zcash wallet to make it private." : step === -1 ? "Your " + t.sym + " went back to " + short(refundTo) + ". Check your wallet and the explorer link." : "Do not send funds to this address. Start a new payment."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Pay() {
  return (
    <Suspense fallback={<main className="p-6">Loading...</main>}>
      <PayForm />
    </Suspense>
  );
}









