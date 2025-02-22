
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { AMENITIES } from "@/data/mockListings";
import { SlidersHorizontal } from "lucide-react";

interface FiltersProps {
  onFiltersChange: (filters: {
    priceRange: [number, number];
    selectedAmenities: string[];
  }) => void;
  maxPrice: number;
}

export function Filters({ onFiltersChange, maxPrice }: FiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity]
    );
  };

  const applyFilters = () => {
    onFiltersChange({
      priceRange: priceRange,
      selectedAmenities: selectedAmenities,
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-medium mb-4">Price Range</h3>
            <Slider
              min={0}
              max={maxPrice}
              step={25}
              value={[priceRange[0], priceRange[1]]}
              onValueChange={handlePriceChange}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-4">Amenities</h3>
            <div className="space-y-3">
              {AMENITIES.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={selectedAmenities.includes(amenity)}
                    onCheckedChange={() => handleAmenityToggle(amenity)}
                  />
                  <label htmlFor={amenity} className="text-sm">
                    {amenity}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
