import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { PrintBasket } from "@/components/PrintBasket";
import { RedirectHandler } from "@/components/RedirectHandler";
import { lazy, Suspense } from "react";

// Eager load critical pages (Index is most important)
import Index from "./pages/Index";

// Lazy load all other pages for better initial load performance
const Browse = lazy(() => import("./pages/Browse"));
const ColoringPage = lazy(() => import("./pages/ColoringPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SeriesPage = lazy(() => import("./pages/SeriesPage"));
const AllSeries = lazy(() => import("./pages/AllSeries"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const CreatePage = lazy(() => import("./pages/CreatePage"));
const CreditsStore = lazy(() => import("./pages/CreditsStore"));
const Community = lazy(() => import("./pages/Community"));
const AIColoringPage = lazy(() => import("./pages/AIColoringPage"));
const MyCreations = lazy(() => import("./pages/MyCreations"));
const UserGallery = lazy(() => import("./pages/UserGallery"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const Popular = lazy(() => import("./pages/Popular"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RedirectHandler />
      <PrintBasket />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/popular" element={<Popular />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/coloring-page/:slug" element={<ColoringPage />} />
          <Route path="/ai-coloring-page/:id" element={<AIColoringPage />} />
          <Route path="/my-creations" element={<MyCreations />} />
          <Route path="/my-creations/:id" element={<AIColoringPage />} />
          <Route path="/category/*" element={<CategoryPage />} />
          <Route path="/series" element={<AllSeries />} />
          <Route path="/series/:slug" element={<SeriesPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/credits" element={<CreditsStore />} />
          <Route path="/credits-store" element={<CreditsStore />} />
          <Route path="/community" element={<Community />} />
          <Route path="/gallery" element={<UserGallery />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/contact-us" element={<ContactUs />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
