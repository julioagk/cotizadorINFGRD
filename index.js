const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve static frontend files from root
app.use(express.static(__dirname));

// Hashing helper
const hash = (pass) => crypto.createHash('sha256').update(pass).digest('hex');

// Encryption Helpers
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'infiniguard_default_secure_key_32bytes_long!';

const getSecretKey = () => {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
};

function encrypt(text) {
  if (text === null || text === undefined) return '';
  const str = String(text);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getSecretKey(), iv);
  let encrypted = cipher.update(str, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') return String(text);
  const parts = text.split(':');
  if (parts.length !== 2) return text;
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', getSecretKey(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return text;
  }
}

function encryptClient(c) {
  if (!c) return c;
  return {
    ...c,
    company: encrypt(c.company),
    name: encrypt(c.name),
    phone: encrypt(c.phone),
    email: encrypt(c.email),
    address: encrypt(c.address),
    notes: encrypt(c.notes)
  };
}

function decryptClient(c) {
  if (!c) return c;
  return {
    ...c,
    company: decrypt(c.company),
    name: decrypt(c.name),
    phone: decrypt(c.phone),
    email: decrypt(c.email),
    address: decrypt(c.address),
    notes: decrypt(c.notes)
  };
}

function encryptPriceListItem(p) {
  if (!p) return p;
  return {
    ...p,
    serpentin: encrypt(p.serpentin),
    serpentin_gabinete: encrypt(p.serpentin_gabinete),
    recubrimiento_completo: encrypt(p.recubrimiento_completo)
  };
}

function decryptPriceListItem(p) {
  if (!p) return p;
  return {
    ...p,
    serpentin: parseFloat(decrypt(p.serpentin)) || 0,
    serpentin_gabinete: parseFloat(decrypt(p.serpentin_gabinete)) || 0,
    recubrimiento_completo: parseFloat(decrypt(p.recubrimiento_completo)) || 0
  };
}

function encryptQuotation(q) {
  if (!q) return q;
  let encryptedItems = q.items;
  if (q.items) {
    encryptedItems = { encrypted: encrypt(JSON.stringify(q.items)) };
  }
  return {
    id: q.id,
    folio: q.folio,
    date: q.date,
    clientId: q.clientId || q.client_id,
    contactName: encrypt(q.contactName || q.contact_name),
    contactPhone: encrypt(q.contactPhone || q.contact_phone),
    attentionTo: encrypt(q.attentionTo || q.attention_to),
    signedBy: q.signedBy || q.signed_by,
    exchangeRate: q.exchangeRate || q.exchange_rate,
    applyIva: q.applyIva || q.apply_iva,
    ivaRate: q.ivaRate || q.iva_rate,
    iva: q.iva,
    subtotal: q.subtotal,
    total: q.total,
    currency: q.currency,
    observations: encrypt(q.observations),
    items: encryptedItems
  };
}

function decryptQuotation(q) {
  if (!q) return q;
  let decryptedItems = q.items;
  if (q.items && typeof q.items === 'object' && q.items.encrypted) {
    try {
      decryptedItems = JSON.parse(decrypt(q.items.encrypted));
    } catch (err) {
      console.error('Error decrypting quotation items:', err);
    }
  } else if (q.items && typeof q.items === 'string') {
    try {
      const parsed = JSON.parse(q.items);
      if (parsed && parsed.encrypted) {
        decryptedItems = JSON.parse(decrypt(parsed.encrypted));
      } else {
        decryptedItems = parsed;
      }
    } catch {
      const decryptedStr = decrypt(q.items);
      try {
        decryptedItems = JSON.parse(decryptedStr);
      } catch {
        decryptedItems = q.items;
      }
    }
  }
  return {
    id: q.id,
    folio: q.folio,
    date: q.date,
    clientId: q.clientId || q.client_id,
    contactName: decrypt(q.contactName || q.contact_name),
    contactPhone: decrypt(q.contactPhone || q.contact_phone),
    attentionTo: decrypt(q.attentionTo || q.attention_to),
    signedBy: q.signedBy || q.signed_by,
    exchangeRate: parseFloat(q.exchangeRate || q.exchange_rate) || 0,
    applyIva: q.applyIva || q.apply_iva || false,
    ivaRate: parseFloat(q.ivaRate || q.iva_rate) || 0,
    iva: parseFloat(q.iva) || 0,
    subtotal: parseFloat(q.subtotal) || 0,
    total: parseFloat(q.total) || 0,
    currency: q.currency,
    observations: decrypt(q.observations),
    items: decryptedItems,
    createdAt: q.createdAt || q.created_at,
    updatedAt: q.updatedAt || q.updated_at
  };
}

