
import { Menu, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between animate-fade-down">
        <Link to="/" className="text-xl font-bold hover:text-primary transition-colors">
          Airbnb Clone
        </Link>

        <div className="flex-1 px-8">
          <form onSubmit={handleSearch} className="relative group">
            <Input 
              type="search" 
              placeholder="Search destinations..." 
              className="max-w-sm mx-auto transition-all duration-300 focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/history">
            <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
              <History className="h-5 w-5" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 animate-scale-in">
              <DropdownMenuItem asChild>
                <Link to="/settings" className="w-full cursor-pointer hover:text-primary transition-colors">
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
