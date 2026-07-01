/* ========================================
   Auth Module - Login System
   ======================================== */

window.Auth = (() => {
  const STORAGE_KEY = 'ig_auth_session';
  const USERS_KEY = 'ig_users';


  // Deterministic Synchronous SHA-256 implementation in pure JS
  function hashPassword(ascii) {
    function rightRotate(value, amount) {
      return (value>>>amount) | (value<<(32-amount));
    }
    
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let i, j;

    let result = '';
    const words = [];
    const asciiLength = ascii[lengthProperty];
    const hash = [];
    const k = [];
    let primeCounter = 0;

    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = 1;
        }
        hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
        k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
      }
    }
    
    ascii += '\x80';
    while (ascii[lengthProperty]%64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j>>8) return ''; // Only support standard characters
      words[i>>2] |= j << ((3 - i%4)*8);
    }
    words[words[lengthProperty]] = ((asciiLength/8)/maxWord)|0;
    words[words[lengthProperty]] = (asciiLength*8)|0;
    
    for (j = 0; j < words[lengthProperty]; j += 16) {
      const w = words.slice(j, j + 16);
      const oldHash = hash.slice(0);
      
      for (i = 0; i < 64; i++) {
        let wItem = w[i];
        if (i >= 16) {
          const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15]>>>3);
          const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2]>>>10);
          wItem = w[i] = (w[i - 16] + s0 + w[i - 7] + s1)|0;
        }
        
        const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        const sigma0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
        const sigma1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
        
        const temp1 = (hash[7] + sigma1 + ch + k[i] + (wItem || 0))|0;
        const temp2 = (sigma0 + maj)|0;
        
        hash = [(temp1 + temp2)|0].concat(hash);
        hash[4] = (hash[4] + temp1)|0;
        hash.length = 8;
      }
      
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i])|0;
      }
    }
    
    for (i = 0; i < 8; i++) {
      let val = hash[i];
      if (val < 0) val += maxWord;
      result += val.toString(16).padStart(8, '0');
    }
    return result;
  }

  // Default users — stored as plain text on first init, migrated to hash on next login
  const DEFAULT_USERS = [
    { username: 'admin', password: 'admin123', name: 'Administrador', role: 'admin' },
    { username: 'fernando', password: 'infiniguard', name: 'Fernando Zamarripa', role: 'admin' }
  ];

  function initUsers() {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    }
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || DEFAULT_USERS;
    } catch { return DEFAULT_USERS; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function createUser({ username, name, password, role }) {
    const users = getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'Ese nombre de usuario ya existe' };
    }
    users.push({ username: username.toLowerCase(), name, password: hashPassword(password), hashed: true, role });
    saveUsers(users);
    return { success: true };
  }

  function updateUser(username, updates) {
    const users = getUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx === -1) return;
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
  }

  function deleteUser(username) {
    const users = getUsers().filter(u => u.username !== username);
    saveUsers(users);
  }

  function changePassword(username, newPassword) {
    const users = getUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx === -1) return;
    users[idx].password = hashPassword(newPassword);
    users[idx].hashed = true;
    saveUsers(users);
  }

  function isLoggedIn() {
    const session = getSession();
    return session !== null;
  }

  function getSession() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (data && data.expires > Date.now()) return data;
      localStorage.removeItem(STORAGE_KEY);
      return null;
    } catch {
      return null;
    }
  }

  function login(username, password) {
    const users = getUsers();
    const user = users.find(u => {
      if (u.username.toLowerCase() !== username.toLowerCase()) return false;
      if (u.hashed) {
        return u.password === hashPassword(password);
      }
      // Plain-text match (legacy) — auto-migrate to hash on success
      if (u.password === password) {
        u.password = hashPassword(password);
        u.hashed = true;
        saveUsers(users);
        return true;
      }
      return false;
    });

    if (!user) return { success: false, error: 'Usuario o contraseña incorrectos' };

    const session = {
      username: user.username,
      name: user.name,
      role: user.role,
      loginAt: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return { success: true, user: session };
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    renderLoginPage();
  }

  function getCurrentUser() {
    const session = getSession();
    return session ? { username: session.username, name: session.name, role: session.role } : null;
  }

  function renderLoginPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="login-page">
        <div class="login-container">
          <div class="login-card">
            <div class="login-header">
              <div class="brand-title large">
                <span class="brand-infin">INFINI</span><span class="brand-guard">GUARD</span>
              </div>
              <p class="login-subtitle">Sistema de Cotización</p>
            </div>

            <form class="login-form" id="login-form">
              <div class="form-group">
                <label class="form-label">Usuario</label>
                <div class="login-input-wrapper">
                  <span class="login-input-icon"><i data-lucide="user" style="width:16px;height:16px;"></i></span>
                  <input type="text" class="form-input login-input" id="login-user" 
                    placeholder="Ingresa tu usuario" autocomplete="username" autofocus>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Contraseña</label>
                <div class="login-input-wrapper">
                  <span class="login-input-icon"><i data-lucide="lock" style="width:16px;height:16px;"></i></span>
                  <input type="password" class="form-input login-input" id="login-pass" 
                    placeholder="Ingresa tu contraseña" autocomplete="current-password">
                </div>
              </div>

              <div id="login-error" class="login-error" style="display:none"></div>

              <button type="submit" class="btn btn-primary btn-lg w-full login-btn">
                Iniciar Sesión
              </button>
            </form>

            <div class="login-footer">
              <p>InfiniGuard México · Sistema Interno</p>
            </div>
          </div>

          <div class="login-bg-decoration">
            <div class="login-bg-circle c1"></div>
            <div class="login-bg-circle c2"></div>
            <div class="login-bg-circle c3"></div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Add login-specific styles
    addLoginStyles();

    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-user').value.trim();
      const password = document.getElementById('login-pass').value;
      const errorEl = document.getElementById('login-error');

      if (!username || !password) {
        errorEl.textContent = 'Completa todos los campos';
        errorEl.style.display = 'block';
        return;
      }

      const result = login(username, password);
      if (result.success) {
        // Seed data on first login
        seedInitialData();
        // Launch app
        App.init();
      } else {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        document.getElementById('login-pass').value = '';
        
        // Shake animation
        const card = document.querySelector('.login-card');
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 500);
      }
    });
  }

  function seedInitialData() {
    if (!window.SEED_DATA) return;

    const clients = Storage.clients.getAll();
    const hasClient = (companyName) => clients.some(c => c.company.toUpperCase() === companyName.toUpperCase());

    // 1. Seed HISENSE
    if (!hasClient('HISENSE') && window.SEED_DATA.hisense) {
      const hisenseId = Utils.uuid();
      Storage.clients.add({
        id: hisenseId,
        company: 'HISENSE',
        name: 'Hisense México',
        phone: '',
        email: '',
        clientType: 'oem',
        factor: 3.0,
        createdAt: new Date().toISOString()
      });
      const hisenseProducts = window.SEED_DATA.hisense.map(p => ({
        id: Utils.uuid(),
        type: p.type,
        model: p.model,
        offers: p.offers
      }));
      Storage.priceLists.save(hisenseId, hisenseProducts);
      console.log(`Seeded HISENSE: ${hisenseProducts.length} products`);
    }

    // 2. Seed CORESA
    if (!hasClient('CORESA') && window.SEED_DATA.coresa) {
      const coresaId = Utils.uuid();
      Storage.clients.add({
        id: coresaId,
        company: 'CORESA',
        name: 'Coresa',
        phone: '',
        email: '',
        clientType: 'distribuidor',
        factor: 4.0,
        createdAt: new Date().toISOString()
      });
      const coresaProducts = window.SEED_DATA.coresa.map(p => ({
        id: Utils.uuid(),
        type: p.type,
        model: p.model,
        offers: p.offers
      }));
      Storage.priceLists.save(coresaId, coresaProducts);
      console.log(`Seeded CORESA: ${coresaProducts.length} products`);
    }

    // 3. Seed PROVEEDORA DE CLIMAS
    if (!hasClient('PROVEEDORA DE CLIMAS') && window.SEED_DATA.provedora) {
      const provedoraId = Utils.uuid();
      Storage.clients.add({
        id: provedoraId,
        company: 'PROVEEDORA DE CLIMAS',
        name: 'Proveedora de Climas',
        phone: '',
        email: '',
        clientType: 'distribuidor',
        factor: 4.0,
        createdAt: new Date().toISOString()
      });
      const provedoraProducts = window.SEED_DATA.provedora.map(p => ({
        id: Utils.uuid(),
        type: p.type,
        model: p.model,
        offers: p.offers
      }));
      Storage.priceLists.save(provedoraId, provedoraProducts);
      console.log(`Seeded PROVEEDORA DE CLIMAS: ${provedoraProducts.length} products`);
    }

    // 4. Seed BRAMEX
    if (!hasClient('BRAMEX') && window.SEED_DATA.bramex) {
      const bramexId = Utils.uuid();
      Storage.clients.add({
        id: bramexId,
        company: 'BRAMEX',
        name: 'Bramex',
        phone: '',
        email: '',
        clientType: 'distribuidor_fabrica',
        factor: 3.7,
        createdAt: new Date().toISOString()
      });
      const bramexProducts = window.SEED_DATA.bramex.map(p => ({
        id: Utils.uuid(),
        type: p.type,
        model: p.model,
        offers: p.offers
      }));
      Storage.priceLists.save(bramexId, bramexProducts);
      console.log(`Seeded BRAMEX: ${bramexProducts.length} products`);
    }

    // Auto-cleanup: remove products with no prices from all client price lists in localStorage
    Storage.clients.getAll().forEach(client => {
      const products = Storage.priceLists.get(client.id);
      if (Array.isArray(products)) {
        const cleanProducts = products.filter(p => {
          if (!p.offers) return false;
          const keys = Object.keys(p.offers);
          if (keys.length === 0) return false;
          return keys.some(k => typeof p.offers[k] === 'number' && p.offers[k] > 0);
        });
        if (cleanProducts.length !== products.length) {
          Storage.priceLists.save(client.id, cleanProducts);
          console.log(`Cleaned price list for ${client.company}: removed ${products.length - cleanProducts.length} empty products`);
        }
      }
    });
  }

  function addLoginStyles() {
    if (document.getElementById('login-styles')) return;
    const style = document.createElement('style');
    style.id = 'login-styles';
    style.textContent = `
      .login-page {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-primary);
        overflow: hidden;
        position: relative;
      }

      .login-container {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 440px;
        padding: 20px;
      }

      .login-card {
        background: var(--bg-card);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-xl);
        padding: 40px 36px;
        backdrop-filter: blur(20px);
        box-shadow: var(--shadow-lg), 0 0 60px rgba(0, 180, 216, 0.08);
        transition: transform 0.3s ease;
      }

      .login-card.shake {
        animation: shakeAnim 0.5s ease;
      }

      @keyframes shakeAnim {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-10px); }
        40% { transform: translateX(10px); }
        60% { transform: translateX(-6px); }
        80% { transform: translateX(6px); }
      }

      .login-header {
        text-align: center;
        margin-bottom: 36px;
      }

      .login-logo {
        height: 56px;
        width: auto;
        margin-bottom: 16px;
        filter: drop-shadow(0 2px 8px rgba(0, 180, 216, 0.2));
      }

      .login-title {
        font-size: 1.8rem;
        font-weight: 800;
        color: var(--accent-secondary);
        letter-spacing: 3px;
        margin-bottom: 4px;
      }

      .login-subtitle {
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-weight: 400;
      }

      .login-form .form-group {
        margin-bottom: 20px;
      }

      .login-input-wrapper {
        position: relative;
      }

      .login-input-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        color: var(--text-muted);
        pointer-events: none;
        z-index: 10;
      }

      .login-input {
        width: 100% !important;
        padding: 14px 16px 14px 44px !important;
        font-size: 0.95rem !important;
        background: var(--bg-input) !important;
        border: 1px solid var(--border-default) !important;
        border-radius: var(--radius-md) !important;
        color: var(--text-primary) !important;
        transition: all var(--transition-fast) !important;
      }

      .login-input:focus {
        border-color: var(--accent-primary) !important;
        box-shadow: 0 0 0 3px rgba(0, 180, 216, 0.15) !important;
      }

      .login-error {
        background: var(--error-bg);
        border: 1px solid rgba(230, 57, 70, 0.3);
        color: var(--error);
        padding: 10px 14px;
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        margin-bottom: 16px;
        text-align: center;
      }

      .login-btn {
        padding: 14px !important;
        font-size: 1rem !important;
        margin-top: 8px;
        letter-spacing: 0.5px;
      }

      .login-footer {
        text-align: center;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid var(--border-subtle);
      }

      .login-footer p {
        color: var(--text-muted);
        font-size: 0.78rem;
      }

      /* Background decoration */
      .login-bg-decoration {
        position: fixed;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        overflow: hidden;
      }

      .login-bg-circle {
        position: absolute;
        border-radius: 50%;
        opacity: 0.07;
      }

      .login-bg-circle.c1 {
        width: 600px;
        height: 600px;
        background: var(--accent-primary);
        top: -200px;
        right: -100px;
        animation: floatCircle 20s ease-in-out infinite;
      }

      .login-bg-circle.c2 {
        width: 400px;
        height: 400px;
        background: var(--accent-secondary);
        bottom: -100px;
        left: -100px;
        animation: floatCircle 15s ease-in-out infinite reverse;
      }

      .login-bg-circle.c3 {
        width: 300px;
        height: 300px;
        background: var(--success);
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: floatCircle 25s ease-in-out infinite;
      }

      @keyframes floatCircle {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(30px, -20px) scale(1.05); }
        50% { transform: translate(-20px, 30px) scale(0.95); }
        75% { transform: translate(20px, 20px) scale(1.02); }
      }
    `;
    document.head.appendChild(style);
  }

  // Check auth and either show login or init app
  function check() {
    initUsers();
    if (isLoggedIn()) {
      seedInitialData();
      App.init();
    } else {
      renderLoginPage();
    }
  }

  return { check, isLoggedIn, login, logout, getCurrentUser, getSession, getUsers, createUser, updateUser, deleteUser, changePassword };
})();
