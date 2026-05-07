import { generateSiteFromTemplate } from '../services/templateEngine';
import * as fs from 'fs';
import * as path from 'path';

const hammerstoneBrief = {
  businessName: 'Hammerstone Builds',
  businessType: 'contractor',
  brandTone: 'bold',
  packageTier: 'growth',
  primaryColor: '#e07b39',
  secondaryColor: '#1a1a1a',
  phone: '(612) 555-0142',
  email: 'mike@hammerstonebuilds.com',
  address: '4521 France Ave S, Minneapolis MN',
  hours: 'Mon-Fri 7am-6pm',
  serviceArea: 'Minneapolis & Surrounding Suburbs',
  yearsInBusiness: '14',
  ownerName: 'Mike Hammerstone',
  licenseNumber: 'MN-BC-45892',
  uniqueDifferentiator: 'We show clients every stage of the build because contractors who hide the process cannot control it',
  servicesOffered: ['Kitchen Remodeling', 'Bathroom Renovation', 'Home Additions', 'Basement Finishing', 'Deck Construction'],
  targetCustomer: 'Minneapolis homeowners aged 35-55 doing their first or second major renovation',
  testimonials: [],
  appUrl: 'https://www.minimorphstudios.net',
  subNiche: 'contractor',
};

const bloomStemBrief = {
  businessName: 'Bloom & Stem',
  businessType: 'florist',
  brandTone: 'romantic',
  packageTier: 'growth',
  primaryColor: '#c8657a',
  secondaryColor: '#2d1f1f',
  phone: '(503) 555-0198',
  email: 'hello@bloomandstem.com',
  address: '812 NW 23rd Ave, Portland OR',
  hours: 'Tue-Sat 9am-6pm, Sun 10am-3pm',
  serviceArea: 'Portland Metro Area',
  yearsInBusiness: '9',
  ownerName: 'Nora Chen',
  licenseNumber: '',
  uniqueDifferentiator: 'We source from local Pacific Northwest farms so your flowers were growing in Oregon soil 48 hours before they reach your hands',
  servicesOffered: ['Wedding Florals', 'Event Design', 'Seasonal Arrangements', 'Daily Bouquets', 'Corporate Subscriptions', 'Dried Flower Workshops'],
  targetCustomer: 'Portland brides, event planners, and locals who want locally-grown seasonal flowers',
  testimonials: [],
  appUrl: 'https://www.minimorphstudios.net',
  subNiche: 'florist',
};

const skipWords = new Set([
  'DOCTYPE','UTF','CDN','CTA','FAQ','SEO','CSS','HTML','URL','SVG','API',
  'GPS','USD','IMG','SRC','ALT','MIN','MAX','VAR','NAN','NOW','MN','BC',
  'RGB','RGBA','MON','FRI','NEW','OLD','END','TOP','GET','SET','ADD','DIV',
  'NAV','BIO','MAP','PDF','ZIP','REF','LOG','ROW','COL','GAP','BOX','BG',
  'FX','ID','JS','TS','FPS','HVAC','ROOF','HOME','TYPE','NAME','DESC',
  'GF','AM','PM','OPEN','OR',
]);

function checkTokens(html: string, pageName: string) {
  const remaining = html.match(/\b[A-Z][A-Z_]{4,}\b/g)?.filter(t =>
    !t.startsWith('RGBA') && !t.startsWith('RGB') && !skipWords.has(t)
  ) ?? [];
  const unique = Array.from(new Set(remaining));
  if (unique.length > 0) {
    console.log(`  ⚠ Possible unreplaced tokens [${pageName}]:`, unique.slice(0, 10).join(', '));
  }
}

async function runTest(brief: typeof hammerstoneBrief, label: string, outDir: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${label}`);
  console.log('='.repeat(60));
  console.time('generation');

  const pages = await generateSiteFromTemplate(brief);

  console.timeEnd('generation');

  const pageNames = Object.keys(pages);
  console.log(`\nPages generated: ${pageNames.length}`);

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const [name, html] of Object.entries(pages)) {
    const fileName = name === 'index' ? 'index.html' : `${name}.html`;
    const outPath = path.join(outDir, fileName);
    fs.writeFileSync(outPath, html);

    const sizeKb = (Buffer.byteLength(html) / 1024).toFixed(1);
    const hasPhone = html.includes(brief.phone);
    const hasName = html.includes(brief.businessName);
    const hasNavLinks = html.includes('href="index.html"');
    console.log(`  ${fileName.padEnd(22)} ${sizeKb.padStart(6)} KB  phone:${hasPhone ? '✓' : '✗'}  name:${hasName ? '✓' : '✗'}  nav:${hasNavLinks ? '✓' : '✗'}`);
    checkTokens(html, name);
  }

  const indexHtml = pages['index'] ?? '';
  const h1 = indexHtml.match(/<h1[^>]*>([\s\S]{0,400}?)<\/h1>/);
  if (h1) {
    const text = h1[1].replace(/<[^>]+>/g, '').trim();
    console.log(`\nHero headline: ${JSON.stringify(text.substring(0, 200))}`);
  }

  console.log(`\nSaved to: ${outDir}/`);
  console.log(`Open:     open ${outDir}/index.html`);
}

async function run() {
  console.log('Starting template engine tests...\n');

  await runTest(hammerstoneBrief, 'Hammerstone Builds (contractor / growth)', '/tmp/hammerstone-test');

  await runTest(bloomStemBrief, 'Bloom & Stem (florist / growth — custom template)', '/tmp/bloomstem-test');

  // Check if florist template was cached
  const customPath = path.join(process.cwd(), 'server', 'templates', 'custom', 'florist.html');
  const exists = fs.existsSync(customPath);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Custom cache: ${customPath}`);
  console.log(`Cache file exists: ${exists ? '✓ YES' : '✗ NO'}`);
  if (exists) {
    const sizeKb = (fs.statSync(customPath).size / 1024).toFixed(1);
    console.log(`Cache file size:   ${sizeKb} KB`);
  }

  // Run florist again to confirm cache hit (no Claude call)
  console.log('\nRunning florist again to verify cache hit...');
  console.time('cache-hit');
  const pages2 = await generateSiteFromTemplate(bloomStemBrief);
  console.timeEnd('cache-hit');
  console.log(`Cache-hit pages: ${Object.keys(pages2).length} (should match first run)`);
}

run().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
