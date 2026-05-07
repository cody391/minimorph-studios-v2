/**
 * Showroom sample site data — our "showroom floor models."
 * Each site has a unique visual personality, mapped to a specific package tier,
 * with add-ons showcased. These are the sites visitors can browse to see
 * what MiniMorph Studios actually builds.
 *
 * ALL business names are fictional. They do not represent real businesses.
 */

export interface ShowroomSite {
  slug: string;
  subdomain: string;
  name: string;
  tagline: string;
  industry: string;
  location: string;
  tier: "Starter" | "Growth" | "Pro";
  tierPrice: string;
  price: number;
  liveUrl?: string;
  resultStat: string;
  showcasedAddOns: string[];
  heroImage: string;
  heroGradient: string;
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
    slug: "hammerstone-builds",
    subdomain: "hammerstone",
    liveUrl: "https://hammerstone.minimorphstudios.net",
    name: "Hammerstone Builds",
    tagline: "Built right. Built to last.",
    industry: "General Contractor",
    location: "Columbus, OH",
    tier: "Starter",
    tierPrice: "$195/mo",
    price: 195,
    resultStat: "Generated 19 qualified leads last month",
    showcasedAddOns: ["Lead Capture", "SMS Alerts", "Reviews"],
    heroImage: "",
    heroGradient: "linear-gradient(135deg, #1a1a1a 0%, #2a1a0a 100%)",
    palette: {
      bg: "#1a1a1a",
      accent: "#e07b39",
      text: "#f0f0f0",
      muted: "#888888",
      card: "#242424",
      border: "#333333",
    },
    font: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    addOns: ["Quote Form", "Photo Gallery", "Google Reviews"],
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
      "I don't need a fancy website. I need one that works when someone Googles 'contractor near me' at 11pm.",
    ownerName: "Dave R.",
    sections: {
      hero: {
        headline: "Built Right. Built to Last.",
        sub: "Licensed general contractor serving the greater metro area. Kitchens, bathrooms, decks, and the stuff nobody else wants to touch.",
      },
      about:
        "Hammerstone Builds has been delivering quality construction since 2015. We're a small crew — three guys who actually show up when we say we will. We don't do free estimates that turn into two-hour sales pitches. We look at the job, tell you what it costs, and get to work.",
      services: [
        { name: "Kitchen Remodels", desc: "Full gut jobs to cabinet refacing. We do it all." },
        { name: "Bathroom Renovations", desc: "Tile, plumbing, vanities, walk-in showers." },
        { name: "Decks & Outdoor", desc: "Composite and cedar. Built to last through any season." },
        { name: "General Repairs", desc: "The stuff that's been on your list for two years. We'll knock it out." },
      ],
      cta: "Get a Quote",
    },
  },
  {
    slug: "driftwood-kitchen",
    subdomain: "driftwood",
    liveUrl: "https://driftwood.minimorphstudios.net",
    name: "Driftwood Kitchen",
    tagline: "Where every meal tells a story.",
    industry: "Restaurant",
    location: "Door County, WI",
    tier: "Growth",
    tierPrice: "$295/mo",
    price: 295,
    resultStat: "+340% online reservations",
    showcasedAddOns: ["Booking", "Reviews", "Instagram", "Email"],
    heroImage: "",
    heroGradient: "linear-gradient(135deg, #2c1810 0%, #1a0c06 100%)",
    palette: {
      bg: "#2c1810",
      accent: "#c8a96e",
      text: "#f5f0e8",
      muted: "#a89070",
      card: "#3a2218",
      border: "#4a3225",
    },
    font: { heading: "'DM Serif Display', serif", body: "'Inter', sans-serif" },
    addOns: ["Online Menu", "Reservation Form", "Google Reviews"],
    features: [
      "8-page responsive site",
      "Full menu with descriptions",
      "Google Maps & hours integration",
      "Monthly blog posts about seasonal specials",
      "Analytics dashboard showing top menu pages",
    ],
    personality:
      "Warm and inviting — like the smell of cedar and perfectly grilled fish drifting off the water. This site uses warm amber tones, textured backgrounds, and rich copy to make visitors hungry before they even check the menu.",
    ownerQuote:
      "We needed a site that felt like our restaurant — warm, unpretentious, and focused on the food. MiniMorph Studios nailed it.",
    ownerName: "Tom & Linda K.",
    sections: {
      hero: {
        headline: "Where Every Meal Tells a Story.",
        sub: "Fresh-caught fish, local craft beer, and sunsets you'll remember. Open year-round on the waterfront.",
      },
      about:
        "Driftwood Kitchen has been a local staple since 2008. What started as a small fish fry shack on the channel has grown into a full-service waterfront restaurant serving locally sourced ingredients. We still cook our perch the same way — one batch at a time.",
      services: [
        { name: "Dine-In", desc: "Waterfront seating with views you won't forget. Reservations recommended on weekends." },
        { name: "Takeout", desc: "Call ahead or order online. Ready in 20 minutes." },
        { name: "Private Events", desc: "Host your rehearsal dinner, birthday, or company outing lakeside." },
        { name: "Catering", desc: "We bring the kitchen to you. Full-service catering for 20 to 200 guests." },
      ],
      cta: "Make a Reservation",
    },
  },
  {
    slug: "velvet-vine-studio",
    subdomain: "velvetandvine",
    liveUrl: "https://velvetandvine.minimorphstudios.net",
    name: "Velvet & Vine Studio",
    tagline: "Where artistry meets intention.",
    industry: "Salon & Spa",
    location: "Nashville, TN",
    tier: "Pro",
    tierPrice: "$395/mo",
    price: 395,
    resultStat: "Booking calendar 3 weeks out",
    showcasedAddOns: ["Booking", "Instagram", "Reviews", "Email"],
    heroImage: "",
    heroGradient: "linear-gradient(135deg, #1a0a1e 0%, #0a0610 100%)",
    palette: {
      bg: "#1a0a1e",
      accent: "#c9a84c",
      text: "#f8f4f0",
      muted: "#9a8878",
      card: "#231028",
      border: "#342040",
    },
    font: { heading: "'DM Serif Display', serif", body: "'Inter', sans-serif" },
    addOns: [
      "Online Booking Integration",
      "Instagram Feed",
      "Google Reviews",
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
      "Elevated and editorial — this isn't a strip-mall salon site. Deep plum backgrounds, gold accents, and intentional whitespace give it a luxury-magazine feel. Every page feels like a spread in Vogue Hair.",
    ownerQuote:
      "Our old site looked like every other salon in town. This one actually reflects the experience we give our clients.",
    ownerName: "Aisha T.",
    sections: {
      hero: {
        headline: "Where Artistry Meets Intention.",
        sub: "Precision cuts, custom color, and intentional styling in the heart of Nashville. Book your consultation.",
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
    subdomain: "gritmill",
    liveUrl: "https://gritmill.minimorphstudios.net",
    name: "Gritmill Fitness",
    tagline: "No excuses. Just results.",
    industry: "Fitness Studio",
    location: "Austin, TX",
    tier: "Growth",
    tierPrice: "$295/mo",
    price: 295,
    resultStat: "Class signups up 280% in 60 days",
    showcasedAddOns: ["AI Chat", "Lead Capture", "SMS", "Reviews"],
    heroImage: "",
    heroGradient: "linear-gradient(135deg, #0d0d0d 0%, #0a0a1a 100%)",
    palette: {
      bg: "#0d0d0d",
      accent: "#00d4ff",
      text: "#f0f0f0",
      muted: "#7a7a8a",
      card: "#151520",
      border: "#252535",
    },
    font: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    addOns: ["Class Schedule", "Lead Capture Form", "Google Reviews"],
    features: [
      "8-page site with class schedule",
      "Trainer bios with certifications",
      "Membership pricing page",
      "Photo gallery of the facility",
      "Blog with workout tips",
      "Monthly analytics report",
    ],
    personality:
      "High-energy and clean — cyan accents on near-black, bold type, and action-ready copy. This site doesn't waste your time with paragraphs about 'our philosophy.' It tells you what classes are available, when they start, and how to sign up.",
    ownerQuote:
      "We're not a big-box gym. Our website needed to feel like walking through our doors — focused, intense, and real.",
    ownerName: "Coach Mike D.",
    sections: {
      hero: {
        headline: "No Excuses. Just Results.",
        sub: "Strength training, HIIT, and Olympic lifting in Austin. First class is free — no commitment required.",
      },
      about:
        "Gritmill Fitness opened in 2021 in a converted warehouse. We run small group classes — never more than 12 people — because coaching matters more than headcount. Our trainers are certified, our programming is structured, and our community is the kind that texts you when you miss a session.",
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
    subdomain: "cloverandthistle",
    liveUrl: "https://cloverandthistle.minimorphstudios.net",
    name: "Clover & Thistle",
    tagline: "Curated for the way you actually live.",
    industry: "Boutique Retail",
    location: "Asheville, NC",
    tier: "Pro",
    tierPrice: "$395/mo",
    price: 395,
    resultStat: "Email list grew 400+ in month 1",
    showcasedAddOns: ["Email", "Instagram", "SEO Blog", "Reviews"],
    heroImage: "",
    heroGradient: "linear-gradient(135deg, #f9f5f0 0%, #e8e4df 100%)",
    palette: {
      bg: "#ffffff",
      accent: "#2d4a2d",
      text: "#1a1a1a",
      muted: "#6b7c6f",
      card: "#f9f5f0",
      border: "#e0ddd8",
    },
    font: { heading: "'DM Serif Display', serif", body: "'Inter', sans-serif" },
    addOns: [
      "Instagram Feed Integration",
      "Newsletter Signup",
      "Google Reviews",
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
      "Light, airy, and intentional — the only light-themed sample in our showroom. Forest green accents, generous whitespace, and serif headings give it a curated, editorial feel. This is the site for the business that arranges their shelves by color.",
    ownerQuote:
      "We wanted our website to feel like walking into our shop — calm, beautiful, and full of things you didn't know you needed.",
    ownerName: "Emma & Claire W.",
    sections: {
      hero: {
        headline: "Curated for the Way You Actually Live.",
        sub: "Handpicked home goods, jewelry, and gifts in downtown Asheville. Open Thursday through Sunday.",
      },
      about:
        "Clover & Thistle started as a pop-up at the farmers market in 2018. Two sisters, a folding table, and a collection of handmade candles. Five years later, we have a storefront on Main Street, relationships with over 40 independent makers, and a website that finally does our shop justice. Everything we carry is chosen with intention.",
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
    subdomain: "emberandoak",
    liveUrl: "https://emberandoak.minimorphstudios.net",
    name: "Ember & Oak Coffee Co.",
    tagline: "Small batch. Big flavor. No shortcuts.",
    industry: "Coffee Roaster",
    location: "Portland, OR",
    tier: "Pro",
    tierPrice: "$395/mo",
    price: 395,
    resultStat: "$12,400 online orders, month one",
    showcasedAddOns: ["Ecommerce", "Subscriptions", "AI Chat", "Email"],
    heroImage: "",
    heroGradient: "linear-gradient(135deg, #1a0f08 0%, #100806 100%)",
    palette: {
      bg: "#1a0f08",
      accent: "#c4782a",
      text: "#f0e6d3",
      muted: "#8a7a68",
      card: "#261810",
      border: "#3a2818",
    },
    font: { heading: "'DM Serif Display', serif", body: "'Inter', sans-serif" },
    addOns: [
      "Product Store",
      "Subscription Management",
      "Email Marketing",
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
      "Rich and tactile — dark espresso tones, golden amber accents, and copy that makes you smell the beans. Pro tier with add-on ecommerce: product pages, subscriptions, and a brand story that makes you want to buy before you even see the price.",
    ownerQuote:
      "We roast 200 pounds a week and ship nationwide. Our old site worked, but it didn't tell our story. This one does.",
    ownerName: "Ben & Sara N.",
    sections: {
      hero: {
        headline: "Small Batch. Big Flavor. No Shortcuts.",
        sub: "Single-origin and custom blends roasted to order. Subscribe and never run out of great coffee.",
      },
      about:
        "Ember & Oak Coffee Co. started in a garage in 2017 with a secondhand drum roaster and a notebook full of flavor profiles. We're still small — just four people — but we ship to 38 states and roast every batch to order. We don't do dark-for-the-sake-of-dark. We roast to bring out what the bean already has. Every bag lists the origin, altitude, process, and roast date. No secrets.",
      services: [
        { name: "Single Origins", desc: "Rotating selections from Ethiopia, Colombia, Guatemala, and Kenya." },
        { name: "House Blends", desc: "Three signature blends — Morning Light, Midnight Dark, and Hearthstone." },
        { name: "Coffee Club", desc: "12oz or 2lb bags delivered every 2 or 4 weeks. Skip or cancel anytime." },
        { name: "Wholesale", desc: "We supply cafes, restaurants, and offices nationwide. Minimum 10lb orders." },
      ],
      cta: "Shop Coffee",
    },
  },
  {
    slug: "thornwood-goods",
    subdomain: "thornwood",
    liveUrl: "https://thornwood.minimorphstudios.net",
    name: "Thornwood Goods",
    tagline: "Handcrafted goods for the well-lived life.",
    industry: "E-Commerce / Artisan Goods",
    location: "Asheville, NC",
    tier: "Growth",
    tierPrice: "$295/mo",
    price: 295,
    resultStat: "+220% inquiry volume in first 60 days",
    showcasedAddOns: ["Instagram", "Email", "Lead Capture", "Reviews"],
    heroImage: "",
    heroGradient: "linear-gradient(135deg, #1a1208 0%, #0e0a04 100%)",
    palette: {
      bg: "#1a1208",
      accent: "#b87a3c",
      text: "#f5efe6",
      muted: "#9a8a78",
      card: "#231a0c",
      border: "#352818",
    },
    font: { heading: "'Cormorant Garamond', serif", body: "'Inter', sans-serif" },
    addOns: ["Instagram Feed", "Email Newsletter", "Inquiry Form"],
    features: [
      "Full catalog + product detail pages",
      "Brand story and maker profile",
      "Instagram grid integration",
      "Newsletter signup with welcome sequence",
      "Inquiry form for custom orders",
      "Monthly performance report",
    ],
    personality:
      "Warm and editorial — the ecommerce template in action. Cormorant Garamond headlines, amber tones, and product photography-forward layouts. This is for the maker who sells on Etsy but deserves their own home. Clean grid, hover-reveal inquiry buttons, and a brand story section that turns browsers into buyers.",
    ownerQuote:
      "I'd been on Etsy for six years. Having my own site finally feels like the business I always meant to run.",
    ownerName: "Jess M.",
    sections: {
      hero: {
        headline: "Handcrafted Goods for the Well-Lived Life.",
        sub: "Small-batch ceramics, woodwork, and leather goods. Made in western North Carolina, shipped nationwide.",
      },
      about:
        "Thornwood Goods is a one-woman studio run by Jess Marchand out of a converted barn in the Blue Ridge foothills. Every piece is made by hand, in small batches, using materials sourced within 200 miles when possible. Jess has been selling her work at regional craft fairs since 2017. The studio isn't big. The waiting list sometimes is.",
      services: [
        { name: "Ceramic Goods", desc: "Mugs, bowls, bud vases, and soap dishes. Each one slightly different because that's the whole point." },
        { name: "Leather Accessories", desc: "Card holders, key fobs, and journal covers. Vegetable-tanned and built to patina beautifully." },
        { name: "Woodwork", desc: "Cutting boards, serving platters, and small shelves. Live-edge when the grain calls for it." },
        { name: "Custom Orders", desc: "Personalization, bulk orders for weddings and events, and one-of-a-kind commissions. 6–8 week lead time." },
      ],
      cta: "Browse the Collection",
    },
  },
];
