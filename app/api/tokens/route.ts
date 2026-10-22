import { getTokens } from "../../../lib/oneclick";

export async function GET() {
  try {
    const tokens = await getTokens();
    const list = tokens.map((t) => ({
      assetId: t.assetId,
      symbol: t.symbol,
      blockchain: t.blockchain,
      decimals: t.decimals,
      price: t.price,
    }));
    return Response.json(list);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}