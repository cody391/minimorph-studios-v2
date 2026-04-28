import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Find Quinn in users
const [users] = await conn.execute("SELECT id, openId, name, email, role, loginMethod, passwordHash IS NOT NULL as hasPassword, lastSignedIn FROM users WHERE name LIKE '%Quinn%' OR name LIKE '%quinn%'");
console.log("Users matching Quinn:", JSON.stringify(users, null, 2));

// Find Quinn in reps
const [reps2] = await conn.execute("SELECT id, userId, fullName, email, status, stripeConnectOnboarded, paperworkCompletedAt FROM reps WHERE fullName LIKE '%Quinn%' OR fullName LIKE '%quinn%'");
console.log("Reps matching Quinn:", JSON.stringify(reps2, null, 2));

// Check if there's a rep with userId matching any Quinn user
if (users.length > 0) {
  for (const u of users) {
    const [repMatch] = await conn.execute("SELECT id, userId, fullName, email, status FROM reps WHERE userId = ?", [u.id]);
    console.log(`Rep linked to user ${u.id} (${u.name}):`, JSON.stringify(repMatch, null, 2));
  }
}

// Also check the become-rep flow - what route does the login redirect to?
console.log("\nNote: Login redirects reps to /rep/dashboard but the actual route is /rep");

await conn.end();
