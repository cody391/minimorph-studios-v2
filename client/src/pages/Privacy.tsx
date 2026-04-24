import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground">
            MiniMorph Studios
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: April 23, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information you provide directly to us, including your name, email address,
              business name, and website URL when you fill out forms, request a quote, apply to become a
              sales representative, or contact us. We also collect information about your interactions with our
              emails and SMS messages, including open rates, click-through rates, and delivery status.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect to provide, maintain, and improve our services; to communicate
              with you about our products and services; to send you marketing communications (with your consent);
              to process your transactions; and to comply with legal obligations. We may use AI-powered tools
              to personalize our communications and improve the relevance of our outreach.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your information with service providers
              who assist us in operating our business (such as email delivery, SMS messaging, payment processing,
              and analytics). These providers are contractually obligated to protect your information and use
              it only for the purposes we specify.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Communications & Opt-Out</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Email:</strong> You can unsubscribe from marketing emails at any time by clicking the
              "Unsubscribe" link in any email we send. Transactional emails (order confirmations, account
              notifications) are not affected by unsubscribe requests.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>SMS:</strong> You can opt out of SMS messages at any time by replying STOP to any
              message. We honor all opt-out requests immediately and will not send further SMS messages
              to opted-out numbers. Standard message and data rates may apply.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your personal information,
              including encryption in transit (TLS/SSL), secure authentication, and access controls.
              Payment information is processed by Stripe and never stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to provide our services and
              fulfill the purposes described in this policy. When you opt out of communications, we retain
              your contact information solely to honor your opt-out preference.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you may have the right to access, correct, delete, or port
              your personal data. You may also have the right to restrict or object to certain processing.
              To exercise these rights, contact us at the address below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your data rights,
              please contact us at:<br />
              <strong>MiniMorph Studios</strong><br />
              Muskegon, Michigan<br />
              Email: privacy@minimorphstudios.com
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
