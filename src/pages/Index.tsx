
import { ListingCard } from "@/components/ListingCard";
import { FEATURED_LISTINGS, CATEGORIES } from "@/data/mockListings";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filters } from "@/components/Filters";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search")?.toLowerCase();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Math.max(...FEATURED_LISTINGS.map(l => l.price))]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const filteredListings = FEATURED_LISTINGS.filter((listing) => {
    const matchesCategory = selectedCategory ? listing.category === selectedCategory : true;
    const matchesSearch = searchQuery
      ? listing.title.toLowerCase().includes(searchQuery) ||
        listing.location.toLowerCase().includes(searchQuery) ||
        listing.description.toLowerCase().includes(searchQuery)
      : true;
    const matchesPriceRange = listing.price >= priceRange[0] && listing.price <= priceRange[1];
    const matchesAmenities = selectedAmenities.length === 0 || 
      selectedAmenities.every(amenity => listing.amenities.includes(amenity));
    
    return matchesCategory && matchesSearch && matchesPriceRange && matchesAmenities;
  });

  useEffect(() => {
    if (searchQuery) {
      setSelectedCategory(null);
    }
  }, [searchQuery]);

  const handleFiltersChange = (filters: { priceRange: [number, number]; selectedAmenities: string[] }) => {
    setPriceRange(filters.priceRange);
    setSelectedAmenities(filters.selectedAmenities);
  };

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

      {/* Categories and Filters */}
      <section className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4 overflow-x-auto">
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
          <Filters
            onFiltersChange={handleFiltersChange}
            maxPrice={Math.max(...FEATURED_LISTINGS.map(l => l.price))}
          />
        </div>
      </section>

      {/* Featured Listings */}
      <section className="container mx-auto py-8">
        <h2 className="mb-8 text-3xl font-bold">
          {searchQuery 
            ? `Search results for "${searchQuery}"`
            : `${selectedCategory || "Featured"} places to stay`}
        </h2>
        {filteredListings.length === 0 ? (
          <p className="text-center text-gray-500">No properties found matching your criteria.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
