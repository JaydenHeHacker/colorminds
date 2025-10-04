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

  // Query parent category if current category has a parent_id
  const { data: parentCategory } = useQuery({
    queryKey: ['parent-category', category?.parent_id],
    queryFn: async () => {
      if (!category?.parent_id) return null;
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', category.parent_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!category?.parent_id,
  });

  // Determine the root category for sidebar (parent or current)
  const rootCategory = parentCategory || category;

  // Special handling for "all" category - show top-level categories
  const isAllCategory = category?.slug === 'all' || category?.path === 'all';

  // Query all siblings (subcategories of the root category) with their counts
  const { data: subCategories, isLoading: isSubCategoriesLoading } = useQuery({
    queryKey: ['subcategories', rootCategory?.id, isAllCategory],
    queryFn: async () => {
      if (!rootCategory?.id) return [];
      
      // First get all subcategories
      let query = supabase
        .from('categories')
        .select('*');
      
      if (isAllCategory) {
        query = query.eq('parent_id', category.id);
      } else {
        query = query.eq('parent_id', rootCategory.id);
      }
      
      const { data: subCats, error } = await query
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
    enabled: !!rootCategory?.id,
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

  // Calculate total count for root category (sum of all subcategories)
  const rootTotalCount = subCategories?.reduce((sum, sub) => {
    return sum + (sub.coloring_pages?.[0]?.count || 0);
  }, 0) || 0;

  // Calculate pagination
  const totalPages = Math.ceil((allColoringPages?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPages = allColoringPages?.slice(startIndex, endIndex) || [];

  // Reset to page 0 when category changes
  useEffect(() => {
    setCurrentPage(0);
  }, [pathSlug]);

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
                      category={rootCategory!}
                      subCategories={subCategories || []}
                      totalCount={rootTotalCount}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <CategorySidebar
                category={rootCategory!}
                subCategories={subCategories || []}
                totalCount={rootTotalCount}
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
