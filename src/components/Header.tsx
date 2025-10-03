import { Search, Menu, Heart, LogIn, LogOut, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useUserRole } from "@/hooks/use-user-role";
import { useIsMobile } from "@/hooks/use-mobile";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { isAdmin } = useUserRole(user);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background backdrop-blur-sm">
        <nav className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center space-x-3">
              <div className="relative p-1 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                <img src={logo} alt="Color Minds Logo" className="h-10 w-auto md:h-12 object-contain transition-smooth hover:scale-105" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent gradient-rainbow">
                Color Minds
              </h1>
            </a>
            
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => scrollToSection('categories')} className="text-sm font-medium transition-smooth hover:text-primary">
                Categories
              </button>
              <button onClick={() => scrollToSection('popular')} className="text-sm font-medium transition-smooth hover:text-primary">
                Popular
              </button>
              {user && (
                <button 
                  onClick={() => scrollToSection('favorites')}
                  className="text-sm font-medium transition-smooth hover:text-primary flex items-center gap-1"
                >
                  <Heart className="h-4 w-4" />
                  My Favorites
                </button>
              )}
              {isAdmin && (
                <button onClick={() => navigate('/admin')} className="text-sm font-medium transition-smooth hover:text-primary">
                  Admin
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Search */}
            {!isMobile && (
              showSearch ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                    autoFocus
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowSearch(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
                  <Search className="h-5 w-5" />
                </Button>
              )
            )}

            {/* Mobile Search Button */}
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
                <Search className="h-5 w-5" />
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50 bg-popover">
                  <DropdownMenuItem onClick={() => scrollToSection('favorites')}>
                    <Heart className="h-4 w-4 mr-2" />
                    My Favorites
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <User className="h-4 w-4 mr-2" />
                        Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" onClick={() => navigate("/auth")} className="gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden md:inline">Log In</span>
              </Button>
            )}
            
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerContent>
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <DrawerTitle>Menu</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <button 
              onClick={() => scrollToSection('categories')} 
              className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth"
            >
              Categories
            </button>
            <button 
              onClick={() => scrollToSection('popular')} 
              className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth"
            >
              Popular
            </button>
            {user && (
              <button 
                onClick={() => scrollToSection('favorites')}
                className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth flex items-center gap-2"
              >
                <Heart className="h-5 w-5" />
                My Favorites
              </button>
            )}
            {isAdmin && (
              <button 
                onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth"
              >
                Admin
              </button>
            )}
            {!user && (
              <Button 
                onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }} 
                className="w-full gap-2"
              >
                <LogIn className="h-5 w-5" />
                Log In
              </Button>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Mobile Search Drawer */}
      <Drawer open={showSearch && isMobile} onOpenChange={setShowSearch}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Search Coloring Pages</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <form onSubmit={handleSearch} className="space-y-4">
              <Input
                type="text"
                placeholder="Search by title, category, or series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                autoFocus
              />
              <Button type="submit" className="w-full gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
