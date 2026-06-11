(async () => {
  const base = 'http://localhost:3001';
  const username = `e2e_user_${Date.now()}`;
  const password = 'password123';
  
  console.log('=== E2E Test: Register → Login → Save → Read ===');
  console.log(`Testing with user: ${username}\n`);

  try {
    // 1. Register
    console.log('[1] Registering...');
    const regRes = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const regData = await regRes.json();
    if (!regRes.ok) {
      console.error('Register failed:', regData);
      return;
    }
    console.log('✓ Registered:', regData.user.username);

    // 2. Login
    console.log('\n[2] Logging in...');
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed:', loginData);
      return;
    }
    const token = loginData.token;
    console.log('✓ Logged in. Token length:', token.length);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // 3. Read initial progress (defaults)
    console.log('\n[3] Reading initial progress (defaults)...');
    let read = await fetch(`${base}/api/progress`, { method: 'GET', headers });
    let data = await read.json();
    console.log('✓ Initial progress:', {
      xp: data.progress.xp,
      health: data.progress.health,
      gold: data.progress.gold,
      currentWeaponIndex: data.progress.currentWeaponIndex,
      inventory: data.progress.inventory,
    });

    // 4. Simulate gameplay: buy weapon, take damage, gain XP, earn gold
    console.log('\n[4] Simulating gameplay...');
    const newProgress = {
      xp: 150,
      health: 75,
      gold: 300,
      currentWeaponIndex: 2, // upgraded weapon
      inventory: ['palo', 'Daga', 'Martillo de Garra'],
      location: 'cave',
      wonDragon: false,
      gameOver: false,
    };

    const saveRes = await fetch(`${base}/api/progress`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(newProgress),
    });
    const saveData = await saveRes.json();
    if (!saveRes.ok) {
      console.error('Save failed:', saveData);
      return;
    }
    console.log('✓ Saved progress:', newProgress);

    // 5. Logout and login again (simulate session restart)
    console.log('\n[5] Logging in again (simulating session restart)...');
    const loginRes2 = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const loginData2 = await loginRes2.json();
    if (!loginRes2.ok) {
      console.error('Second login failed:', loginData2);
      return;
    }
    const token2 = loginData2.token;
    const headers2 = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token2}`,
    };
    console.log('✓ Logged in again with new token');

    // 6. Read progress after restart
    console.log('\n[6] Reading progress after session restart...');
    read = await fetch(`${base}/api/progress`, { method: 'GET', headers: headers2 });
    data = await read.json();
    const restored = data.progress;
    console.log('✓ Restored progress:', {
      xp: restored.xp,
      health: restored.health,
      gold: restored.gold,
      currentWeaponIndex: restored.currentWeaponIndex,
      inventory: restored.inventory,
      location: restored.location,
    });

    // 7. Verify values match
    console.log('\n[7] Verification:');
    const checks = [
      { name: 'XP', expected: newProgress.xp, actual: restored.xp },
      { name: 'Health', expected: newProgress.health, actual: restored.health },
      { name: 'Gold', expected: newProgress.gold, actual: restored.gold },
      { name: 'Weapon Index', expected: newProgress.currentWeaponIndex, actual: restored.currentWeaponIndex },
      { name: 'Location', expected: newProgress.location, actual: restored.location },
    ];
    let allPass = true;
    for (const check of checks) {
      const pass = check.expected === check.actual;
      const status = pass ? '✓' : '✗';
      console.log(`  ${status} ${check.name}: expected ${check.expected}, got ${check.actual}`);
      if (!pass) allPass = false;
    }

    console.log('\n' + (allPass ? '✓ ALL TESTS PASSED!' : '✗ SOME TESTS FAILED'));
  } catch (e) {
    console.error('\nUnexpected error:', e.message);
  }
})();
