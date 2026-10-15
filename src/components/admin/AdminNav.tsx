"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// one entry per landed surface — never a link to a route that 404s
const ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/games", label: "Games" },
];

/** Rail nav for the admin shell. Active = crimson leaning tick + heading
 *  color + aria-current — never color alone (storefront rule). */
export default function AdminNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className={
        orientation === "vertical" ? "flex flex-col gap-0.5" : "flex gap-0.5 overflow-x-auto"
      }
    >
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-2.5 px-3 py-2 font-display text-lg leading-none tracking-[0.06em] uppercase transition duration-150 hover:text-heading active:scale-[0.98] ${
              active ? "text-heading" : "text-muted"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-4 w-0.5 -skew-x-[26deg] bg-accent transition-transform duration-200 ${
                active ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
              }`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
