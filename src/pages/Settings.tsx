
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const storedCurrency = localStorage.getItem("currency") || "USD";

  const handleCurrencyChange = (value: string) => {
    localStorage.setItem("currency", value);
    toast({
      title: "Currency updated",
      description: `Currency has been changed to ${value}`,
    });
    window.location.reload();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="max-w-md">
        <div className="space-y-4">
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select defaultValue={storedCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
