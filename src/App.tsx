import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import ColoringPage from "./pages/ColoringPage";
import CategoryPage from "./pages/CategoryPage";
import SeriesPage from "./pages/SeriesPage";
import AllSeries from "./pages/AllSeries";
import Favorites from "./pages/Favorites";
import Sitemap from "./pages/Sitemap";
import ImageSitemap from "./pages/ImageSitemap";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import CreatePage from "./pages/CreatePage";
import CreditsStore from "./pages/CreditsStore";
import Community from "./pages/Community";
import AIColoringPage from "./pages/AIColoringPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/coloring-page/:slug" element={<ColoringPage />} />
          <Route path="/ai-coloring-page/:id" element={<AIColoringPage />} />
          <Route path="/my-creations/:id" element={<AIColoringPage />} />
          <Route path="/category/*" element={<CategoryPage />} />
          <Route path="/series" element={<AllSeries />} />
          <Route path="/series/:slug" element={<SeriesPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/credits" element={<CreditsStore />} />
          <Route path="/credits-store" element={<CreditsStore />} />
          <Route path="/community" element={<Community />} />
          <Route path="/sitemap.xml" element={<Sitemap />} />
          <Route path="/image-sitemap.xml" element={<ImageSitemap />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
