(async () => {
  const base = 'http://localhost:3001';
  const username = `interactive_${Date.now()}`;
  const password = 'pass1234';

  console.log('=== INTERACTIVE BUG REPRODUCTION TEST ===\n');
  console.log('Scenario: User plays → spends gold → closes browser → reopens → logs in\n');

  try {
    // 1. Register
    console.log('[STEP 1] Registering user...');
    await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    console.log(`✓ User registered: ${username}\n`);

    // 2. Login (browser session 1)
    console.log('[STEP 2] Browser session 1: Login...');
    const login1 = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data1 = await login1.json();
    const token1 = data1.token;
    const headers1 = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` };
    
    // Load initial progress
    const read1 = await fetch(`${base}/api/progress`, { method: 'GET', headers: headers1 });
    const progress1 = await read1.json();
    console.log(`✓ Logged in. Initial gold: ${progress1.progress.gold}\n`);

    // 3. Spend gold (user plays, buys weapon for 30 gold)
    console.log('[STEP 3] User plays: buys weapon (30 gold)...');
    console.log(`   Gold: ${progress1.progress.gold} - 30 = ${progress1.progress.gold - 30}`);
    await fetch(`${base}/api/progress`, {
      method: 'PUT',
      headers: headers1,
      body: JSON.stringify({
        xp: 0, health: 100, gold: progress1.progress.gold - 30, 
        currentWeaponIndex: 1, inventory: ['palo', 'Daga'], 
        location: 'town', wonDragon: false, gameOver: false
      }),
    });
    console.log('✓ Weapon purchased. Gold saved to server.\n');

    // 4. Logout (browser closes completely)
    console.log('[STEP 4] Browser closes (user logs out)...');
    console.log('✓ Browser session ended.\n');

    // 5. Browser restart - simulate reopening the page WITH login still valid
    // (token in localStorage persists)
    console.log('[STEP 5] Browser reopens - user has token in localStorage...');
    console.log('✓ Page loads, token found. Attempting login with stored token...\n');

    // 6. Re-login (simulate what happens when token is already in localStorage)
    const login2 = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data2 = await login2.json();
    const token2 = data2.token;
    const headers2 = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` };

    // Load progress (simulating loadProgress() in frontend)
    const read2 = await fetch(`${base}/api/progress`, { method: 'GET', headers: headers2 });
    const progress2 = await read2.json();
    console.log('[STEP 6] Frontend loads progress from server...');
    console.log(`✓ Gold after re-login: ${progress2.progress.gold}\n`);

    // 7. Verify
    console.log('[VERIFICATION]');
    const expectedGold = progress1.progress.gold - 30;
    if (progress2.progress.gold === expectedGold) {
      console.log(`✓ PASS: Gold persisted correctly (${expectedGold})`);
      console.log('   Bug is FIXED - gold does not reset to 50');
    } else {
      console.log(`✗ FAIL: Gold is ${progress2.progress.gold}, expected ${expectedGold}`);
      console.log(`   Bug still exists - gold was reset or not saved correctly`);
    }
  } catch (e) {
    console.error('\n✗ Error:', e.message);
  }
})();
