import { Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const Footer = () => {
  const navigate = useNavigate();
  
  const scrollToSection = (sectionId: string) => {
    if (window.location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-border/40 py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold bg-clip-text text-transparent gradient-rainbow">
              Color Minds
            </h3>
            <p className="text-sm text-muted-foreground">
              Unleash creativity and explore endless possibilities. Free creative coloring pages, download and print anytime!
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={() => scrollToSection('categories')} className="hover:text-primary transition-smooth">
                  All Categories
                </button>
              </li>
              <li>
                <Link to="/series" className="hover:text-primary transition-smooth">
                  Story Series
                </Link>
              </li>
              <li>
                <button onClick={() => scrollToSection('popular')} className="hover:text-primary transition-smooth">
                  Popular
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/favorites" className="hover:text-primary transition-smooth">
                  My Favorites
                </Link>
              </li>
              <li>
                <button onClick={() => scrollToSection('popular')} className="hover:text-primary transition-smooth">
                  Popular Pages
                </button>
              </li>
              <li>
                <Link to="/about-us" className="hover:text-primary transition-smooth">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy-policy" className="hover:text-primary transition-smooth">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-primary transition-smooth">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="hover:text-primary transition-smooth">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border/40 pt-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            Made with <Heart className="h-4 w-4 text-accent fill-accent" /> for coloring enthusiasts
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © 2024 Color Minds. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
