import { relay } from "@/lib/auth";

/** Signed-in wishlist, resolved server-side (browser never hits the API). */
export async function GET() {
  return relay("GET", "/api/Wishlist");
}