// ── DATABASE SETUP ──
let pool = null;
const localDbPath = path.join(__dirname, 'database.json');

const isProd = !!process.env.DATABASE_URL;

if (isProd) {
  console.log('Connecting to PostgreSQL database...');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  // Auto-run schema migrations
  pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      hashed BOOLEAN DEFAULT TRUE
    );
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      factor NUMERIC DEFAULT 1.0,
      type TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      folio TEXT NOT NULL,
      date TEXT NOT NULL,
      client_id TEXT NOT NULL,
      contact_name TEXT,
      contact_phone TEXT,
      attention_to TEXT,
      signed_by TEXT,
      exchange_rate NUMERIC,
      apply_iva BOOLEAN DEFAULT FALSE,
      iva_rate NUMERIC,
      iva NUMERIC,
      subtotal NUMERIC,
      total NUMERIC,
      currency TEXT,
      observations TEXT,
      items JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS price_lists (
      client_id TEXT,
      product_id TEXT,
      type TEXT,
      model TEXT,
      serpentin TEXT,
      serpentin_gabinete TEXT,
      recubrimiento_completo TEXT,
      PRIMARY KEY (client_id, product_id)
    );
  `).then(async () => {
    console.log('Database tables verified/created successfully.');
    // Run column type conversions in case they are already numeric
    try {
      await pool.query('ALTER TABLE price_lists ALTER COLUMN serpentin TYPE TEXT');
      await pool.query('ALTER TABLE price_lists ALTER COLUMN serpentin_gabinete TYPE TEXT');
      await pool.query('ALTER TABLE price_lists ALTER COLUMN recubrimiento_completo TYPE TEXT');
      console.log('PostgreSQL price_lists columns migration completed.');
    } catch (migErr) {
      console.log('PostgreSQL price_lists columns migration skipped or already applied.');
    }
    // Seed default users
    const res = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(res.rows[0].count) === 0) {
      await pool.query('INSERT INTO users (username, password, name, role, hashed) VALUES ($1, $2, $3, $4, $5)', ['admin', hash('admin123'), 'Administrador', 'admin', true]);
      await pool.query('INSERT INTO users (username, password, name, role, hashed) VALUES ($1, $2, $3, $4, $5)', ['fernando', hash('infiniguard'), 'Fernando Zamarripa', 'admin', true]);
      console.log('Default admin users seeded into PostgreSQL.');
    }
  }).catch(err => {
    console.error('Error initializing PostgreSQL tables:', err);
  });
} else {
  console.log('Using local database file: database.json');
  // Init local database.json if not present
  if (!fs.existsSync(localDbPath)) {
    const defaultData = {
      users: [
        { username: 'admin', password: hash('admin123'), name: 'Administrador', role: 'admin', hashed: true },
        { username: 'fernando', password: hash('infiniguard'), name: 'Fernando Zamarripa', role: 'admin', hashed: true }
      ],
      clients: [],
      quotations: [],
      config: {},
      priceLists: {}
    };
    fs.writeFileSync(localDbPath, JSON.stringify(defaultData, null, 2));
  }
}

// Local File Read/Write Helpers
function readLocalDb() {
  return JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
}
function writeLocalDb(data) {
  fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
}

// ── API ROUTES ──

// 1. Auth & Users
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Completa todos los campos' });

  const uName = username.toLowerCase();
  const passHash = hash(password);

  if (isProd) {
    try {
      const dbRes = await pool.query('SELECT * FROM users WHERE username = $1', [uName]);
      const user = dbRes.rows[0];
      if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      
      let match = false;
      if (user.hashed) {
        match = user.password === passHash;
      } else {
        // Migration of plain text
        if (user.password === password) {
          await pool.query('UPDATE users SET password = $1, hashed = $2 WHERE username = $3', [passHash, true, uName]);
          match = true;
        }
      }
      if (!match) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

      res.json({
        username: user.username,
        name: user.name,
        role: user.role,
        token: 'session_token_placeholder'
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    const user = db.users.find(u => u.username === uName);
    if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    
    let match = false;
    if (user.hashed) {
      match = user.password === passHash;
    } else {
      if (user.password === password) {
        user.password = passHash;
        user.hashed = true;
        writeLocalDb(db);
        match = true;
      }
    }
    if (!match) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    
    res.json({ username: user.username, name: user.name, role: user.role });
  }
});

app.get('/api/auth/users', async (req, res) => {
  if (isProd) {
    try {
      const dbRes = await pool.query('SELECT username, name, role FROM users');
      res.json(dbRes.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    res.json(db.users.map(u => ({ username: u.username, name: u.name, role: u.role })));
  }
});

app.post('/api/auth/users', async (req, res) => {
  const { username, name, password, role } = req.body;
  if (!username || !password || !name || !role) return res.status(400).json({ error: 'Faltan datos' });

  const uName = username.toLowerCase();
  const passHash = hash(password);

  if (isProd) {
    try {
      const checkRes = await pool.query('SELECT username FROM users WHERE username = $1', [uName]);
      if (checkRes.rows.length > 0) return res.status(400).json({ error: 'El usuario ya existe' });

      await pool.query('INSERT INTO users (username, name, password, role, hashed) VALUES ($1, $2, $3, $4, $5)', [uName, name, passHash, role, true]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    if (db.users.find(u => u.username === uName)) return res.status(400).json({ error: 'El usuario ya existe' });
    db.users.push({ username: uName, name, password: passHash, role, hashed: true });
    writeLocalDb(db);
    res.json({ success: true });
  }
});

app.put('/api/auth/users/:username', async (req, res) => {
  const { name, role } = req.body;
  const uName = req.params.username.toLowerCase();

  if (isProd) {
    try {
      await pool.query('UPDATE users SET name = $1, role = $2 WHERE username = $3', [name, role, uName]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    const idx = db.users.findIndex(u => u.username === uName);
    if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
    db.users[idx].name = name;
    db.users[idx].role = role;
    writeLocalDb(db);
    res.json({ success: true });
  }
});

app.delete('/api/auth/users/:username', async (req, res) => {
  const uName = req.params.username.toLowerCase();

  if (isProd) {
    try {
      await pool.query('DELETE FROM users WHERE username = $1', [uName]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    db.users = db.users.filter(u => u.username !== uName);
    writeLocalDb(db);
    res.json({ success: true });
  }
});

app.put('/api/auth/users/:username/password', async (req, res) => {
  const { password } = req.body;
  const uName = req.params.username.toLowerCase();
  const passHash = hash(password);

  if (isProd) {
    try {
      await pool.query('UPDATE users SET password = $1, hashed = $2 WHERE username = $3', [passHash, true, uName]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    const idx = db.users.findIndex(u => u.username === uName);
    if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
    db.users[idx].password = passHash;
    db.users[idx].hashed = true;
    writeLocalDb(db);
    res.json({ success: true });
  }
});

// 2. Clients
app.get('/api/clients', async (req, res) => {
  if (isProd) {
    try {
      const dbRes = await pool.query('SELECT * FROM clients');
      const decrypted = dbRes.rows.map(decryptClient);
      decrypted.sort((a, b) => (a.company || '').localeCompare(b.company || '', 'es', { sensitivity: 'base' }));
      res.json(decrypted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    const decrypted = db.clients.map(decryptClient);
    decrypted.sort((a, b) => (a.company || '').localeCompare(b.company || '', 'es', { sensitivity: 'base' }));
    res.json(decrypted);
  }
});

app.post('/api/clients', async (req, res) => {
  const c = req.body;
  const ec = encryptClient(c);
  if (isProd) {
    try {
      await pool.query(
        'INSERT INTO clients (id, company, name, phone, factor, type, email, address, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [ec.id, ec.company, ec.name, ec.phone, ec.factor, ec.type, ec.email, ec.address, ec.notes]
      );
      res.json(c);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    db.clients.push(ec);
    writeLocalDb(db);
    res.json(c);
  }
});

app.put('/api/clients/:id', async (req, res) => {
  const id = req.params.id;
  const c = req.body;
  const ec = encryptClient(c);
  if (isProd) {
    try {
      await pool.query(
        'UPDATE clients SET company = $1, name = $2, phone = $3, factor = $4, type = $5, email = $6, address = $7, notes = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9',
        [ec.company, ec.name, ec.phone, ec.factor, ec.type, ec.email, ec.address, ec.notes, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    const idx = db.clients.findIndex(item => item.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Cliente no encontrado' });
    db.clients[idx] = { ...ec, updatedAt: new Date().toISOString() };
    writeLocalDb(db);
    res.json({ success: true });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  const id = req.params.id;
  if (isProd) {
    try {
      await pool.query('DELETE FROM clients WHERE id = $1', [id]);
      await pool.query('DELETE FROM price_lists WHERE client_id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    db.clients = db.clients.filter(c => c.id !== id);
    if (db.priceLists[id]) delete db.priceLists[id];
    writeLocalDb(db);
    res.json({ success: true });
  }
});

// 3. Price Lists (Custom Client product lines)
app.get('/api/pricelists/:clientId', async (req, res) => {
  const { clientId } = req.params;
  if (isProd) {
    try {
      const dbRes = await pool.query('SELECT * FROM price_lists WHERE client_id = $1', [clientId]);
      res.json(dbRes.rows.map(row => decryptPriceListItem({
        id: row.product_id,
        type: row.type,
        model: row.model,
        serpentin: row.serpentin,
        serpentin_gabinete: row.serpentin_gabinete,
        recubrimiento_completo: row.recubrimiento_completo
      })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    const list = db.priceLists[clientId] || [];
    res.json(list.map(decryptPriceListItem));
  }
});

app.post('/api/pricelists/:clientId', async (req, res) => {
  const { clientId } = req.params;
  const pList = req.body; // Array of product objects
  if (isProd) {
    try {
      await pool.query('DELETE FROM price_lists WHERE client_id = $1', [clientId]);
      for (const p of pList) {
        const ep = encryptPriceListItem(p);
        await pool.query(
          'INSERT INTO price_lists (client_id, product_id, type, model, serpentin, serpentin_gabinete, recubrimiento_completo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [clientId, ep.id, ep.type, ep.model, ep.serpentin, ep.serpentin_gabinete, ep.recubrimiento_completo]
        );
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    db.priceLists[clientId] = pList.map(encryptPriceListItem);
    writeLocalDb(db);
    res.json({ success: true });
  }
});

// 4. Quotations
app.get('/api/quotations', async (req, res) => {
  if (isProd) {
    try {
      const dbRes = await pool.query('SELECT * FROM quotations ORDER BY date DESC, folio DESC');
      res.json(dbRes.rows.map(decryptQuotation));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    res.json(db.quotations.map(decryptQuotation));
  }
});

app.post('/api/quotations', async (req, res) => {
  const q = req.body;
  const eq = encryptQuotation(q);
  if (isProd) {
    try {
      await pool.query(
        'INSERT INTO quotations (id, folio, date, client_id, contact_name, contact_phone, attention_to, signed_by, exchange_rate, apply_iva, iva_rate, iva, subtotal, total, currency, observations, items) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
        [
          eq.id, eq.folio, eq.date, eq.clientId, eq.contactName, eq.contactPhone,
          eq.attentionTo, eq.signedBy, eq.exchangeRate, eq.applyIva, eq.ivaRate,
          eq.iva, eq.subtotal, eq.total, eq.currency, eq.observations, JSON.stringify(eq.items)
        ]
      );
      res.json(q);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    db.quotations.push(eq);
    writeLocalDb(db);
    res.json(q);
  }
});

app.delete('/api/quotations/:id', async (req, res) => {
  const id = req.params.id;
  if (isProd) {
    try {
      await pool.query('DELETE FROM quotations WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    db.quotations = db.quotations.filter(q => q.id !== id);
    writeLocalDb(db);
    res.json({ success: true });
  }
});

// 5. System Configuration
app.get('/api/config', async (req, res) => {
  if (isProd) {
    try {
      const dbRes = await pool.query('SELECT * FROM config');
      const cfgObj = {};
      dbRes.rows.forEach(row => {
        try {
          cfgObj[row.key] = JSON.parse(row.value);
        } catch {
          cfgObj[row.key] = row.value;
        }
      });
      res.json(cfgObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    res.json(db.config);
  }
});

app.post('/api/config', async (req, res) => {
  const cfg = req.body;
  if (isProd) {
    try {
      for (const [k, v] of Object.entries(cfg)) {
        await pool.query(
          'INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
          [k, JSON.stringify(v)]
        );
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    db.config = { ...db.config, ...cfg };
    writeLocalDb(db);
    res.json({ success: true });
  }
});

// 6. Folio Counters
app.get('/api/folio', async (req, res) => {
  if (isProd) {
    try {
      const dbRes = await pool.query("SELECT value FROM config WHERE key = 'folio_counter'");
      const val = dbRes.rows[0]?.value ? JSON.parse(dbRes.rows[0].value) : '5885';
      res.json({ current: val });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    res.json({ current: db.config.folio_counter || '5885' });
  }
});

app.post('/api/folio', async (req, res) => {
  const { value } = req.body;
  if (isProd) {
    try {
      await pool.query(
        "INSERT INTO config (key, value) VALUES ('folio_counter', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [JSON.stringify(value.toString())]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    const db = readLocalDb();
    db.config.folio_counter = value.toString();
    writeLocalDb(db);
    res.json({ success: true });
  }
});

// Fallback all other routes to index.html (SPA Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
