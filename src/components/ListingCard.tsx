
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { StarIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface ListingCardProps {
  id: number;
  title: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  dates: string;
}

export function ListingCard({ id, title, location, price, rating, image, dates }: ListingCardProps) {
  return (
    <Link to={`/property/${id}`}>
      <Card className="group overflow-hidden border-none transition-transform duration-300 hover:-translate-y-1">
        <CardContent className="p-0">
          <AspectRatio ratio={4/3} className="bg-muted">
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </AspectRatio>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-airbnb-accent">{location}</p>
              </div>
              <div className="flex items-center gap-1">
                <StarIcon className="h-4 w-4" />
                <span className="text-sm">{rating}</span>
              </div>
            </div>
            <p className="text-sm text-airbnb-accent mt-2">{dates}</p>
            <p className="mt-2">
              <span className="font-semibold">${price}</span>
              <span className="text-airbnb-accent"> night</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
