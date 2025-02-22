
import { ListingCard } from "@/components/ListingCard";

const FEATURED_LISTINGS = [
  {
    id: 1,
    title: "Luxury Villa with Ocean View",
    location: "Malibu, California",
    price: 550,
    rating: 4.97,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 1-6",
  },
  {
    id: 2,
    title: "Modern Downtown Loft",
    location: "New York City, NY",
    price: 299,
    rating: 4.85,
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 7-12",
  },
  {
    id: 3,
    title: "Cozy Mountain Cabin",
    location: "Aspen, Colorado",
    price: 425,
    rating: 4.92,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 15-20",
  },
  {
    id: 4,
    title: "Beachfront Paradise",
    location: "Miami Beach, Florida",
    price: 375,
    rating: 4.88,
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    dates: "Apr 20-25",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
          alt="Hero"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="mb-4 text-5xl font-bold animate-fade-down">
              Find your next adventure
            </h1>
            <p className="text-xl animate-fade-up">
              Discover unique stays around the world
            </p>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="container mx-auto py-16">
        <h2 className="mb-8 text-3xl font-bold">Featured places to stay</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_LISTINGS.map((listing) => (
            <ListingCard key={listing.id} {...listing} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
