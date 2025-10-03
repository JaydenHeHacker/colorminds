import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Printer, Heart, Share2, ArrowLeft, Loader2, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { Badge } from "@/components/ui/badge";

const AIColoringPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: generation, isLoading } = useQuery({
    queryKey: ['ai-generation', id],
    queryFn: async () => {
      if (!id) throw new Error('Invalid id');
      
      const { data: genData, error } = await supabase
        .from('ai_generations')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Fetch user profile separately
      if (genData?.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', genData.user_id)
          .maybeSingle();
        
        return { ...genData, profile: profileData };
      }
      
      return genData;
    },
    enabled: !!id,
  });

  const getUserDisplayName = () => {
    const gen = generation as any;
    if (gen?.profile?.email) {
      return gen.profile.email.split('@')[0];
    }
    return 'Anonymous';
  };

  const handlePrint = async () => {
    if (!generation) return;
    
    try {
      toast.info("Loading image for print...");
      
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
            <title>Print ${generation.prompt}</title>
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
              <img src="${generation.image_url}" alt="${generation.prompt}" />
              <div class="footer">
                <div class="brand">Color Minds</div>
                <div class="url">www.colorminds.com - Free Printable Coloring Pages</div>
              </div>
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();
      
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

  if (!generation) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Coloring Page Not Found</h1>
          <Button onClick={() => navigate('/community')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Community
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <article className="container px-4 py-8 md:py-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/community')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Community
          </Button>

          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-lg border-2 border-border shadow-lg">
                  <img
                    src={generation.image_url}
                    alt={generation.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Button onClick={handlePrint} className="flex-1 gap-2" size="lg">
                      <Printer className="h-5 w-5" />
                      Print
                    </Button>
                  </div>
                  <div className="flex gap-3">
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
                    {generation.prompt}
                  </h1>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {generation.categories && (
                      <Badge variant="secondary">
                        {generation.categories.name}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      Community Creation
                    </Badge>
                  </div>

                  <div className="text-muted-foreground space-y-2">
                    <p>Created by: <span className="font-medium">{getUserDisplayName()}</span></p>
                    <p>Created: {new Date(generation.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>

                <div className="p-6 rounded-lg bg-gradient-to-r from-secondary/10 to-accent/10 border-2 border-secondary/20">
                  <h3 className="text-lg font-semibold mb-3">About This Page</h3>
                  <p className="text-muted-foreground">
                    This coloring page was created by a community member using our AI coloring page generator. 
                    You can print it for free and enjoy coloring!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />

      <ShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        pageId={generation.id}
        title={generation.prompt}
        imageUrl={generation.image_url}
        description={generation.prompt}
        categoryName={generation.categories?.name}
      />
    </div>
  );
};

export default AIColoringPage;
