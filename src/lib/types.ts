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
