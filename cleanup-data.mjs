import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Real rep IDs to keep:
// - Jodi Sodini: rep ID 1050003, userId 510012
// - Quinn Wasilchenko: rep ID 1110017, userId 1500531
// - Cody Wasilchenko (owner): rep ID 600004, userId 510011
// - Chelsea McKinley: rep ID 600008, userId 510013 (she went through onboarding)
const KEEP_REP_IDS = [600004, 600008, 1050003, 1110017];
const KEEP_USER_IDS = [510011, 510012, 510013, 1500531];

console.log("=== CLEANUP: Removing all sample/test data ===\n");

// Get all tables to understand what needs cleaning
const [tables] = await conn.execute("SHOW TABLES");
console.log("Tables in database:", tables.map(t => Object.values(t)[0]).join(', '));

// 1. Delete fake commissions (repId not in keep list)
const [commResult] = await conn.execute(
  `DELETE FROM commissions WHERE repId NOT IN (${KEEP_REP_IDS.join(',')})`
);
console.log(`Deleted ${commResult.affectedRows} fake commissions`);

// 2. Delete fake leads (assignedRepId not in keep list AND not unassigned leads for real reps)
const [leadResult] = await conn.execute(
  `DELETE FROM leads WHERE assignedRepId NOT IN (${KEEP_REP_IDS.join(',')}) AND assignedRepId != 0 AND assignedRepId IS NOT NULL`
);
console.log(`Deleted ${leadResult.affectedRows} fake leads (assigned to fake reps)`);

// Also delete leads assigned to rep 0 that are clearly test data
const [leadResult2] = await conn.execute(
  `DELETE FROM leads WHERE contactName IN ('John Doe', 'Code Test Rep') OR businessName IN ('Test Business', 'Code Test Business')`
);
console.log(`Deleted ${leadResult2.affectedRows} test leads by name`);

// 3. Delete fake reps
const [repResult] = await conn.execute(
  `DELETE FROM reps WHERE id NOT IN (${KEEP_REP_IDS.join(',')})`
);
console.log(`Deleted ${repResult.affectedRows} fake reps`);

// 4. Delete fake gamification records
try {
  const [gamResult] = await conn.execute(
    `DELETE FROM rep_gamification WHERE repId NOT IN (${KEEP_REP_IDS.join(',')})`
  );
  console.log(`Deleted ${gamResult.affectedRows} fake gamification records`);
} catch (e) { console.log("rep_gamification:", e.message); }

// 5. Delete fake accountability scores
try {
  const [accResult] = await conn.execute(
    `DELETE FROM accountability_scores WHERE repId NOT IN (${KEEP_REP_IDS.join(',')})`
  );
  console.log(`Deleted ${accResult.affectedRows} fake accountability scores`);
} catch (e) { console.log("accountability_scores:", e.message); }

// 6. Delete fake training progress
try {
  const [trainResult] = await conn.execute(
    `DELETE FROM training_progress WHERE repId NOT IN (${KEEP_REP_IDS.join(',')})`
  );
  console.log(`Deleted ${trainResult.affectedRows} fake training progress`);
} catch (e) { console.log("training_progress:", e.message); }

// 7. Delete fake daily check-ins
try {
  const [checkinResult] = await conn.execute(
    `DELETE FROM daily_check_ins WHERE repId NOT IN (${KEEP_REP_IDS.join(',')})`
  );
  console.log(`Deleted ${checkinResult.affectedRows} fake check-ins`);
} catch (e) { console.log("daily_check_ins:", e.message); }

// 8. Delete fake rep service areas
try {
  const [areaResult] = await conn.execute(
    `DELETE FROM rep_service_areas WHERE repId NOT IN (${KEEP_REP_IDS.join(',')})`
  );
  console.log(`Deleted ${areaResult.affectedRows} fake service areas`);
} catch (e) { console.log("rep_service_areas:", e.message); }

