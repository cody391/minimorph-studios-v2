import 'dotenv/config';
import mysql from 'mysql2/promise';

const db = await mysql.createConnection(process.env.DATABASE_URL);

// Find Quinn in reps
const [reps] = await db.execute("SELECT id, userId, fullName, email, status, stripeConnectAccountId, stripeConnectOnboarded, paperworkCompletedAt FROM reps WHERE fullName LIKE '%Quinn%' OR fullName LIKE '%quinn%'");
console.log('Quinn reps:', JSON.stringify(reps, null, 2));

// Find Quinn in users
const [users] = await db.execute("SELECT id, name, email, role FROM users WHERE name LIKE '%Quinn%' OR name LIKE '%quinn%'");
console.log('Quinn users:', JSON.stringify(users, null, 2));

// Check all recent reps with their userId linkage
const [recentReps] = await db.execute("SELECT id, userId, fullName, email, status, stripeConnectAccountId, stripeConnectOnboarded FROM reps ORDER BY id DESC LIMIT 10");
console.log('\nRecent reps:', JSON.stringify(recentReps, null, 2));

await db.end();
