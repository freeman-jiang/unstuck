
import { FEATURED_LISTINGS } from "./mockListings";

export interface Booking {
  id: number;
  propertyId: number;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: "completed" | "cancelled" | "upcoming";
  confirmationNumber: string;
}

export const BOOKING_HISTORY: Booking[] = [
  {
    id: 1,
    propertyId: FEATURED_LISTINGS[0].id,
    checkIn: "2024-02-01",
    checkOut: "2024-02-05",
    totalPrice: 800,
    status: "completed",
    confirmationNumber: "BOK123456",
  },
  {
    id: 2,
    propertyId: FEATURED_LISTINGS[1].id,
    checkIn: "2024-03-15",
    checkOut: "2024-03-20",
    totalPrice: 1200,
    status: "upcoming",
    confirmationNumber: "BOK789012",
  },
];
