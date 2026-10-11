"use client";

// Phosphor icons call createContext internally, which Server Components
// cannot do — icons used by server-rendered markup cross this boundary.
export {
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  Minus,
  Pause,
  Play,
  Plus,
  ShoppingCartSimple,
  Star,
  X,
} from "@phosphor-icons/react";
