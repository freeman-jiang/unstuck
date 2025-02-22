
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { ChevronRight, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrency();
  const [showHelpOptions, setShowHelpOptions] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const navigate = useNavigate();

  const handleCurrencyChange = (value: string) => {
    setCurrency(value as 'USD' | 'CAD');
    toast({
      title: "Currency updated",
      description: `Currency has been changed to ${value}`,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="max-w-md space-y-8">
        <div className="space-y-4">
          <Label htmlFor="currency">Currency</Label>
          <Select defaultValue={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="CAD">CAD (C$)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-between"
            onClick={() => setShowHelpOptions(!showHelpOptions)}
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span>Need Help?</span>
            </div>
            <ChevronRight className={`h-4 w-4 transition-transform ${showHelpOptions ? 'rotate-90' : ''}`} />
          </Button>

          {showHelpOptions && (
            <div className="pl-4 space-y-4 animate-fade-in">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
              >
                More Options
                <ChevronRight className={`h-4 w-4 transition-transform ${showMoreOptions ? 'rotate-90' : ''}`} />
              </Button>

              {showMoreOptions && (
                <div className="pl-4 animate-fade-in">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => navigate('/help/support')}
                  >
                    Contact Support
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
