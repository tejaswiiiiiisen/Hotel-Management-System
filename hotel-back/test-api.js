import 'dotenv/config';
import jwt from 'jsonwebtoken';

async function test() {
  const token = jwt.sign({ username: 'rahul', role: 'manager' }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const res = await fetch('http://localhost:4000/api/customers/C-574/status', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({status: 'Checked In'})
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}

test().catch(console.error);
