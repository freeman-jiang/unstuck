
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BOOKING_HISTORY } from "@/data/mockBookingHistory";
import { FEATURED_LISTINGS } from "@/data/mockListings";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import { useParams } from "react-router-dom";

const BookingDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  const booking = BOOKING_HISTORY.find(
    (booking) => booking.id === Number(id)
  );
  
  if (!booking) {
    return <div className="container mx-auto py-8">Booking not found</div>;
  }
  
  const property = FEATURED_LISTINGS.find(
    (listing) => listing.id === booking.propertyId
  );

  if (!property) {
    return <div className="container mx-auto py-8">Property not found</div>;
  }

  const handleContactSupport = () => {
    toast({
      title: "Support Request Sent",
      description: "Our team will contact you shortly regarding your booking.",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Booking Details</h1>
      <Card>
        <CardHeader>
          <CardTitle>{property.title}</CardTitle>
          <p className="text-muted-foreground">{property.location}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Booking Information</h3>
              <p>Confirmation #{booking.confirmationNumber}</p>
              <p>Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</p>
              <p>Check-in: {format(new Date(booking.checkIn), "MMMM d, yyyy")}</p>
              <p>Check-out: {format(new Date(booking.checkOut), "MMMM d, yyyy")}</p>
              <p>Total Price: ${booking.totalPrice}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Property Details</h3>
              <p>{property.description}</p>
              <div className="mt-4">
                <img
                  src={property.image}
                  alt={property.title}
                  className="rounded-lg w-full object-cover h-48"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center pt-4">
            <Button onClick={handleContactSupport} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingDetails;
