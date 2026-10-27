"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { apiRequest, fetchSessionUser } from "@/lib/api-client";
import type { User } from "@/lib/types";

export interface SessionState {
  user: User | null;
  ready: boolean;
}

export function useSession() {
  const router = useRouter();
  const { data, isLoading } = useSWR<{ user: User | null }>(
    "/api/auth/me",
    async () => ({ user: await fetchSessionUser() }),
    {
      revalidateOnFocus: true,
      shouldRetryOnError: false,
      keepPreviousData: false,
    },
  );

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await apiRequest<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      await mutate("/api/auth/me", { user: result.user }, false);
      await mutate("/api/bootstrap");
      return { ok: true as const, user: result.user };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Gagal masuk.",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      await mutate("/api/auth/me", { user: null }, false);
      await mutate("/api/bootstrap");
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  return {
    user: data?.user ?? null,
    loading: isLoading && !data,
    login,
    logout,
  };
}

export type UserSession = ReturnType<typeof useSession>;
