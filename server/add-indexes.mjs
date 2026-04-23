import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const indexes = [
  "CREATE INDEX IF NOT EXISTS idx_leads_assigned_rep ON leads(assignedRepId)",
  "CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage)",
  "CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone)",
  "CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)",
  "CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source)",
  "CREATE INDEX IF NOT EXISTS idx_outreach_sequences_lead ON outreach_sequences(leadId)",
  "CREATE INDEX IF NOT EXISTS idx_outreach_sequences_status ON outreach_sequences(status)",
  "CREATE INDEX IF NOT EXISTS idx_ai_conversations_lead ON ai_conversations(leadId)",
  "CREATE INDEX IF NOT EXISTS idx_scraped_businesses_status ON scraped_businesses(status)",
  "CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes(email)",
  "CREATE INDEX IF NOT EXISTS idx_enriched_contacts_lead ON enriched_contacts(leadId)",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("No DATABASE_URL"); process.exit(1); }
  
  const conn = await mysql.createConnection(url);
  
  for (const sql of indexes) {
    try {
      await conn.execute(sql);
      console.log(`✓ ${sql.split(" ON ")[1]}`);
    } catch (err) {
      // Index might already exist or table might not exist yet
      console.log(`⚠ ${sql.split(" ON ")[1]}: ${err.message}`);
    }
  }
  
  await conn.end();
  console.log("\nDone — all indexes applied.");
}

main().catch(console.error);
