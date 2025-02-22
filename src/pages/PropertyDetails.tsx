
import { useParams } from "react-router-dom";
import { FEATURED_LISTINGS } from "@/data/mockListings";
import { StarIcon } from "lucide-react";

const PropertyDetails = () => {
  const { id } = useParams();
  const property = FEATURED_LISTINGS.find(
    (listing) => listing.id === Number(id)
  );

  if (!property) {
    return <div className="container mx-auto py-8">Property not found</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-8">
        {/* Image */}
        <div className="rounded-xl overflow-hidden h-[50vh]">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold mb-4">{property.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              <StarIcon className="h-5 w-5" />
              <span>{property.rating}</span>
              <span className="text-airbnb-accent">·</span>
              <span>{property.location}</span>
            </div>
            <p className="text-gray-600 mb-6">{property.description}</p>
            
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">What this place offers</h2>
              <ul className="grid grid-cols-2 gap-4">
                {property.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2">
                    <span>✓</span> {amenity}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Booking Card */}
          <div className="rounded-xl border p-6 h-fit sticky top-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-2xl font-bold">${property.price}</span>
                <span className="text-gray-600"> / night</span>
              </div>
              <div className="flex items-center gap-1">
                <StarIcon className="h-4 w-4" />
                <span>{property.rating}</span>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {property.maxGuests} guests · {property.bedrooms} bedrooms · {property.bathrooms} bathrooms
              </p>
            </div>
            <p className="text-sm text-gray-600">{property.dates}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
