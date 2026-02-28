export type PaginatedResponse<T> = {
  readonly data: T[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
}

export type ResourceSummary = {
  id: string;
  title: string;
  description: string;
  category: string;
  country: string;
  platform: string;
  status: "ACTIVE" | "HIDDEN" | "SOLD_OUT";
  image?: string | null;
  price?: number | null;
  badge?: string | null;
  followers?: number | null;
  averageRating?: number | null;
  reviewCount?: number;
};

export type ResourceDetail = ResourceSummary & {
  tags: string[];
  link: string;
  image?: string | null;
  price?: number | null;
  createdAt: string;
  categoryId?: string | null;
};

export type OrderItem = {
  id: string;
  status: string;
  amount?: number | null;
  productLink?: string | null;
  discountCode?: string | null;
  finalPrice?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  postLink?: string | null;
  screenshotUrl?: string | null;
  createdAt: string;
  resource: {
    id: string;
    title: string;
  } | null;
  user?: {
    id: string;
    email?: string | null;
    phone?: string | null;
  };
};

export type UserProfile = {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: "USER" | "ADMIN";
  nickname?: string | null;
  avatar?: string | null;
};

export type WalletInfo = {
  id: string;
  balance: number;
};

export type TransactionItem = {
  id: string;
  type: "TOPUP" | "DEDUCTION" | "REFUND";
  amount: number;
  description: string;
  orderId?: string | null;
  createdAt: string;
  order?: {
    id: string;
    resource: { title: string } | null;
  } | null;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  orderId?: string | null;
  createdAt: string;
};

export type ReviewItem = {
  id: string;
  userId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: {
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

export type CartItemData = {
  id: string;
  userId: string;
  resourceId: string;
  createdAt: string;
  resource: ResourceSummary;
};

export type PaymentRequestItem = {
  id: string;
  amount: number;
  paymentMethod: "WECHAT" | "ALIPAY";
  status: "PENDING" | "APPROVED" | "REJECTED";
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};
