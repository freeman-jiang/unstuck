
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { StarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ListingCardProps {
  id: number;
  title: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  dates: string;
}

const convertCurrency = (price: number, currency: string) => {
  const CAD_RATE = 1.35;
  if (currency === "CAD") {
    return Math.round(price * CAD_RATE);
  }
  return price;
};

export function ListingCard({ id, title, location, price, rating, image, dates }: ListingCardProps) {
  const { currency } = useCurrency();
  const convertedPrice = convertCurrency(price, currency);

  return (
    <Link to={`/property/${id}`}>
      <Card className="group overflow-hidden border-none transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-in">
        <CardContent className="p-0">
          <AspectRatio ratio={4/3} className="bg-muted">
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </AspectRatio>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{location}</p>
              </div>
              <div className="flex items-center gap-1">
                <StarIcon className="h-4 w-4 text-primary" />
                <span className="text-sm">{rating}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{dates}</p>
            <p className="mt-2">
              <span className="font-semibold">{convertedPrice} {currency}</span>
              <span className="text-muted-foreground"> night</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
