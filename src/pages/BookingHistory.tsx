
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BOOKING_HISTORY } from "@/data/mockBookingHistory";
import { FEATURED_LISTINGS } from "@/data/mockListings";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const BookingHistory = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Booking History</h1>
      <div className="space-y-4">
        {BOOKING_HISTORY.map((booking) => {
          const property = FEATURED_LISTINGS.find(
            (listing) => listing.id === booking.propertyId
          );

          if (!property) return null;

          return (
            <Link key={booking.id} to={`/booking/${booking.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <CardTitle>{property.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {property.location}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="text-sm font-medium">
                      {format(new Date(booking.checkIn), "MMM d, yyyy")} -{" "}
                      {format(new Date(booking.checkOut), "MMM d, yyyy")}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Confirmation #{booking.confirmationNumber}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <div
                    className={`text-sm font-medium ${
                      booking.status === "completed"
                        ? "text-green-600"
                        : booking.status === "upcoming"
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)}
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BookingHistory;
