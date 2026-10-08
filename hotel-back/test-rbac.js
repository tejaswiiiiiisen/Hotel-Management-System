async function test() {
  // Login
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'adminhotel@hotel.com', password: 'admin123' })
  });
  
  const loginData = await loginRes.json();
  const cookies = loginRes.headers.get('set-cookie');
  console.log('Login status:', loginRes.status);
  
  if (!cookies) {
     console.log('No cookies set', loginData);
     return;
  }
  
  const token = cookies.split(';')[0]; // simple parsing

  const rolesRes = await fetch('http://localhost:4000/api/rbac/roles', {
    headers: { 'Cookie': token }
  });
  console.log('Roles status:', rolesRes.status);
  console.log(await rolesRes.json());
  
  const rolePermsRes = await fetch('http://localhost:4000/api/rbac/role-permissions', {
    headers: { 'Cookie': token }
  });
  console.log('RolePerms status:', rolePermsRes.status);
  console.log(await rolePermsRes.json());
}

test();
