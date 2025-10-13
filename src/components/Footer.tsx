import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand intro */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold bg-clip-text text-transparent gradient-rainbow">Color Minds</h3>
            <p className="text-sm text-muted-foreground">
              Unleash creativity and explore endless possibilities. Free creative coloring pages — download and print
              anytime!
            </p>

            {/* SEO backlinks section */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Built by{" "}
                <a
                  href="https://github.com/superstonne"
                  target="_blank"
                  rel="noopener"
                  className="hover:text-primary underline-offset-4 hover:underline"
                >
                  Jinlong Hacker
                </a>
              </p>
              <p>
                Explore my AI project:{" "}
                <a
                  href="https://geminibanana.fun"
                  target="_blank"
                  rel="noopener"
                  className="hover:text-primary underline-offset-4 hover:underline"
                >
                  Geminibanana.fun
                </a>
              </p>
              <p>
                Also available as an open-source NPM package:
                <a href="https://www.npmjs.com/package/create-ai-coloring" rel="dofollow">
                  create-ai-coloring
                </a>
              </p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/category/all" className="hover:text-primary transition-smooth">
                  All Categories
                </Link>
              </li>
              <li>
                <Link to="/series" className="hover:text-primary transition-smooth">
                  Story Series
                </Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-primary transition-smooth">
                  Browse All
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/favorites" className="hover:text-primary transition-smooth">
                  My Favorites
                </Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-primary transition-smooth">
                  Browse All Pages
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="hover:text-primary transition-smooth">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
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
              <li>
                <Link to="/sitemap" className="hover:text-primary transition-smooth">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom line */}
        <div className="border-t border-border/40 pt-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            Made with <Heart className="h-4 w-4 text-accent fill-accent" /> for coloring enthusiasts
          </p>
          <p className="text-xs text-muted-foreground mt-2">© 2025 Color Minds. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
