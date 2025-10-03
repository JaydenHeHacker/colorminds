import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ColoringCard } from "@/components/ColoringCard";
import { SubCategoryCard } from "@/components/SubCategoryCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { StructuredData } from "@/components/StructuredData";
import { SocialMeta } from "@/components/SocialMeta";

const CategoryPage = () => {
  const { "*": pathSlug } = useParams<{ "*": string }>();
  const navigate = useNavigate();

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

  // Query subcategories of current category
  const { data: subCategories, isLoading: isSubCategoriesLoading } = useQuery({
    queryKey: ['subcategories', category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          coloring_pages(count)
        `)
        .eq('parent_id', category.id)
        .order('order_position', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

  const { data: coloringPages, isLoading: isPagesLoading } = useQuery({
    queryKey: ['category-pages', category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      
      const { data, error } = await supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('category_id', category.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

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
      document.title = `${category.name} Coloring Pages - Free Printables | Color Minds`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `Discover free printable ${category.name.toLowerCase()} coloring pages for kids and adults. ${category.description || ''} Download and print high-quality designs.`
        );
      }
    }
  }, [category]);

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
  const hasSubCategories = subCategories && subCategories.length > 0;
  const hasColoringPages = coloringPages && coloringPages.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <SocialMeta
        title={`${category.name} Coloring Pages - Free Printables`}
        description={`Discover ${coloringPages?.length || 0} free printable ${category.name.toLowerCase()} coloring pages. ${category.description || ''} Download and print high-quality designs for kids and adults.`}
        image={coloringPages?.[0]?.image_url}
        type="website"
        keywords={[
          category.name,
          'coloring pages',
          'printable',
          'free',
          'kids',
          'adults',
          'download'
        ]}
      />
      
      <StructuredData
        type="CollectionPage"
        data={{
          category: category.name,
          description: category.description,
          numberOfItems: coloringPages?.length || 0,
          items: coloringPages?.map(page => ({
            title: page.title,
            image: page.image_url
          }))
        }}
      />
      
      <main className="flex-1">
        <Breadcrumbs items={breadcrumbItems} />

        <section className="container px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Category Header */}
            <header className="mb-8 md:mb-12">
              {category.icon && category.icon.startsWith('http') ? (
                <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden mb-8 shadow-xl">
                  <img 
                    src={category.icon} 
                    alt={category.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                      {category.name} Coloring Pages
                    </h1>
                    {category.description && (
                      <p className="text-base md:text-lg lg:text-xl opacity-90 max-w-3xl">
                        {category.description}
                      </p>
                    )}
                    <div className="mt-3 text-sm md:text-base opacity-80">
                      {coloringPages?.length || 0} free printable coloring pages available
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {category.icon && (
                    <div className="mb-6 flex justify-center">
                      <span className="text-6xl md:text-7xl lg:text-8xl">{category.icon}</span>
                    </div>
                  )}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                    {category.name} Coloring Pages
                  </h1>
                  {category.description && (
                    <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                      {category.description}
                    </p>
                  )}
                  <div className="mt-4 text-sm text-muted-foreground">
                    {coloringPages?.length || 0} free printable coloring pages available
                  </div>
                </div>
              )}
            </header>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Subcategories Grid */}
                {hasSubCategories && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Browse by Subcategory</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {subCategories.map((subCat) => (
                        <SubCategoryCard
                          key={subCat.id}
                          id={subCat.id}
                          name={subCat.name}
                          slug={subCat.slug}
                          path={subCat.path}
                          description={subCat.description}
                          icon={subCat.icon}
                          itemCount={subCat.coloring_pages?.[0]?.count || 0}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Coloring Pages Grid */}
                {hasColoringPages ? (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">
                      {hasSubCategories ? 'Featured Pages' : 'All Pages'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      {coloringPages.map((page) => (
                        <ColoringCard
                          key={page.id}
                          id={page.id}
                          slug={page.slug}
                          title={page.title}
                          image={page.image_url}
                          category={category.name}
                          difficulty={page.difficulty as "easy" | "medium" | "hard"}
                        />
                      ))}
                    </div>
                  </div>
                ) : !hasSubCategories ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      No coloring pages found in this category yet.
                    </p>
                    <Button onClick={() => navigate('/')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Browse All Categories
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
