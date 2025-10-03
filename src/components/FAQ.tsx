import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect } from "react";

const faqData = [
  {
    question: "Are all coloring pages really free to download and print?",
    answer: "Yes! All coloring pages on Color Minds are 100% free to download and print. No sign-up, no subscription, no hidden fees. Simply browse, click download, and print at home."
  },
  {
    question: "What age groups are these coloring pages suitable for?",
    answer: "Our collection includes coloring pages for all ages: simple designs for toddlers and preschoolers (ages 2-5), fun themes for kids (ages 6-12), detailed designs for teens, and intricate patterns for adults. Each page is labeled with a difficulty level to help you choose."
  },
  {
    question: "How do I download and print coloring pages?",
    answer: "Simply click on any coloring page you like, then click the 'Download' button. The image will be saved to your device as a high-quality PNG file. Open the file and print it using your home printer on standard letter-size (8.5x11) paper."
  },
  {
    question: "Can I use these coloring pages for my classroom or daycare?",
    answer: "Absolutely! Our free printable coloring pages are perfect for educational use in classrooms, daycares, homeschooling, and learning centers. Teachers and parents can print as many copies as needed for non-commercial educational purposes."
  },
  {
    question: "What themes and categories are available?",
    answer: "We offer a wide variety including animals (cats, dogs, dinosaurs, unicorns), holidays (Christmas, Halloween, Easter, Thanksgiving, Valentine's Day), characters (Disney, Hello Kitty, Sonic, Pokemon), nature (flowers, butterflies, seasons), and exclusive AI-generated story series."
  },
  {
    question: "What are AI-generated story series coloring pages?",
    answer: "Our unique story series are collections of connected coloring pages that tell a complete story across multiple chapters. Each series features consistent characters and narrative progression, combining creativity with storytelling for an immersive coloring experience."
  },
  {
    question: "Do I need to create an account to download coloring pages?",
    answer: "No account is required to browse and download coloring pages. However, creating a free account allows you to save favorites, track your downloads, and get personalized recommendations."
  },
  {
    question: "What paper and printers work best for coloring pages?",
    answer: "Standard printer paper (20-24 lb) works well for most coloring pages. For markers or watercolors, use thicker cardstock (60-80 lb) to prevent bleed-through. Any home inkjet or laser printer will work—just make sure to select 'Best Quality' or 'High Quality' in your print settings."
  }
];

export const FAQ = () => {
  useEffect(() => {
    // Add FAQ structured data for SEO
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqData.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    });
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              Everything you need to know about our free printable coloring pages
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqData.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border rounded-lg px-6 bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};