import type {
  ResourceDetail,
  ResourceSummary,
  PaginatedResponse,
  WalletInfo,
  TransactionItem,
  NotificationItem,
  CartItemData
} from "@/lib/types";

export async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!res.ok) {
    let message = "Request failed";
    try {
      const json = await res.json();
      message = json.error || json.message || message;
    } catch {
      const text = await res.text();
      if (text) message = text;
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function fetcherOrNull<T>(url: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (res.status === 401) return null;
  if (!res.ok) {
    let message = "Request failed";
    try {
      const json = await res.json();
      message = json.error || json.message || message;
    } catch {
      const text = await res.text();
      if (text) message = text;
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  resources: (query = "") => fetcher<PaginatedResponse<ResourceSummary>>(`/api/resources${query}`),
  resource: (id: string) => fetcher<ResourceDetail>(`/api/resources/${id}`),
  createResource: (payload: Partial<ResourceDetail>) =>
    fetcher<ResourceDetail>("/api/resources", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateResource: (id: string, payload: Partial<ResourceDetail>) =>
    fetcher<ResourceDetail>(`/api/resources/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteResource: (id: string) =>
    fetcher<{ ok: true }>(`/api/resources/${id}`, { method: "DELETE" }),
  favorites: async () => (await fetcherOrNull<string[]>("/api/favorites")) ?? [],
  toggleFavorite: (resourceId: string) =>
    fetcher<{ ok: true }>("/api/favorites", {
      method: "POST",
      body: JSON.stringify({ resourceId })
    }),
  wallet: () => fetcher<WalletInfo>("/api/wallet"),
  walletTransactions: (page = 1, pageSize = 20) =>
    fetcher<PaginatedResponse<TransactionItem>>(
      `/api/wallet/transactions?page=${page}&pageSize=${pageSize}`
    ),
  notifications: (page = 1, unreadOnly = false) =>
    fetcher<{ data: NotificationItem[]; total: number; unreadCount: number; page: number; pageSize: number }>(
      `/api/notifications?page=${page}${unreadOnly ? "&unreadOnly=true" : ""}`
    ),
  markNotificationRead: (id: string) =>
    fetcher<{ success: true }>(`/api/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () =>
    fetcher<{ success: true }>("/api/notifications/read-all", { method: "PUT" }),
  cart: () => fetcher<CartItemData[]>("/api/cart"),
  cartIds: async () => {
    const items = await fetcherOrNull<CartItemData[]>("/api/cart");
    return items ? items.map((i) => i.resourceId) : [];
  },
  addToCart: (resourceId: string) =>
    fetcher<{ success: true }>("/api/cart", {
      method: "POST",
      body: JSON.stringify({ resourceId })
    }),
  removeFromCart: (resourceId: string) =>
    fetcher<{ success: true }>(`/api/cart?resourceId=${encodeURIComponent(resourceId)}`, {
      method: "DELETE"
    }),
  batchOrder: (items: { resourceId: string; productLink?: string; discountCode?: string; finalPrice?: number | null; startDate?: string | null; endDate?: string | null; message?: string }[]) =>
    fetcher<{ success: true; orderCount: number }>("/api/cart/batch-order", {
      method: "POST",
      body: JSON.stringify({ items })
    }),
  categories: () => fetcher<{ id: string; name: string; sort: number }[]>("/api/categories"),
  tags: () => fetcher<{ id: string; name: string; sort: number }[]>("/api/tags"),
  updateProfile: (payload: { nickname?: string; avatar?: string }) =>
    fetcher<{ success: true }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    fetcher<{ success: true }>("/api/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  activePaymentQrCodes: (type?: string) =>
    fetcher<{ id: string; type: string; imageUrl: string; label?: string }[]>(
      `/api/payment-qr${type ? `?type=${type}` : ""}`
    ),
  createPaymentRequest: (payload: { amount: number; paymentMethod: string; qrCodeId?: string; note?: string; screenshotUrl?: string }) =>
    fetcher<{ success: true; referenceNo: string }>("/api/payment-requests", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  myPaymentRequests: (page = 1) =>
    fetcher<PaginatedResponse<any>>(`/api/payment-requests?page=${page}`)
};
