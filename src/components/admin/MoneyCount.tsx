"use client";

import CountUp from "@/components/ui/CountUp";
import { formatPrice } from "@/lib/format";

/** formatPrice is a function, and functions cannot cross the RSC boundary
 *  into a client component — so money-counting lives on this side of it. */
export default function MoneyCount({ value }: { value: number }) {
  return <CountUp value={value} format={formatPrice} />;
}
