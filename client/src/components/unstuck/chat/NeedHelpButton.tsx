import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { NeedHelpButtonProps } from "./types";

export const NeedHelpButton = ({ onClick }: NeedHelpButtonProps) => (
  <Button
    onClick={onClick}
    size="lg"
    className="rounded-full h-12 pl-4 pr-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg flex items-center gap-2"
  >
    <MessageCircle className="h-5 w-5 text-white" />
    <span className="text-white font-medium">Need help?</span>
  </Button>
); 