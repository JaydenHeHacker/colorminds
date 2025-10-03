import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent gradient-rainbow">
              ColoringFun
            </h1>
          </a>
          
          <div className="hidden md:flex items-center gap-4">
            <a href="#categories" className="text-sm font-medium transition-smooth hover:text-primary">
              Categories
            </a>
            <a href="#popular" className="text-sm font-medium transition-smooth hover:text-primary">
              Popular
            </a>
            <a href="/admin" className="text-sm font-medium transition-smooth hover:text-primary">
              Admin
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coloring pages..."
                className="pl-8"
              />
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </nav>
    </header>
  );
};
