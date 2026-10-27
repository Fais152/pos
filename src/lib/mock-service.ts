"use client";

import { mutate } from "swr";
import { apiRequest, ApiClientError } from "./api-client";
import type {
  Category,
  Ingredient,
  Order,
  OrderItem,
  PaymentMethod,
  Product,
  Settings,
  User,
} from "./types";

function refresh() {
  mutate("/api/bootstrap").catch((error) => {
    console.error("Gagal memuat ulang data setelah perubahan.", error);
  });
}

export type SaveUserInput = Pick<User, "id" | "name" | "username" | "isActive"> & {
  password?: string;
};

class ApiService {
  async saveCategory(category: Category) {
    await apiRequest("/api/categories", {
      method: "POST",
      body: JSON.stringify({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
      }),
    });
    await refresh();
  }

  async deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiRequest(`/api/categories?id=${encodeURIComponent(categoryId)}`, {
        method: "DELETE",
      });
      await refresh();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Gagal menghapus kategori.",
      };
    }
  }

  async saveProduct(
    product: Product,
    recipes?: Array<{ ingredientId: string; qtyPerPortion: number }>,
  ) {
    await apiRequest("/api/products", {
      method: "POST",
      body: JSON.stringify({
        id: product.id,
        categoryId: product.categoryId,
        name: product.name,
        price: product.price,
        isActive: product.isActive,
        recipes,
      }),
    });
    await refresh();
  }

  async toggleProductStatus(productId: string) {
    await apiRequest(`/api/products/${encodeURIComponent(productId)}/toggle`, {
      method: "PATCH",
    });
    await refresh();
  }

  async saveIngredient(ingredient: Ingredient) {
    await apiRequest("/api/ingredients", {
      method: "POST",
      body: JSON.stringify({
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        currentStock: ingredient.currentStock,
        minStock: ingredient.minStock,
        costPerUnit: ingredient.costPerUnit,
        isActive: ingredient.isActive,
      }),
    });
    await refresh();
  }

  async createIngredient(ingredient: Ingredient, createdBy: string) {
    void createdBy;
    await this.saveIngredient(ingredient);
  }

  async restockIngredient(params: {
    ingredientId: string;
    qty: number;
    unitCost?: number;
    note: string;
    createdBy: string;
  }) {
    await apiRequest("/api/ingredients/restock", {
      method: "POST",
      body: JSON.stringify({
        ingredientId: params.ingredientId,
        qty: params.qty,
        unitCost: params.unitCost,
        note: params.note,
      }),
    });
    await refresh();
  }

  async adjustOrWasteStock(params: {
    ingredientId: string;
    type: "adjustment" | "waste";
    qtyChange?: number;
    countedQty?: number;
    note: string;
    createdBy: string;
  }) {
    await apiRequest("/api/ingredients/adjust", {
      method: "POST",
      body: JSON.stringify({
        ingredientId: params.ingredientId,
        type: params.type,
        qtyChange: params.qtyChange,
        countedQty: params.countedQty,
        note: params.note,
      }),
    });
    await refresh();
  }

  async createOrder(params: {
    orderId: string;
    orderType: "dine_in" | "takeaway";
    tableLabel?: string | null;
    items: Array<{ productId: string; qty: number; note?: string }>;
    discount: number;
    clientTotal: number;
    paymentMethod: PaymentMethod;
    cashReceived: number;
    cashierId: string;
  }): Promise<{ order: Order; items: OrderItem[]; replayed?: boolean }> {
    const result = await apiRequest<{ order: Order; items: OrderItem[]; replayed?: boolean }>(
      "/api/orders",
      {
      method: "POST",
      body: JSON.stringify({
        id: params.orderId,
        orderType: params.orderType,
        tableLabel: params.tableLabel,
        items: params.items,
        discount: params.discount,
        clientTotal: params.clientTotal,
        paymentMethod: params.paymentMethod,
        cashReceived: params.cashReceived,
      }),
    });
    await refresh();
    return result;
  }

  async voidOrder(orderId: string, voidReason: string, voidedBy: string) {
    void voidedBy;
    await apiRequest(`/api/orders/${encodeURIComponent(orderId)}/void`, {
      method: "POST",
      body: JSON.stringify({ reason: voidReason }),
    });
    await refresh();
    return true;
  }

  async updateSettings(settings: Settings) {
    await apiRequest("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    await refresh();
  }

  async saveUser(user: SaveUserInput) {
    await apiRequest("/api/users", {
      method: "POST",
      body: JSON.stringify({
        id: user.id,
        name: user.name,
        username: user.username,
        password: user.password,
        isActive: user.isActive,
      }),
    });
    await refresh();
  }

  async toggleUserActive(userId: string) {
    await apiRequest(`/api/users/${encodeURIComponent(userId)}/toggle`, {
      method: "PATCH",
    });
    await refresh();
  }
}

export const mockDb = new ApiService();
export { ApiClientError };


