import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('=== ALL REPS WITH USER ACCOUNTS ===');
const [reps] = await conn.execute(`
  SELECT r.id, r.name, r.email, r.status, r.user_id, r.stripe_connect_onboarded, r.training_progress,
         u.id as uid, u.email as user_email, u.name as user_name, u.role as user_role
  FROM reps r
  LEFT JOIN users u ON r.user_id = u.id
  ORDER BY r.id
`);
console.table(reps);

console.log('\n=== LOCAL AUTH CREDENTIALS ===');
const [localAuth] = await conn.execute(`SELECT id, user_id, email, created_at FROM local_auth`);
console.table(localAuth);

console.log('\n=== ONBOARDING DATA ===');
const [onboarding] = await conn.execute(`SELECT id, user_id, step, completed_at FROM rep_onboarding_data`);
console.table(onboarding);

console.log('\n=== REP APPLICATIONS ===');
const [apps] = await conn.execute(`SELECT * FROM rep_applications ORDER BY id`);
console.table(apps);

await conn.end();
