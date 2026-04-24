/**
 * Clear all test rep applications, assessments, and onboarding data
 * Run with: node scripts/clear-test-data.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  console.log('Clearing all test rep data...\n');
  
  // Order matters due to foreign key relationships
  // Clear child tables first, then parent tables
  const tables = [
    'rep_onboarding_data',
    'rep_assessments',
    'rep_applications',
    'rep_support_tickets',
    'rep_notification_preferences',
    'rep_notifications',
    'rep_service_areas',
    'rep_sent_emails',
    'rep_email_templates',
    'rep_gamification',
    'rep_activity_logs',
    'rep_quiz_results',
    'rep_training_progress',
    'reps',
  ];
  
  for (const table of tables) {
    try {
      const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result[0].count;
      if (count > 0) {
        await connection.execute(`DELETE FROM ${table}`);
        console.log(`  ✓ Cleared ${count} rows from ${table}`);
      } else {
        console.log(`  - ${table} (already empty)`);
      }
    } catch (err) {
      console.log(`  ⚠ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n✅ All test rep data cleared. Fresh start ready.');
  await connection.end();
}

main().catch(console.error);
