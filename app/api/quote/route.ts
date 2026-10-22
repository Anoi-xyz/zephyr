import { requestQuote } from "../../../lib/oneclick";

const ZEC = "nep141:zec.omft.near";

export async function POST(req: Request) {
  try {
    const { originAsset, amount, recipient, refundTo, dry } = await req.json();

    if (!originAsset || !amount || !recipient || !refundTo) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!/^t[13][a-zA-Z0-9]{25,40}$/.test(recipient)) {
      return Response.json(
        { error: "Recipient must be a transparent Zcash address (t1... or t3...)" },
        { status: 400 }
      );
    }

    const quote = await requestQuote({
      dry: dry !== false,
      originAsset,
      destinationAsset: ZEC,
      amount: String(amount),
      recipient,
      refundTo,
    });
    return Response.json(quote);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}