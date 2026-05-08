import "dotenv/config";
import { generateSiteFromTemplate, SiteBrief } from "../services/templateEngine";
import { createPagesProject, deployToPages, addCustomDomain } from "../services/cloudflareDeployment";
import { ENV } from "../_core/env";

// ── Showroom site definitions ─────────────────────────────────────────────────
// Each entry maps a SiteBrief (consumed by the template engine) to a Cloudflare
// Pages project name. The template engine handles image generation, copy, page
// assembly, and nav link generation — all pages get .html extension hrefs.

const SHOWROOM_SITES: Array<{ brief: SiteBrief; cloudflareProject: string; subdomain: string }> = [
  {
    subdomain: "hammerstone",
    brief: {
      businessName: "Hammerstone Builds",
      businessType: "contractor",
      brandTone: "bold industrial",
      packageTier: "growth",
      primaryColor: "#e07b39",
      secondaryColor: "#1a1a1a",
      phone: "(612) 555-0142",
      email: "mike@hammerstonebuilds.com",
      address: "4521 France Ave S, Minneapolis MN 55410",
      hours: "Mon–Fri 7am–6pm, Sat 8am–2pm",
      serviceArea: "Minneapolis & Surrounding Suburbs",
      yearsInBusiness: "14",
      ownerName: "Mike Hammerstone",
      licenseNumber: "MN-BC-45892",
      uniqueDifferentiator:
        "We show clients every stage of the build with daily photo updates because contractors who hide the process cannot control it",
      servicesOffered: [
        "Kitchen Remodeling",
        "Bathroom Renovation",
        "Home Additions",
        "Basement Finishing",
        "Deck & Outdoor Living",
        "Whole Home Renovation",
      ],
      targetCustomer:
        "Minneapolis homeowners 35–55 doing their first or second major renovation",
      testimonials: [
        {
          quote: "Finished on time, on budget, cleaned up every day. First contractor I would hire again.",
          name: "James K.",
          context: "Homeowner — Minnetonka MN",
        },
        {
          quote: "They sent photos every evening. We always knew exactly what was happening.",
          name: "Sarah M.",
          context: "Homeowner — Eden Prairie MN",
        },
        {
          quote: "The master bath went from a 1990s disaster to something out of a magazine.",
          name: "Linda R.",
          context: "Homeowner — Edina MN",
        },
      ],
      appUrl: "https://www.minimorphstudios.net",
      subNiche: "contractor",
    },
    cloudflareProject: "mm-showroom-hammerstone-builds",
  },

  {
    subdomain: "driftwood",
    brief: {
      businessName: "Driftwood Kitchen & Bar",
      businessType: "restaurant",
      brandTone: "warm casual friendly",
      packageTier: "growth",
      primaryColor: "#c8703a",
      secondaryColor: "#1a0f08",
      phone: "(512) 555-0187",
      email: "hello@driftwoodkitchen.com",
      address: "2847 South Congress Ave, Austin TX 78704",
      hours: "Tue–Sun 5pm–10pm, Brunch Sat–Sun 10am–2pm",
      serviceArea: "South Congress Austin TX",
      yearsInBusiness: "6",
      ownerName: "Maria Delgado",
      licenseNumber: "",
      uniqueDifferentiator:
        "Everything on the menu is sourced within 150 miles of Austin and changes weekly based on what the farms actually have",
      servicesOffered: [
        "Farm-to-Table Dinner",
        "Weekend Brunch",
        "Private Dining",
        "Wine & Cocktails",
        "Catering",
      ],
      targetCustomer: "Austin food lovers who care where their food comes from",
      testimonials: [
        {
          quote: "The best meal I had in Austin all year. The menu changes but the quality never does.",
          name: "Thomas B.",
          context: "Regular — South Congress",
        },
        {
          quote: "Perfect for date night. The staff knows the menu inside out.",
          name: "Priya N.",
          context: "Diner — Bouldin Creek",
        },
        {
          quote: "Brunch here has become our Sunday ritual.",
          name: "Jake & Mia S.",
          context: "South Austin Residents",
        },
      ],
      appUrl: "https://www.minimorphstudios.net",
      subNiche: "restaurant",
    },
    cloudflareProject: "mm-showroom-driftwood-kitchen",
  },

  {
    subdomain: "gritmill",
    brief: {
      businessName: "Gritmill Fitness",
      businessType: "gym",
      brandTone: "bold energetic intense",
      packageTier: "growth",
      primaryColor: "#f5a623",
      secondaryColor: "#080808",
      phone: "(720) 555-0163",
      email: "train@gritmillfitness.com",
      address: "1840 Blake Street, Denver CO 80202",
      hours: "Mon–Fri 5am–9pm, Sat–Sun 7am–5pm",
      serviceArea: "Downtown Denver & RiNo",
      yearsInBusiness: "7",
      ownerName: "Derek Santos",
      licenseNumber: "",
      uniqueDifferentiator:
        "No mirrors, no selfie stations — just coaches who remember your name and programs built around your actual goals",
      servicesOffered: [
        "Group Fitness Classes",
        "Personal Training",
        "Strength & Conditioning",
        "Nutrition Coaching",
        "Free Trial Week",
      ],
      targetCustomer:
        "Denver professionals 25–45 tired of impersonal big box gyms",
      testimonials: [
        {
          quote: "First gym where a coach noticed when I was gone for a week and actually checked in.",
          name: "Rachel T.",
          context: "Member — RiNo",
        },
        {
          quote: "Lost 22 pounds in 4 months. More importantly I actually understand how to train now.",
          name: "Marcus D.",
          context: "Member — Capitol Hill",
        },
        {
          quote: "No fluff, no gimmicks, just real programming and real accountability.",
          name: "Sofia R.",
          context: "Member — LoHi",
        },
      ],
      appUrl: "https://www.minimorphstudios.net",
      subNiche: "gym",
    },
    cloudflareProject: "mm-showroom-gritmill-fitness",
  },

  {
    subdomain: "velvetandvine",
    brief: {
      businessName: "Velvet & Vine Studio",
      businessType: "salon",
      brandTone: "elegant luxury editorial",
      packageTier: "growth",
      primaryColor: "#9b7fa6",
      secondaryColor: "#1a1018",
      phone: "(404) 555-0129",
      email: "book@velvetandvinestudio.com",
      address: "675 Ponce de Leon Ave NE, Atlanta GA 30308",
      hours: "Tue–Sat 9am–7pm",
      serviceArea: "Ponce City Market Atlanta GA",
      yearsInBusiness: "9",
      ownerName: "Camille Rousseau",
      licenseNumber: "GA-COS-77341",
      uniqueDifferentiator:
        "We do not book more than 4 clients per stylist per day so every appointment gets unhurried attention",
      servicesOffered: [
        "Balayage & Color",
        "Precision Cuts",
        "Keratin Treatments",
        "Extensions",
        "Bridal Hair",
        "Color Correction",
      ],
      targetCustomer:
        "Atlanta professionals and brides who want exceptional hair",
      testimonials: [
        {
          quote: "Camille fixed three years of bad balayage in one appointment. I cried. In a good way.",
          name: "Jessica P.",
          context: "Client — Virginia-Highland",
        },
        {
          quote: "The no-rush policy is real. My appointment took four hours and was worth every minute.",
          name: "Danielle W.",
          context: "Bridal Client — Buckhead",
        },
        {
          quote: "Best color I have ever had. And I have been to salons in New York and Paris.",
          name: "Aimee L.",
          context: "Client — Inman Park",
        },
      ],
      appUrl: "https://www.minimorphstudios.net",
      subNiche: "salon",
    },
    cloudflareProject: "mm-showroom-velvet-vine-studio",
  },

  {
    subdomain: "cloverandthistle",
    brief: {
      businessName: "Clover & Thistle Boutique",
      businessType: "boutique",
      brandTone: "warm lifestyle friendly",
      packageTier: "growth",
      primaryColor: "#7a9e6e",
      secondaryColor: "#1a1208",
      phone: "(503) 555-0147",
      email: "hello@cloverandthistle.com",
      address: "2315 NE Alberta Street, Portland OR 97211",
      hours: "Mon–Sat 10am–7pm, Sun 11am–5pm",
      serviceArea: "Alberta Arts District Portland OR",
      yearsInBusiness: "11",
      ownerName: "Fiona McAllister",
      licenseNumber: "",
      uniqueDifferentiator:
        "Every brand we carry is women-owned, Pacific Northwest based, or both — we have never carried fast fashion and never will",
      servicesOffered: [
        "Women's Clothing",
        "Accessories & Jewelry",
        "Home Goods",
        "Gift Wrapping",
        "Personal Styling",
        "Local Designer Drops",
      ],
      targetCustomer: "Portland women 28–50 who shop intentionally",
      testimonials: [
        {
          quote: "Every piece I have bought here has a story. Fiona knows what you need before you do.",
          name: "Sarah M.",
          context: "Regular — Alberta Arts District",
        },
        {
          quote: "The only boutique where I have never once felt pressured. Just beautifully curated things and someone who actually knows them.",
          name: "Karen L.",
          context: "Customer — Lake Oswego",
        },
        {
          quote: "I bought three pieces from independent designers I had never heard of and they became my most-asked-about clothes.",
          name: "Rachel T.",
          context: "Customer — NE Portland",
        },
      ],
      appUrl: "https://www.minimorphstudios.net",
      subNiche: "boutique",
    },
    cloudflareProject: "mm-showroom-clover-and-thistle",
  },

  {
    subdomain: "emberandoak",
    brief: {
      businessName: "Ember & Oak Coffee Co.",
      businessType: "coffee",
      brandTone: "artisan roaster",
      packageTier: "growth",
      primaryColor: "#c47a2a",
      secondaryColor: "#0f0906",
      phone: "(503) 555-0211",
      email: "hello@emberoakcoffee.com",
      address: "441 NW 10th Ave, Portland OR 97209",
      hours: "Mon–Fri 7am–6pm, Sat–Sun 8am–5pm",
      serviceArea: "Portland OR & Nationwide Shipping",
      yearsInBusiness: "5",
      ownerName: "James Okafor",
      licenseNumber: "",
      uniqueDifferentiator:
        "Direct-trade single-origin beans roasted to order within 48 hours — we have visited every farm we source from and will never sit a bag on a shelf",
      servicesOffered: [
        "Ethiopia Yirgacheffe",
        "Colombia El Paraiso",
        "Monthly Subscriptions",
        "Corporate Coffee Programs",
        "Brewing Equipment",
      ],
      targetCustomer:
        "Serious coffee drinkers who know the difference between washed and natural process, and gift buyers who want something genuinely premium",
      testimonials: [
        {
          quote: "I have never had coffee this fresh. The Ethiopia alone made me throw out everything else in my cabinet.",
          name: "Michael P.",
          context: "Subscriber — Seattle WA",
        },
        {
          quote: "My office switched to the Office Program. Productivity went up. I am serious.",
          name: "Jennifer K.",
          context: "Office Manager — Portland OR",
        },
        {
          quote: "The brewing guides that come with each bag are worth more than most coffee courses I have paid for.",
          name: "Carlos R.",
          context: "Home Brewer — Denver CO",
        },
      ],
      appUrl: "https://www.minimorphstudios.net",
      subNiche: "coffee",
    },
    cloudflareProject: "mm-showroom-ember-oak-coffee",
  },

  {
    subdomain: "thornwood",
    brief: {
      businessName: "Thornwood Goods",
      businessType: "ecommerce",
      brandTone: "warm artisan editorial",
      packageTier: "growth",
      primaryColor: "#b87a3c",
      secondaryColor: "#1a1208",
      phone: "(828) 555-0173",
      email: "hello@thornwoodgoods.com",
      address: "44 Lexington Ave, Asheville NC 28801",
      hours: "Thu–Sun 11am–6pm · Online 24/7",
      serviceArea: "Asheville NC & Nationwide Shipping",
      yearsInBusiness: "7",
      ownerName: "Jess Marchand",
      licenseNumber: "",
      uniqueDifferentiator:
        "Every piece is handmade to order in a converted barn studio — no inventory, no middlemen, no identical copies of anything we make",
      servicesOffered: [
        "Ceramic Goods",
        "Leather Accessories",
        "Woodwork & Serving Boards",
        "Custom Orders",
        "Wedding & Event Gifts",
        "Studio Visits by Appointment",
      ],
      targetCustomer:
        "Gift buyers, interior design enthusiasts, and people who want things made by actual human hands",
      testimonials: [
        {
          quote: "I bought a mug six years ago. It is still the first one I reach for every morning.",
          name: "Claire B.",
          context: "Customer — Asheville NC",
        },
        {
          quote: "Ordered a custom cutting board for our wedding. Jess made it exactly right. Worth every penny.",
          name: "Marcus & Dana L.",
          context: "Bride & Groom — Charlotte NC",
        },
        {
          quote: "The leather card holder has more character after two years than it did on day one. That is what good materials do.",
          name: "James O.",
          context: "Customer — Brooklyn NY",
        },
      ],
      appUrl: "https://www.minimorphstudios.net",
      subNiche: "artisan shop",
      socialHandles: {
        instagram: "@thornwoodgoods",
      },
      blogTopics: [
        "How to care for vegetable-tanned leather",
        "What makes a cutting board food-safe",
        "The story behind our clay source in western NC",
      ],
      specialRequests:
        "Showcase the handmade process — photos of the studio, works in progress, and finished pieces. Inquiry form is primary CTA, not a cart.",
      pricingDisplay: "contact_for_pricing",
    },
    cloudflareProject: "mm-showroom-thornwood-goods",
  },
];

