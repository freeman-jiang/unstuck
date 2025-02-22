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

export const AMENITIES = [
  "Pool",
  "Hot Tub",
  "WiFi",
  "Kitchen",
  "Free parking",
  "Gym",
  "Beach access",
  "Air conditioning",
  "BBQ grill",
  "Fireplace"
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
  {
    id: 5,
    title: "Rustic Farmhouse Retreat",
    location: "Vermont, USA",
    price: 275,
    rating: 4.89,
    image: "https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 10-15",
    description: "Experience authentic farm living in this beautifully restored historic farmhouse.",
    category: "Countryside",
    amenities: ["Kitchen", "Fireplace", "BBQ grill", "Free parking", "WiFi"],
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6
  },
  {
    id: 6,
    title: "Urban Penthouse Suite",
    location: "Chicago, Illinois",
    price: 450,
    rating: 4.95,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 12-17",
    description: "Luxurious penthouse with stunning views of the Chicago skyline.",
    category: "City Living",
    amenities: ["Gym", "WiFi", "Air conditioning", "Kitchen", "Free parking"],
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4
  },
  {
    id: 7,
    title: "Lakeside Cabin",
    location: "Lake Tahoe, California",
    price: 325,
    rating: 4.87,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 15-20",
    description: "Cozy cabin by the lake with stunning mountain views and outdoor activities.",
    category: "Mountain View",
    amenities: ["Hot Tub", "Fireplace", "BBQ grill", "Kitchen", "WiFi"],
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4
  },
  {
    id: 8,
    title: "Tropical Beach Villa",
    location: "Maui, Hawaii",
    price: 625,
    rating: 4.98,
    image: "https://images.unsplash.com/photo-1505881402582-c5bc11054f91?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 18-23",
    description: "Luxurious beachfront villa with direct access to pristine Hawaiian beaches.",
    category: "Beachfront",
    amenities: ["Pool", "Beach access", "Air conditioning", "Kitchen", "BBQ grill"],
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8
  },
  {
    id: 9,
    title: "Mountain Lodge",
    location: "Banff, Canada",
    price: 475,
    rating: 4.91,
    image: "https://images.unsplash.com/photo-1517320964276-a002fa203177?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 20-25",
    description: "Spacious lodge with breathtaking views of the Canadian Rockies.",
    category: "Mountain View",
    amenities: ["Hot Tub", "Fireplace", "Free parking", "Kitchen", "WiFi"],
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6
  },
  {
    id: 10,
    title: "Historic Downtown Loft",
    location: "Boston, Massachusetts",
    price: 285,
    rating: 4.86,
    image: "https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 22-27",
    description: "Charming loft in a historic building in the heart of downtown Boston.",
    category: "City Living",
    amenities: ["WiFi", "Air conditioning", "Kitchen", "Gym", "Free parking"],
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2
  }
];
