async function testPost() {
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'adminhotel@hotel.com', password: 'admin123' })
  });
  const cookies = loginRes.headers.get('set-cookie');
  const token = cookies.split(';')[0];
  
  const payload = {
    role_id: 2,
    permissions: [
      { module_key: 'dashboard', can_view: true, can_edit: true },
      { module_key: 'rooms', can_view: true, can_edit: false }
    ]
  };

  const res = await fetch('http://localhost:4000/api/rbac/role-permissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': token },
    body: JSON.stringify(payload)
  });
  
  console.log('Save status:', res.status);
  console.log(await res.json());
}
testPost();
