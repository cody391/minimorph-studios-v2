/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Portfolio: Staggered masonry-style showcase with device mockup images.
 * Shows real examples of work to build trust.
 */
import { motion } from "framer-motion";

const PORTFOLIO_RESTAURANT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/portfolio-restaurant-FuwZJvAQ2GMjeehhGneKaP.webp";
const PORTFOLIO_FITNESS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/portfolio-fitness-CUFdv5zqfB7SqFNxYiDTgc.webp";
const PORTFOLIO_BOUTIQUE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/portfolio-boutique-Vi5nkbxFKPXcbd2d2bUNTo.webp";

const projects = [
  {
    image: PORTFOLIO_RESTAURANT,
    title: "The Gilded Plate",
    category: "Restaurant & Hospitality",
    description: "A sophisticated dining experience brought to life online with warm tones and elegant typography.",
  },
  {
    image: PORTFOLIO_FITNESS,
    title: "Elevate Fitness",
    category: "Health & Wellness",
    description: "An energetic, conversion-focused site that captures the studio's dynamic brand identity.",
  },
  {
    image: PORTFOLIO_BOUTIQUE,
    title: "Aura Boutique",
    category: "Fashion & Retail",
    description: "A minimal, editorial e-commerce experience that lets the products speak for themselves.",
  },
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="py-24 lg:py-32 bg-cream">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-2xl mb-16 lg:mb-20">
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
            Every project is a unique collaboration. Here are some of the businesses we've helped transform their online presence.
          </motion.p>
        </div>

        {/* Portfolio Grid — Staggered */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Large card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 group"
          >
            <div className="relative rounded-2xl overflow-hidden bg-cream-dark aspect-[4/3]">
              <img
                src={projects[0].image}
                alt={projects[0].title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                <span className="text-xs font-sans font-medium text-cream/70 uppercase tracking-widest mb-2 block">
                  {projects[0].category}
                </span>
                <h3 className="text-2xl lg:text-3xl font-serif text-white mb-2">
                  {projects[0].title}
                </h3>
                <p className="text-sm text-white/80 font-sans max-w-md">
                  {projects[0].description}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Two stacked cards */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
            {projects.slice(1).map((project, idx) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 * (idx + 1) }}
                className="group"
              >
                <div className="relative rounded-2xl overflow-hidden bg-cream-dark aspect-[4/3]">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6">
                    <span className="text-xs font-sans font-medium text-cream/70 uppercase tracking-widest mb-1 block">
                      {project.category}
                    </span>
                    <h3 className="text-xl font-serif text-white mb-1">
                      {project.title}
                    </h3>
                    <p className="text-sm text-white/80 font-sans">
                      {project.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
