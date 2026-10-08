import { query } from './src/db.js';
query('DESCRIBE rooms').then(res => {
  console.log(res.map(r => r.Field));
  process.exit(0);
}).catch(console.error);
