const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    const base = 'http://localhost:3001';
    const username = `auto_node_${Date.now()}`;
    const password = 'pass1234';
    console.log('Registering', username);
    try {
      const r = await fetch(`${base}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!r.ok) {
        const t = await r.text();
        console.log('Register failed', r.status, t);
      } else {
        console.log('Registered OK');
      }
    } catch (e) {
      console.error('Register request error', e.message);
    }

    console.log('Logging in...');
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed', loginRes.status, loginData);
      return;
    }
    const token = loginData.token;
    console.log('Got token length', token.length);

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    console.log('Saving progress with gold=777');
    const save = await fetch(`${base}/api/progress`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ xp: 1, health: 90, gold: 777, currentWeaponIndex: 0, inventory: ['palo'], location: 'town', wonDragon: false, gameOver: false }),
    });
    const saveData = await save.json().catch(()=>null);
    console.log('Save response', save.status, saveData);

    console.log('Reading progress...');
    const read = await fetch(`${base}/api/progress`, { method: 'GET', headers });
    const readData = await read.json();
    console.log('Progress:', JSON.stringify(readData, null, 2));
  } catch (e) {
    console.error('Unexpected error', e);
  }
})();
