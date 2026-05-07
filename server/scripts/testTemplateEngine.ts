import { generateSiteFromTemplate } from '../services/templateEngine';
import * as fs from 'fs';
import * as path from 'path';

const brief = {
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

const skipWords = new Set([
  'DOCTYPE','UTF','CDN','CTA','FAQ','SEO','CSS','HTML','URL','SVG','API',
  'GPS','USD','IMG','SRC','ALT','MIN','MAX','VAR','NAN','NOW','MN','BC',
  'RGB','RGBA','MON','FRI','NEW','OLD','END','TOP','GET','SET','ADD','DIV',
  'NAV','BIO','MAP','PDF','ZIP','REF','LOG','ROW','COL','GAP','BOX','BG',
  'FX','ID','JS','TS','FPS','HVAC','ROOF','HOME','TYPE','NAME','DESC',
  'GF','AM','PM','OPEN',
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

async function run() {
  console.log('Starting multi-page template engine test...');
  console.time('generation');

  const pages = await generateSiteFromTemplate(brief);

  console.timeEnd('generation');

  const pageNames = Object.keys(pages);
  console.log('\n=== PAGES GENERATED ===');
  console.log(`Total: ${pageNames.length} pages\n`);

  // Save all pages and report
  const outDir = '/tmp/hammerstone-test';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const [name, html] of Object.entries(pages)) {
    const fileName = name === 'index' ? 'index.html' : `${name}.html`;
    const outPath = path.join(outDir, fileName);
    fs.writeFileSync(outPath, html);

    const sizeKb = (Buffer.byteLength(html) / 1024).toFixed(1);
    const hasPhone = html.includes('(612) 555-0142');
    const hasName = html.includes('Hammerstone Builds');
    const hasNavLinks = html.includes('href="services.html"') || html.includes('href="index.html"');
    console.log(`${fileName.padEnd(20)} ${sizeKb.padStart(6)} KB  phone:${hasPhone ? '✓' : '✗'}  name:${hasName ? '✓' : '✗'}  nav:${hasNavLinks ? '✓' : '✗'}`);
    checkTokens(html, name);
  }

  // Detailed check on index
  const indexHtml = pages['index'] ?? '';
  console.log('\n=== INDEX PAGE DETAILS ===');
  console.log('HEADLINE replaced:     ', !indexHtml.includes('"HEADLINE"') && !indexHtml.includes('>HEADLINE<'));
  console.log('Primary color present: ', indexHtml.includes('#e07b39'));
  console.log('License present:       ', indexHtml.includes('MN-BC-45892'));
  console.log('Growth tier label:     ', indexHtml.includes('Growth'));
  console.log('NAV_LINKS replaced:    ', !indexHtml.includes('NAV_LINKS'));
  console.log('NAV_CTA_HREF replaced: ', !indexHtml.includes('NAV_CTA_HREF'));

  const h1 = indexHtml.match(/<h1[^>]*>([\s\S]{0,400}?)<\/h1>/);
  if (h1) {
    const text = h1[1].replace(/<[^>]+>/g, '').trim();
    console.log('\nHero headline:', JSON.stringify(text.substring(0, 200)));
  }

  console.log(`\nSaved to: ${outDir}/`);
  console.log(`Open: open ${outDir}/index.html`);
}

run().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
