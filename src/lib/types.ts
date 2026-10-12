/** Shape of GET /api/Games as verified against the live backend. */
export interface Game {
  id: number;
  name: string;
  genre: string;
  platform: string;
  price: number;
  rating: number;
  inStock: boolean;
  trailerUrl: string;
  imageUrls: string[];
  description: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PagedGames {
  items: Game[];
  totalCount: number;
  totalPages: number;
}

/** Snapshot rows from /api/Wishlist and /api/Cart (verified against backend DTOs). */
export interface WishlistItem {
  gameId: number;
  gameName: string;
  image: string;
  price: number;
}

export interface CartItem extends WishlistItem {
  quantity: number;
}

/** GET /api/Auth/profile envelope data (verified against AuthResponse). */
export interface ProfileUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string; // "User" | "Admin"
  status: string; // "Active" | "Blocked"
}

/** /api/Addresses rows (verified against AddressDto). */
export interface Address {
  addressId: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

/** /api/Orders rows — history carries the full OrderDto (verified). */
export interface OrderItem {
  gameId: number;
  gameName: string;
  price: number;
  quantity: number;
}

export interface Order {
  purchaseId: number;
  orderId: string;
  orderDate: string; // ISO timestamp
  items: OrderItem[];
  subTotal: number;
  tax: number;
  total: number;
  shippingAddress: Address;
  paymentMethod: string;
  status: string;
}
