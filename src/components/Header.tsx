import { Menu, Heart, LogIn, LogOut, User, X, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
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
  const {
    isAdmin
  } = useUserRole(user);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };
  
  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };
  return <>
      <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background backdrop-blur-sm">
        <nav className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center space-x-3">
              <img src={logo} alt="Color Minds Logo" className="h-12 w-auto md:h-16 object-contain transition-smooth hover:scale-105" />
              <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent gradient-rainbow">
                Color Minds
              </span>
            </a>
            
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => scrollToSection('categories')} className="text-sm font-medium transition-smooth hover:text-primary">
                Categories
              </button>
              <button onClick={() => navigate('/series')} className="text-sm font-medium transition-smooth hover:text-primary">
                Story Series
              </button>
              <button onClick={() => navigate('/community')} className="text-sm font-medium transition-smooth hover:text-primary flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                AI Gallery
              </button>
              <button onClick={() => navigate('/gallery')} className="text-sm font-medium transition-smooth hover:text-primary flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                Color Showcase
              </button>
              <button onClick={() => scrollToSection('popular')} className="text-sm font-medium transition-smooth hover:text-primary">
                Popular
              </button>
              {user && <button onClick={() => navigate('/favorites')} className="text-sm font-medium transition-smooth hover:text-primary flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  My Favorites
                </button>}
              {isAdmin && <button onClick={() => navigate('/admin')} className="text-sm font-medium transition-smooth hover:text-primary">
                  Admin
                </button>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={() => navigate("/create")} className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <span>✨ Create</span>
            </Button>

            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50 bg-popover">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-creations')}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    My Creations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/favorites')}>
                    <Heart className="h-4 w-4 mr-2" />
                    My Favorites
                  </DropdownMenuItem>
                  {isAdmin && <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <User className="h-4 w-4 mr-2" />
                        Admin
                      </DropdownMenuItem>
                    </>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Button variant="default" size="sm" onClick={() => navigate("/auth")} className="gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden md:inline">Log In</span>
              </Button>}
            
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
            <Button onClick={() => {
            navigate('/create');
            setMobileMenuOpen(false);
          }} className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80">
              ✨ Create Your Own
            </Button>
            {user && <button onClick={() => {
            navigate('/profile');
            setMobileMenuOpen(false);
          }} className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                My Profile
              </button>}
            {user && <button onClick={() => {
            navigate('/my-creations');
            setMobileMenuOpen(false);
          }} className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                My Creations
              </button>}
            <button onClick={() => scrollToSection('categories')} className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth">
              Categories
            </button>
            <button onClick={() => {
            navigate('/series');
            setMobileMenuOpen(false);
          }} className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth">
              Story Series
            </button>
            <button onClick={() => {
            navigate('/community');
            setMobileMenuOpen(false);
          }} className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Gallery
            </button>
            <button onClick={() => {
            navigate('/gallery');
            setMobileMenuOpen(false);
          }} className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Color Showcase
            </button>
            <button onClick={() => scrollToSection('popular')} className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth">
              Popular
            </button>
            {user && <button onClick={() => {
            navigate('/favorites');
            setMobileMenuOpen(false);
          }} className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth flex items-center gap-2">
                <Heart className="h-5 w-5" />
                My Favorites
              </button>}
            {isAdmin && <button onClick={() => {
            navigate('/admin');
            setMobileMenuOpen(false);
          }} className="w-full text-left px-4 py-3 text-base font-medium hover:bg-muted rounded-lg transition-smooth">
                Admin
              </button>}
            {!user && <Button onClick={() => {
            navigate('/auth');
            setMobileMenuOpen(false);
          }} className="w-full gap-2">
                <LogIn className="h-5 w-5" />
                Log In
              </Button>}
          </div>
        </DrawerContent>
      </Drawer>
    </>;
};