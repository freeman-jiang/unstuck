
export interface Listing {
  id: number;
  title: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  dates: string;
  description: string;
  category: string;
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
}

export const CATEGORIES = [
  "Beachfront",
  "Mountain View",
  "City Living",
  "Countryside"
];

export const FEATURED_LISTINGS: Listing[] = [
  {
    id: 1,
    title: "Luxury Villa with Ocean View",
    location: "Malibu, California",
    price: 550,
    rating: 4.97,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 1-6",
    description: "Experience luxury living in this stunning oceanfront villa with panoramic views of the Pacific.",
    category: "Beachfront",
    amenities: ["Pool", "Hot Tub", "WiFi", "Kitchen", "Free parking"],
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8
  },
  {
    id: 2,
    title: "Modern Downtown Loft",
    location: "New York City, NY",
    price: 299,
    rating: 4.85,
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 7-12",
    description: "Stylish loft in the heart of Manhattan with easy access to all attractions.",
    category: "City Living",
    amenities: ["WiFi", "Kitchen", "Gym", "Doorman", "Elevator"],
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4
  },
  {
    id: 3,
    title: "Cozy Mountain Cabin",
    location: "Aspen, Colorado",
    price: 425,
    rating: 4.92,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 15-20",
    description: "Rustic cabin with stunning mountain views, perfect for winter sports enthusiasts.",
    category: "Mountain View",
    amenities: ["Fireplace", "Hot Tub", "WiFi", "Kitchen", "Ski-in/Ski-out"],
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6
  },
  {
    id: 4,
    title: "Beachfront Paradise",
    location: "Miami Beach, Florida",
    price: 375,
    rating: 4.88,
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 20-25",
    description: "Beautiful beachfront condo with direct access to pristine beaches.",
    category: "Beachfront",
    amenities: ["Beach access", "Pool", "WiFi", "Kitchen", "Gym"],
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4
  },
];
