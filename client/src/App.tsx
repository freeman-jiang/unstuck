import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { UnstuckProvider } from "./contexts/UnstuckContext";
import BookingDetails from "./pages/BookingDetails";
import BookingHistory from "./pages/BookingHistory";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PropertyDetails from "./pages/PropertyDetails";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CurrencyProvider>
        <UnstuckProvider
          config={{
            apiKey: "test-api-key",
            // serverUrl: "https://server.getunstuck.workers.dev",
            serverUrl: "http://localhost:8787",
          }}
        >
          {/* <WorkflowCreator /> */}
          <div className="min-h-screen bg-background font-sans antialiased">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Navbar />
              <main className="animate-fade-in">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/property/:id" element={<PropertyDetails />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/history" element={<BookingHistory />} />
                  <Route path="/booking/:id" element={<BookingDetails />} />
                  <Route path="/help/support" element={<Support />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </BrowserRouter>
          </div>
        </UnstuckProvider>
      </CurrencyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
