"use client";

import useSWR from "swr";
import { toast } from "sonner";
import { fetchBootstrap } from "@/lib/api-client";
import type { DatabaseState } from "@/lib/types";

const EMPTY_STATE: DatabaseState = {
  users: [],
  categories: [],
  products: [],
  ingredients: [],
  recipes: [],
  orders: [],
  orderItems: [],
  stockMovements: [],
  settings: {
    cafeName: "Koetaw",
    address: "",
    phone: "",
    taxPercent: 0,
    servicePercent: 0,
    receiptFooter: "",
    timezone: "Asia/Makassar",
  },
};

export function useMockDb(): DatabaseState {
  const { data } = useSWR<DatabaseState>("/api/bootstrap", fetchBootstrap, {
    revalidateOnFocus: true,
    keepPreviousData: true,
    shouldRetryOnError: false,
    onError: () => {
      toast.error("Gagal memuat data. Periksa koneksi server lalu coba lagi.", {
        id: "bootstrap-error",
      });
    },
    onSuccess: () => {
      toast.dismiss("bootstrap-error");
    },
  });

  return data ?? EMPTY_STATE;
}
