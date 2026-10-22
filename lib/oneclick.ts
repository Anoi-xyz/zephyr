const BASE = "https://1click.chaindefuser.com";
const JWT = process.env.ONECLICK_JWT;

export interface Token {
  assetId: string;
  symbol: string;
  blockchain: string;
  decimals: number;
  price?: number;
  contractAddress?: string;
}

export interface QuoteRequest {
  originAsset: string;
  destinationAsset: string;
  amount: string;
  recipient: string;
  refundTo: string;
  dry?: boolean;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (JWT) h.Authorization = `Bearer ${JWT}`;
  return h;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`1Click ${path} -> ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const getTokens = () => call<Token[]>("/v0/tokens");

export async function findZec(): Promise<Token[]> {
  const tokens = await getTokens();
  return tokens.filter((t) => t.symbol.toUpperCase().includes("ZEC"));
}

export function requestQuote(r: QuoteRequest) {
  return call<any>("/v0/quote", {
    method: "POST",
    body: JSON.stringify({
      dry: r.dry ?? false,
      swapType: "EXACT_INPUT",
      slippageTolerance: 100,
      originAsset: r.originAsset,
      depositType: "ORIGIN_CHAIN",
      destinationAsset: r.destinationAsset,
      amount: r.amount,
      refundTo: r.refundTo,
      refundType: "ORIGIN_CHAIN",
      recipient: r.recipient,
      recipientType: "DESTINATION_CHAIN",
      deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }),
  });
}

export const submitDeposit = (txHash: string, depositAddress: string) =>
  call<any>("/v0/deposit/submit", {
    method: "POST",
    body: JSON.stringify({ txHash, depositAddress }),
  });

export const getStatus = (depositAddress: string) =>
  call<{ status: string }>(`/v0/status?depositAddress=${encodeURIComponent(depositAddress)}`);
