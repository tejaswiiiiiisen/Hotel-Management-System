import mysql from 'mysql2/promise';
async function run() {
  const db = await mysql.createConnection({ user: 'root', database: 'hotel_website', password: '' });
  await db.query(\
    INSERT INTO employees (employee_code, name, email, role, department, salary, status, org, org_id)
    SELECT staff_id, name, email, role, department, IFNULL(salary, 0), status, org_name, org_id FROM staff
    ON DUPLICATE KEY UPDATE 
      name = VALUES(name), role = VALUES(role), department = VALUES(department), salary = VALUES(salary), status = VALUES(status);
  \);
  console.log('Synced!');
  process.exit(0);
}
run();
