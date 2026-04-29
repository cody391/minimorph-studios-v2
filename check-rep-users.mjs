import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check if Jodi's user account (1170003) exists
const [jodi] = await conn.execute('SELECT * FROM users WHERE id = 1170003');
console.log('User 1170003 (Jodi):', jodi.length ? 'EXISTS' : 'NOT FOUND - DELETED!');
if (jodi.length) console.log('  Details:', { id: jodi[0].id, email: jodi[0].email, hasPassword: !!jodi[0].passwordHash });

// Check Chelsea's user
const [chelsea] = await conn.execute('SELECT * FROM users WHERE id = 510013');
console.log('\nUser 510013 (Chelsea):', chelsea.length ? 'EXISTS' : 'NOT FOUND - DELETED!');
if (chelsea.length) console.log('  Details:', { id: chelsea[0].id, email: chelsea[0].email, hasPassword: !!chelsea[0].passwordHash });

// Check Quinn's user
const [quinn] = await conn.execute('SELECT * FROM users WHERE id = 1500531');
console.log('\nUser 1500531 (Quinn):', quinn.length ? 'EXISTS' : 'NOT FOUND - DELETED!');
if (quinn.length) console.log('  Details:', { id: quinn[0].id, email: quinn[0].email, hasPassword: !!quinn[0].passwordHash });

// Check login by email for all three
console.log('\n=== LOGIN LOOKUP BY EMAIL ===');
for (const email of ['jodi@sodinimarketing.com', 'chelseamckinley49444@gmail.com', 'quinn.lawncare@yahoo.com']) {
  const [result] = await conn.execute('SELECT id, email, passwordHash FROM users WHERE email = ?', [email]);
  console.log(`${email}: ${result.length ? 'CAN LOGIN (has account)' : 'CANNOT LOGIN (no account)'}`);
  if (result.length) console.log(`  userId=${result[0].id}, hasPassword=${!!result[0].passwordHash}`);
}

await conn.end();
