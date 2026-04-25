# Showroom Turnkey Audit: Package Features vs What's Built

## Current Architecture
- ShowroomSite.tsx renders: Banner → Hero → About → NuanceSection → Services → Gallery → CTA → Footer → Attribution
- Each site gets ONE nuance section (industry-specific) plus shared sections
- Gallery currently reuses hero image 3x with different object-position
- No blog, reviews, booking, contact form, ecommerce, newsletter, or Instagram sections exist yet

## What Needs to Be Built (Per Tier)

### ALL TIERS need:
- Contact/Quote form section
- Testimonials/Reviews section (Pro+ gets Google Reviews widget styling)
- Blog preview section (Growth+)
- Better gallery (not just hero reuse)
- Hours & Location section with map placeholder

### STARTER (Hammerstone Builds):
- [x] Hero, About, Services, CTA, Footer — exist
- [x] Contractor Projects nuance — exists
- [ ] Contact/Quote form with file upload
- [ ] Service area map section
- [ ] Before/after project gallery
- [ ] Hours & service area in footer

### GROWTH (Driftwood Kitchen):
- [x] Hero, About, Services, CTA, Footer — exist
- [x] Restaurant Menu nuance — exists
- [ ] Blog/news preview section
- [ ] Google Reviews widget section
- [ ] Reservation form section
- [ ] Google Analytics badge in attribution
- [ ] Better photo gallery

### GROWTH (Gritmill Fitness):
- [x] Hero, About, Services, CTA, Footer — exist
- [x] Gym Schedule nuance — exists
- [ ] Blog preview section
- [ ] Google Reviews widget section
- [ ] Lead capture / free trial form
- [ ] Trainer bios section
- [ ] Membership pricing section

### PRO (Velvet & Vine Studio):
- [x] Hero, About, Services, CTA, Footer — exist
- [x] Stylist Team nuance — exists
- [ ] Online booking widget section
- [ ] Google Reviews section
- [ ] Instagram feed section
- [ ] Blog preview section
- [ ] Service menu with pricing
- [ ] SMS alerts badge

### PRO (Clover & Thistle):
- [x] Hero, About, Services, CTA, Footer — exist
- [x] Boutique Arrivals nuance — exists
- [ ] Instagram feed section
- [ ] Newsletter signup section
- [ ] Google Reviews section
- [ ] Blog preview section
- [ ] Gift card callout
- [ ] New arrivals lookbook

### COMMERCE (Ember & Oak Coffee):
- [x] Hero, About, Services, CTA, Footer — exist
- [x] Coffee Shop/Products nuance — exists
- [ ] Full product catalog with cart buttons
- [ ] Subscription signup section
- [ ] Blog preview section
- [ ] Reviews section
- [ ] Newsletter section
- [ ] Shipping info section
