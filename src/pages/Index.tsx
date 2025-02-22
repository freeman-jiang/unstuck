
import { ListingCard } from "@/components/ListingCard";
import { FEATURED_LISTINGS, CATEGORIES } from "@/data/mockListings";
import { useState } from "react";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredListings = selectedCategory
    ? FEATURED_LISTINGS.filter((listing) => listing.category === selectedCategory)
    : FEATURED_LISTINGS;

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

      {/* Categories */}
      <section className="container mx-auto py-8">
        <div className="flex gap-4 overflow-x-auto pb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              !selectedCategory
                ? "bg-primary text-white"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            All Properties
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === category
                  ? "bg-primary text-white"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="container mx-auto py-8">
        <h2 className="mb-8 text-3xl font-bold">
          {selectedCategory || "Featured"} places to stay
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} {...listing} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
