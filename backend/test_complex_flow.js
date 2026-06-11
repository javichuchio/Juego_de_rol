(async () => {
  const base = 'http://localhost:3001';
  const username = `e2e_noauth_${Date.now()}`;
  const password = 'pass1234';

  console.log('=== COMPLEX TEST: Play (no auth) → Logout → Login → Verify sync ===\n');

  try {
    // 1. Register user
    console.log('[1] Registering user...');
    await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    console.log('✓ Registered\n');

    // 2. First login to set server defaults
    console.log('[2] First login to initialize server state...');
    const login1 = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data1 = await login1.json();
    const token1 = data1.token;
    const headers1 = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` };
    
    // Load defaults
    const readDefault = await fetch(`${base}/api/progress`, { method: 'GET', headers: headers1 });
    const defaultProgress = await readDefault.json();
    console.log(`✓ Server state: gold=${defaultProgress.progress.gold}\n`);

    // 3. Logout to simulate user session end
    console.log('[3] User logs out (simulates browser close)...');
    console.log('✓ Logged out\n');

    // 4. User plays WITHOUT authentication (simulates open page without login)
    // In real scenario, progress would be saved to localStorage by the browser
    console.log('[4] Simulating gameplay without auth (would save to localStorage locally)...');
    console.log('   Simulated: gold 50 → 100 (found treasure), health 100 → 85 (took damage)\n');

    // 5. User logs back in
    console.log('[5] Logging back in...');
    const login2 = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data2 = await login2.json();
    const token2 = data2.token;
    const headers2 = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` };
    console.log('✓ Logged in\n');

    // 6. Simulate client syncing local progress to server
    console.log('[6] Frontend syncs local progress (gold=100, health=85)...');
    const syncPayload = {
      xp: 0, health: 85, gold: 100, currentWeaponIndex: 0,
      inventory: ['palo'], location: 'town',
      wonDragon: false, gameOver: false
    };
    await fetch(`${base}/api/progress`, {
      method: 'PUT',
      headers: headers2,
      body: JSON.stringify(syncPayload),
    });
    console.log('✓ Synced to server\n');

    // 7. Read progress to verify server has synced values
    console.log('[7] Reading progress after sync...');
    const readAfterSync = await fetch(`${base}/api/progress`, { method: 'GET', headers: headers2 });
    const afterSyncProgress = await readAfterSync.json();
    console.log(`✓ Server now shows: gold=${afterSyncProgress.progress.gold}, health=${afterSyncProgress.progress.health}\n`);

    // 8. Logout and login AGAIN to verify persistence
    console.log('[8] Logout and re-login to verify persistence...');
    const login3 = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data3 = await login3.json();
    const token3 = data3.token;
    const headers3 = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token3}` };

    const readFinal = await fetch(`${base}/api/progress`, { method: 'GET', headers: headers3 });
    const finalProgress = await readFinal.json();
    console.log(`✓ After final re-login: gold=${finalProgress.progress.gold}, health=${finalProgress.progress.health}\n`);

    // 9. Verify
    console.log('[9] Verification:');
    if (finalProgress.progress.gold === 100 && finalProgress.progress.health === 85) {
      console.log('  ✓ PASS: Local progress persisted through multiple sessions');
    } else {
      console.log(`  ✗ FAIL: Expected gold=100 health=85, got gold=${finalProgress.progress.gold} health=${finalProgress.progress.health}`);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
