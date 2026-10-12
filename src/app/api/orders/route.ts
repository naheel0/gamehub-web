import { relay } from "@/lib/auth";

/** Signed-in order history — the rows carry full detail, so no id route. */
export async function GET() {
  return relay("GET", "/api/Orders");
}
