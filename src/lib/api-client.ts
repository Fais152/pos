import type { DatabaseState } from "./types";

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: init.signal ?? controller.signal,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    clearTimeout(timeout);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError(
        "Koneksi ke server terlalu lama. Periksa koneksi lalu coba lagi.",
        0,
      );
    }
    
    console.error(error);
    throw new ApiClientError(
      "Koneksi ke server terlalu lama. Periksa koneksi lalu coba lagi.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Permintaan gagal (${response.status}).`;
    throw new ApiClientError(message, response.status);
  }

  return payload as T;
}

export async function fetchBootstrap(): Promise<DatabaseState> {
  return apiRequest<DatabaseState>("/api/bootstrap", { cache: "no-store" });
}

export async function fetchSessionUser() {
  const result = await apiRequest<{ user: import("./types").User | null }>("/api/auth/me", {
    cache: "no-store",
  });
  return result.user;
}
