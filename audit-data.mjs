import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log("=== DATABASE AUDIT: Finding sample/placeholder data ===\n");

// 1. All reps
const [reps] = await conn.execute("SELECT id, userId, fullName, email, status, createdAt FROM reps ORDER BY id");
console.log(`\n--- REPS (${reps.length} total) ---`);
for (const r of reps) {
  console.log(`  ID ${r.id} | userId=${r.userId} | ${r.fullName} | ${r.email} | status=${r.status} | created=${r.createdAt}`);
}

// 2. All users (non-admin)
const [users] = await conn.execute("SELECT id, name, email, role, loginMethod, createdAt FROM users WHERE role != 'admin' ORDER BY id");
console.log(`\n--- USERS non-admin (${users.length} total) ---`);
for (const u of users) {
  console.log(`  ID ${u.id} | ${u.name} | ${u.email} | role=${u.role} | method=${u.loginMethod} | created=${u.createdAt}`);
}

// 3. Leads
const [leads] = await conn.execute("SELECT id, businessName, contactName, assignedRepId, stage, source, createdAt FROM leads ORDER BY id");
console.log(`\n--- LEADS (${leads.length} total) ---`);
for (const l of leads) {
  console.log(`  ID ${l.id} | ${l.businessName} | contact=${l.contactName} | repId=${l.assignedRepId} | stage=${l.stage} | source=${l.source}`);
}

// 4. Commissions
const [commissions] = await conn.execute("SELECT id, repId, amount, status, createdAt FROM commissions ORDER BY id");
console.log(`\n--- COMMISSIONS (${commissions.length} total) ---`);
for (const c of commissions) {
  console.log(`  ID ${c.id} | repId=${c.repId} | $${c.amount} | status=${c.status}`);
}

// 5. Rep activities
const [activities] = await conn.execute("SELECT id, repId, type, createdAt FROM rep_activities ORDER BY id LIMIT 30");
console.log(`\n--- REP ACTIVITIES (first 30) ---`);
for (const a of activities) {
  console.log(`  ID ${a.id} | repId=${a.repId} | type=${a.type} | ${a.createdAt}`);
}

// 6. Scraped businesses
const [scraped] = await conn.execute("SELECT COUNT(*) as cnt FROM scraped_businesses");
console.log(`\n--- SCRAPED BUSINESSES: ${scraped[0].cnt} total ---`);

// 7. Rep gamification
const [gamification] = await conn.execute("SELECT * FROM rep_gamification ORDER BY repId");
console.log(`\n--- REP GAMIFICATION (${gamification.length} total) ---`);
for (const g of gamification) {
  console.log(`  repId=${g.repId} | xp=${g.xp} | level=${g.level} | streak=${g.currentStreak}`);
}

// 8. Accountability scores
const [accountability] = await conn.execute("SELECT * FROM accountability_scores ORDER BY repId");
console.log(`\n--- ACCOUNTABILITY SCORES (${accountability.length} total) ---`);
for (const a of accountability) {
  console.log(`  repId=${a.repId} | score=${a.score} | tier=${a.tier}`);
}

// 9. Training progress
const [training] = await conn.execute("SELECT * FROM training_progress ORDER BY repId");
console.log(`\n--- TRAINING PROGRESS (${training.length} total) ---`);
for (const t of training) {
  console.log(`  repId=${t.repId} | moduleId=${t.moduleId} | completed=${t.completed}`);
}

// 10. Check-ins
const [checkins] = await conn.execute("SELECT repId, COUNT(*) as cnt FROM daily_check_ins GROUP BY repId");
console.log(`\n--- DAILY CHECK-INS by rep ---`);
for (const c of checkins) {
  console.log(`  repId=${c.repId} | count=${c.cnt}`);
}

// 11. Customers
const [customers] = await conn.execute("SELECT id, userId, businessName, contactName, email, createdAt FROM customers ORDER BY id");
console.log(`\n--- CUSTOMERS (${customers.length} total) ---`);
for (const c of customers) {
  console.log(`  ID ${c.id} | userId=${c.userId} | ${c.businessName} | ${c.contactName} | ${c.email}`);
}

await conn.end();
