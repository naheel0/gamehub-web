"use client";

// Phosphor icons call createContext internally, which Server Components
// cannot do — icons used by server-rendered markup cross this boundary.
export { ArrowRight, Pause, Play, Star } from "@phosphor-icons/react";
