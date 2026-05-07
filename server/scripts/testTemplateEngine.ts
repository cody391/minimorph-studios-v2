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

async function run() {
  console.log('Starting template engine test...');
  console.time('generation');

  const pages = await generateSiteFromTemplate(brief);
  const html = pages.index || pages['index.html'] || Object.values(pages)[0] || '';

  console.timeEnd('generation');
  console.log('\n=== GENERATION RESULTS ===');
  console.log('Pages generated:', Object.keys(pages));
  console.log('HTML size:', html.length.toLocaleString(), 'chars');
  console.log('');
  console.log('Token replacement:');
  console.log('  HEADLINE replaced:      ', !html.includes('HEADLINE'));
  console.log('  SUBHEADLINE replaced:   ', !html.includes('SUBHEADLINE'));
  console.log('  ABOUT_STORY replaced:   ', !html.includes('ABOUT_STORY'));
  console.log('  Phone present:          ', html.includes('(612) 555-0142'));
  console.log('  Business name present:  ', html.includes('Hammerstone Builds'));
  console.log('  Owner name present:     ', html.includes('Mike Hammerstone'));
  console.log('  Primary color present:  ', html.includes('#e07b39'));
  console.log('  License present:        ', html.includes('MN-BC-45892'));
  console.log('  Minneapolis present:    ', html.includes('Minneapolis'));
  console.log('  Growth tier label:      ', html.includes('Growth'));
  console.log('  Kitchen Remodeling:     ', html.includes('Kitchen Remodeling'));

  // Hero H1 — the actual generated copy
  const h1 = html.match(/<h1[^>]*>([\s\S]{0,400}?)<\/h1>/);
  if (h1) {
    const text = h1[1].replace(/<[^>]+>/g, '').trim();
    console.log('\nHero headline copy:');
    console.log(' ', JSON.stringify(text.substring(0, 200)));
  }

  // Check for unreplaced uppercase tokens (false-positive filtered)
  const skipWords = new Set([
    'DOCTYPE','UTF','CDN','CTA','FAQ','SEO','CSS','HTML','URL','SVG','API',
    'GPS','USD','IMG','SRC','ALT','MIN','MAX','VAR','NAN','NOW','MN','BC',
    'RGB','RGBA','MON','FRI','NEW','OLD','END','TOP','GET','SET','ADD','DIV',
    'NAV','BIO','MAP','PDF','ZIP','REF','LOG','ROW','COL','GAP','BOX','BG',
    'FX','ID','JS','TS','FPS','HVAC','ROOF','HOME','TYPE','NAME','DESC',
  ]);
  const remaining = html.match(/\b[A-Z][A-Z_]{4,}\b/g)?.filter(t =>
    !t.startsWith('RGBA') && !t.startsWith('RGB') && !skipWords.has(t)
  ) ?? [];
  const unique = Array.from(new Set(remaining));
  if (unique.length > 0) {
    console.log('\nPossible unreplaced tokens:', unique.slice(0, 20));
  } else {
    console.log('\nAll tokens replaced ✅');
  }

  // Save output
  const outPath = path.join('/tmp', 'hammerstone-test.html');
  fs.writeFileSync(outPath, html);
  console.log('\nSaved to:', outPath);
  console.log('File size:', (fs.statSync(outPath).size / 1024).toFixed(1), 'KB');
}

run().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
