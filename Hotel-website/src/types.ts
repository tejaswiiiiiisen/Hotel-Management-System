// Shared shapes returned by the API.

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  dob?: string;
  country?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

export interface Room {
  id: number;
  name: string;
  slug: string;
  type: string;
  roomType?: string;
  roomNumber?: string;
  number?: string;
  floor?: string;
  roomView?: string;
  shortDescription: string;
  description: string;
  pricePerNight: number;
  price?: number;
  capacity: number;
  guests?: number;
  maxGuests?: number;
  sizeSqm: number;
  beds: string;
  images: string[];
  image?: string;
  amenities: string[];
  policies: string[];
  rating: number;
  reviewsCount: number;
  available: number | boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: number;
  roomId?: number;
  userId?: number | null;
  authorName: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface Guest {
  id: number;
  name: string;
  relationship?: string;
  age?: string | number;
  [key: string]: unknown;
}
