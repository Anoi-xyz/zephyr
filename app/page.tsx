import Link from "next/link";

const steps = [
  { n: "1", t: "Tell Zephyr", d: "Say which token and chain you pay from, and how much. Typing \"10 usdc on base\" is enough." },
  { n: "2", t: "Get a payment page", d: "The assistant checks the details and builds a page with everything filled in." },
  { n: "3", t: "Send and watch", d: "Send to one deposit address. Progress updates live until the ZEC lands." },
];

const card = "rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 backdrop-blur";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <nav className="flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold [font-family:var(--head)]">
          <img src="/logo.png" alt="" className="h-[30px] w-auto" />
          Zephyr
        </Link>
        <Link href="/agent" className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-[18px] py-2.5 text-[15px] font-medium hover:border-[var(--gold)]">
          Meet Zephyr
        </Link>
      </nav>

      <header className="py-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 text-sm text-[var(--muted)]">
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--gold)]" />
          Built on Zcash and NEAR Intents
        </div>
        <h1 className="mx-auto mb-4 mt-6 max-w-[14ch] text-5xl font-bold leading-[1.04] md:text-7xl">
          Describe the payment. Get a link.
        </h1>
        <p className="mx-auto max-w-[52ch] text-lg text-[var(--muted)]">
          Tell Zephyr what you want to pay with. The recipient gets ZEC, whatever chain you pay from.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/agent" className="rounded-full bg-[var(--gold)] px-7 py-3.5 font-semibold text-[var(--gold-ink)] hover:bg-[#ffc83f]">
            Meet Zephyr
          </Link>
          <a href="#how" className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-7 py-3.5 font-medium hover:border-[var(--gold)]">
            See how it works
          </a>
        </div>
        <p className="mt-5 text-sm text-[var(--muted)]">
          Pay from Ethereum, Base, Arbitrum, Solana or Bitcoin. The recipient gets ZEC.
        </p>
      </header>

      <section id="how" className="pt-16">
        <h2 className="max-w-[20ch] text-3xl font-bold leading-tight md:text-4xl">One chat, one link, one payment.</h2>
        <p className="mb-8 mt-3 max-w-[56ch] text-[17px] text-[var(--muted)]">
          The assistant asks only for what is missing. The app checks every address before a link exists, so a typo cannot turn into a lost payment.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className={card}>
              <span className="mb-3 grid h-7 w-7 place-items-center rounded-full bg-[rgba(244,183,40,0.15)] text-sm font-bold text-[var(--gold)]">{s.n}</span>
              <h3 className="mb-2 text-[17px] font-semibold">{s.t}</h3>
              <p className="text-[15px] text-[var(--muted)]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-16">
        <h2 className="max-w-[20ch] text-3xl font-bold leading-tight md:text-4xl">What the payer sees</h2>
        <p className="mb-8 mt-3 max-w-[56ch] text-[17px] text-[var(--muted)]">
          A single deposit address, a clear price, and live progress until the ZEC lands.
        </p>
        <div className="grid items-start gap-5 md:grid-cols-[1.1fr_0.9fr]">
          <div className={card}>
            <h3 className="mb-3 text-[17px] font-semibold">Send exactly 10.00 USDC (Base) to:</h3>
            <div className="my-3 break-all rounded-xl border border-dashed border-[rgba(244,183,40,0.5)] px-3.5 py-3 text-sm">
              0xSAMPLE_DEPOSIT_ADDRESS_NOT_REAL
            </div>
            <ul className="mt-3 space-y-4 text-[var(--muted)]">
              <li className="flex gap-3 text-[var(--text)]">
                <i className="mt-1 h-[17px] w-[17px] flex-none rounded-full bg-[var(--gold)] shadow-[0_0_0_5px_rgba(244,183,40,0.18)]" />
                <div>Waiting for your deposit<small className="block text-[13px] text-[var(--muted)]">This address expires with the quote, so send soon.</small></div>
              </li>
              <li className="flex gap-3">
                <i className="mt-1 h-[17px] w-[17px] flex-none rounded-full border-[1.5px] border-[var(--line)]" />
                <div>Swapping to ZEC<small className="block text-[13px]">Usually about 2 minutes.</small></div>
              </li>
              <li className="flex gap-3">
                <i className="mt-1 h-[17px] w-[17px] flex-none rounded-full border-[1.5px] border-[var(--line)]" />
                <div>ZEC delivered<small className="block text-[13px]">Sent to the recipient&apos;s Zcash address.</small></div>
              </li>
            </ul>
          </div>
          <div className={card}>
            <h3 className="mb-3 text-[17px] font-semibold">Price breakdown</h3>
            <div className="flex justify-between py-1.5 text-sm text-[var(--muted)]"><span>Payer sends</span><b className="font-medium text-[var(--text)]">10.00 USDC</b></div>
            <div className="flex justify-between border-t border-[var(--line)] py-1.5 text-sm text-[var(--muted)]"><span>Swap and network fees</span><b className="font-medium text-[var(--text)]">about $0.42</b></div>
            <div className="flex justify-between border-t border-[var(--line)] py-1.5 text-sm text-[var(--muted)]"><span>Recipient receives</span><b className="font-medium text-[var(--text)]">about 0.0077 ZEC</b></div>
            <p className="mt-3.5 text-sm text-[var(--muted)]">
              Sample quote. If a swap fails, funds return to your refund address.{" "}
              <strong className="font-semibold text-[var(--gold)]">ZEC arrives at a public address, so shield it in your Zcash wallet to make it private.</strong>
            </p>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap justify-between gap-4 py-14 text-sm text-[var(--muted)]">
        <span>Zephyr is open source and built for ZECATHON.</span>
        <span>Numbers on this page are from a sample quote.</span>
      </footer>
    </div>
  );
}



