/**
 * Admin DTOs hand-mirrored from GameHub.Application/DTOs/Admin — the
 * backend is the contract. The fixed value sets come from
 * GameHub.Domain.Enums and are validated there (Enum.TryParse), so the UI
 * must only ever offer values from these lists.
 */

export type AdminOrderListDto = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  orderDate: string;
};

export type AdminShippingAddressDto = {
  fullName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
};

export type OrderItemDto = {
  gameId: number;
  gameName: string;
  price: number;
  quantity: number;
};

export type AdminOrderDetailDto = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  subTotal: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  orderDate: string;
  items: OrderItemDto[];
  shippingAddress: AdminShippingAddressDto;
};

export type AdminUserListDto = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export type AdminUserDetailDto = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  addressCount: number;
  orderCount: number;
  totalSpent: number;
};

export type OrderStatusCount = { status: string; count: number };
export type DailySales = { date: string; amount: number };

export type DashboardStatsDto = {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  orderStatusDistribution: OrderStatusCount[];
  last7DaysSales: DailySales[];
};

/** Canonical GUID shape — the backend routes constrain {orderId:guid}, so a
 *  malformed id must 404 locally before any request is made. */
export const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GameHub.Domain/Enums — backend-validated, exact member names. */
export const ORDER_STATUSES = [
  "Pending",
  "Placed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Confirmed",
] as const;
export const ROLES = ["User", "Admin"] as const;
export const ACCOUNT_STATUSES = ["Active", "Blocked"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type Role = (typeof ROLES)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
