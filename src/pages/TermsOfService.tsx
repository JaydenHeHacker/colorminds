import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-background to-secondary/20 py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="w-10 h-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-muted-foreground">
              Last Updated: January 2024
            </p>
          </div>

          <Card className="p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using Color Minds, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            {/* Use License */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Use License</h2>
              
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Free Content</h3>
                  <p className="leading-relaxed mb-2">
                    Permission is granted to temporarily download, print, and use our free coloring pages for personal, educational, and non-commercial purposes only. This license includes:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Downloading and printing for personal use</li>
                    <li>Using in educational settings (schools, homeschools)</li>
                    <li>Sharing with friends and family</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Restrictions</h3>
                  <p className="leading-relaxed mb-2">You may not:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Sell or redistribute the coloring pages</li>
                    <li>Modify or claim ownership of the coloring pages</li>
                    <li>Use the coloring pages for commercial purposes without permission</li>
                    <li>Remove watermarks or attribution (if present)</li>
                    <li>Use automated tools to scrape or download content in bulk</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-bold mb-4">User Accounts</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="leading-relaxed">
                  When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms.
                </p>
                <p className="leading-relaxed">
                  You are responsible for safeguarding your account password and for any activities or actions under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
                </p>
              </div>
            </section>

            {/* AI-Generated Content */}
            <section>
              <h2 className="text-2xl font-bold mb-4">AI-Generated Content</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="leading-relaxed">
                  Content created using our AI tools is subject to the following terms:
                </p>
                <ul className="space-y-2 list-disc list-inside ml-4">
                  <li>You retain rights to prompts and descriptions you provide</li>
                  <li>AI-generated images created by free users are automatically public and shared with the community</li>
                  <li>Premium users can mark their creations as private</li>
                  <li>You may use AI-generated content for personal and commercial purposes</li>
                  <li>We reserve the right to use AI-generated content for promotional purposes</li>
                </ul>
              </div>
            </section>

            {/* User-Generated Content */}
            <section>
              <h2 className="text-2xl font-bold mb-4">User-Generated Content</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="leading-relaxed">
                  When you upload colored artwork to our community gallery:
                </p>
                <ul className="space-y-2 list-disc list-inside ml-4">
                  <li>You retain ownership of your artwork</li>
                  <li>You grant us a worldwide, non-exclusive license to display, distribute, and promote your content</li>
                  <li>You confirm that you have all necessary rights to the uploaded content</li>
                  <li>You agree that your content will be subject to moderation and may be removed if it violates our guidelines</li>
                  <li>You will not upload content that is illegal, offensive, or infringes on others' rights</li>
                </ul>
              </div>
            </section>

            {/* Prohibited Uses */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Prohibited Uses</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You may not use our service for any illegal or unauthorized purpose. Prohibited activities include but are not limited to:
              </p>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside ml-4">
                <li>Violating any local, state, national, or international law</li>
                <li>Harassing, abusing, or harming other users</li>
                <li>Uploading malicious code or viruses</li>
                <li>Attempting to gain unauthorized access to our systems</li>
                <li>Impersonating others or misrepresenting your affiliation</li>
                <li>Using the service for spam or unsolicited advertising</li>
                <li>Scraping or automated data collection without permission</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The service and its original content (excluding user-generated and AI-generated content with appropriate rights), features, and functionality are owned by Color Minds and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            {/* Payment Terms */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Payment and Subscription Terms</h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="leading-relaxed">
                  For premium features and subscriptions:
                </p>
                <ul className="space-y-2 list-disc list-inside ml-4">
                  <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                  <li>All fees are non-refundable unless required by law</li>
                  <li>You can cancel your subscription at any time</li>
                  <li>Upon cancellation, you'll continue to have access until the end of your billing period</li>
                  <li>We reserve the right to change pricing with 30 days' notice</li>
                </ul>
              </div>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                The service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, whether express or implied. We do not warrant that the service will be uninterrupted, timely, secure, or error-free. AI-generated content may not always meet your expectations, and we do not guarantee specific results.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                In no event shall Color Minds, its directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses resulting from your use of the service.
              </p>
            </section>

            {/* Modifications */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Modifications to Service and Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify or discontinue the service at any time without notice. We also reserve the right to modify these Terms at any time. Continued use of the service after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through our Contact Us page.
              </p>
            </section>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
