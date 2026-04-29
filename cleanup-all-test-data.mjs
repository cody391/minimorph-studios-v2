import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log("=== FULL TEST DATA CLEANUP ===\n");

// 1. Delete fake reps and their related data
console.log("--- Cleaning REPS ---");
const fakeRepIds = [1170001, 1170002]; // John Doe, Code Test Rep
for (const id of fakeRepIds) {
  await conn.execute(`DELETE FROM daily_check_ins WHERE rep_id = ?`, [id]);
  await conn.execute(`DELETE FROM academy_progress WHERE rep_id = ?`, [id]);
  await conn.execute(`DELETE FROM academy_certifications WHERE rep_id = ?`, [id]);
  await conn.execute(`DELETE FROM role_play_sessions WHERE rp_rep_id = ?`, [id]);
  await conn.execute(`DELETE FROM rep_service_areas WHERE repId = ?`, [id]);
  await conn.execute(`DELETE FROM commissions WHERE repId = ?`, [id]);
  // rep_assessments uses user_id not rep_id — need to find user for this rep
  const [repUser] = await conn.execute(`SELECT userId FROM reps WHERE id = ?`, [id]);
  if (repUser.length > 0 && repUser[0].userId) {
    await conn.execute(`DELETE FROM rep_assessments WHERE user_id = ?`, [repUser[0].userId]);
  }
}
const [delReps] = await conn.execute(`DELETE FROM reps WHERE id IN (1170001, 1170002)`);
console.log(`Deleted ${delReps.affectedRows} fake reps`);

// 2. Delete fake commissions (for non-existent rep IDs)
console.log("\n--- Cleaning COMMISSIONS ---");
const [realReps] = await conn.execute(`SELECT id FROM reps`);
const realRepIds = realReps.map(r => r.id);
const placeholders = realRepIds.map(() => '?').join(',');
const [delComm] = await conn.execute(
  `DELETE FROM commissions WHERE repId NOT IN (${placeholders})`,
  realRepIds
);
console.log(`Deleted ${delComm.affectedRows} orphaned commissions`);

// 3. Delete broken contracts (orphaned or with NULL monthlyPrice)
console.log("\n--- Cleaning CONTRACTS ---");
const [realCustomers] = await conn.execute(`SELECT id FROM customers`);
const realCustIds = realCustomers.map(c => c.id);
if (realCustIds.length > 0) {
  const cp = realCustIds.map(() => '?').join(',');
  const [delContracts] = await conn.execute(
    `DELETE FROM contracts WHERE customerId NOT IN (${cp})`,
    realCustIds
  );
  console.log(`Deleted ${delContracts.affectedRows} orphaned contracts`);
} else {
  const [delAll] = await conn.execute(`DELETE FROM contracts`);
  console.log(`Deleted ${delAll.affectedRows} contracts (no real customers exist)`);
}

// 4. Delete test submissions
console.log("\n--- Cleaning SUBMISSIONS ---");
const [delSubs] = await conn.execute(
  `DELETE FROM contact_submissions WHERE email IN ('notify@test.com', 'test@example.com', 'user@test.com') OR name IN ('Notify Test', 'Test User')`
);
console.log(`Deleted ${delSubs.affectedRows} test submissions`);

// 5. Delete test orders (Regular User / user@test.com)
console.log("\n--- Cleaning ORDERS ---");
const [delOrders] = await conn.execute(
  `DELETE FROM orders WHERE customerEmail = 'user@test.com' OR customerName = 'Regular User'`
);
console.log(`Deleted ${delOrders.affectedRows} test orders`);

// 6. Delete test onboarding projects (Test Biz / john@test.com / Dev Test Business)
console.log("\n--- Cleaning ONBOARDING PROJECTS ---");
const [delProj] = await conn.execute(
  `DELETE FROM onboarding_projects WHERE contactEmail = 'john@test.com' OR businessName = 'Test Biz' OR businessName = 'Dev Test Business'`
);
console.log(`Deleted ${delProj.affectedRows} test onboarding projects`);

// 7. Final counts
console.log("\n=== FINAL COUNTS ===");
const [rc] = await conn.execute(`SELECT COUNT(*) as c FROM reps`);
const [cc] = await conn.execute(`SELECT COUNT(*) as c FROM contracts`);
const [co] = await conn.execute(`SELECT COUNT(*) as c FROM commissions`);
const [cs] = await conn.execute(`SELECT COUNT(*) as c FROM contact_submissions`);
const [oc] = await conn.execute(`SELECT COUNT(*) as c FROM orders`);
const [pc] = await conn.execute(`SELECT COUNT(*) as c FROM onboarding_projects`);

console.log(`Reps: ${rc[0].c}`);
console.log(`Contracts: ${cc[0].c}`);
console.log(`Commissions: ${co[0].c}`);
console.log(`Submissions: ${cs[0].c}`);
console.log(`Orders: ${oc[0].c}`);
console.log(`Onboarding Projects: ${pc[0].c}`);

console.log("\n✅ Cleanup complete!");
await conn.end();
