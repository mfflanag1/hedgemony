"use client";

import { useEffect, useState } from "react";

/**
 * Per-tab display name. Uses sessionStorage (not localStorage) so two tabs in
 * the same browser get distinct names — important when both tabs join the
 * same lobby room.
 */
export function usePlayerName(): [string, (name: string) => void] {
  const [name, setName] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem("hedgemony:displayName");
    if (stored) {
      setName(stored);
    } else {
      const fresh = `operator-${Math.random().toString(36).slice(2, 6)}`;
      setName(fresh);
      window.sessionStorage.setItem("hedgemony:displayName", fresh);
    }
  }, []);
  const update = (n: string) => {
    setName(n);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("hedgemony:displayName", n);
    }
  };
  return [name, update];
}
