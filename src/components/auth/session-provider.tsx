"use client";

import { createContext, useContext } from "react";
import type { UserSession } from "@/hooks/use-session";

const SessionContext = createContext<UserSession | null>(null);

export function SessionProvider({
  value,
  children,
}: {
  value: UserSession;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAppSession(): UserSession {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useAppSession must be used inside SessionProvider");
  }
  return ctx;
}
