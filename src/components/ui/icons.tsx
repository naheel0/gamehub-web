"use client";

// Phosphor icons call createContext internally, which Server Components
// cannot do — icons used by server-rendered markup cross this boundary.
export {
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Eye,
  EyeSlash,
  Heart,
  List,
  MagnifyingGlass,
  Minus,
  PaperPlaneRight,
  Pause,
  Play,
  Plus,
  ShoppingCartSimple,
  SignOut,
  Star,
  Trash,
  X,
} from "@phosphor-icons/react";
