
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BOOKING_HISTORY } from "@/data/mockBookingHistory";
import { FEATURED_LISTINGS } from "@/data/mockListings";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const BookingHistory = () => {
  return (
    <div className="container mx-auto py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Booking History</h1>
      <div className="space-y-4">
        {BOOKING_HISTORY.map((booking, index) => {
          const property = FEATURED_LISTINGS.find(
            (listing) => listing.id === booking.propertyId
          );

          if (!property) return null;

          return (
            <Link key={booking.id} to={`/booking/${booking.id}`}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{
                animationDelay: `${index * 100}ms`
              }}>
                <CardHeader className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-primary">{property.title}</CardTitle>
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
                    className={`text-sm font-medium transition-colors ${
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
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default BookingHistory;
