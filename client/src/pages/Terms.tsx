import { Link } from "wouter";

export default function Terms() {
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
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: April 23, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using MiniMorph Studios' website, services, or platform ("Services"),
              you agree to be bound by these Terms of Service. If you do not agree to these terms,
              do not use our Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Services Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              MiniMorph Studios provides website design, development, and digital marketing services
              for small and medium businesses. Our platform connects businesses with independent sales
              representatives who facilitate the sale of our services. We also offer automated lead
              generation, outreach, and customer relationship management tools.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account. You must notify us immediately
              of any unauthorized use of your account. We reserve the right to suspend or terminate
              accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Sales Representative Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sales representatives operate as independent contractors, not employees of MiniMorph Studios.
              Representatives are responsible for their own taxes, insurance, and compliance with local laws.
              Commission structures and payment terms are outlined in the separate Representative Agreement.
              MiniMorph Studios reserves the right to modify commission structures with 30 days' notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Payment Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              All payments are processed through Stripe. By making a purchase, you agree to Stripe's
              terms of service. Prices are in US dollars unless otherwise stated. We reserve the right
              to change pricing with reasonable notice. Refund policies are outlined in individual
              service agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, designs, code, and materials created by MiniMorph Studios remain our
              intellectual property until full payment is received. Upon full payment, clients receive
              a license to use the deliverables for their business purposes. We retain the right to
              showcase completed work in our portfolio unless otherwise agreed in writing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Communications Consent</h2>
            <p className="text-muted-foreground leading-relaxed">
              By providing your contact information, you consent to receive communications from
              MiniMorph Studios via email and SMS. You may opt out of marketing communications at
              any time by clicking "Unsubscribe" in emails or replying STOP to SMS messages.
              Transactional communications related to your account or active services are not
              affected by opt-out requests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              MiniMorph Studios shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of our Services. Our total
              liability shall not exceed the amount paid by you for the specific service giving
              rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the
              State of Michigan, without regard to its conflict of law provisions. Any disputes
              arising under these terms shall be resolved in the courts of Muskegon County, Michigan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, contact us at:<br />
              <strong>MiniMorph Studios</strong><br />
              Muskegon, Michigan<br />
              Email: legal@minimorphstudios.com
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
