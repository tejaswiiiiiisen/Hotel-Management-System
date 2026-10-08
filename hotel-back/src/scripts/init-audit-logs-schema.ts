import { db } from "../db.js";

export async function initAuditLogsSchema() {
  const createAuditLogsTable = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      organization_id VARCHAR(50) DEFAULT NULL,
      branch_id VARCHAR(50) DEFAULT NULL,
      user_id VARCHAR(50) DEFAULT NULL,
      user_name VARCHAR(255) DEFAULT NULL,
      user_role VARCHAR(100) DEFAULT NULL,
      action VARCHAR(255) NOT NULL,
      module VARCHAR(100) NOT NULL,
      activity_type VARCHAR(50) NOT NULL,
      description TEXT DEFAULT NULL,
      entity_type VARCHAR(100) DEFAULT NULL,
      entity_id VARCHAR(100) DEFAULT NULL,
      old_value JSON DEFAULT NULL,
      new_value JSON DEFAULT NULL,
      ip_address VARCHAR(100) DEFAULT NULL,
      user_agent TEXT DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'Success',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.query(createAuditLogsTable);
    console.log("Verified audit_logs table schema.");
  } catch (err) {
    console.error("Error creating audit_logs table:", err);
    throw err;
  }
}
