import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  AlertTriangle,
  ChevronRight,
  Coffee,
  HelpCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface NestedMenuProps {
  title: string;
  icon?: React.ReactNode;
  children?: string[];
  depth?: number;
  maxDepth?: number;
  onFinalOption?: () => void;
}

const Settings = () => {
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();

  const handleCurrencyChange = (value: string) => {
    setCurrency(value as "USD" | "CAD");
    toast({
      title: "Currency updated",
      description: `Currency has been changed to ${value}`,
    });
  };

  const NestedMenu = ({
    title,
    icon,
    children = [],
    depth = 0,
    maxDepth = 5,
    onFinalOption,
  }: NestedMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // If we're at max depth and have children, show the final option
    if (depth === maxDepth && children.length > 0) {
      return (
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={onFinalOption}
        >
          {icon && icon}
          <span>{children[0]}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      );
    }

    // If no children or at max depth, don't render anything
    if (children.length === 0 || depth > maxDepth) {
      return null;
    }

    // Split the children - first one for this level, rest for next level
    const currentOption = children[0];
    const remainingOptions = children.slice(1);

    const randomIcons = [
      <Coffee className="h-4 w-4" />,
      <Zap className="h-4 w-4" />,
      <AlertTriangle className="h-4 w-4" />,
    ];
    const randomIcon =
      randomIcons[Math.floor(Math.random() * randomIcons.length)];

    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            {icon || randomIcon}
            <span>{title}</span>
          </div>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        </Button>

        {isOpen && (
          <div className={`pl-${depth + 4} space-y-4 animate-fade-in`}>
            <NestedMenu
              title={currentOption}
              children={remainingOptions}
              depth={depth + 1}
              maxDepth={maxDepth}
              onFinalOption={onFinalOption}
            />
          </div>
        )}
      </div>
    );
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

        <NestedMenu
          title="Need Help?"
          icon={<HelpCircle className="h-4 w-4" />}
          children={[
            "Advanced Options",
            "Secret Settings",
            "Click Deeper",
            "No, Even Deeper",
            "You're Getting Warmer",
            "Almost There (Not Really)",
            "Contact Support (If You're Worthy)",
          ]}
          maxDepth={6}
          onFinalOption={() => navigate("/help/support")}
        />

        <div className="text-xs text-muted-foreground mt-4 italic">
          Note: To contact support, navigate through all 7 layers of our
          unnecessarily complicated menu system. Good luck!
        </div>
      </div>
    </div>
  );
};

export default Settings;
