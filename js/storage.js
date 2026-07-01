/* ========================================
   Storage Module - local + API Sync
   ======================================== */

window.Storage = (() => {
  const KEYS = {
    clients: 'ig_clients',
    quotations: 'ig_quotations',
    config: 'ig_config',
    folioCounter: 'ig_folio_counter'
  };

  function getApiUrl() {
    const url = localStorage.getItem('ig_api_url');
    if (url) return url;
    // Default to relative if running on local server port
    if (window.location.port === '8080') {
      return window.location.origin;
    }
    return '';
  }

  async function apiCall(path, options = {}) {
    const apiBase = getApiUrl();
    if (!apiBase) return null; // local-only mode
    try {
      const res = await fetch(`${apiBase}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP error ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn('API sync failed:', err.message);
      return null;
    }
  }

  function priceListKey(clientId) {
    return `ig_pricelist_${clientId}`;
  }

  // ── Generic CRUD ──
  function getAll(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch { return []; }
  }

  function saveAll(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function getById(key, id) {
    return getAll(key).find(item => item.id === id) || null;
  }

  function add(key, item, path) {
    const items = getAll(key);
    items.push(item);
    saveAll(key, items);

    // Background push to backend
    if (path) {
      apiCall(path, {
        method: 'POST',
        body: JSON.stringify(item)
      });
    }
    return item;
  }

  function update(key, id, updates, path) {
    const items = getAll(key);
    const idx = items.findIndex(item => item.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    saveAll(key, items);

    // Background update to backend
    if (path) {
      apiCall(`${path}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(items[idx])
      });
    }
    return items[idx];
  }

  function remove(key, id, path) {
    const items = getAll(key).filter(item => item.id !== id);
    saveAll(key, items);

    // Background delete from backend
    if (path) {
      apiCall(`${path}/${id}`, {
        method: 'DELETE'
      });
    }
  }

  // ── Clients ──
  const clients = {
    getAll: () => getAll(KEYS.clients),
    getById: (id) => getById(KEYS.clients, id),
    add: (client) => add(KEYS.clients, client, '/api/clients'),
    update: (id, data) => update(KEYS.clients, id, data, '/api/clients'),
    remove: (id) => {
      remove(KEYS.clients, id, '/api/clients');
      localStorage.removeItem(priceListKey(id));
    },
    search: (query) => {
      const q = query.toLowerCase();
      return getAll(KEYS.clients).filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
      );
    }
  };

  // ── Price Lists ──
  const priceLists = {
    get: (clientId) => {
      try {
        return JSON.parse(localStorage.getItem(priceListKey(clientId))) || [];
      } catch { return []; }
    },
    save: (clientId, products) => {
      localStorage.setItem(priceListKey(clientId), JSON.stringify(products));
      // Background push to backend
      apiCall(`/api/pricelists/${clientId}`, {
        method: 'POST',
        body: JSON.stringify(products)
      });
    },
    add: (clientId, product) => {
      const products = priceLists.get(clientId);
      products.push(product);
      priceLists.save(clientId, products);
      return product;
    },
    update: (clientId, productId, updates) => {
      const products = priceLists.get(clientId);
      const idx = products.findIndex(p => p.id === productId);
      if (idx !== -1) {
        products[idx] = { ...products[idx], ...updates };
        priceLists.save(clientId, products);
        return products[idx];
      }
      return null;
    },
    remove: (clientId, productId) => {
      const products = priceLists.get(clientId).filter(p => p.id !== productId);
      priceLists.save(clientId, products);
    },
    getTypes: (clientId) => {
      const products = priceLists.get(clientId);
      return [...new Set(products.map(p => p.type))].sort();
    },
    getByType: (clientId, type) => {
      return priceLists.get(clientId).filter(p => p.type === type);
    },
    getModels: (clientId, type) => {
      const products = priceLists.get(clientId).filter(p => p.type === type);
      return [...new Set(products.map(p => p.model))].sort();
    },
    getProduct: (clientId, type, model) => {
      return priceLists.get(clientId).find(p => p.type === type && p.model === model);
    }
  };

  // ── Quotations ──
  const quotations = {
    getAll: () => getAll(KEYS.quotations).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    getById: (id) => getById(KEYS.quotations, id),
    add: (quotation) => add(KEYS.quotations, quotation, '/api/quotations'),
    update: (id, data) => update(KEYS.quotations, id, data, '/api/quotations'),
    remove: (id) => remove(KEYS.quotations, id, '/api/quotations'),
    getByClient: (clientId) => getAll(KEYS.quotations).filter(q => q.clientId === clientId)
  };

  // ── Config ──
  const config = {
    get: () => {
      const defaults = {
        gallonCost: 450,
        ivaRate: 16,
        currency: 'USD',
        companyName: 'INFINIGUARD MEXICO',
        companyRfc: 'IME191002KLA',
        companyAddress: 'KAPPA 420, Parque Industrial Milenium, Del. Ciudad Apodaca',
        companyCity: 'Apodaca, Nuevo León, México CP: 66626',
        companyPhone: '',
        sucursal: 'MAT',
        almacen: 'GENERAL',
        signedBy: ''
      };
      try {
        const saved = JSON.parse(localStorage.getItem(KEYS.config));
        return { ...defaults, ...(saved || {}) };
      } catch {
        return defaults;
      }
    },
    save: (cfg) => {
      localStorage.setItem(KEYS.config, JSON.stringify(cfg));
      // Background push to backend
      apiCall('/api/config', {
        method: 'POST',
        body: JSON.stringify(cfg)
      });
    },
    update: (updates) => {
      const current = config.get();
      config.save({ ...current, ...updates });
    }
  };

  // ── Folio ──
  const folio = {
    getNext: () => {
      const current = parseInt(localStorage.getItem(KEYS.folioCounter) || '5885');
      const next = current + 1;
      localStorage.setItem(KEYS.folioCounter, next.toString());
      // Background push to backend
      apiCall('/api/folio', {
        method: 'POST',
        body: JSON.stringify({ value: next })
      });
      return next.toString();
    },
    getCurrent: () => {
      return parseInt(localStorage.getItem(KEYS.folioCounter) || '5885');
    },
    set: (val) => {
      localStorage.setItem(KEYS.folioCounter, val.toString());
      apiCall('/api/folio', {
        method: 'POST',
        body: JSON.stringify({ value: val })
      });
    }
  };

  // ── Production Database Syncing ──
  async function syncWithBackend() {
    const apiBase = getApiUrl();
    if (!apiBase) return false;

    console.log('Syncing data with Railway backend database...');
    
    // 1. Sync configuration
    const remoteConfig = await apiCall('/api/config');
    if (remoteConfig) {
      localStorage.setItem(KEYS.config, JSON.stringify(remoteConfig));
    }

    // 2. Sync folio counter
    const remoteFolio = await apiCall('/api/folio');
    if (remoteFolio && remoteFolio.current) {
      localStorage.setItem(KEYS.folioCounter, remoteFolio.current);
    }

    // 3. Sync clients
    const remoteClients = await apiCall('/api/clients');
    if (remoteClients) {
      saveAll(KEYS.clients, remoteClients);
      // For each client, pull custom price list
      for (const client of remoteClients) {
        const pList = await apiCall(`/api/pricelists/${client.id}`);
        if (pList) {
          localStorage.setItem(priceListKey(client.id), JSON.stringify(pList));
        }
      }
    }

    // 4. Sync quotations
    const remoteQuotations = await apiCall('/api/quotations');
    if (remoteQuotations) {
      saveAll(KEYS.quotations, remoteQuotations);
    }

    // 5. Sync system users
    const remoteUsers = await apiCall('/api/auth/users');
    if (remoteUsers) {
      localStorage.setItem('ig_users', JSON.stringify(remoteUsers));
    }

    console.log('Database sync complete.');
    return true;
  }

  return { clients, priceLists, quotations, config, folio, syncWithBackend, getApiUrl, apiCall };
})();
