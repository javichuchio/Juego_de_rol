(async () => {
  const base = 'http://localhost:3001';
  const username = `bugtest_${Date.now()}`;
  const password = 'pass1234';

  console.log('=== BUG TEST: Spend gold → Logout → Login → Verify gold persists ===\n');

  try {
    // 1. Register and login
    console.log('[1] Registering and logging in...');
    await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    const login1 = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data1 = await login1.json();
    const token1 = data1.token;
    console.log('✓ Logged in with initial gold: 50\n');

    // 2. Spend gold (simulate buying a weapon for 30 gold, leaving 20)
    console.log('[2] Spending gold (buying weapon: 50 - 30 = 20)...');
    const headers1 = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` };
    await fetch(`${base}/api/progress`, {
      method: 'PUT',
      headers: headers1,
      body: JSON.stringify({
        xp: 0, health: 100, gold: 20, currentWeaponIndex: 1, 
        inventory: ['palo', 'Daga'], location: 'town', 
        wonDragon: false, gameOver: false
      }),
    });
    console.log('✓ Gold spent: 50 → 20\n');

    // 3. Read progress to confirm
    console.log('[3] Reading progress after spending...');
    const read1 = await fetch(`${base}/api/progress`, { method: 'GET', headers: headers1 });
    const progress1 = await read1.json();
    console.log(`✓ Server shows gold: ${progress1.progress.gold}\n`);

    // 4. Logout (simulating user logout)
    console.log('[4] User logs out (simulating session end)...');
    console.log('✓ Logged out\n');

    // 5. Login again
    console.log('[5] Logging in again...');
    const login2 = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data2 = await login2.json();
    const token2 = data2.token;
    console.log('✓ Logged in again\n');

    // 6. Read progress to verify gold is still 20, not reset to 50
    console.log('[6] Reading progress after re-login...');
    const headers2 = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` };
    const read2 = await fetch(`${base}/api/progress`, { method: 'GET', headers: headers2 });
    const progress2 = await read2.json();
    const finalGold = progress2.progress.gold;
    console.log(`✓ Server shows gold: ${finalGold}`);

    console.log('\n[7] Verification:');
    if (finalGold === 20) {
      console.log('  ✓ PASS: Gold persisted correctly (20, not reset to 50)');
    } else if (finalGold === 50) {
      console.log('  ✗ FAIL: Gold was reset to 50 (should be 20)');
    } else {
      console.log(`  ✗ FAIL: Gold is ${finalGold} (expected 20)`);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
