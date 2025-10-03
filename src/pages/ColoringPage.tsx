import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RecommendedPages } from "@/components/RecommendedPages";
import { Button } from "@/components/ui/button";
import { Printer, Heart, Share2, ArrowLeft, Loader2, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { StructuredData } from "@/components/StructuredData";
import { SocialMeta } from "@/components/SocialMeta";

const ColoringPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: page, isLoading } = useQuery({
    queryKey: ['coloring-page', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Invalid slug');
      
      const { data, error } = await supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            name,
            slug,
            path
          )
        `)
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Query for series navigation if this page is part of a series
  const { data: seriesPages } = useQuery({
    queryKey: ['series-pages', page?.series_id],
    queryFn: async () => {
      if (!page?.series_id) return null;
      
      const { data, error } = await supabase
        .from('coloring_pages')
        .select('id, slug, title, series_order')
        .eq('series_id', page.series_id)
        .order('series_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!page?.series_id,
  });

  const currentIndex = seriesPages?.findIndex(p => p.id === page?.id) ?? -1;
  const prevPage = currentIndex > 0 ? seriesPages?.[currentIndex - 1] : null;
  const nextPage = currentIndex >= 0 && currentIndex < (seriesPages?.length ?? 0) - 1 ? seriesPages?.[currentIndex + 1] : null;

  const { data: isFavoritedData } = useQuery({
    queryKey: ['is-favorited', page?.id, user?.id],
    queryFn: async () => {
      if (!page?.id || !user) return false;
      
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('coloring_page_id', page.id)
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!page?.id && !!user,
  });

  useEffect(() => {
    setIsFavorited(isFavoritedData || false);
  }, [isFavoritedData]);

  useEffect(() => {
    if (page) {
      const categoryName = page.categories?.name || 'Coloring Page';
      document.title = `${page.title} - Free Printable ${categoryName} Coloring Page | Color Minds`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `Download and print this free ${page.title} coloring page. ${page.description || `Perfect for kids and adults who love ${categoryName.toLowerCase()}.`} High-quality printable design.`
        );
      }
    }
  }, [page]);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to save favorites");
      navigate("/auth");
      return;
    }

    if (!page?.id) return;

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('coloring_page_id', page.id);
        
        if (error) throw error;
        
        setIsFavorited(false);
        toast.success("Removed from favorites");
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            coloring_page_id: page.id
          });
        
        if (error) throw error;
        
        setIsFavorited(true);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorite");
    }
  };

  const handlePrintPreview = () => {
    setIsPrintPreviewOpen(true);
  };

  const handlePrint = async () => {
    if (!page) return;
    
    try {
      toast.info("Loading image for print...");
      
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not access iframe');
      }
      
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print ${page.title}</title>
            <style>
              @page {
                margin: 0.5in;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
              .content {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              img {
                width: 100%;
                max-width: 7.5in;
                height: auto;
                display: block;
                margin-bottom: 0.3in;
              }
              .footer {
                text-align: center;
                padding: 0.2in 0;
                border-top: 2px solid #333;
                width: 100%;
                max-width: 7.5in;
              }
              .brand {
                font-size: 16pt;
                font-weight: bold;
                color: #333;
                margin-bottom: 0.1in;
              }
              .url {
                font-size: 12pt;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="content">
              <img src="${page.image_url}" alt="${page.title}" />
              <div class="footer">
                <div class="brand">Color Minds</div>
                <div class="url">www.colorminds.com - Free Printable Coloring Pages</div>
              </div>
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();
      
      // Wait for image to load
      const img = iframeDoc.querySelector('img');
      if (img) {
        img.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 100);
          }, 250);
        };
        
        img.onerror = () => {
          toast.error("Failed to load image");
          document.body.removeChild(iframe);
        };
      }
      
      await supabase.rpc('increment_download_count', { page_id: page.id });
      toast.success("Print dialog will open shortly...");
    } catch (error) {
      console.error('Print error:', error);
      toast.error("Print failed. Please try again.");
    }
  };

  if (isLoading) {
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

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Coloring Page Not Found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const difficultyConfig = {
    easy: { label: "Easy", icon: "🟢", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800", age: "Ages 3-6" },
    medium: { label: "Medium", icon: "🟡", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800", age: "Ages 7-10" },
    hard: { label: "Hard", icon: "🔴", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800", age: "Ages 11+" }
  };

  const config = difficultyConfig[page.difficulty || 'medium'];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <SocialMeta
        title={`${page.title} - Free Printable ${page.categories?.name || 'Coloring'} Page`}
        description={`${page.description || `Download and print this free ${page.title} coloring page.`} Perfect for kids and adults. High-quality printable design.`}
        image={page.image_url}
        type="article"
        author="Color Minds"
        publishedTime={page.created_at}
        modifiedTime={page.updated_at}
        keywords={[
          page.categories?.name || 'coloring',
          page.difficulty || 'medium',
          'coloring page',
          'printable',
          'free',
          'kids',
          'adults',
          page.title
        ]}
      />
      
      <StructuredData
        type="ImageObject"
        data={{
          title: page.title,
          description: page.description,
          image: page.image_url,
          category: page.categories?.name,
          downloadCount: page.download_count,
          datePublished: page.created_at,
          dateModified: page.updated_at,
          keywords: [
            page.categories?.name,
            page.difficulty,
            "coloring page",
            "printable",
            "free",
            "kids",
            "adults"
          ]
        }}
      />

      <StructuredData
        type="BreadcrumbList"
        data={{
          items: [
            { label: 'Home', href: '/' },
            ...(page.categories ? [{ 
              label: page.categories.name, 
              href: `/category/${page.categories.path || page.categories.slug}` 
            }] : []),
            { label: page.title, isCurrentPage: true },
          ]
        }}
      />
      
      <main className="flex-1">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            ...(page.categories ? [{ 
              label: page.categories.name, 
              href: `/category/${page.categories.path || page.categories.slug}` 
            }] : []),
            { label: page.title, isCurrentPage: true },
          ]}
        />

        <article className="container px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-lg border-2 border-border shadow-lg">
                  <img
                    src={page.image_url}
                    alt={`${page.title} - Free printable ${page.categories?.name || 'coloring'} page for kids and adults`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Button onClick={handlePrint} className="flex-1 gap-2" size="lg">
                      <Printer className="h-5 w-5" />
                      Print
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handlePrintPreview}
                      size="lg"
                      className="gap-2"
                    >
                      <Eye className="h-5 w-5" />
                      Preview
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant={isFavorited ? "default" : "outline"}
                      onClick={handleToggleFavorite}
                      size="lg"
                      className="flex-1"
                    >
                      <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setIsShareOpen(true)}
                      size="lg"
                      className="flex-1"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                    {page.title}
                  </h1>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {page.categories && (
                      <Link to={`/category/${page.categories.path || page.categories.slug}`}>
                        <span className="inline-block px-3 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                          {page.categories.name}
                        </span>
                      </Link>
                    )}
                    <span className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full border ${config.color}`}>
                      {config.icon} {config.label} · {config.age}
                    </span>
                    {page.series_title && (
                      <span className="inline-block px-3 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                        📚 {page.series_title} - Chapter {page.series_order}/{page.series_total}
                      </span>
                    )}
                  </div>

                   {page.description && (
                     <p className="text-lg text-muted-foreground leading-relaxed">
                       {page.description}
                     </p>
                   )}
                 </div>

                 {/* Series Navigation */}
                 {page.series_id && (prevPage || nextPage) && (
                   <div className="p-4 rounded-lg bg-gradient-to-r from-secondary/10 to-accent/10 border-2 border-secondary/20">
                     <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                       📚 Story Navigation
                     </h3>
                     <div className="flex gap-3">
                       {prevPage ? (
                         <Link to={`/coloring-page/${prevPage.slug}`} className="flex-1">
                           <Button variant="outline" className="w-full gap-2 group">
                             <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                             <div className="text-left flex-1 min-w-0">
                               <div className="text-xs text-muted-foreground">Previous</div>
                               <div className="text-sm font-medium truncate">Ch. {prevPage.series_order}</div>
                             </div>
                           </Button>
                         </Link>
                       ) : (
                         <div className="flex-1" />
                       )}
                       {nextPage ? (
                         <Link to={`/coloring-page/${nextPage.slug}`} className="flex-1">
                           <Button className="w-full gap-2 group">
                             <div className="text-left flex-1 min-w-0">
                               <div className="text-xs opacity-90">Next</div>
                               <div className="text-sm font-medium truncate">Ch. {nextPage.series_order}</div>
                             </div>
                             <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
                           </Button>
                         </Link>
                       ) : (
                         <div className="flex-1" />
                       )}
                     </div>
                     {seriesPages && (
                       <div className="mt-3 flex items-center gap-2">
                         <div className="flex-1 h-1.5 bg-secondary/20 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-500"
                             style={{ width: `${((currentIndex + 1) / seriesPages.length) * 100}%` }}
                           />
                         </div>
                         <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                           {currentIndex + 1}/{seriesPages.length}
                         </span>
                       </div>
                     )}
                   </div>
                 )}

                 <div className="space-y-4 p-6 rounded-lg bg-muted/50 border">
                  <h2 className="text-xl font-semibold">How to Use This Coloring Page</h2>
                  <ol className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">1.</span>
                      <span>Click the <strong>"Print"</strong> button above to open the print dialog</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">2.</span>
                      <span>Choose your printer or select "Save as PDF" to download the image</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">3.</span>
                      <span>Use crayons, colored pencils, markers, or any coloring tools you prefer</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">4.</span>
                      <span>Share your colored masterpiece with friends and family!</span>
                    </li>
                  </ol>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    <span><strong>{page.download_count}</strong> prints</span>
                  </div>
                  <p className="text-xs">
                    💡 <strong>Tip:</strong> For best results, print on thick paper or cardstock for easier coloring and reduced bleed-through.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Recommended Pages */}
        {page.categories && (
          <RecommendedPages 
            currentPageId={page.id}
            category={page.categories.name}
            difficulty={page.difficulty || 'medium'}
          />
        )}
      </main>

      <Footer />

      <ShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={page.title}
        pageId={page.id}
      />

      {/* Print Preview Dialog */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsPrintPreviewOpen(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Print Preview</h3>
                <Button variant="ghost" onClick={() => setIsPrintPreviewOpen(false)}>✕</Button>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
                <img src={page.image_url} alt={page.title} className="w-full h-auto mb-4" />
                <div className="border-t-2 border-gray-800 pt-4 text-center">
                  <div className="text-lg font-bold text-gray-900 mb-2">Color Minds</div>
                  <div className="text-sm text-gray-600">www.colorminds.com - Free Printable Coloring Pages</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => { setIsPrintPreviewOpen(false); handlePrint(); }} className="flex-1 gap-2">
                  <Printer className="h-5 w-5" />
                  Print Now
                </Button>
                <Button variant="outline" onClick={() => setIsPrintPreviewOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColoringPage;
