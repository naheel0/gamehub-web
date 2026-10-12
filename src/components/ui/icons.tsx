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
  MapPin,
  Minus,
  Package,
  PaperPlaneRight,
  Pause,
  Pencil,
  Play,
  Plus,
  ShoppingCartSimple,
  SignOut,
  Star,
  Trash,
  UserCircle,
  X,
} from "@phosphor-icons/react";
