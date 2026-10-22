import { getStatus } from "../../../lib/oneclick";

export async function GET(req: Request) {
  try {
    const depositAddress = new URL(req.url).searchParams.get("depositAddress");
    if (!depositAddress) {
      return Response.json({ error: "depositAddress is required" }, { status: 400 });
    }
    const status = await getStatus(depositAddress);
    return Response.json(status);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}