/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Portfolio: Expanded showcase with 7 projects in a dynamic editorial grid.
 * Row 1: 1 large + 2 stacked. Row 2: 3 equal cards. Row 3: 2 stacked + 1 large (reversed).
 * Category filter tabs for interactivity.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

/* ── Image URLs ── */
const PORTFOLIO_RESTAURANT =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/portfolio-restaurant-FuwZJvAQ2GMjeehhGneKaP.webp";
const PORTFOLIO_FITNESS =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/portfolio-fitness-CUFdv5zqfB7SqFNxYiDTgc.webp";
const PORTFOLIO_BOUTIQUE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/portfolio-boutique-Vi5nkbxFKPXcbd2d2bUNTo.webp";
const PORTFOLIO_LAWFIRM =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/portfolio-lawfirm-NTGvojFD4txoYypT5UQw7b.webp";
const PORTFOLIO_COFFEESHOP =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/portfolio-coffeeshop-ayy6kziqi3H6bnsCj8UDBD.webp";
const PORTFOLIO_DENTAL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/portfolio-dental-VGaUnsCDLyHDupEJPxFpXL.webp";
const PORTFOLIO_REALESTATE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/portfolio-realestate-gCQUa46PwMubpxfHbr5cH2.webp";

/* ── Project data ── */
const projects = [
  {
    image: PORTFOLIO_RESTAURANT,
    title: "The Gilded Plate",
    category: "Hospitality",
    description:
      "A sophisticated dining experience brought to life online with warm tones and elegant typography.",
  },
  {
    image: PORTFOLIO_FITNESS,
    title: "Elevate Fitness",
    category: "Health & Wellness",
    description:
      "An energetic, conversion-focused site that captures the studio's dynamic brand identity.",
  },
  {
    image: PORTFOLIO_BOUTIQUE,
    title: "Aura Boutique",
    category: "Retail",
    description:
      "A minimal, editorial e-commerce experience that lets the products speak for themselves.",
  },
  {
    image: PORTFOLIO_LAWFIRM,
    title: "Sterling & Croft LLP",
    category: "Professional Services",
    description:
      "A prestigious law firm site with navy and gold accents that conveys trust, authority, and heritage.",
  },
  {
    image: PORTFOLIO_COFFEESHOP,
    title: "The Roasted Earth",
    category: "Hospitality",
    description:
      "An artisan coffee brand brought online with earthy tones, hand-drawn icons, and a warm community feel.",
  },
  {
    image: PORTFOLIO_DENTAL,
    title: "Lumina Dental",
    category: "Health & Wellness",
    description:
      "A calming, approachable dental clinic site with teal accents, team profiles, and online booking.",
  },
  {
    image: PORTFOLIO_REALESTATE,
    title: "Prestige Waterfront",
    category: "Real Estate",
    description:
      "A luxury real estate platform with dramatic property photography, interactive listings, and agent profiles.",
  },
];

const categories = [
  "All",
  ...Array.from(new Set(projects.map((p) => p.category))),
];

/* ── Reusable card component ── */
function PortfolioCard({
  project,
  size = "default",
}: {
  project: (typeof projects)[number];
  size?: "large" | "default";
}) {
  const isLarge = size === "large";
  return (
    <div className="relative rounded-2xl overflow-hidden bg-cream-dark aspect-[4/3] h-full">
      <img
        src={project.image}
        alt={project.title}
        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-forest/10 to-transparent" />
      <div
        className={`absolute bottom-0 left-0 right-0 ${
          isLarge ? "p-6 lg:p-8" : "p-5 lg:p-6"
        }`}
      >
        <span className="text-xs font-sans font-medium text-cream/60 uppercase tracking-widest mb-1.5 block">
          {project.category}
        </span>
        <h3
          className={`font-serif text-white mb-1 ${
            isLarge ? "text-2xl lg:text-3xl" : "text-lg lg:text-xl"
          }`}
        >
          {project.title}
        </h3>
        <p
          className={`text-white/75 font-sans leading-relaxed ${
            isLarge ? "text-sm max-w-md" : "text-sm line-clamp-2"
          }`}
        >
          {project.description}
        </p>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [active, setActive] = useState("All");

  const filtered =
    active === "All"
      ? projects
      : projects.filter((p) => p.category === active);

  return (
    <section id="portfolio" className="py-24 lg:py-32 bg-cream">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 lg:mb-18">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-sans font-medium text-terracotta uppercase tracking-widest mb-4 block"
            >
              Our Work
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-serif text-forest leading-tight mb-6"
            >
              Crafted with care,
              <br />
              <span className="italic">built to convert</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-forest/60 font-sans leading-relaxed"
            >
              Every project is a unique collaboration. Here are some of the
              businesses we've helped transform their online presence.
            </motion.p>
          </div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-4 py-2 rounded-full text-sm font-sans font-medium transition-all duration-300 ${
                  active === cat
                    ? "bg-forest text-cream shadow-sm"
                    : "bg-forest/6 text-forest/60 hover:bg-forest/12 hover:text-forest"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Portfolio Grid — Dynamic layout based on count */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {filtered.length >= 7 ? (
              /* Full 7-project editorial layout */
              <div className="space-y-6 lg:space-y-8">
                {/* Row 1: Large left + 2 stacked right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="lg:col-span-7 group"
                  >
                    <PortfolioCard project={filtered[0]} size="large" />
                  </motion.div>
                  <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
                    {filtered.slice(1, 3).map((project, idx) => (
                      <motion.div
                        key={project.title}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 * (idx + 1) }}
                        className="group flex-1"
                      >
                        <PortfolioCard project={project} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Row 2: 3 equal cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {filtered.slice(3, 6).map((project, idx) => (
                    <motion.div
                      key={project.title}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.1 * idx }}
                      className="group"
                    >
                      <PortfolioCard project={project} />
                    </motion.div>
                  ))}
                </div>

                {/* Row 3: Full-width feature card */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                  className="group"
                >
                  <div className="relative rounded-2xl overflow-hidden bg-cream-dark aspect-[21/9]">
                    <img
                      src={filtered[6].image}
                      alt={filtered[6].title}
                      className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-forest/80 via-forest/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 top-0 flex flex-col justify-end p-8 lg:p-12 max-w-lg">
                      <span className="text-xs font-sans font-medium text-cream/60 uppercase tracking-widest mb-2 block">
                        {filtered[6].category}
                      </span>
                      <h3 className="text-2xl lg:text-4xl font-serif text-white mb-3">
                        {filtered[6].title}
                      </h3>
                      <p className="text-sm lg:text-base text-white/75 font-sans leading-relaxed">
                        {filtered[6].description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Filtered view: responsive grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filtered.map((project, idx) => (
                  <motion.div
                    key={project.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                    className="group"
                  >
                    <PortfolioCard project={project} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom stat line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-14 lg:mt-18 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-sm font-sans text-forest/40"
        >
          <span>
            <strong className="text-forest/70 font-semibold">200+</strong>{" "}
            websites delivered
          </span>
          <span className="hidden sm:inline text-forest/20">|</span>
          <span>
            <strong className="text-forest/70 font-semibold">15+</strong>{" "}
            industries served
          </span>
          <span className="hidden sm:inline text-forest/20">|</span>
          <span>
            <strong className="text-forest/70 font-semibold">96%</strong>{" "}
            client retention
          </span>
        </motion.div>
      </div>
    </section>
  );
}
