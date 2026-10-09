"use client";

// Phosphor icons call createContext internally, which Server Components
// cannot do — icons used by server-rendered markup cross this boundary.
export {
  ArrowLeft,
  ArrowRight,
  Minus,
  Pause,
  Play,
  Plus,
  ShoppingCartSimple,
  Star,
} from "@phosphor-icons/react";
