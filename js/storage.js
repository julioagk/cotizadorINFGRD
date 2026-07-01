/* ========================================
   Storage Module - localStorage Persistence
   ======================================== */

window.Storage = (() => {
  const KEYS = {
    clients: 'ig_clients',
    quotations: 'ig_quotations',
    config: 'ig_config',
    folioCounter: 'ig_folio_counter'
  };

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

  function add(key, item) {
    const items = getAll(key);
    items.push(item);
    saveAll(key, items);
    return item;
  }

  function update(key, id, updates) {
    const items = getAll(key);
    const idx = items.findIndex(item => item.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    saveAll(key, items);
    return items[idx];
  }

  function remove(key, id) {
    const items = getAll(key).filter(item => item.id !== id);
    saveAll(key, items);
  }

  // ── Clients ──
  const clients = {
    getAll: () => getAll(KEYS.clients),
    getById: (id) => getById(KEYS.clients, id),
    add: (client) => add(KEYS.clients, client),
    update: (id, data) => update(KEYS.clients, id, data),
    remove: (id) => {
      remove(KEYS.clients, id);
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
    add: (quotation) => add(KEYS.quotations, quotation),
    update: (id, data) => update(KEYS.quotations, id, data),
    remove: (id) => remove(KEYS.quotations, id),
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
      return next.toString();
    },
    getCurrent: () => {
      return parseInt(localStorage.getItem(KEYS.folioCounter) || '5885');
    },
    set: (val) => {
      localStorage.setItem(KEYS.folioCounter, val.toString());
    }
  };

  return { clients, priceLists, quotations, config, folio };
})();
