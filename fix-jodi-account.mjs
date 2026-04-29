import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Generate a local openId like the system does
const openId = 'local_' + crypto.randomBytes(16).toString('base64url');

// Create a temporary password - Jodi will need to be told what it is
// Using a simple one she can change later
const tempPassword = 'MiniMorph2026!';
const passwordHash = await bcrypt.hash(tempPassword, 12);

// Recreate Jodi's user account with the same ID (1170003)
try {
  await conn.execute(
    `INSERT INTO users (id, openId, name, email, loginMethod, role, passwordHash, createdAt, updatedAt, lastSignedIn) 
     VALUES (?, ?, ?, ?, 'email_password', 'user', ?, NOW(), NOW(), NOW())`,
    [1170003, openId, 'Jodi Sodini', 'jodi@sodinimarketing.com', passwordHash]
  );
  console.log('✅ Jodi user account recreated (ID: 1170003)');
  console.log('   Email: jodi@sodinimarketing.com');
  console.log('   Temp password: MiniMorph2026!');
} catch (err) {
  if (err.code === 'ER_DUP_ENTRY') {
    console.log('User already exists, skipping');
  } else {
    throw err;
  }
}

// Verify the fix
const [verify] = await conn.execute('SELECT id, email, name FROM users WHERE id = 1170003');
console.log('\nVerification:', verify[0]);

// Now verify all 3 reps can log in
console.log('\n=== FINAL VERIFICATION ===');
for (const email of ['jodi@sodinimarketing.com', 'chelseamckinley49444@gmail.com', 'quinn.lawncare@yahoo.com']) {
  const [result] = await conn.execute('SELECT id, email, name, passwordHash FROM users WHERE email = ?', [email]);
  if (result.length && result[0].passwordHash) {
    console.log(`✅ ${email} - CAN LOGIN (userId=${result[0].id})`);
  } else {
    console.log(`❌ ${email} - CANNOT LOGIN`);
  }
}

await conn.end();