// 9. Delete fake users (keep admin, keep real rep users)
// First get the admin user IDs
const [adminUsers] = await conn.execute("SELECT id FROM users WHERE role = 'admin'");
const adminIds = adminUsers.map(u => u.id);
const allKeepUserIds = [...KEEP_USER_IDS, ...adminIds];
const [userResult] = await conn.execute(
  `DELETE FROM users WHERE id NOT IN (${allKeepUserIds.join(',')}) AND role != 'admin'`
);
console.log(`Deleted ${userResult.affectedRows} fake users`);

// 10. Delete fake customers
try {
  const [custResult] = await conn.execute(
    `DELETE FROM customers WHERE contactName IN ('John Doe', 'Code Test') OR businessName LIKE '%Test%'`
  );
  console.log(`Deleted ${custResult.affectedRows} fake customers`);
} catch (e) { console.log("customers:", e.message); }

// 11. Clean up team feed posts from fake reps
try {
  const [feedResult] = await conn.execute(
    `DELETE FROM team_feed_posts WHERE repId NOT IN (${KEEP_REP_IDS.join(',')})`
  );
  console.log(`Deleted ${feedResult.affectedRows} fake team feed posts`);
} catch (e) { console.log("team_feed_posts:", e.message); }

// 12. Clean up rep activities from fake reps
try {
  const [actResult] = await conn.execute(
    `DELETE FROM activities WHERE repId NOT IN (${KEEP_REP_IDS.join(',')})`
  );
  console.log(`Deleted ${actResult.affectedRows} fake activities`);
} catch (e) { console.log("activities:", e.message); }

// 13. Clean up notifications for fake users
try {
  const [notifResult] = await conn.execute(
    `DELETE FROM notifications WHERE userId NOT IN (${allKeepUserIds.join(',')})`
  );
  console.log(`Deleted ${notifResult.affectedRows} fake notifications`);
} catch (e) { console.log("notifications:", e.message); }

// 14. Clean up assessment results for fake users
try {
  const [assessResult] = await conn.execute(
    `DELETE FROM assessment_results WHERE userId NOT IN (${allKeepUserIds.join(',')})`
  );
  console.log(`Deleted ${assessResult.affectedRows} fake assessment results`);
} catch (e) { console.log("assessment_results:", e.message); }

// 15. Clean up onboarding data for fake users
try {
  const [onbResult] = await conn.execute(
    `DELETE FROM onboarding_data WHERE userId NOT IN (${allKeepUserIds.join(',')})`
  );
  console.log(`Deleted ${onbResult.affectedRows} fake onboarding data`);
} catch (e) { console.log("onboarding_data:", e.message); }

// Final verification
console.log("\n=== VERIFICATION ===");
const [repsLeft] = await conn.execute("SELECT id, fullName, email, status FROM reps ORDER BY id");
console.log(`Reps remaining (${repsLeft.length}):`);
for (const r of repsLeft) console.log(`  ID ${r.id} | ${r.fullName} | ${r.email} | ${r.status}`);

const [usersLeft] = await conn.execute("SELECT id, name, email, role FROM users ORDER BY id");
console.log(`\nUsers remaining (${usersLeft.length}):`);
for (const u of usersLeft) console.log(`  ID ${u.id} | ${u.name} | ${u.email} | ${u.role}`);

const [leadsLeft] = await conn.execute("SELECT id, businessName, assignedRepId FROM leads ORDER BY id");
console.log(`\nLeads remaining (${leadsLeft.length}):`);
for (const l of leadsLeft) console.log(`  ID ${l.id} | ${l.businessName} | repId=${l.assignedRepId}`);

const [commissionsLeft] = await conn.execute("SELECT COUNT(*) as cnt FROM commissions");
console.log(`\nCommissions remaining: ${commissionsLeft[0].cnt}`);

await conn.end();
console.log("\n=== CLEANUP COMPLETE ===");
