// Runnable data check: the one self-test for the data layer.
// Fails (exit 1) if the live API stops matching the shape the UI assumes.
//   node scripts/check-api.mjs
const BASE =
  process.env.BACKEND_API_URL ??
  "https://gamehub1-hsdtbxdcfvfva3fw.centralindia-01.azurewebsites.net";

const REQUIRED = ["id", "name", "genre", "platform", "price", "rating", "inStock", "imageUrls"];

function assertPagedGames(json) {
  if (!json || json.success !== true) throw new Error(`envelope: ${json?.message ?? "no payload"}`);
  const { items, totalCount, totalPages } = json.data ?? {};
  if (!Array.isArray(items) || typeof totalCount !== "number") {
    throw new Error("shape: data.items/data.totalCount missing");
  }
  for (const g of items) {
    for (const f of REQUIRED) {
      if (g[f] === undefined || g[f] === null) throw new Error(`item ${g.id ?? "?"} missing "${f}"`);
    }
    if (typeof g.price !== "number" || typeof g.rating !== "number") {
      throw new Error(`item ${g.id}: non-numeric price/rating`);
    }
    if (!Array.isArray(g.imageUrls)) throw new Error(`item ${g.id}: imageUrls not an array`);
  }
  return { items, totalCount, totalPages };
}

const res = await fetch(`${BASE}/api/Games?page=1&pageSize=100`, { signal: AbortSignal.timeout(15000) });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const { items, totalCount, totalPages } = assertPagedGames(await res.json());

console.log(`OK: ${items.length} items, totalCount=${totalCount}, totalPages=${totalPages}`);
const s = items[0];
console.log(`sample: ${s.name} | ${s.genre} | Rs.${s.price} | ${s.rating} | art: ${s.imageUrls[0]}`);
