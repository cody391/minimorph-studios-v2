/**
 * Showroom sample site data — our "showroom floor models."
 * Each site has a unique visual personality, mapped to a specific package tier,
 * with add-ons showcased. These are the sites visitors can browse to see
 * what MiniMorph actually builds.
 *
 * ALL business names are fictional. They do not represent real businesses.
 */

export interface ShowroomSite {
  slug: string;
  name: string;
  tagline: string;
  industry: string;
  location: string;
  tier: "Starter" | "Growth" | "Pro" | "Commerce";
  tierPrice: string;
  heroImage: string;
  palette: {
    bg: string;
    accent: string;
    text: string;
    muted: string;
    card: string;
    border: string;
  };
  font: { heading: string; body: string };
  addOns: string[];
  features: string[];
  personality: string;
  ownerQuote: string;
  ownerName: string;
  sections: {
    hero: { headline: string; sub: string };
    about: string;
    services: { name: string; desc: string }[];
    cta: string;
  };
}

export const showroomSites: ShowroomSite[] = [
  {
    slug: "driftwood-kitchen",
    name: "Driftwood Kitchen",
    tagline: "Waterfront dining, done right.",
    industry: "Restaurant",
    location: "Whitehall, MI",
    tier: "Growth",
    tierPrice: "$250/mo",
    heroImage: "/manus-storage/sample-lakehouse-hero_c46693d0.jpg",
    palette: {
      bg: "#1a1612",
      accent: "#d4a574",
      text: "#f5f0eb",
      muted: "#a89888",
      card: "#231e19",
      border: "#3a3228",
    },
    font: { heading: "'DM Serif Display', serif", body: "'Inter', sans-serif" },
    addOns: ["Online Menu with Photos", "Google Reviews Widget", "Reservation Form"],
    features: [
      "8-page responsive site",
      "Full menu with food photography",
      "Google Maps & hours integration",
      "Monthly blog posts about seasonal specials",
      "Analytics dashboard showing top menu pages",
    ],
    personality:
      "Warm and inviting — like the smell of cedar and grilled walleye drifting off the lake. This site uses warm amber tones, textured backgrounds, and large food photography to make visitors hungry before they even check the menu.",
    ownerQuote:
      "We needed a site that felt like our restaurant — warm, unpretentious, and focused on the food. MiniMorph nailed it.",
    ownerName: "Tom & Linda K.",
    sections: {
      hero: {
        headline: "Where the lake meets the table.",
        sub: "Fresh-caught fish, Michigan craft beer, and sunsets you'll remember. Open year-round on White Lake.",
      },
      about:
        "Driftwood Kitchen has been a Whitehall staple since 2008. What started as a small fish fry shack on the channel has grown into a full-service waterfront restaurant serving locally sourced Michigan ingredients. We still fry our perch the same way — one batch at a time.",
      services: [
        { name: "Dine-In", desc: "Waterfront seating with views of White Lake. Reservations recommended on weekends." },
        { name: "Takeout", desc: "Call ahead or order online. Ready in 20 minutes." },
        { name: "Private Events", desc: "Host your rehearsal dinner, birthday, or company outing lakeside." },
        { name: "Catering", desc: "We bring the kitchen to you. Full-service catering for 20 to 200 guests." },
      ],
      cta: "Make a Reservation",
    },
  },
  {
    slug: "hammerstone-builds",
    name: "Hammerstone Builds",
    tagline: "Built to last. Not to impress your neighbor.",
    industry: "General Contractor",
    location: "Muskegon, MI",
    tier: "Starter",
    tierPrice: "$150/mo",
    heroImage: "/manus-storage/sample-ironworks-hero_6b431260.jpg",
    palette: {
      bg: "#0f1114",
      accent: "#e8734a",
      text: "#eaeaea",
      muted: "#8a8a8a",
      card: "#1a1c20",
      border: "#2a2c30",
    },
    font: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    addOns: ["Contact Form with File Upload", "Google Reviews Widget"],
    features: [
      "5-page professional site",
      "Project gallery with before/after photos",
      "Service area map",
      "Contact form with project description",
      "Monthly performance report",
    ],
    personality:
      "No-nonsense and direct — like the guy who shows up on time, does the work right, and doesn't charge you for a consultation that's really a sales pitch. Industrial palette with bold orange accents. The copy is short because the work speaks for itself.",
    ownerQuote:
      "I don't need a fancy website. I need one that works when someone Googles 'contractor Muskegon' at 11pm.",
    ownerName: "Dave R.",
    sections: {
      hero: {
        headline: "We fix what the last guy broke.",
        sub: "Licensed general contractor serving Muskegon County. Kitchens, bathrooms, decks, and the stuff nobody else wants to touch.",
      },
      about:
        "Hammerstone Builds has been serving Muskegon and the lakeshore since 2015. We're a small crew — three guys who actually show up when we say we will. We don't do free estimates that turn into two-hour sales pitches. We look at the job, tell you what it costs, and get to work.",
      services: [
        { name: "Kitchen Remodels", desc: "Full gut jobs to cabinet refacing. We do it all." },
        { name: "Bathroom Renovations", desc: "Tile, plumbing, vanities, walk-in showers." },
        { name: "Decks & Outdoor", desc: "Composite and cedar. Built for Michigan winters." },
        { name: "General Repairs", desc: "The stuff that's been on your list for two years. We'll knock it out." },
      ],
      cta: "Get a Quote",
    },
  },
  {
    slug: "velvet-vine-studio",
    name: "Velvet & Vine Studio",
    tagline: "Where artistry meets intention.",
    industry: "Salon & Spa",
    location: "Grand Rapids, MI",
    tier: "Pro",
    tierPrice: "$400/mo",
    heroImage: "/manus-storage/sample-salon-hero_abcbe45a.jpg",
    palette: {
      bg: "#0a0a0a",
      accent: "#c9a87c",
      text: "#f8f6f3",
      muted: "#9a9088",
      card: "#141414",
      border: "#262220",
    },
    font: { heading: "'DM Serif Display', serif", body: "'Inter', sans-serif" },
    addOns: [
      "Online Booking Integration",
      "Google Reviews Widget",
      "Instagram Feed",
      "SMS Appointment Reminders",
    ],
    features: [
      "15-page site with stylist profiles",
      "Online booking with calendar sync",
      "Service menu with pricing",
      "Before/after gallery",
      "Blog with hair care tips",
      "Monthly SEO and traffic reports",
    ],
    personality:
      "Elevated and editorial — this isn't a strip-mall salon site. Dark backgrounds, gold accents, and intentional whitespace give it a luxury-magazine feel. The photography does the heavy lifting. Every page feels like a spread in Vogue Hair.",
    ownerQuote:
      "Our old site looked like every other salon in town. This one actually reflects the experience we give our clients.",
    ownerName: "Aisha T.",
    sections: {
      hero: {
        headline: "Your hair deserves better than a template.",
        sub: "Precision cuts, custom color, and intentional styling in the heart of Grand Rapids. Book your consultation.",
      },
      about:
        "Velvet & Vine Studio was founded in 2019 by Aisha Torres, a stylist with 12 years of experience and a belief that great hair starts with listening. We're a team of five stylists, each with their own specialty — from lived-in balayage to protective styling to editorial updos. We don't rush. We don't upsell. We just do really good hair.",
      services: [
        { name: "Precision Cuts", desc: "Tailored to your face shape, lifestyle, and how much time you actually spend styling." },
        { name: "Custom Color", desc: "Balayage, highlights, vivids, corrective color. Consultation required for first-timers." },
        { name: "Protective Styling", desc: "Braids, locs, twists, and silk presses done with care and intention." },
        { name: "Bridal & Events", desc: "Trial runs included. We make sure you feel like yourself, just elevated." },
      ],
      cta: "Book a Consultation",
    },
  },
  {
    slug: "gritmill-fitness",
    name: "Gritmill Fitness",
    tagline: "Earn it.",
    industry: "Fitness Studio",
    location: "Holland, MI",
    tier: "Growth",
    tierPrice: "$250/mo",
    heroImage: "/manus-storage/sample-fitness-hero_6fc68343.jpg",
    palette: {
      bg: "#0c0c0e",
      accent: "#22d3ee",
      text: "#f0f0f0",
      muted: "#7a7a8a",
      card: "#151518",
      border: "#252530",
    },
    font: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    addOns: ["Class Schedule Widget", "Google Reviews Widget", "Lead Capture Form"],
    features: [
      "8-page site with class schedule",
      "Trainer bios with certifications",
      "Membership pricing page",
      "Photo gallery of the facility",
      "Blog with workout tips",
      "Monthly analytics report",
    ],
    personality:
      "High-energy and clean — cyan accents on near-black, bold type, and action photography. This site doesn't waste your time with paragraphs about 'our philosophy.' It tells you what classes are available, when they start, and how to sign up. Like the gym itself — no mirrors on the ceiling, no smoothie bar, just work.",
    ownerQuote:
      "We're not a big-box gym. Our website needed to feel like walking through our doors — focused, intense, and real.",
    ownerName: "Coach Mike D.",
    sections: {
      hero: {
        headline: "No mirrors. No smoothie bar. Just work.",
        sub: "Strength training, HIIT, and Olympic lifting in Holland, MI. First class is free.",
      },
      about:
        "Gritmill Fitness opened in 2021 in a converted warehouse on 8th Street. We run small group classes — never more than 12 people — because coaching matters more than headcount. Our trainers are certified, our programming is structured, and our community is the kind that texts you when you miss a session.",
      services: [
        { name: "Strength & Conditioning", desc: "Barbell-based programming. Squat, press, pull. Three days a week." },
        { name: "HIIT Classes", desc: "30-minute high-intensity sessions. No equipment experience needed." },
        { name: "Olympic Lifting", desc: "Snatch and clean & jerk technique. Small groups, coached every rep." },
        { name: "Open Gym", desc: "Members-only access during off-hours. Bring your own programming." },
      ],
      cta: "Try a Free Class",
    },
  },
  {
    slug: "clover-and-thistle",
    name: "Clover & Thistle",
    tagline: "Curated. Not mass-produced.",
    industry: "Boutique Retail",
    location: "Saugatuck, MI",
    tier: "Pro",
    tierPrice: "$400/mo",
    heroImage: "/manus-storage/sample-boutique-hero_0b03bcb5.jpg",
    palette: {
      bg: "#faf8f5",
      accent: "#2d5a3d",
      text: "#1a1a1a",
      muted: "#6b7c6f",
      card: "#ffffff",
      border: "#e0ddd8",
    },
    font: { heading: "'DM Serif Display', serif", body: "'Inter', sans-serif" },
    addOns: [
      "Instagram Feed Integration",
      "Google Reviews Widget",
      "Newsletter Signup",
      "Gift Card System",
    ],
    features: [
      "12-page site with lookbook galleries",
      "Brand story page",
      "New arrivals section (updated monthly)",
      "Store hours and location with map",
      "Blog with styling guides",
      "Monthly traffic and engagement reports",
    ],
    personality:
      "Light, airy, and intentional — the only light-themed sample in our showroom. Sage green accents, generous whitespace, and serif headings give it a curated, editorial feel. This is the site for the business that arranges their shelves by color and has a candle burning at the register.",
    ownerQuote:
      "We wanted our website to feel like walking into our shop — calm, beautiful, and full of things you didn't know you needed.",
    ownerName: "Emma & Claire W.",
    sections: {
      hero: {
        headline: "Things worth keeping.",
        sub: "Handpicked home goods, jewelry, and gifts in downtown Saugatuck. Open Thursday through Sunday.",
      },
      about:
        "Clover & Thistle started as a pop-up at the Saugatuck farmers market in 2018. Two sisters, a folding table, and a collection of handmade candles. Five years later, we have a storefront on Butler Street, relationships with over 40 independent makers, and a website that finally does our shop justice. Everything we carry is chosen with intention — we know the maker, the material, and the story behind it.",
      services: [
        { name: "Home Goods", desc: "Ceramics, textiles, candles, and objects that make a house feel like yours." },
        { name: "Jewelry", desc: "Handcrafted pieces from independent designers. Gold-fill, sterling, and stones." },
        { name: "Gifts & Cards", desc: "Curated gift boxes and letterpress cards for every occasion." },
        { name: "Workshops", desc: "Monthly maker workshops — candle pouring, wreath making, watercolor basics." },
      ],
      cta: "Visit the Shop",
    },
  },
  {
    slug: "ember-oak-coffee",
    name: "Ember & Oak Coffee Co.",
    tagline: "Small batch. Big flavor. No shortcuts.",
    industry: "Coffee Roaster / Ecommerce",
    location: "Traverse City, MI",
    tier: "Commerce",
    tierPrice: "Custom",
    heroImage: "/manus-storage/sample-coffee-hero_99af36b8.jpg",
    palette: {
      bg: "#1c1816",
      accent: "#b8860b",
      text: "#f0ebe4",
      muted: "#8a7e72",
      card: "#262018",
      border: "#3a3228",
    },
    font: { heading: "'DM Serif Display', serif", body: "'Inter', sans-serif" },
    addOns: [
      "Ecommerce Store",
      "Product Catalog",
      "Subscription Management",
      "Shipping Calculator",
      "Inventory Tracking",
    ],
    features: [
      "Full ecommerce site with product pages",
      "Subscription coffee club management",
      "Origin story pages for each blend",
      "Wholesale inquiry form",
      "Blog with brewing guides",
      "Monthly sales and traffic reports",
    ],
    personality:
      "Rich and tactile — dark roast tones, golden accents, and photography that makes you smell the beans through the screen. This is our Commerce tier showpiece. It demonstrates what a full ecommerce build looks like: product pages, cart, subscriptions, and a brand story that makes you want to buy before you even see the price.",
    ownerQuote:
      "We roast 200 pounds a week and ship nationwide. Our old Shopify site worked, but it didn't tell our story. This one does.",
    ownerName: "Ben & Sara N.",
    sections: {
      hero: {
        headline: "Roasted this morning. Shipped today.",
        sub: "Single-origin and custom blends from Traverse City, MI. Subscribe and never run out.",
      },
      about:
        "Ember & Oak Coffee Co. started in a garage in 2017 with a secondhand drum roaster and a notebook full of flavor profiles. We're still small — just four people — but we ship to 38 states and roast every batch to order. We don't do dark-for-the-sake-of-dark. We roast to bring out what the bean already has. Every bag lists the origin, altitude, process, and roast date. No secrets.",
      services: [
        { name: "Single Origins", desc: "Rotating selections from Ethiopia, Colombia, Guatemala, and Kenya." },
        { name: "House Blends", desc: "Three signature blends — Morning Light, Lakeshore Dark, and Sleeping Bear." },
        { name: "Coffee Club", desc: "12oz or 2lb bags delivered every 2 or 4 weeks. Skip or cancel anytime." },
        { name: "Wholesale", desc: "We supply cafes, restaurants, and offices across Michigan. Minimum 10lb orders." },
      ],
      cta: "Shop Coffee",
    },
  },
];
