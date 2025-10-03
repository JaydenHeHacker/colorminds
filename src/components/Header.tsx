import { Search, Menu, Heart, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);

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
    toast.success("已退出登录");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center space-x-3">
            <img src={logo} alt="Color Minds Logo" className="h-10 w-10" />
            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent gradient-rainbow">
              Color Minds
            </h1>
          </a>
          
          <div className="hidden md:flex items-center gap-4">
            <a href="#categories" className="text-sm font-medium transition-smooth hover:text-primary">
              分类
            </a>
            <a href="#popular" className="text-sm font-medium transition-smooth hover:text-primary">
              热门
            </a>
            {user && (
              <button 
                onClick={() => navigate("/#favorites")}
                className="text-sm font-medium transition-smooth hover:text-primary flex items-center gap-1"
              >
                <Heart className="h-4 w-4" />
                我的收藏
              </button>
            )}
            <a href="/admin" className="text-sm font-medium transition-smooth hover:text-primary">
              管理
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user.email?.split('@')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/#favorites")}>
                  <Heart className="h-4 w-4 mr-2" />
                  我的收藏
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate("/auth")} className="gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden md:inline">登录</span>
            </Button>
          )}
          
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </nav>
    </header>
  );
};
