import { Button } from "@/components/ui/button";
import { useUnstuck } from "@/contexts/UnstuckContext";
import { useState } from "react";

export function HelpButton() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { getContext } = useUnstuck();

  const handleHelp = async () => {
    console.log("Getting context");
    const { interactiveElements, domString, screenshot } = await getContext();
    console.log(interactiveElements);

    setIsAnalyzing(true);
    try {
      const response = await fetch("http://localhost:8787/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userQuery:
            "I want to find all the properties that have a swimming pool.", // Placeholder query
          screenshot,
          domString,
          interactiveElements,
        }),
      });

      const data = await response.json();
      console.log("Analysis response:", data);
    } catch (error) {
      console.error("Error analyzing page:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Button
      onClick={handleHelp}
      disabled={isAnalyzing}
      className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg"
    >
      {isAnalyzing ? "Analyzing..." : "Need Help?"}
    </Button>
  );
}
