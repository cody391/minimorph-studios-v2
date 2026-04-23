import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("Missing DATABASE_URL"); process.exit(1); }
async function seed() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Seeding demo data...");
  const tables = ["contact_submissions","upsell_opportunities","reports","nurture_logs","commissions","contracts","customers","leads","reps"];
  for (const t of tables) { await conn.execute("DELETE FROM `"+t+"`"); await conn.execute("ALTER TABLE `"+t+"` AUTO_INCREMENT = 1"); }
  console.log("Cleared existing data");
  const reps = [[0,"Sarah Mitchell","sarah@minimorph.com","(512) 555-0101","active",100,"92.00","2025-11-01"],[0,"James Rodriguez","james@minimorph.com","(512) 555-0102","active",100,"87.00","2025-12-15"],[0,"Emily Chen","emily@minimorph.com","(512) 555-0103","training",65,"0.00",null],[0,"Marcus Johnson","marcus@minimorph.com","(512) 555-0104","applied",0,"0.00",null]];
  for (const r of reps) { await conn.execute("INSERT INTO reps (userId,fullName,email,phone,status,trainingProgress,performanceScore,certifiedAt) VALUES (?,?,?,?,?,?,?,?)", r); }
  console.log("Reps seeded (4)");
  const leads = [["Bella Rosa Trattoria","Maria Rossi","maria@bellarosa.com","(512) 555-1001","Restaurant / Food","ai_sourced","warming","warm",72,1],["Peak Performance Gym","Derek Watts","derek@peakgym.com","(512) 555-1002","Fitness / Wellness","website_form","contacted","hot",88,1],["Greenfield Law Group","Patricia Green","pat@greenfieldlaw.com","(512) 555-1003","Law / Legal","referral","proposal_sent","hot",91,2],["Sunrise Dental Care","Dr. Amy Park","amy@sunrisedental.com","(512) 555-1004","Healthcare / Dental","ai_sourced","new","cold",45,null],["Urban Threads Boutique","Lisa Chang","lisa@urbanthreads.com","(512) 555-1005","Retail / E-commerce","manual","enriched","warm",65,null],["Horizon Realty","Tom Baker","tom@horizonrealty.com","(512) 555-1006","Real Estate","ai_sourced","assigned","warm",78,2]];
  for (const l of leads) { await conn.execute("INSERT INTO leads (businessName,contactName,email,phone,industry,source,stage,temperature,qualificationScore,assignedRepId) VALUES (?,?,?,?,?,?,?,?,?,?)", l); }
  console.log("Leads seeded (6)");
  const customers = [["The Roasted Earth Coffee","Jake Morrison","jake@roastedearth.com","(512) 555-2001","Restaurant / Food","https://roastedearth.com",92,"active",null],["Sterling & Croft LLP","David Sterling","david@sterlingcroft.com","(512) 555-2002","Law / Legal","https://sterlingcroft.com",85,"active",null],["Lumina Dental Studio","Dr. Sarah Kim","sarah@luminadental.com","(512) 555-2003","Healthcare / Dental","https://luminadental.com",68,"at_risk",null]];
  for (const c of customers) { await conn.execute("INSERT INTO customers (businessName,contactName,email,phone,industry,website,healthScore,status,leadId) VALUES (?,?,?,?,?,?,?,?,?)", c); }
  console.log("Customers seeded (3)");
  const now = new Date(); const fmt = (d) => d.toISOString().slice(0,10);
  const contracts = [[1,1,"growth","199.00",fmt(new Date(now.getFullYear(),now.getMonth()-6,now.getDate())),fmt(new Date(now.getFullYear()+1,now.getMonth(),now.getDate())),"active",8,"not_started"],[2,2,"premium","349.00",fmt(new Date(now.getFullYear(),now.getMonth()-3,now.getDate())),fmt(new Date(now.getFullYear(),now.getMonth()+3,now.getDate())),"expiring_soon",15,"nurturing"],[3,1,"starter","99.00",fmt(new Date(now.getFullYear()-1,now.getMonth(),now.getDate())),fmt(new Date(now.getFullYear(),now.getMonth()-1,now.getDate())),"expired",5,"proposed"]];
  for (const ct of contracts) { await conn.execute("INSERT INTO contracts (customerId,repId,packageTier,monthlyPrice,startDate,endDate,status,websitePages,renewalStatus) VALUES (?,?,?,?,?,?,?,?,?)", ct); }
  console.log("Contracts seeded (3)");
  const commissions = [[1,1,"597.00","initial_sale","paid",fmt(new Date(now.getFullYear(),now.getMonth()-5,15))],[2,2,"1047.00","initial_sale","paid",fmt(new Date(now.getFullYear(),now.getMonth()-2,20))],[1,3,"297.00","initial_sale","approved",null],[1,1,"199.00","renewal","pending",null]];
  for (const cm of commissions) { await conn.execute("INSERT INTO commissions (repId,contractId,amount,type,status,paidAt) VALUES (?,?,?,?,?,?)", cm); }
  console.log("Commissions seeded (4)");
  const nurture = [[1,1,"check_in","email","Monthly check-in","Hi Jake, just checking in on your website performance.","delivered"],[1,1,"report_delivery","email","March Analytics Report","Your monthly analytics report is ready.","opened"],[2,2,"support_request","in_app","Update contact page","Can you update our contact page with the new office address?","resolved"],[2,2,"renewal_outreach","email","Contract renewal discussion","Your contract is expiring soon.","sent"],[3,3,"upsell_attempt","phone","Upgrade to Growth tier","Discussed benefits of upgrading from Starter to Growth tier.","responded"]];
  for (const n of nurture) { await conn.execute("INSERT INTO nurture_logs (customerId,contractId,type,channel,subject,content,status) VALUES (?,?,?,?,?,?,?)", n); }
  console.log("Nurture logs seeded (5)");
  const reports = [[1,1,"2026-03",4520,1890,"38.5",185,"4.2","delivered","Consider adding a blog section to boost organic traffic."],[1,1,"2026-02",3980,1650,"41.2",172,"3.8","delivered","Optimize mobile load times for better engagement."],[2,2,"2026-03",8200,3400,"32.1",210,"5.1","generated","Add client testimonials to the homepage for social proof."],[3,3,"2026-03",1200,520,"52.8",95,"1.8","draft","Urgent: site speed and SEO improvements needed."]];
  for (const r of reports) { await conn.execute("INSERT INTO reports (customerId,contractId,reportMonth,pageViews,uniqueVisitors,bounceRate,avgSessionDuration,conversionRate,status,recommendations) VALUES (?,?,?,?,?,?,?,?,?,?)", r); }
  console.log("Reports seeded (4)");
  const upsells = [[1,1,"add_feature","Blog Integration","Add a managed blog section with SEO optimization","50.00","proposed"],[2,2,"add_pages","Case Studies Section","Add 5 case study pages to showcase client wins","150.00","identified"],[3,3,"tier_upgrade","Upgrade to Growth Tier","Move from Starter to Growth for more pages and AI support","100.00","proposed"]];
  for (const u of upsells) { await conn.execute("INSERT INTO upsell_opportunities (customerId,contractId,type,title,description,estimatedValue,status) VALUES (?,?,?,?,?,?,?)", u); }
  console.log("Upsells seeded (3)");
  const contacts = [["Alex Turner","alex@turnerplumbing.com","Turner Plumbing Co.","Interested in a website for my plumbing business.","new"],["Rachel Kim","rachel@kimyoga.com","Kim Yoga Studio","Looking for a modern website with online booking integration.","reviewed"],["Mike O'Brien","mike@obrienconstruction.com","O'Brien Construction","Need a professional website to showcase our portfolio.","converted"]];
  for (const cs of contacts) { await conn.execute("INSERT INTO contact_submissions (name,email,businessName,message,status) VALUES (?,?,?,?,?)", cs); }
  console.log("Contact submissions seeded (3)");
  console.log("All demo data seeded successfully!");
  await conn.end(); process.exit(0);
}
seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