// ── Result types ──────────────────────────────────────────────────────────────

interface SiteResult {
  cloudflareProject: string;
  businessName: string;
  liveUrl?: string;
  deployUrl?: string;
  pageCount?: number;
  pages?: string[];
  error?: string;
  success: boolean;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function generateAndDeployAll(): Promise<SiteResult[]> {
  const results: SiteResult[] = [];
  const siteStart = process.env.SITE_START
    ? parseInt(process.env.SITE_START, 10) - 1  // 1-based input
    : 0;
  const siteLimit = process.env.SITE_LIMIT
    ? siteStart + parseInt(process.env.SITE_LIMIT, 10)
    : SHOWROOM_SITES.length;

  for (let i = siteStart; i < siteLimit; i++) {
    const { brief, cloudflareProject, subdomain } = SHOWROOM_SITES[i];

    console.log("\n" + "━".repeat(56));
    console.log(`[${i + 1}/${SHOWROOM_SITES.length}] ${brief.businessName}`);
    console.log(`      ${brief.businessType} · ${brief.packageTier} · ${cloudflareProject}`);

    try {
      // ── Step 1: Generate all pages via template engine ───────────────────
      // Template engine handles: copy generation, image upload to R2, nav
      // token injection (.html extensions), package tier gating, privacy page.
      console.log("  → Generating via template engine...");
      const pages = await generateSiteFromTemplate(brief);
      const pageNames = Object.keys(pages);
      console.log(`  ✅ ${pageNames.length} pages: ${pageNames.join(", ")}`);

      // ── Step 2: Ensure Cloudflare Pages project exists ───────────────────
      console.log(`  → Cloudflare project: ${cloudflareProject}`);
      try {
        await createPagesProject({ projectName: cloudflareProject, customerId: 0 });
        console.log("  ✅ Project created");
      } catch (err: any) {
        if (!err.message?.includes("already exists")) throw err;
        console.log("  (project exists — redeploying)");
      }

      // ── Step 3: Deploy all pages ─────────────────────────────────────────
      // deployToPages writes {page}.html files + a _redirects file so both
      // /contact and /contact.html resolve correctly. Template engine nav
      // links use .html extensions, so clean URLs are a bonus not a requirement.
      console.log("  → Deploying pages...");
      const deployment = await deployToPages({ projectName: cloudflareProject, pages });
      console.log(`  ✅ Deployed: ${deployment.deploymentUrl}`);

      // ── Step 4: Attach custom subdomain if configured ─────────────────────
      const domain = (ENV as any).minimorphSitesDomain as string | undefined;
      if (domain) {
        const customDomain = `${subdomain}.${domain}`;
        try {
          const domainResult = await addCustomDomain({ projectName: cloudflareProject, domain: customDomain });
          console.log(`  ✅ Domain: ${customDomain} (${domainResult.status})`);
        } catch (err: any) {
          console.warn(`  ⚠ Domain attach failed (non-fatal): ${err.message?.slice(0, 80)}`);
        }
      }

      results.push({
        cloudflareProject,
        businessName: brief.businessName,
        liveUrl: `https://${subdomain}.minimorphstudios.net`,
        deployUrl: deployment.deploymentUrl,
        pageCount: pageNames.length,
        pages: pageNames,
        success: true,
      });
    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}`);
      if (err.cause) {
        console.error(`     Cause: ${String(err.cause?.message ?? err.cause)}`);
      }
      results.push({
        cloudflareProject,
        businessName: brief.businessName,
        error: err.message,
        success: false,
      });
    }

    if (i < siteLimit - 1) {
      console.log("  (waiting 15s before next site...)");
      await new Promise(r => setTimeout(r, 15000));
    }
  }

  return results;
}

async function main() {
  console.log("Showroom site regeneration — template engine\n");
  const results = await generateAndDeployAll();

  console.log("\n" + "═".repeat(56));
  console.log("COMPLETE");
  console.log("═".repeat(56));
  for (const r of results) {
    if (r.success) {
      console.log(`✅ ${r.businessName} — ${r.pageCount} pages`);
      console.log(`   ${r.liveUrl}`);
      console.log(`   ${r.deployUrl}`);
    } else {
      console.log(`❌ ${r.businessName} — ${r.error}`);
    }
  }
}

main().catch(console.error);
