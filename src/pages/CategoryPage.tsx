import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ColoringCard } from "@/components/ColoringCard";
import { CategorySidebar } from "@/components/CategorySidebar";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Loader2, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { StructuredData } from "@/components/StructuredData";
import { SocialMeta } from "@/components/SocialMeta";

const ITEMS_PER_PAGE = 6;

const CategoryPage = () => {
  const { "*": pathSlug } = useParams<{ "*": string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Query category by path (supports multi-level like 'animals/cats/cute-cats')
  const { data: category, isLoading: isCategoryLoading } = useQuery({
    queryKey: ['category', pathSlug],
    queryFn: async () => {
      if (!pathSlug) throw new Error('Invalid category path');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('path', pathSlug)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!pathSlug,
  });

  // Special handling for "all" category - show top-level categories
  const isAllCategory = category?.slug === 'all' || category?.path === 'all';

  // Query subcategories of the current category with their counts
  const { data: subCategories, isLoading: isSubCategoriesLoading } = useQuery({
    queryKey: ['subcategories', category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      
      // Get all subcategories of the current category
      const { data: subCats, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', category.id)
        .order('order_position', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      if (!subCats) return [];
      
      // Get all possible child category IDs for counting
      const { data: allCategories } = await supabase
        .from('categories')
        .select('id, parent_id');
      
      // Build a map of category to all its descendants
      const buildDescendants = (catId: string): string[] => {
        const children = allCategories?.filter(c => c.parent_id === catId) || [];
        const descendants = [catId];
        children.forEach(child => {
          descendants.push(...buildDescendants(child.id));
        });
        return descendants;
      };
      
      // For each subcategory, count pages in it and all descendants
      const subCatsWithCounts = await Promise.all(
        subCats.map(async (subCat) => {
          const categoryIds = buildDescendants(subCat.id);
          
          const { count } = await supabase
            .from('coloring_pages')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
            .in('category_id', categoryIds);
          
          return {
            ...subCat,
            coloring_pages: [{ count: count || 0 }]
          };
        })
      );
      
      return subCatsWithCounts;
    },
    enabled: !!category?.id,
  });

  // Query all coloring pages in this category (and its subcategories recursively)
  const { data: allColoringPages, isLoading: isPagesLoading } = useQuery({
    queryKey: ['category-all-pages', category?.id, isAllCategory],
    queryFn: async () => {
      if (!category?.id) return [];
      
      // For "all" category, get all coloring pages
      if (isAllCategory) {
        const { data, error } = await supabase
          .from('coloring_pages')
          .select(`
            *,
            categories (
              name,
              slug
            )
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
      }
      
      // For regular categories, get all descendant category IDs
      const { data: allCategories } = await supabase
        .from('categories')
        .select('id, parent_id');
      
      const buildDescendants = (catId: string): string[] => {
        const children = allCategories?.filter(c => c.parent_id === catId) || [];
        const descendants = [catId];
        children.forEach(child => {
          descendants.push(...buildDescendants(child.id));
        });
        return descendants;
      };
      
      const categoryIds = buildDescendants(category.id);
      
      const { data, error } = await supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('status', 'published')
        .in('category_id', categoryIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

  // Calculate total count for current category (from actual pages)
  const currentCategoryCount = allColoringPages?.length || 0;

  // Calculate pagination
  const totalPages = Math.ceil((allColoringPages?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPages = allColoringPages?.slice(startIndex, endIndex) || [];

  // Reset to page 0 when category changes
  useEffect(() => {
    setCurrentPage(0);
  }, [pathSlug]);

  // Add pagination meta tags for SEO
  useEffect(() => {
    // Remove existing pagination tags
    const existingPrev = document.querySelector('link[rel="prev"]');
    const existingNext = document.querySelector('link[rel="next"]');
    existingPrev?.remove();
    existingNext?.remove();

    if (totalPages > 1 && category) {
      const baseUrl = `${window.location.origin}/category/${pathSlug}`;
      
      // Add prev link
      if (currentPage > 0) {
        const prevLink = document.createElement('link');
        prevLink.rel = 'prev';
        prevLink.href = currentPage === 1 ? baseUrl : `${baseUrl}?page=${currentPage}`;
        document.head.appendChild(prevLink);
      }
      
      // Add next link
      if (currentPage < totalPages - 1) {
        const nextLink = document.createElement('link');
        nextLink.rel = 'next';
        nextLink.href = `${baseUrl}?page=${currentPage + 2}`;
        document.head.appendChild(nextLink);
      }
    }

    return () => {
      document.querySelector('link[rel="prev"]')?.remove();
      document.querySelector('link[rel="next"]')?.remove();
    };
  }, [currentPage, totalPages, pathSlug, category]);

  // Build breadcrumb items from category path
  const breadcrumbItems: Array<{ label: string; href?: string; isCurrentPage?: boolean }> = [
    { label: 'Home', href: '/', isCurrentPage: false }
  ];
  if (category?.path) {
    const pathParts = category.path.split('/');
    pathParts.forEach((part, index) => {
      const isLast = index === pathParts.length - 1;
      breadcrumbItems.push({
        label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
        href: isLast ? undefined : `/category/${pathParts.slice(0, index + 1).join('/')}`,
        isCurrentPage: isLast,
      });
    });
  }

  useEffect(() => {
    if (category) {
      document.title = `Free Printable ${category.name} Coloring Pages - Download & Print | Color Minds`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `Browse ${allColoringPages?.length || 0}+ free printable ${category.name.toLowerCase()} coloring pages for kids and adults. ${category.description || ''} Download, print, and color high-quality designs instantly. Perfect for home or classroom.`
        );
      }
    }
  }, [category, allColoringPages?.length]);

  if (isCategoryLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Category Not Found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isLoading = isPagesLoading || isSubCategoriesLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <SocialMeta
        title={`Free Printable ${category.name} Coloring Pages - Download & Print`}
        description={`Browse ${allColoringPages?.length || 0}+ free printable ${category.name.toLowerCase()} coloring pages for kids and adults. ${category.description || ''} Download, print, and color high-quality designs instantly.`}
        image={allColoringPages?.[0]?.image_url}
        type="website"
        keywords={[
          `${category.name} coloring pages`,
          `free ${category.name.toLowerCase()} coloring pages`,
          `printable ${category.name.toLowerCase()} coloring pages`,
          'free printable coloring pages',
          'coloring pages for kids',
          'adult coloring pages',
          `${category.name.toLowerCase()} printables`
        ]}
      />
      
      <StructuredData
        type="CollectionPage"
        data={{
          category: category.name,
          description: category.description,
          numberOfItems: allColoringPages?.length || 0,
          items: allColoringPages?.map(page => ({
            title: page.title,
            image: page.image_url
          }))
        }}
      />

      {/* Category-specific FAQ Schema for important categories */}
      {['christmas', 'halloween', 'pokemon', 'frozen', 'unicorns', 'dinosaurs'].includes(category.slug) && (
        <StructuredData
          type="FAQPage"
          data={{
            questions: [
              {
                question: `Are these ${category.name} coloring pages free?`,
                answer: `Yes! All ${category.name} coloring pages on Color Minds are 100% free to download and print. You can print as many copies as you need for personal use, homeschooling, or classroom activities without any cost.`
              },
              {
                question: `How do I print ${category.name} coloring pages?`,
                answer: `To print ${category.name} coloring pages, simply click on any design you like, then click the "Print" button. Your browser's print dialog will open. We recommend using standard letter (8.5x11) or A4 paper for best results. You can print in black and white or color.`
              },
              {
                question: `What age are ${category.name} coloring pages suitable for?`,
                answer: `Our ${category.name} coloring pages are suitable for all ages! We have simple designs perfect for toddlers and preschoolers (ages 2-5), medium complexity for elementary kids (ages 6-10), and intricate patterns for teens and adults (ages 11+).`
              },
              {
                question: `Can I use these ${category.name} coloring pages for commercial purposes?`,
                answer: `These ${category.name} coloring pages are free for personal use, educational purposes, and non-commercial activities. For commercial licensing, please contact us.`
              }
            ]
          }}
        />
      )}
      
      <main className="flex-1">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="container px-4 py-8 md:py-12">
          <div className="flex gap-8">
            {/* Mobile Filter Button */}
            <div className="lg:hidden fixed bottom-6 right-6 z-40">
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button size="lg" className="rounded-full shadow-lg gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    Categories
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Categories</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <CategorySidebar
                      category={category!}
                      subCategories={subCategories || []}
                      totalCount={currentCategoryCount}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <CategorySidebar
                category={category!}
                subCategories={subCategories || []}
                totalCount={currentCategoryCount}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Category Header */}
              <header className="mb-8">
                {category.icon && category.icon.startsWith('http') ? (
                  <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-6 shadow-lg">
                    <img 
                      src={category.icon} 
                      alt={category.name} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                        Free Printable {category.name} Coloring Pages
                      </h1>
                      {category.description && (
                        <p className="text-sm md:text-base opacity-90">
                          {category.description}
                        </p>
                      )}
                      <div className="mt-2 text-xs md:text-sm opacity-80">
                        {allColoringPages?.length || 0} free printable coloring pages · Download and print instantly
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      {category.icon && !category.icon.startsWith('http') && (
                        <span className="text-4xl md:text-5xl">{category.icon}</span>
                      )}
                      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                        Free Printable {category.name} Coloring Pages
                      </h1>
                    </div>
                    {category.description && (
                      <p className="text-base md:text-lg text-muted-foreground mb-3">
                        {category.description}
                      </p>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {allColoringPages?.length || 0} free printable coloring pages · Download and print for kids and adults
                    </div>
                  </div>
                )}
              </header>

              {/* Loading State */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : paginatedPages.length > 0 ? (
                <>
                  {/* SEO Content Block - Only for important categories */}
                  {category.description && (allColoringPages?.length || 0) > 10 && (
                    <div className="mb-8 space-y-6">
                      <div className="p-6 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4">
                          About {category.name} Coloring Pages
                        </h2>
                        <div className="prose prose-sm md:prose max-w-none text-muted-foreground space-y-4">
                          <p className="mb-3">
                            {category.description}
                          </p>
                          <p className="mb-3">
                            Our collection features <strong>{allColoringPages?.length || 0}+ free printable {category.name.toLowerCase()} coloring pages</strong>, 
                            carefully designed for various skill levels. Whether you're looking for simple designs for young children or intricate patterns 
                            for adults, you'll find the perfect coloring page here.
                          </p>
                          <p className="mb-3">
                            Each <strong>{category.name.toLowerCase()} coloring page</strong> is professionally illustrated and optimized for printing on standard 
                            letter (8.5x11") or A4 paper. Simply download, print, and start coloring with your favorite crayons, colored pencils, or markers!
                          </p>
                          
                          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-background border">
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                👶 Perfect for Kids
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Our {category.name.toLowerCase()} coloring pages help develop fine motor skills, color recognition, 
                                and creativity in children ages 3-12.
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-background border">
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                🎨 Great for Adults
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Adult colorists will appreciate the detailed designs that provide hours of relaxing, 
                                meditative coloring experiences.
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-background border">
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                🏫 Educational Use
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Teachers and homeschoolers can use these {category.name.toLowerCase()} pages for classroom activities, 
                                art projects, and educational lessons.
                              </p>
                            </div>
                            <div className="p-4 rounded-lg bg-background border">
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                🎉 Special Occasions
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Perfect for parties, rainy day activities, travel entertainment, 
                                and quiet time at home or in waiting rooms.
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 p-4 rounded-lg bg-accent/10 border-2 border-accent/30">
                            <h3 className="font-semibold mb-2">💡 Tips for Coloring {category.name} Pages</h3>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <span className="text-accent font-bold">•</span>
                                <span>Start with lighter colors and gradually add darker shades for depth and dimension</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-accent font-bold">•</span>
                                <span>Use colored pencils for detailed areas and markers or crayons for larger sections</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-accent font-bold">•</span>
                                <span>Print multiple copies to experiment with different color schemes</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-accent font-bold">•</span>
                                <span>Frame your finished masterpieces or create a personalized coloring book</span>
                              </li>
                            </ul>
                          </div>

                          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm not-prose">
                            <div className="flex items-start gap-2">
                              <span className="text-primary font-medium">✓</span>
                              <span>100% free to download and print</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-primary font-medium">✓</span>
                              <span>High-quality, print-ready designs</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-primary font-medium">✓</span>
                              <span>No signup or registration required</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-primary font-medium">✓</span>
                              <span>Multiple difficulty levels available</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-primary font-medium">✓</span>
                              <span>New pages added regularly</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-primary font-medium">✓</span>
                              <span>Print unlimited copies</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Coloring Pages Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {paginatedPages.map((page) => (
                      <ColoringCard
                        key={page.id}
                        id={page.id}
                        slug={page.slug}
                        title={page.title}
                        image={page.image_url}
                        category={page.categories?.name || category.name}
                        difficulty={page.difficulty as "easy" | "medium" | "hard"}
                        seriesId={page.series_id}
                        seriesTitle={page.series_title}
                        seriesOrder={page.series_order}
                        seriesTotal={page.series_total}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <Pagination
                    pageCount={totalPages}
                    currentPage={currentPage}
                    onPageChange={(selected) => {
                      setCurrentPage(selected.selected);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />

                  {/* Printing Guide - Only for categories with many pages */}
                  {(allColoringPages?.length || 0) > 15 && (
                    <div className="mt-12 p-6 rounded-lg bg-muted/50 border">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span>🖨️</span>
                        <span>How to Print {category.name} Coloring Pages</span>
                      </h2>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                          <p><strong className="text-foreground">Choose your favorite design</strong> - Browse through our collection of {allColoringPages?.length || 0}+ {category.name.toLowerCase()} coloring pages and click on the one you like.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                          <p><strong className="text-foreground">Click the Print button</strong> - This will open your browser's print dialog with the coloring page ready to print.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                          <p><strong className="text-foreground">Select your settings</strong> - Choose paper size (letter or A4), orientation, and quality. We recommend using 20-24lb paper for best results.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                          <p><strong className="text-foreground">Start coloring!</strong> - Use crayons, colored pencils, markers, or any medium you prefer. All designs are optimized for easy printing.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No coloring pages found in this category yet.
                  </p>
                  <Button onClick={() => navigate('/')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Browse All Categories
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
