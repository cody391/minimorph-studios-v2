import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("No DATABASE_URL");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL + "&ssl={\"rejectUnauthorized\":true}");

// 1. All reps with status
console.log("\n=== ALL REPS ===");
const [reps] = await conn.execute(`
  SELECT r.id, r.fullName, r.status, r.trainingProgress, r.certifiedAt, r.performanceScore
  FROM reps r ORDER BY r.id
`);
console.table(reps);

// 2. Certification counts per rep
console.log("\n=== CERTIFICATIONS PER REP ===");
const [certs] = await conn.execute(`
  SELECT ac.repId, COUNT(*) as certCount, GROUP_CONCAT(ac.moduleId) as modules
  FROM academy_certifications ac
  GROUP BY ac.repId
`);
console.table(certs);

// 3. Active leads per rep
console.log("\n=== ACTIVE LEADS PER REP ===");
const [leadCounts] = await conn.execute(`
  SELECT l.assignedRepId, COUNT(*) as activeLeads
  FROM leads l
  WHERE l.stage NOT IN ('closed_won', 'closed_lost')
  AND l.assignedRepId IS NOT NULL
  GROUP BY l.assignedRepId
`);
console.table(leadCounts);

// 4. Unassigned leads available
console.log("\n=== UNASSIGNED LEADS (available to assign) ===");
const [unassigned] = await conn.execute(`
  SELECT l.stage, COUNT(*) as cnt
  FROM leads l
  WHERE l.assignedRepId IS NULL
  GROUP BY l.stage
`);
console.table(unassigned);

// 5. Daily check-ins today
console.log("\n=== DAILY CHECK-INS TODAY ===");
const [checkIns] = await conn.execute(`
  SELECT dc.repId, dc.requiredReviews, dc.completedReviews, dc.isCleared
  FROM daily_check_ins dc
  WHERE DATE(dc.checkInDate) = CURDATE()
`);
console.table(checkIns);

// 6. Rep service areas
console.log("\n=== REP SERVICE AREAS ===");
const [areas] = await conn.execute(`
  SELECT rsa.repId, rsa.areaName, rsa.isPrimary
  FROM rep_service_areas rsa
  ORDER BY rsa.repId
`);
console.table(areas);

await conn.end();
