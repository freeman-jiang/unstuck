
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-3xl font-bold mb-4">Customer Support</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Need assistance? Our support team is here to help you.
        </p>
        
        <div className="inline-flex items-center justify-center gap-2 text-lg font-medium">
          <Mail className="h-5 w-5" />
          <span>info@unstuck.com</span>
        </div>
      </div>
    </div>
  );
};

export default Support;
