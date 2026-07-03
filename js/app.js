/* ========================================
   App Module - Main SPA Controller & Router
   ======================================== */

window.App = (() => {
  let currentView = 'dashboard';

  function init() {
    renderShell();
    bindNavigation();

    // Auto-compile Lucide icons for dynamically added DOM elements with infinite-loop protection
    if (window.MutationObserver) {
      let isCompiling = false;
      const observer = new MutationObserver((mutations) => {
        if (isCompiling) return;
        let shouldUpdate = false;
        for (const m of mutations) {
          if (m.addedNodes.length > 0) {
            for (const node of m.addedNodes) {
              if (node.nodeType === 1) {
                if (node.tagName === 'SVG' || node.querySelector('svg')) {
                  continue; // Skip SVG additions to prevent feedback loops
                }
                if (node.hasAttribute('data-lucide') || node.querySelector('[data-lucide]')) {
                  shouldUpdate = true;
                  break;
                }
              }
            }
          }
          if (shouldUpdate) break;
        }
        if (shouldUpdate && window.lucide) {
          isCompiling = true;
          window.lucide.createIcons();
          setTimeout(() => { isCompiling = false; }, 0);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    handleRoute();
    window.addEventListener('hashchange', handleRoute);
  }

  function renderShell() {
    const user = Auth.getCurrentUser() || { name: 'Usuario', role: 'admin' };
    document.getElementById('app').innerHTML = `
      <div class="app-layout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-logo">
            <div class="brand-title">
              <span class="brand-infin">INFINI</span><span class="brand-guard">GUARD</span>
            </div>
            <span class="brand-short">IG</span>
            <span class="logo-text">COTIZADOR</span>
          </div>
          <nav class="sidebar-nav">
            <div class="nav-section">
              <div class="nav-section-title">Principal</div>
              <div class="nav-item active" data-view="dashboard">
                <span class="nav-icon"><i data-lucide="layout-dashboard" style="width: 18px; height: 18px;"></i></span>
                <span class="nav-label">Dashboard</span>
              </div>
              <div class="nav-item" data-view="quotation-new">
                <span class="nav-icon"><i data-lucide="file-plus" style="width: 18px; height: 18px;"></i></span>
                <span class="nav-label">Nueva Cotización</span>
              </div>
              <div class="nav-item" data-view="quotations">
                <span class="nav-icon"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i></span>
                <span class="nav-label">Cotizaciones</span>
              </div>
            </div>
            <div class="nav-section">
              <div class="nav-section-title">Gestión</div>
              <div class="nav-item" data-view="clients">
                <span class="nav-icon"><i data-lucide="users" style="width: 18px; height: 18px;"></i></span>
                <span class="nav-label">Clientes</span>
              </div>
              <div class="nav-item" data-view="calculator">
                <span class="nav-icon"><i data-lucide="calculator" style="width: 18px; height: 18px;"></i></span>
                <span class="nav-label">Calculadora</span>
              </div>
            </div>
            <div class="nav-section">
              <div class="nav-section-title">Sistema</div>
              <div class="nav-item" data-view="settings">
                <span class="nav-icon"><i data-lucide="settings" style="width: 18px; height: 18px;"></i></span>
                <span class="nav-label">Configuración</span>
              </div>
              ${user.role === 'admin' ? `
              <div class="nav-item" data-view="admin">
                <span class="nav-icon"><i data-lucide="shield" style="width: 18px; height: 18px;"></i></span>
                <span class="nav-label">Administración</span>
              </div>` : ''}
            </div>
          </nav>
          
          <!-- Logged in User Section -->
          <div class="sidebar-user" style="padding: 14px; border-top: 1px solid var(--border-default); display: flex; flex-direction: column; gap: 10px; background: var(--bg-primary);">
            <div class="user-info" style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
              <span class="user-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; color: white;">
                ${user.name.charAt(0).toUpperCase()}
              </span>
              <div class="user-details" style="display: flex; flex-direction: column; overflow: hidden;">
                <span class="user-name" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                  ${Utils.escHtml(user.name)}
                </span>
                <span class="user-role" style="font-size: 0.72rem; color: var(--text-muted); text-transform: capitalize;">
                  ${Utils.escHtml(user.role)}
                </span>
              </div>
            </div>
            <button class="btn btn-sm btn-secondary w-full" id="logout-btn" style="padding: 6px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <i data-lucide="log-out" style="width: 14px; height: 14px;"></i>
              <span class="logout-text">Cerrar Sesión</span>
            </button>
          </div>
 
          <div class="sidebar-footer">
            <button class="sidebar-toggle" id="sidebar-toggle">
              <i data-lucide="chevrons-left" style="width: 18px; height: 18px;"></i>
            </button>
          </div>
        </aside>
        <main class="main-content" id="main-content"></main>
      </div>
      <div class="toast-container" id="toast-container"></div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
 
  function bindNavigation() {
    document.getElementById('sidebar').addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (item) {
        const view = item.dataset.view;
        window.location.hash = view;
      }
    });
 
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('collapsed');
      
      const toggleBtn = document.getElementById('sidebar-toggle');
      if (sidebar.classList.contains('collapsed')) {
        toggleBtn.innerHTML = '<i data-lucide="chevrons-right" style="width:18px;height:18px"></i>';
      } else {
        toggleBtn.innerHTML = '<i data-lucide="chevrons-left" style="width:18px;height:18px"></i>';
      }
      
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });
 
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.logout();
      });
    }
  }
 
  function handleRoute() {
    let hash = window.location.hash.slice(1) || 'dashboard';
    let [view, ...params] = hash.split('/');

    // Role-based route guard for admin panel
    const user = Auth.getCurrentUser();
    if (view === 'admin' && (!user || user.role !== 'admin')) {
      window.location.hash = 'dashboard';
      return;
    }

    currentView = view;
 
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });
 
    const main = document.getElementById('main-content');
    main.scrollTop = 0;
 
    switch (view) {
      case 'dashboard': renderDashboard(); break;
      case 'quotation-new': renderNewQuotation(); break;
      case 'quotations': renderQuotationsList(); break;
      case 'quotation-detail': renderQuotationDetail(params[0]); break;
      case 'clients': renderClientsList(); break;
      case 'client-new': renderNewClientStandalone(main); break;
      case 'client-detail': renderClientDetail(params[0]); break;
      case 'calculator': Calculator.renderPage(); break;
      case 'settings': renderSettings(); break;
      case 'admin': renderAdminPanel(); break;
      default: renderDashboard();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ── Dashboard ──
  function renderDashboard() {
    const clients = Storage.clients.getAll();
    const quotations = Storage.quotations.getAll();
    const config = Storage.config.get();

    document.getElementById('main-content').innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <div>
            <h1><i data-lucide="layout-dashboard" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;"></i> Dashboard</h1>
            <p class="subtitle">Bienvenido al sistema de cotización InfiniGuard</p>
          </div>
          <button class="btn btn-primary btn-lg" onclick="location.hash='quotation-new'">
            <i data-lucide="plus" style="width:16px;height:16px"></i> Nueva Cotización
          </button>
        </div>

        <div class="stats-grid">
          <div class="stat-card" onclick="location.hash='quotations'">
            <div class="stat-icon" style="color: var(--accent-primary);"><i data-lucide="file-text" style="width: 28px; height: 28px;"></i></div>
            <div class="stat-value">${quotations.length}</div>
            <div class="stat-label">Cotizaciones</div>
          </div>
          <div class="stat-card" onclick="location.hash='clients'">
            <div class="stat-icon" style="color: var(--success);"><i data-lucide="users" style="width: 28px; height: 28px;"></i></div>
            <div class="stat-value">${clients.length}</div>
            <div class="stat-label">Clientes</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--warning);"><i data-lucide="dollar-sign" style="width: 28px; height: 28px;"></i></div>
            <div class="stat-value">$${Utils.formatCurrency(config.gallonCost)}</div>
            <div class="stat-label">Costo por Galón</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--info);"><i data-lucide="bar-chart-2" style="width: 28px; height: 28px;"></i></div>
            <div class="stat-value">$${Utils.formatCurrency(quotations.reduce((sum, q) => sum + (q.total || 0), 0))}</div>
            <div class="stat-label">Total Cotizado</div>
          </div>
        </div>

        <div class="quick-actions mb-4">
          <div class="quick-action" onclick="location.hash='quotation-new'">
            <span class="qa-icon" style="color: var(--accent-primary);"><i data-lucide="file-text" style="width: 28px; height: 28px; margin: 0 auto 8px;"></i></span>
            <h3>Nueva Cotización</h3>
            <p>Crear cotización rápida</p>
          </div>
          <div class="quick-action" onclick="location.hash='clients'">
            <span class="qa-icon" style="color: var(--success);"><i data-lucide="user" style="width: 28px; height: 28px; margin: 0 auto 8px;"></i></span>
            <h3>Gestionar Clientes</h3>
            <p>Ver y editar clientes</p>
          </div>
          <div class="quick-action" onclick="location.hash='calculator'">
            <span class="qa-icon" style="color: var(--warning);"><i data-lucide="calculator" style="width: 28px; height: 28px; margin: 0 auto 8px;"></i></span>
            <h3>Calculadora</h3>
            <p>Calcular serpentines</p>
          </div>
          <div class="quick-action" onclick="location.hash='settings'">
            <span class="qa-icon" style="color: var(--info);"><i data-lucide="settings" style="width: 28px; height: 28px; margin: 0 auto 8px;"></i></span>
            <h3>Configuración</h3>
            <p>Ajustes del sistema</p>
          </div>
        </div>

        ${quotations.length > 0 ? `
          <div class="card">
            <div class="card-header">
              <h2><i data-lucide="file-text" class="icon-inline" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px;"></i> Cotizaciones Recientes</h2>
              <button class="btn btn-ghost" onclick="location.hash='quotations'">Ver todas →</button>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${quotations.slice(0, 5).map(q => {
                    const client = Storage.clients.getById(q.clientId);
                    return `<tr>
                      <td><span class="badge badge-primary">${q.folio}</span></td>
                      <td>${Utils.formatDateShort(q.date)}</td>
                      <td>${Utils.escHtml(client?.company || 'N/A')}</td>
                      <td class="font-bold">$${Utils.formatCurrency(q.total)} ${q.currency || 'USD'}</td>
                      <td>
                        <div class="flex gap-2">
                          <button class="btn btn-sm btn-ghost" onclick="location.hash='quotation-detail/${q.id}'" title="Ver"><i data-lucide="eye" style="width:16px;height:16px"></i></button>
                          <button class="btn btn-sm btn-ghost" onclick="App.downloadPDF('${q.id}')" title="PDF"><i data-lucide="download" style="width:16px;height:16px"></i></button>
                        </div>
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <div class="card">
            <div class="empty-state">
              <div class="empty-icon">📄</div>
              <h3>Sin cotizaciones aún</h3>
              <p>Crea tu primera cotización para comenzar</p>
              <button class="btn btn-primary" onclick="location.hash='quotation-new'">➕ Nueva Cotización</button>
            </div>
          </div>
        `}
      </div>
    `;
  }

  // ── Clients List ──
  function renderClientsList() {
    const clients = Storage.clients.getAll();

    document.getElementById('main-content').innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <div>
            <h1><i data-lucide="users" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;"></i> Clientes</h1>
            <p class="subtitle">${clients.length} clientes registrados</p>
          </div>
          <button class="btn btn-primary" onclick="App.showNewClientModal()"><i data-lucide="plus" style="width:16px;height:16px;margin-right:6px;"></i> Nuevo Cliente</button>
        </div>

        ${clients.length > 0 ? `
          <div class="card">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Contacto</th>
                    <th>Tipo</th>
                    <th>Factor</th>
                    <th>Productos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${clients.map(c => {
                    const ct = Utils.CLIENT_TYPES[c.clientType] || {};
                    const productCount = Storage.priceLists.get(c.id).length;
                    return `<tr>
                      <td class="font-semibold">${Utils.escHtml(c.company)}</td>
                      <td>${Utils.escHtml(c.name)}</td>
                      <td><span class="client-type-badge client-type-${c.clientType}">${ct.label || c.clientType}</span></td>
                      <td class="text-accent font-bold">${c.factor}</td>
                      <td>${productCount > 0 ? `<span class="badge badge-success">${productCount} productos</span>` : '<span class="text-muted">Sin productos</span>'}</td>
                      <td>
                        <div class="flex gap-2">
                          <button class="btn btn-sm btn-ghost" onclick="location.hash='client-detail/${c.id}'" title="Ver"><i data-lucide="eye" style="width:16px;height:16px"></i></button>
                          <button class="btn btn-sm btn-ghost" onclick="App.deleteClient('${c.id}')" title="Eliminar"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
                        </div>
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <div class="card">
            <div class="empty-state">
              <div class="empty-icon" style="color: var(--text-muted);"><i data-lucide="users" style="width: 48px; height: 48px;"></i></div>
              <h3>Sin clientes registrados</h3>
              <p>Agrega tu primer cliente para comenzar a cotizar</p>
              <button class="btn btn-primary" onclick="App.showNewClientModal()"><i data-lucide="plus" style="width:16px;height:16px;margin-right:6px;"></i> Nuevo Cliente</button>
            </div>
          </div>
        `}
      </div>
    `;
  }

  // ── Client Detail ──
  function renderClientDetail(clientId) {
    const client = Storage.clients.getById(clientId);
    if (!client) { renderClientsList(); return; }

    const products = Storage.priceLists.get(clientId);
    const quotations = Storage.quotations.getByClient(clientId);
    const ct = Utils.CLIENT_TYPES[client.clientType] || {};
    const existingTypes = Storage.priceLists.getTypes(clientId);

    document.getElementById('main-content').innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <div>
            <h1>
              <button class="btn btn-ghost" style="padding: 4px 8px; margin-right: 8px;" onclick="location.hash='clients'"><i data-lucide="arrow-left" style="width:18px;height:18px;"></i></button>
              <i data-lucide="building" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--accent-primary);"></i> ${Utils.escHtml(client.company)}
            </h1>
            <p class="subtitle">${Utils.escHtml(client.name)} · <span class="client-type-badge client-type-${client.clientType}">${ct.label}</span> · Factor ${client.factor}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-secondary" onclick="App.showEditClientModal('${clientId}')"><i data-lucide="edit" style="width:16px;height:16px;margin-right:6px;"></i> Editar Cliente</button>
            <button class="btn btn-secondary" onclick="App.importExcelForClient('${clientId}')"><i data-lucide="file-spreadsheet" style="width:16px;height:16px;margin-right:6px;"></i> Importar Excel</button>
            <button class="btn btn-primary" onclick="App.startQuotationForClient('${clientId}')"><i data-lucide="file-plus" style="width:16px;height:16px;margin-right:6px;"></i> Nueva Cotización</button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--accent-primary);"><i data-lucide="package" style="width: 28px; height: 28px;"></i></div>
            <div class="stat-value">${products.length}</div>
            <div class="stat-label">Productos</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--success);"><i data-lucide="file-text" style="width: 28px; height: 28px;"></i></div>
            <div class="stat-value">${quotations.length}</div>
            <div class="stat-label">Cotizaciones</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="color: var(--warning);"><i data-lucide="bar-chart-2" style="width: 28px; height: 28px;"></i></div>
            <div class="stat-value">${existingTypes.length}</div>
            <div class="stat-label">Tipos de Equipo</div>
          </div>
        </div>

        <!-- Products -->
        <div class="card mb-4">
          <div class="card-header">
            <h2><i data-lucide="package" class="icon-inline" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px;"></i> Lista de Precios</h2>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-secondary" onclick="App.importExcelForClient('${clientId}')"><i data-lucide="file-spreadsheet" style="width:14px;height:14px;margin-right:4px;"></i> Importar Excel</button>
              <button class="btn btn-sm btn-primary" onclick="App.showAddProductModal('${clientId}')"><i data-lucide="plus" style="width:14px;height:14px;margin-right:4px;"></i> Agregar Producto</button>
            </div>
          </div>
          
          <div style="padding: 16px 20px 0;">
            <div class="form-row" style="margin-bottom: 0; gap: 16px; align-items: center;">
              <div class="form-group" style="max-width: 280px; margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px;">Filtrar por Tipo</label>
                <select class="form-select" id="price-list-filter-type" style="padding: 8px 12px; font-size: 0.9rem;">
                  <option value="">Todos los tipos</option>
                  ${existingTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="max-width: 320px; margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px;">Buscar Modelo</label>
                <div style="position: relative;">
                  <input type="text" class="form-input" id="price-list-search-model" placeholder="Escribe modelo..." style="padding: 8px 12px 8px 36px; font-size: 0.9rem;">
                  <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--text-muted);"></i>
                </div>
              </div>
            </div>
          </div>

          <div id="price-list-table-container"></div>
        </div>

        <!-- Client Quotations -->
        ${quotations.length > 0 ? `
          <div class="card">
            <div class="card-header">
              <h2><i data-lucide="file-text" class="icon-inline" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px; color: var(--accent-primary);"></i> Cotizaciones del Cliente</h2>
            </div>
            <div class="table-container">
              <table>
                <thead><tr><th>Folio</th><th>Fecha</th><th>Total</th><th>Acciones</th></tr></thead>
                <tbody>
                  ${quotations.map(q => `
                    <tr>
                      <td><span class="badge badge-primary">${q.folio}</span></td>
                      <td>${Utils.formatDateShort(q.date)}</td>
                      <td class="font-bold">$${Utils.formatCurrency(q.total)} ${q.currency || 'USD'}</td>
                      <td>
                        <div class="flex gap-2">
                          <button class="btn btn-sm btn-ghost" onclick="location.hash='quotation-detail/${q.id}'"><i data-lucide="eye" style="width:16px;height:16px"></i></button>
                          <button class="btn btn-sm btn-ghost" onclick="App.downloadPDF('${q.id}')"><i data-lucide="download" style="width:16px;height:16px"></i></button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    function filterAndRenderProductTable(typeFilter = '', modelSearch = '') {
      const selectedType = typeFilter.toUpperCase().trim();
      const modelQuery = modelSearch.toLowerCase().trim();

      const filtered = products.filter(p => {
        const matchesType = !selectedType || p.type.toUpperCase() === selectedType;
        const matchesModel = !modelQuery || p.model.toLowerCase().includes(modelQuery);
        return matchesType && matchesModel;
      });

      const tableContainer = document.getElementById('price-list-table-container');
      if (!tableContainer) return;

      if (filtered.length > 0) {
        tableContainer.innerHTML = `
          <div class="table-container" style="max-height:400px; overflow-y:auto; margin-top: 12px;">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Modelo</th>
                  <th>Serpentín</th>
                  <th>Serpentín + Gabinete</th>
                  <th>Rec. Completo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(p => {
                  const isEvap = p.type.toUpperCase().includes('EVAPORADOR') || p.type.toUpperCase().includes('MANEJADORA');
                  return `
                    <tr>
                      <td><span class="badge badge-primary">${Utils.escHtml(p.type)}</span></td>
                      <td class="font-semibold">${Utils.escHtml(p.model)}</td>
                      <td>
                        ${p.offers.serpentin ? `
                          <span style="font-weight: 500;">$${Utils.formatCurrency(p.offers.serpentin)}</span>
                          <span style="display: block; font-size: 0.72rem; color: var(--text-muted); font-weight: normal; margin-top: 1px;">Serp. ${isEvap ? 'Evaporador' : 'Condensador'}</span>
                        ` : '-'}
                      </td>
                      <td>
                        ${p.offers.serpentin_gabinete ? `
                          <span style="font-weight: 500;">$${Utils.formatCurrency(p.offers.serpentin_gabinete)}</span>
                          <span style="display: block; font-size: 0.72rem; color: var(--text-muted); font-weight: normal; margin-top: 1px;">Serp. ${isEvap ? 'Evaporador' : 'Condensador'} + Gab.</span>
                        ` : '-'}
                      </td>
                      <td>
                        ${p.offers.recubrimiento_completo ? `
                          <span style="font-weight: 500;">$${Utils.formatCurrency(p.offers.recubrimiento_completo)}</span>
                          <span style="display: block; font-size: 0.72rem; color: var(--text-muted); font-weight: normal; margin-top: 1px;">Recub. Completo</span>
                        ` : '-'}
                      </td>
                      <td>
                        <div class="flex gap-2">
                          <button class="btn btn-sm btn-ghost" onclick="App.showEditProductModal('${clientId}','${p.id}')" title="Editar"><i data-lucide="edit" style="width:16px;height:16px;color:var(--accent-primary)"></i></button>
                          <button class="btn btn-sm btn-ghost" onclick="App.removeProduct('${clientId}','${p.id}')" title="Eliminar"><i data-lucide="trash-2" style="width:16px;height:16px;color:var(--error)"></i></button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        tableContainer.innerHTML = `
          <div class="empty-state" style="padding: 40px 20px;">
            <div class="empty-icon" style="color: var(--text-muted);"><i data-lucide="search" style="width: 40px; height: 40px;"></i></div>
            <h3>Sin coincidencias</h3>
            <p>No se encontraron productos con los filtros seleccionados</p>
          </div>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    }

    setTimeout(() => {
      const typeSelect = document.getElementById('price-list-filter-type');
      const modelInput = document.getElementById('price-list-search-model');

      const triggerFilter = () => {
        filterAndRenderProductTable(typeSelect.value, modelInput.value);
      };

      if (typeSelect) typeSelect.addEventListener('change', triggerFilter);
      if (modelInput) modelInput.addEventListener('input', triggerFilter);

      filterAndRenderProductTable();
    }, 10);
  }

  // ── Quotations List ──
  function renderQuotationsList() {
    const quotations = Storage.quotations.getAll();
    const clients = Storage.clients.getAll();

    document.getElementById('main-content').innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <div>
            <h1><i data-lucide="file-text" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--accent-primary);"></i> Cotizaciones</h1>
            <p class="subtitle" id="q-list-subtitle">${quotations.length} cotizaciones en el sistema</p>
          </div>
          <button class="btn btn-primary" onclick="location.hash='quotation-new'"><i data-lucide="plus" style="width:16px;height:16px;margin-right:6px;"></i> Nueva Cotización</button>
        </div>

        <div class="card mb-4">
          <div class="form-row" style="align-items: flex-end;">
            <div class="form-group" style="flex: 2;">
              <label class="form-label">Filtrar por Cliente</label>
              <select class="form-select" id="filter-q-client">
                <option value="">-- Todos los Clientes --</option>
                ${clients.map(c => `<option value="${c.id}">${Utils.escHtml(c.company)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Buscar Folio / Cliente</label>
              <input type="text" class="form-input" id="filter-q-search" placeholder="Ej: 5886 o Hisense">
            </div>
          </div>
        </div>

        <div class="card" id="quotations-list-card">
          <div class="table-container" id="q-table-container">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Conceptos</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="quotations-tbody">
                <!-- Rows injected dynamically -->
              </tbody>
            </table>
          </div>
          <div id="q-empty-state" class="empty-state" style="display:none; padding:40px 20px;">
            <div class="empty-icon" style="color: var(--text-muted);"><i data-lucide="file-text" style="width: 48px; height: 48px;"></i></div>
            <h3>Sin resultados</h3>
            <p>No se encontraron cotizaciones con los filtros actuales</p>
          </div>
        </div>
      </div>
    `;

    function updateList() {
      const selectedClientId = document.getElementById('filter-q-client').value;
      const searchVal = document.getElementById('filter-q-search').value.trim().toLowerCase();

      const filtered = quotations.filter(q => {
        const client = Storage.clients.getById(q.clientId);
        const matchesClient = !selectedClientId || q.clientId === selectedClientId;
        const matchesSearch = !searchVal || 
          (q.folio && q.folio.toString().toLowerCase().includes(searchVal)) || 
          (client?.company && client.company.toLowerCase().includes(searchVal));
        return matchesClient && matchesSearch;
      });

      document.getElementById('q-list-subtitle').innerText = `${filtered.length} de ${quotations.length} cotizaciones`;

      const tbody = document.getElementById('quotations-tbody');
      const emptyState = document.getElementById('q-empty-state');
      const tableContainer = document.getElementById('q-table-container');

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
      } else {
        tableContainer.style.display = 'block';
        emptyState.style.display = 'none';
        tbody.innerHTML = filtered.map(q => {
          const client = Storage.clients.getById(q.clientId);
          return `<tr>
            <td><span class="badge badge-primary">${q.folio}</span></td>
            <td>${Utils.formatDateShort(q.date)}</td>
            <td>${Utils.escHtml(client?.company || 'N/A')}</td>
            <td>${q.items?.length || 0}</td>
            <td class="font-bold text-accent">$${Utils.formatCurrency(q.total)} ${q.currency || 'USD'}</td>
            <td>
              <div class="flex gap-2">
                <button class="btn btn-sm btn-ghost" onclick="location.hash='quotation-detail/${q.id}'" title="Ver"><i data-lucide="eye" style="width:16px;height:16px"></i></button>
                <button class="btn btn-sm btn-ghost" onclick="App.downloadPDF('${q.id}')" title="PDF"><i data-lucide="download" style="width:16px;height:16px"></i></button>
                <button class="btn btn-sm btn-ghost admin-del-btn" data-id="${q.id}" title="Eliminar"><i data-lucide="trash-2" style="width:16px;height:16px;color:var(--error)"></i></button>
              </div>
            </td>
          </tr>`;
        }).join('');

        tbody.querySelectorAll('.admin-del-btn').forEach(btn => {
          btn.onclick = () => {
            const qId = btn.dataset.id;
            App.deleteQuotation(qId);
          };
        });
      }

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }

    document.getElementById('filter-q-client').addEventListener('change', updateList);
    document.getElementById('filter-q-search').addEventListener('input', updateList);

    updateList();
  }

  // ── Quotation Detail ──
  function renderQuotationDetail(quotationId) {
    const q = Storage.quotations.getById(quotationId);
    if (!q) { renderQuotationsList(); return; }
    const client = Storage.clients.getById(q.clientId);

    document.getElementById('main-content').innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <div>
            <h1>
              <button class="btn btn-ghost" style="padding: 4px 8px; margin-right: 8px;" onclick="location.hash='quotations'"><i data-lucide="arrow-left" style="width:18px;height:18px;"></i></button>
              <i data-lucide="file-text" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--accent-primary);"></i> Cotización ${q.folio}
            </h1>
            <p class="subtitle">${Utils.escHtml(client?.company || '')} · ${Utils.formatDateShort(q.date)}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-secondary" onclick="App.previewPDF('${q.id}')"><i data-lucide="eye" style="width:16px;height:16px;margin-right:6px;"></i> Vista Previa</button>
            <button class="btn btn-primary" onclick="App.downloadPDF('${q.id}')"><i data-lucide="download" style="width:16px;height:16px;margin-right:6px;"></i> Descargar PDF</button>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">
            <h3>Información General</h3>
          </div>
          <div class="form-row">
            <div><strong>Folio:</strong> ${q.folio}</div>
            <div><strong>Fecha:</strong> ${Utils.formatDate(q.date)}</div>
            <div><strong>Cliente:</strong> ${Utils.escHtml(client?.company || 'N/A')}</div>
            <div><strong>Moneda:</strong> ${q.currency || 'USD'}</div>
          </div>
          <div class="form-row mt-3">
            <div><strong>Contacto:</strong> ${Utils.escHtml(q.contactName || '')}</div>
            <div><strong>En atención a:</strong> ${Utils.escHtml(q.attentionTo || '')}</div>
            <div><strong>Firmada por:</strong> ${Utils.escHtml(q.signedBy || '')}</div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">
            <h3>Productos Cotizados</h3>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cant.</th>
                  <th>Modelo</th>
                  <th>Descripción</th>
                  <th>Oferta</th>
                  <th>P. Unitario</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                ${(q.items || []).map(item => `
                  <tr>
                    <td>${item.quantity}</td>
                    <td class="font-semibold text-accent">${Utils.escHtml(item.model)}</td>
                    <td>${Utils.escHtml(item.description || '')}</td>
                    <td>${Utils.escHtml(item.offer || '')}</td>
                    <td class="text-right">$${Utils.formatCurrency(item.unitPrice)}</td>
                    <td class="text-right font-bold">$${Utils.formatCurrency(item.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="totals-box">
            <div class="totals-inner">
              <div class="totals-row">
                <span>Subtotal</span>
                <span>$${Utils.formatCurrency(q.subtotal)} ${q.currency || 'USD'}</span>
              </div>
              <div class="totals-row">
                <span>I.V.A. (${q.ivaRate || 16}%)</span>
                <span>$${Utils.formatCurrency(q.iva)} ${q.currency || 'USD'}</span>
              </div>
              <div class="totals-row total-final">
                <span>TOTAL</span>
                <span>$${Utils.formatCurrency(q.total)} ${q.currency || 'USD'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── New Quotation ──
  function renderNewQuotation(preselectedClientId) {
    const main = document.getElementById('main-content');

    // State for the quotation wizard
    const state = {
      step: 1,
      clientType: null, // 'existing' or 'new'
      clientId: preselectedClientId || null,
      client: preselectedClientId ? Storage.clients.getById(preselectedClientId) : null,
      items: [],
      observations: '',
      applyIva: true,
      currency: 'USD',
      contactName: '',
      attentionTo: '',
      signedBy: Storage.config.get().signedBy || '',
      exchangeRate: '',
      productSource: null // 'excel' or 'calculator'
    };

    if (preselectedClientId) {
      state.clientType = 'existing';
      state.step = 2;
    }

    function renderStep() {
      switch (state.step) {
        case 1: renderStep1(); break;
        case 2: renderStep2(); break;
        case 3: renderStep3(); break;
        case 4: renderStep4(); break;
      }
    }

    // Step 1: Choose client type
    function renderStep1() {
      main.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <div>
              <h1>
                <button class="btn btn-ghost" style="padding: 4px 8px; margin-right: 8px;" onclick="location.hash='quotations'"><i data-lucide="arrow-left" style="width:18px;height:18px;"></i></button>
                <i data-lucide="file-plus" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--accent-primary);"></i> Nueva Cotización
              </h1>
            </div>
          </div>
          ${renderStepper(1)}
          <div class="card">
            <div class="card-header"><h2>¿Tipo de cliente?</h2></div>
            <div class="selection-grid">
              <div class="selection-card" id="sel-existing">
                <div class="card-icon" style="color: var(--accent-primary);"><i data-lucide="user" style="width:36px;height:36px;"></i></div>
                <h3>Cliente Existente</h3>
                <p>Seleccionar un cliente con su lista de precios ya cargada</p>
              </div>
              <div class="selection-card" id="sel-new">
                <div class="card-icon" style="color: var(--success);"><i data-lucide="user-plus" style="width:36px;height:36px;"></i></div>
                <h3>Cliente Nuevo</h3>
                <p>Crear un nuevo cliente con sus datos y precios</p>
              </div>
            </div>
            <div class="flex justify-between mt-4">
              <button class="btn btn-secondary" onclick="location.hash='quotations'"><i data-lucide="x" style="width:14px;height:14px;margin-right:4px;"></i> Cancelar</button>
            </div>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      document.getElementById('sel-existing').onclick = () => {
        state.clientType = 'existing';
        state.step = 2;
        renderStep();
      };

      document.getElementById('sel-new').onclick = () => {
        state.clientType = 'new';
        renderNewClientForm();
      };
    }

    // New client form (inline)
    function renderNewClientForm() {
      main.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <h1><i data-lucide="user-plus" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--success);"></i> Nuevo Cliente</h1>
          </div>
          ${renderStepper(1)}
          <div class="card">
            <div class="card-header"><h2>Datos del Cliente</h2></div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Empresa *</label>
                <input type="text" class="form-input" id="nc-company" placeholder="Nombre de la empresa">
              </div>
              <div class="form-group">
                <label class="form-label">Contacto *</label>
                <input type="text" class="form-input" id="nc-name" placeholder="Nombre del contacto">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="text" class="form-input" id="nc-phone" placeholder="Teléfono">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="nc-email" placeholder="Email">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Tipo de Cliente *</label>
              <div class="selection-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))">
                ${Object.entries(Utils.CLIENT_TYPES).map(([key, ct]) => `
                  <div class="selection-card" data-client-type="${key}" style="padding:16px">
                    <h3 style="font-size:0.9rem">${ct.label}</h3>
                    <p style="font-size:0.85rem;color:var(--accent-primary);font-weight:700">Factor ${ct.factor}</p>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="flex justify-between mt-4">
              <button class="btn btn-secondary" id="nc-back-step1"><i data-lucide="arrow-left" style="width:14px;height:14px;margin-right:4px;"></i> Atrás</button>
              <div class="flex gap-2">
                <button class="btn btn-ghost" onclick="location.hash='quotations'"><i data-lucide="x" style="width:14px;height:14px;margin-right:4px;"></i> Cancelar</button>
                <button class="btn btn-primary btn-lg" id="nc-save" disabled>Crear Cliente y Continuar <i data-lucide="arrow-right" style="width:14px;height:14px;margin-left:4px;"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;

      let selectedType = null;

      document.getElementById('nc-back-step1').onclick = () => {
        renderStep1();
      };

      main.querySelectorAll('[data-client-type]').forEach(card => {
        card.addEventListener('click', () => {
          main.querySelectorAll('[data-client-type]').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedType = card.dataset.clientType;
          document.getElementById('nc-save').disabled = false;
        });
      });

      document.getElementById('nc-save').addEventListener('click', () => {
        const company = document.getElementById('nc-company').value.trim();
        const name = document.getElementById('nc-name').value.trim();
        if (!company || !name || !selectedType) {
          Utils.showToast('Completa los campos obligatorios', 'warning');
          return;
        }

        const newClient = {
          id: Utils.uuid(),
          company,
          name,
          phone: document.getElementById('nc-phone').value.trim(),
          email: document.getElementById('nc-email').value.trim(),
          clientType: selectedType,
          factor: Utils.CLIENT_TYPES[selectedType].factor,
          createdAt: new Date().toISOString()
        };

        Storage.clients.add(newClient);
        state.clientId = newClient.id;
        state.client = newClient;
        state.clientType = 'new';
        Utils.showToast(`Cliente "${company}" creado`, 'success');

        // Show product source options
        renderProductSourceChoice();
      });
    }

    // Product source choice for new client
    function renderProductSourceChoice() {
      main.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <h1><i data-lucide="package" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--accent-primary);"></i> Agregar Productos</h1>
            <p class="subtitle">Cliente: ${Utils.escHtml(state.client.company)}</p>
          </div>
          ${renderStepper(1)}
          <div class="card">
            <div class="card-header"><h2>¿Cómo deseas agregar productos?</h2></div>
            <div class="selection-grid">
              <div class="selection-card" id="src-excel">
                <div class="card-icon" style="color: var(--accent-primary);"><i data-lucide="file-spreadsheet" style="width:36px;height:36px;"></i></div>
                <h3>Subir Excel</h3>
                <p>Importar archivo Excel con modelos y precios</p>
              </div>
              <div class="selection-card" id="src-calculator">
                <div class="card-icon" style="color: var(--warning);"><i data-lucide="calculator" style="width:36px;height:36px;"></i></div>
                <h3>Calculadora</h3>
                <p>Calcular precios de serpentines manualmente</p>
              </div>
            </div>
            <div class="flex justify-between mt-4">
              <button class="btn btn-secondary" id="src-back"><i data-lucide="arrow-left" style="width:14px;height:14px;margin-right:4px;"></i> Atrás</button>
              <button class="btn btn-ghost" onclick="location.hash='quotations'"><i data-lucide="x" style="width:14px;height:14px;margin-right:4px;"></i> Cancelar</button>
            </div>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      document.getElementById('src-back').onclick = () => {
        renderNewClientForm();
      };

      document.getElementById('src-excel').onclick = () => {
        state.productSource = 'excel';
        renderExcelImport();
      };

      document.getElementById('src-calculator').onclick = () => {
        state.productSource = 'calculator';
        state.step = 2;
        renderStep();
      };
    }

    // Excel import view
    function renderExcelImport() {
      main.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <h1><i data-lucide="file-spreadsheet" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--accent-primary);"></i> Importar Excel</h1>
          </div>
          ${renderStepper(1)}
          <div class="card">
            <div class="file-upload-zone" id="excel-drop-zone">
              <div class="upload-icon" style="color: var(--text-muted);"><i data-lucide="upload-cloud" style="width:48px;height:48px;"></i></div>
              <h3>Arrastra tu archivo Excel aquí</h3>
              <p>o haz clic para seleccionar (.xlsx, .xls)</p>
              <input type="file" id="excel-file-input" accept=".xlsx,.xls" style="display:none">
            </div>
            <div id="excel-import-status" class="mt-4" style="display:none"></div>
            <div class="flex justify-between mt-4">
              <button class="btn btn-secondary" id="excel-back"><i data-lucide="arrow-left" style="width:14px;height:14px;margin-right:4px;"></i> Atrás</button>
              <div class="flex gap-2">
                <button class="btn btn-ghost" onclick="location.hash='quotations'"><i data-lucide="x" style="width:14px;height:14px;margin-right:4px;"></i> Cancelar</button>
                <button class="btn btn-primary btn-lg" id="excel-continue" style="display:none">Continuar a Cotización <i data-lucide="arrow-right" style="width:14px;height:14px;margin-left:4px;"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;

      const dropZone = document.getElementById('excel-drop-zone');
      const fileInput = document.getElementById('excel-file-input');

      document.getElementById('excel-back').onclick = () => {
        if (state.clientType === 'existing') {
          state.step = 2;
          renderStep();
        } else {
          renderProductSourceChoice();
        }
      };

      dropZone.onclick = () => fileInput.click();
      dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
      dropZone.ondragleave = () => dropZone.classList.remove('dragover');
      dropZone.ondrop = (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); };
      fileInput.onchange = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); };

      async function handleFile(file) {
        const statusEl = document.getElementById('excel-import-status');
        statusEl.style.display = 'block';
        statusEl.innerHTML = '<div class="flex items-center gap-3"><div class="spinner"></div><span>Procesando archivo...</span></div>';

        try {
          const result = await ExcelImporter.parseFile(file);
          
          // Save products to client price list
          Storage.priceLists.save(state.clientId, result.products);

          statusEl.innerHTML = `
            <div class="calc-result-box">
              <h3 class="mb-3">✅ Importación Exitosa</h3>
              <div class="calc-result-row">
                <span class="calc-result-label">Total de productos</span>
                <span class="calc-result-value">${result.summary.totalProducts}</span>
              </div>
              <div class="calc-result-row">
                <span class="calc-result-label">Con precios</span>
                <span class="calc-result-value">${result.summary.withPrices}</span>
              </div>
              <div class="calc-result-row">
                <span class="calc-result-label">Tipos de equipo</span>
                <span class="calc-result-value">${result.summary.types.join(', ')}</span>
              </div>
            </div>
          `;

          document.getElementById('excel-continue').style.display = 'inline-flex';
          document.getElementById('excel-continue').onclick = () => {
            state.step = 2;
            renderStep();
          };

          Utils.showToast(`${result.summary.totalProducts} productos importados`, 'success');
        } catch (err) {
          statusEl.innerHTML = `<div class="badge badge-error" style="padding:12px">❌ Error: ${err.message}</div>`;
          Utils.showToast('Error al importar el archivo', 'error');
        }
      }
    }

    // Step 2: Select products
    function renderStep2() {
      const isExisting = state.clientType === 'existing';
      const useCalculator = state.productSource === 'calculator';

      main.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <div>
              <h1><i data-lucide="file-plus" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--accent-primary);"></i> Nueva Cotización</h1>
              <p class="subtitle">${state.client ? Utils.escHtml(state.client.company) : 'Selecciona un cliente'}</p>
            </div>
          </div>
          ${renderStepper(2)}

          ${!state.clientId && isExisting ? `
            <div class="card mb-4">
              <div class="card-header"><h2>Seleccionar Cliente</h2></div>
              <div class="form-group">
                <select class="form-select" id="client-select" style="font-size:1rem;padding:14px">
                  <option value="">-- Selecciona un cliente --</option>
                  ${Storage.clients.getAll().map(c => `<option value="${c.id}">${Utils.escHtml(c.company)} - ${Utils.escHtml(c.name)}</option>`).join('')}
                </select>
              </div>
            </div>
          ` : ''}

          <div id="product-selection-area"></div>

          <!-- Current items -->
          <div class="card mt-4" id="items-card">
            <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;">
              <h2><i data-lucide="shopping-cart" class="icon-inline" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px; color: var(--accent-primary);"></i> Conceptos Agregados (${state.items.length})</h2>
              <button class="btn btn-secondary" id="toggle-calc-btn" style="font-size:0.85rem;padding:6px 14px;">
                <i data-lucide="calculator" style="width:14px;height:14px;margin-right:5px;"></i> Calcular Serpentín
              </button>
            </div>
            <div id="items-table-area"></div>
            <div class="flex justify-between mt-4">
              <button class="btn btn-secondary" onclick="state_step1()"><i data-lucide="arrow-left" style="width:14px;height:14px;margin-right:4px;"></i> Atrás</button>
              <div class="flex gap-2">
                <button class="btn btn-ghost" onclick="location.hash='quotations'"><i data-lucide="x" style="width:14px;height:14px;margin-right:4px;"></i> Cancelar</button>
                <button class="btn btn-primary btn-lg" id="go-step3" ${state.items.length === 0 ? 'disabled' : ''}>
                  Siguiente: Datos de Cotización <i data-lucide="arrow-right" style="width:14px;height:14px;margin-left:4px;"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Client selector for existing clients
      if (!state.clientId && isExisting) {
        document.getElementById('client-select').addEventListener('change', (e) => {
          state.clientId = e.target.value;
          state.client = Storage.clients.getById(e.target.value);
          if (state.client) renderProductSelector();
        });
      } else if (state.clientId) {
        renderProductSelector();
      }

      renderItemsTable();

      // Expose step navigation
      window.state_step1 = () => { state.step = 1; renderStep(); };

      document.getElementById('go-step3').onclick = () => {
        if (state.items.length === 0) {
          Utils.showToast('Agrega al menos un concepto', 'warning');
          return;
        }
        state.step = 3;
        renderStep();
      };

      // Toggle calculator button
      let calcMode = false;
      document.getElementById('toggle-calc-btn').onclick = () => {
        calcMode = !calcMode;
        const btn = document.getElementById('toggle-calc-btn');
        if (calcMode) {
          btn.innerHTML = '<i data-lucide="package" style="width:14px;height:14px;margin-right:5px;"></i> Ver Lista de Precios';
          if (window.lucide) window.lucide.createIcons();
          const area = document.getElementById('product-selection-area');
          area.innerHTML = '<div id="calc-container"></div>';
          Calculator.render('calc-container', {
            clientFactor: state.client ? state.client.factor : 1,
            clientType: state.client ? state.client.clientType : 'distribuidor',
            clientName: state.client ? state.client.company : '',
            onAdd: (product) => {
              state.items.push({
                id: Utils.uuid(),
                quantity: 1,
                model: product.model,
                description: product.description,
                offer: product.offer,
                unitPrice: product.unitPrice,
                amount: product.unitPrice,
                clave: product.model
              });

              if (product.saveToPricelist && state.clientId) {
                const offerKey = 'serpentin';
                const newProduct = {
                  id: Utils.uuid(),
                  type: product.productType || 'SERPENTIN',
                  model: product.model,
                  offers: {
                    [offerKey]: product.unitPrice
                  }
                };
                Storage.priceLists.add(state.clientId, newProduct);
                Utils.showToast('Guardado en la lista de precios del cliente', 'success');
              }

              renderItemsTable();
              document.getElementById('go-step3').disabled = false;
            }
          });
        } else {
          btn.innerHTML = '<i data-lucide="calculator" style="width:14px;height:14px;margin-right:5px;"></i> Calcular Serpentín';
          if (window.lucide) window.lucide.createIcons();
          renderProductSelector();
        }
      };

      function renderProductSelector() {
        const area = document.getElementById('product-selection-area');
        const products = Storage.priceLists.get(state.clientId);

        if (useCalculator && state.clientType === 'new') {
          // Show calculator
          area.innerHTML = '<div id="calc-container"></div>';
          Calculator.render('calc-container', {
            clientFactor: state.client.factor,
            clientType: state.client.clientType,
            clientName: state.client.company,
            onAdd: (product) => {
              state.items.push({
                id: Utils.uuid(),
                quantity: 1,
                model: product.model,
                description: product.description,
                offer: product.offer,
                unitPrice: product.unitPrice,
                amount: product.unitPrice,
                clave: product.model
              });

              if (product.saveToPricelist && state.clientId) {
                const offerKey = 'serpentin';
                const newProduct = {
                  id: Utils.uuid(),
                  type: product.productType || 'SERPENTIN',
                  model: product.model,
                  offers: {
                    [offerKey]: product.unitPrice
                  }
                };
                Storage.priceLists.add(state.clientId, newProduct);
                Utils.showToast('Guardado en la lista de precios del cliente', 'success');
              }

              renderItemsTable();
              document.getElementById('go-step3').disabled = false;
            }
          });
          return;
        }

        if (products.length === 0 && state.clientType === 'existing') {
          area.innerHTML = `
            <div class="card mb-4">
              <div class="empty-state" style="padding:30px">
                <div class="empty-icon" style="color: var(--text-muted);"><i data-lucide="package" style="width:48px;height:48px;"></i></div>
                <h3>Este cliente no tiene lista de precios</h3>
                <p>Importa un Excel con su lista de precios primero</p>
                <button class="btn btn-primary mt-3" id="import-for-existing"><i data-lucide="file-spreadsheet" style="width:16px;height:16px;margin-right:6px;"></i> Importar Excel</button>
              </div>
            </div>
          `;
          document.getElementById('import-for-existing').onclick = () => {
            renderExcelImport();
          };
          return;
        }

        area.innerHTML = `
          <div class="card mb-4">
            <div class="card-header flex justify-between items-center" style="flex-wrap: wrap; gap: 10px; padding: 12px 16px;">
              <h2 style="margin: 0;"><i data-lucide="plus" class="icon-inline" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px; color: var(--accent-primary);"></i> Agregar</h2>
              <div class="tab-pill-group flex gap-1 p-1" style="background: rgba(0,0,0,0.08); padding: 3px; border-radius: 8px;">
                <button class="btn btn-sm" id="btn-tab-catalog" style="padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; border: none; outline: none; cursor: pointer; transition: all 0.2s;">Catálogo</button>
                <button class="btn btn-sm" id="btn-tab-viaticos" style="padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; border: none; outline: none; cursor: pointer; transition: all 0.2s;">Viáticos</button>
                <button class="btn btn-sm" id="btn-tab-custom" style="padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; border: none; outline: none; cursor: pointer; transition: all 0.2s;">Concepto Libre</button>
              </div>
            </div>
            
            <!-- CATALOG FIELDS -->
            <div id="catalog-fields" style="padding: 16px;">
              <div class="form-row">
                <div class="form-group" style="flex: 1.2;">
                  <label class="form-label">Buscar Modelo o Tipo</label>
                  <input type="text" class="form-input" id="sel-model-filter" placeholder="Escribe el modelo o tipo (ej: AVC, VRF, Condensador)...">
                </div>
                <div class="form-group" style="flex: 1.8;">
                  <label class="form-label">Modelo</label>
                  <select class="form-select" id="sel-model">
                    <option value="">-- Seleccionar --</option>
                  </select>
                </div>
              </div>
              <div class="form-row mt-2">
                <div class="form-group" style="flex: 2;">
                  <label class="form-label">Oferta / Recubrimiento</label>
                  <select class="form-select" id="sel-offer" disabled>
                    <option value="">-- Primero selecciona modelo --</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Cantidad</label>
                  <input type="number" class="form-input" id="sel-qty" value="1" min="1" step="1">
                </div>
                <div class="form-group">
                  <label class="form-label">Precio Unitario</label>
                  <input type="text" class="form-input" id="sel-price" readonly style="opacity:0.7;font-weight:700;font-size:1.1rem">
                </div>
              </div>
              <div class="flex justify-end mt-3">
                <button class="btn btn-primary btn-lg" id="sel-add" disabled style="min-width: 180px;"><i data-lucide="plus" style="width:16px;height:16px;margin-right:6px;"></i> Agregar al Catálogo</button>
              </div>
            </div>

            <!-- VIATICOS FIELDS -->
            <div id="viaticos-fields" style="display: none; padding: 16px;">
              <div class="form-row">
                <div class="form-group" style="flex: 1;">
                  <label class="form-label">Precio de Viáticos (USD) *</label>
                  <input type="number" class="form-input" id="viat-price" placeholder="Ej: 600.00" min="0" step="0.01" style="font-weight:700;font-size:1.1rem">
                </div>
              </div>
              <div class="flex justify-end mt-3">
                <button class="btn btn-primary btn-lg" id="viat-add" style="min-width: 180px;"><i data-lucide="plus" style="width:16px;height:16px;margin-right:6px;"></i> Agregar Viáticos</button>
              </div>
            </div>

            <!-- CUSTOM FIELDS -->
            <div id="custom-fields" style="display: none; padding: 16px;">
              <div class="form-row">
                <div class="form-group" style="flex: 1.2;">
                  <label class="form-label">Clave / Modelo *</label>
                  <input type="text" class="form-input" id="cust-model" placeholder="Ej: SERV, INST-ESP">
                </div>
                <div class="form-group" style="flex: 1.8;">
                  <label class="form-label">Descripción del Concepto *</label>
                  <input type="text" class="form-input" id="cust-description" placeholder="Ej: Servicio adicional / Instalación especial">
                </div>
              </div>
              <div class="form-row mt-2">
                <div class="form-group" style="flex: 2;">
                  <label class="form-label">Precio Unitario (USD) *</label>
                  <input type="number" class="form-input" id="cust-price" placeholder="Ej: 500.00" min="0" step="0.01" style="font-weight:700;font-size:1.1rem">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label">Cantidad *</label>
                  <input type="number" class="form-input" id="cust-qty" value="1" min="1" step="1">
                </div>
              </div>
              <div class="flex justify-end mt-3">
                <button class="btn btn-primary btn-lg" id="cust-add" style="min-width: 180px;"><i data-lucide="plus" style="width:16px;height:16px;margin-right:6px;"></i> Agregar Concepto</button>
              </div>
            </div>
          </div>
        `;

        const modelSelect = document.getElementById('sel-model');
        const offerSelect = document.getElementById('sel-offer');
        const priceInput = document.getElementById('sel-price');
        const addBtn = document.getElementById('sel-add');
        const filterInput = document.getElementById('sel-model-filter');

        const tabCatalog = document.getElementById('btn-tab-catalog');
        const tabViaticos = document.getElementById('btn-tab-viaticos');
        const tabCustom = document.getElementById('btn-tab-custom');
        const catalogFields = document.getElementById('catalog-fields');
        const viaticosFields = document.getElementById('viaticos-fields');
        const customFields = document.getElementById('custom-fields');

        let activeTab = 'catalog';

        function updateTabStyles() {
          tabCatalog.style.background = 'transparent';
          tabCatalog.style.color = 'var(--text-secondary)';
          tabViaticos.style.background = 'transparent';
          tabViaticos.style.color = 'var(--text-secondary)';
          tabCustom.style.background = 'transparent';
          tabCustom.style.color = 'var(--text-secondary)';

          catalogFields.style.display = 'none';
          viaticosFields.style.display = 'none';
          customFields.style.display = 'none';

          if (activeTab === 'catalog') {
            tabCatalog.style.background = 'var(--accent-primary)';
            tabCatalog.style.color = 'white';
            catalogFields.style.display = 'block';
          } else if (activeTab === 'viaticos') {
            tabViaticos.style.background = 'var(--accent-primary)';
            tabViaticos.style.color = 'white';
            viaticosFields.style.display = 'block';
            document.getElementById('viat-price').focus();
          } else {
            tabCustom.style.background = 'var(--accent-primary)';
            tabCustom.style.color = 'white';
            customFields.style.display = 'block';
          }
          if (window.lucide) window.lucide.createIcons();
        }

        tabCatalog.onclick = (e) => {
          e.preventDefault();
          activeTab = 'catalog';
          updateTabStyles();
        };

        tabViaticos.onclick = (e) => {
          e.preventDefault();
          activeTab = 'viaticos';
          updateTabStyles();
        };

        tabCustom.onclick = (e) => {
          e.preventDefault();
          activeTab = 'custom';
          updateTabStyles();
        };

        // Initialize active tab style
        updateTabStyles();

        // Preset Viáticos click handler
        const viatAddBtn = document.getElementById('viat-add');
        viatAddBtn.onclick = () => {
          const vPrice = parseFloat(document.getElementById('viat-price').value) || 0;

          if (vPrice <= 0) {
            Utils.showToast('Por favor ingresa un precio mayor a 0', 'warning');
            return;
          }

          const item = {
            id: Utils.uuid(),
            quantity: 1,
            model: 'VIATICOS-APL-FOR',
            description: 'viaticos de aplicacion',
            offer: 'CONCEPTO LIBRE',
            unitPrice: vPrice,
            amount: Math.round(vPrice * 100) / 100,
            clave: 'VIATICOS-APL-FOR'
          };

          state.items.push(item);
          renderItemsTable();
          document.getElementById('go-step3').disabled = false;
          Utils.showToast('Viáticos agregados', 'success');

          // Reset field
          document.getElementById('viat-price').value = '';
        };

        let selectedProduct = null;

        function populateModels(filterText = '') {
          const query = filterText.toLowerCase().trim();
          const filtered = products.filter(p => 
            p.model.toLowerCase().includes(query) || 
            p.type.toLowerCase().includes(query)
          );

          if (filtered.length > 0) {
            modelSelect.innerHTML = `<option value="">-- Seleccionar modelo (${filtered.length}) --</option>` +
              filtered.map(p => `<option value="${p.id}">[${p.type}] ${p.model}</option>`).join('');
          } else {
            modelSelect.innerHTML = '<option value="">Sin coincidencias</option>';
          }

          selectedProduct = null;
          offerSelect.value = '';
          offerSelect.disabled = true;
          offerSelect.innerHTML = '<option value="">-- Primero selecciona modelo --</option>';
          priceInput.value = '';
          addBtn.disabled = true;
        }

        filterInput.oninput = (e) => {
          populateModels(e.target.value);
        };

        populateModels();

        modelSelect.onchange = () => {
          const productId = modelSelect.value;
          offerSelect.disabled = !productId;
          priceInput.value = '';
          addBtn.disabled = true;

          if (!productId) { 
            offerSelect.innerHTML = '<option value="">--</option>'; 
            return; 
          }

          selectedProduct = products.find(p => p.id === productId);
          if (!selectedProduct) return;

          const offers = selectedProduct.offers || {};
          const offerOptions = [];
          const isEvap = selectedProduct.type.toUpperCase().includes('EVAPORADOR') || selectedProduct.type.toUpperCase().includes('MANEJADORA');
          const serpLabel = isEvap ? 'Serpentín Evaporador' : 'Serpentín Condensador';
          const gabLabel = isEvap ? 'Serpentín Evaporador + Gabinete' : 'Serpentín Condensador + Gabinete';

          if (offers.serpentin) offerOptions.push({ key: 'serpentin', label: serpLabel, price: offers.serpentin });
          if (offers.serpentin_gabinete) offerOptions.push({ key: 'serpentin_gabinete', label: gabLabel, price: offers.serpentin_gabinete });
          if (offers.recubrimiento_completo) offerOptions.push({ key: 'recubrimiento_completo', label: 'Recubrimiento Completo', price: offers.recubrimiento_completo });

          if (offerOptions.length === 0) {
            offerSelect.innerHTML = '<option value="">Sin ofertas disponibles</option>';
            return;
          }

          offerSelect.innerHTML = `<option value="">-- Seleccionar oferta --</option>` +
            offerOptions.map(o => `<option value="${o.key}" data-price="${o.price}">${o.label} - $${Utils.formatCurrency(o.price)}</option>`).join('');
        };

        offerSelect.onchange = () => {
          const opt = offerSelect.selectedOptions[0];
          if (!opt || !opt.dataset.price) {
            priceInput.value = '';
            addBtn.disabled = true;
            return;
          }
          priceInput.value = '$' + Utils.formatCurrency(parseFloat(opt.dataset.price)) + ' USD';
          addBtn.disabled = false;
        };

        addBtn.onclick = () => {
          if (!selectedProduct) return;
          const opt = offerSelect.selectedOptions[0];
          const price = parseFloat(opt.dataset.price);
          const qty = parseInt(document.getElementById('sel-qty').value) || 1;
          const isEvap = selectedProduct.type.toUpperCase().includes('EVAPORADOR') || selectedProduct.type.toUpperCase().includes('MANEJADORA');
          const serpLabel = isEvap ? 'Serpentín Evaporador' : 'Serpentín Condensador';
          const gabLabel = isEvap ? 'Serpentín Evaporador + Gabinete' : 'Serpentín Condensador + Gabinete';

          let offerLabel = '';
          if (offerSelect.value === 'serpentin') {
            offerLabel = serpLabel;
          } else if (offerSelect.value === 'serpentin_gabinete') {
            offerLabel = gabLabel;
          } else {
            offerLabel = Utils.OFFER_TYPES[offerSelect.value]?.label || opt.textContent.split(' - ')[0];
          }

          const item = {
            id: Utils.uuid(),
            quantity: qty,
            model: selectedProduct.model,
            description: `APLICACION DE ANTICORROSIVO INFINIGUARD A UNIDAD MOD. ${selectedProduct.model} EN ${offerLabel.toUpperCase()}`,
            offer: offerLabel,
            unitPrice: price,
            amount: Math.round(qty * price * 100) / 100,
            clave: selectedProduct.model
          };

          state.items.push(item);
          renderItemsTable();
          document.getElementById('go-step3').disabled = false;
          Utils.showToast(`${selectedProduct.model} agregado`, 'success');

          // Reset selects
          filterInput.value = '';
          populateModels();
          document.getElementById('sel-qty').value = 1;
        };

        // CUSTOM CONCEPT ADDITION
        const custAddBtn = document.getElementById('cust-add');
        custAddBtn.onclick = () => {
          const cModel = document.getElementById('cust-model').value.trim();
          const cDesc = document.getElementById('cust-description').value.trim();
          const cQty = parseInt(document.getElementById('cust-qty').value) || 1;
          const cPrice = parseFloat(document.getElementById('cust-price').value) || 0;

          if (!cModel || !cDesc) {
            Utils.showToast('Completa la clave y la descripción', 'warning');
            return;
          }

          const item = {
            id: Utils.uuid(),
            quantity: cQty,
            model: cModel,
            description: cDesc,
            offer: 'CONCEPTO LIBRE',
            unitPrice: cPrice,
            amount: Math.round(cQty * cPrice * 100) / 100,
            clave: cModel
          };

          state.items.push(item);
          renderItemsTable();
          document.getElementById('go-step3').disabled = false;
          Utils.showToast('Concepto libre agregado', 'success');

          // Reset custom fields
          document.getElementById('cust-model').value = '';
          document.getElementById('cust-description').value = '';
          document.getElementById('cust-qty').value = 1;
          document.getElementById('cust-price').value = '';
        };
      }

      function renderItemsTable() {
        const area = document.getElementById('items-table-area');
        if (state.items.length === 0) {
          area.innerHTML = '<p class="text-muted text-center" style="padding:20px">Sin conceptos agregados</p>';
          return;
        }

        const subtotal = state.items.reduce((sum, i) => sum + i.amount, 0);

        area.innerHTML = `
          <div class="table-container">
            <table class="quotation-items-table">
              <thead>
                <tr>
                  <th>Cant.</th>
                  <th>Modelo</th>
                  <th>Oferta</th>
                  <th>P. Unitario</th>
                  <th>Importe</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${state.items.map((item, idx) => `
                  <tr>
                    <td>${item.quantity}</td>
                    <td class="font-semibold text-accent">${Utils.escHtml(item.model)}</td>
                    <td>${Utils.escHtml(item.offer)}</td>
                    <td class="text-right">$${Utils.formatCurrency(item.unitPrice)}</td>
                    <td class="text-right font-bold">$${Utils.formatCurrency(item.amount)}</td>
                    <td>
                      <button class="btn btn-sm btn-ghost text-error" onclick="App._removeItem(${idx})">✕</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="totals-box mt-3">
            <div class="totals-inner">
              <div class="totals-row total-final">
                <span>Subtotal</span>
                <span>$${Utils.formatCurrency(subtotal)} USD</span>
              </div>
            </div>
          </div>
        `;

        // Update header count
        const header = document.querySelector('#items-card .card-header h2');
        if (header) header.innerHTML = `<i data-lucide="shopping-cart" class="icon-inline" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px; color: var(--accent-primary);"></i> Conceptos Agregados (${state.items.length})`;

        const goBtn = document.getElementById('go-step3');
        if (goBtn) goBtn.disabled = state.items.length === 0;

        if (window.lucide) {
          window.lucide.createIcons();
        }
      }

      // Expose remove function
      App._removeItem = (idx) => {
        state.items.splice(idx, 1);
        renderItemsTable();
      };
    }

    // Step 3: Quotation details
    function renderStep3() {
      const config = Storage.config.get();
      const pastQuotations = Storage.quotations.getAll();
      const uniqueSignees = [...new Set([
        config.signedBy,
        ...pastQuotations.map(q => q.signedBy)
      ].map(s => s?.trim()).filter(Boolean))];

      main.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <h1><i data-lucide="file-text" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--accent-primary);"></i> Datos de la Cotización</h1>
          </div>
          ${renderStepper(3)}

          <div class="card">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Folio</label>
                <input type="text" class="form-input" id="q-folio" value="${Storage.folio.getCurrent() + 1}" placeholder="Número de folio">
              </div>
              <div class="form-group">
                <label class="form-label">Fecha</label>
                <input type="date" class="form-input" id="q-date" value="${Utils.today()}">
              </div>
              <div class="form-group">
                <label class="form-label">Moneda</label>
                <select class="form-select" id="q-currency">
                  <option value="USD" selected>USD (Dólares)</option>
                  <option value="MXN">MXN (Pesos)</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" style="flex: 1.5;">
                <label class="form-label">Contacto / AT'N</label>
                <input type="text" class="form-input" id="q-contact" value="${Utils.escHtml(state.client?.name || '')}" placeholder="Nombre del contacto">
              </div>
              <div class="form-group">
                <label class="form-label">Teléfono de Contacto</label>
                <input type="text" class="form-input" id="q-contact-phone" value="${Utils.escHtml(state.client?.phone || '')}" placeholder="Número de teléfono">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Firmada por</label>
              <input type="text" class="form-input" id="q-signed" value="${Utils.escHtml(config.signedBy || '')}" placeholder="Nombre del firmante" list="past-signees-list">
              <datalist id="past-signees-list">
                ${uniqueSignees.map(s => `<option value="${Utils.escHtml(s)}">`).join('')}
              </datalist>
            </div>
            <div class="form-group">
              <label class="form-label">Observaciones</label>
              <textarea class="form-textarea" id="q-observations" placeholder="Escribe las condiciones de la cotización...">${Utils.escHtml(state.observations || '')}</textarea>
            </div>

            <div class="flex justify-between mt-4">
              <button class="btn btn-secondary" id="back-step2"><i data-lucide="arrow-left" style="width:14px;height:14px;margin-right:4px;"></i> Atrás</button>
              <div class="flex gap-2">
                <button class="btn btn-ghost" onclick="location.hash='quotations'"><i data-lucide="x" style="width:14px;height:14px;margin-right:4px;"></i> Cancelar</button>
                <button class="btn btn-primary btn-lg" id="go-step4">Vista Previa <i data-lucide="arrow-right" style="width:14px;height:14px;margin-left:4px;"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById('back-step2').onclick = () => { state.step = 2; renderStep(); };
      document.getElementById('go-step4').onclick = () => {
        state.folio = document.getElementById('q-folio').value.trim();
        state.date = document.getElementById('q-date').value;
        state.currency = document.getElementById('q-currency').value;
        state.contactName = document.getElementById('q-contact').value.trim();
        state.contactPhone = document.getElementById('q-contact-phone').value.trim();
        state.attentionTo = state.contactName; 
        state.signedBy = document.getElementById('q-signed').value.trim();
        state.exchangeRate = null;
        state.applyIva = false;
        state.observations = document.getElementById('q-observations').value.trim();
        state.step = 4;
        renderStep();
      };
    }

    // Step 4: Preview & Save
    function renderStep4() {
      const subtotal = state.items.reduce((sum, i) => sum + i.amount, 0);
      const ivaRate = state.applyIva ? 16 : 0;
      const iva = Math.round(subtotal * ivaRate / 100 * 100) / 100;
      const total = Math.round((subtotal + iva) * 100) / 100;

      main.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <h1><i data-lucide="eye" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--accent-primary);"></i> Vista Previa</h1>
          </div>
          ${renderStepper(4)}

          <div class="card mb-4">
            <div class="flex justify-between items-center mb-4">
              <div>
                <h2 style="color:var(--accent-primary);font-size:1.3rem">${Storage.config.get().companyName}</h2>
                <p class="text-muted" style="font-size:0.85rem">${Storage.config.get().companyRfc} · ${Storage.config.get().companyAddress}</p>
              </div>
              <div class="text-right">
                <div style="font-size:1.5rem;color:var(--text-secondary)">Cotización</div>
                <div style="font-size:2rem;font-weight:800;color:var(--accent-primary)">${state.folio}</div>
                <div class="text-muted">${Utils.formatDate(state.date)}</div>
              </div>
            </div>

            <div style="background:var(--bg-input);padding:16px;border-radius:var(--radius-md);margin-bottom:20px">
              <div class="form-row">
                <div><strong>Cliente:</strong> ${Utils.escHtml(state.client?.company || '')}</div>
                <div><strong>Contacto:</strong> ${Utils.escHtml(state.contactName)}</div>
                <div><strong>Moneda:</strong> ${state.currency}</div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Cant.</th>
                    <th>Unid.</th>
                    <th>Clave</th>
                    <th>Descripción</th>
                    <th>P. Unitario</th>
                    <th>Importe</th>
                    <th>Mon</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.items.map(item => `
                    <tr>
                      <td>${parseFloat(item.quantity).toFixed(2)}</td>
                      <td>SERV</td>
                      <td class="text-accent font-semibold">${Utils.escHtml(item.clave || item.model)}</td>
                      <td>${Utils.escHtml(item.description)}</td>
                      <td class="text-right">${Utils.formatCurrency(item.unitPrice)}</td>
                      <td class="text-right font-bold">${Utils.formatCurrency(item.amount)}</td>
                      <td>${state.currency}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="totals-box">
              <div class="totals-inner">
                <div class="totals-row"><span>Subtotal</span><span>${Utils.formatCurrency(subtotal)} ${state.currency}</span></div>
                <div class="totals-row total-final"><span>TOTAL</span><span>${Utils.formatCurrency(total)} ${state.currency}</span></div>
              </div>
            </div>
            <p class="text-muted mt-2 text-right" style="font-style:italic;font-size:0.85rem">${Utils.numberToWords(total, state.currency)}</p>
          </div>

          <div class="flex justify-between">
            <button class="btn btn-secondary" id="back-step3"><i data-lucide="arrow-left" style="width:14px;height:14px;margin-right:4px;"></i> Atrás</button>
            <div class="flex gap-3">
              <button class="btn btn-ghost btn-lg" onclick="location.hash='quotations'"><i data-lucide="x" style="width:16px;height:16px;margin-right:6px;"></i> Cancelar</button>
              <button class="btn btn-secondary btn-lg" id="save-only"><i data-lucide="save" style="width:16px;height:16px;margin-right:6px;"></i> Guardar</button>
              <button class="btn btn-primary btn-lg" id="save-pdf"><i data-lucide="download" style="width:16px;height:16px;margin-right:6px;"></i> Guardar y Descargar PDF</button>
            </div>
          </div>
        </div>
      `;

      document.getElementById('back-step3').onclick = () => { state.step = 3; renderStep(); };

      function saveQuotation() {
        const quotation = {
          id: Utils.uuid(),
          folio: state.folio,
          date: state.date,
          clientId: state.clientId,
          contactName: state.contactName,
          contactPhone: state.contactPhone || '',
          attentionTo: state.attentionTo,
          signedBy: state.signedBy,
          exchangeRate: state.exchangeRate ? parseFloat(state.exchangeRate) : null,
          currency: state.currency,
          applyIva: false,
          ivaRate: 0,
          items: state.items,
          subtotal,
          iva: 0,
          total: subtotal,
          observations: state.observations,
          createdAt: new Date().toISOString()
        };

        Storage.quotations.add(quotation);
        Storage.folio.set(parseInt(state.folio) || Storage.folio.getCurrent());
        Utils.showToast(`Cotización ${state.folio} guardada`, 'success');
        return quotation;
      }

      document.getElementById('save-only').onclick = () => {
        saveQuotation();
        location.hash = 'quotations';
      };

      document.getElementById('save-pdf').onclick = () => {
        try {
          const q = saveQuotation();
          PDFGenerator.download(q, state.client);
          location.hash = 'quotations';
        } catch (err) {
          console.error("Error saving/downloading PDF in wizard:", err);
          alert("Error al descargar PDF: " + err.message + "\nStack: " + err.stack);
        }
      };
    }

    function renderStepper(active) {
      const steps = [
        { num: 1, label: 'Cliente' },
        { num: 2, label: 'Productos' },
        { num: 3, label: 'Datos' },
        { num: 4, label: 'Confirmar' }
      ];
      return `
        <div class="stepper">
          ${steps.map((s, i) => `
            <div class="stepper-step ${active === s.num ? 'active' : ''} ${active > s.num ? 'completed' : ''}">
              <div class="stepper-number">${active > s.num ? '✓' : s.num}</div>
              <span class="stepper-label">${s.label}</span>
            </div>
            ${i < steps.length - 1 ? `<div class="stepper-line ${active > s.num ? 'completed' : ''}"></div>` : ''}
          `).join('')}
        </div>
      `;
    }

    renderStep();
  }

  // ── Settings ──
  function renderSettings() {
    const config = Storage.config.get();

    document.getElementById('main-content').innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <h1><i data-lucide="settings" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--accent-primary);"></i> Configuración</h1>
        </div>

        <div class="card mb-4">
          <div class="card-header"><h2><i data-lucide="dollar-sign" class="icon-inline" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px; color: var(--warning);"></i> Costos y Cálculos</h2></div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Costo por Galón (USD)</label>
              <input type="number" class="form-input" id="cfg-gallon" value="${config.gallonCost}" step="1">
            </div>
              <label class="form-label">Tasa de IVA (%)</label>
              <input type="number" class="form-input" id="cfg-iva" value="${config.ivaRate}" step="1">
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header"><h2><i data-lucide="database" class="icon-inline" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px; color: var(--accent-primary);"></i> Base de Datos (Railway)</h2></div>
          <div class="form-group">
            <label class="form-label">URL del Servidor API de Railway</label>
            <input type="text" class="form-input" id="cfg-api-url" value="${localStorage.getItem('ig_api_url') || ''}" placeholder="Ej: https://cotizador-production.up.railway.app">
            <p class="form-hint" style="margin-top: 4px;">Si se deja vacío, la aplicación correrá en modo local independiente (localStorage). Al ingresar una URL, se sincronizarán y guardarán los datos en la base de datos en la nube.</p>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header"><h2><i data-lucide="building" class="icon-inline" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px; color: var(--accent-primary);"></i> Datos de la Empresa</h2></div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre de Empresa</label>
              <input type="text" class="form-input" id="cfg-company" value="${Utils.escHtml(config.companyName)}">
            </div>
            <div class="form-group">
              <label class="form-label">RFC</label>
              <input type="text" class="form-input" id="cfg-rfc" value="${Utils.escHtml(config.companyRfc)}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Dirección</label>
            <input type="text" class="form-input" id="cfg-address" value="${Utils.escHtml(config.companyAddress)}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Ciudad / CP</label>
              <input type="text" class="form-input" id="cfg-city" value="${Utils.escHtml(config.companyCity)}">
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input type="text" class="form-input" id="cfg-phone" value="${Utils.escHtml(config.companyPhone || '')}">
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header"><h2><i data-lucide="file-text" class="icon-inline" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px; color: var(--accent-primary);"></i> Cotizaciones</h2></div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Sucursal</label>
              <input type="text" class="form-input" id="cfg-sucursal" value="${Utils.escHtml(config.sucursal)}">
            </div>
            <div class="form-group">
              <label class="form-label">Almacén</label>
              <input type="text" class="form-input" id="cfg-almacen" value="${Utils.escHtml(config.almacen)}">
            </div>
            <div class="form-group">
              <label class="form-label">Firmado por (Default)</label>
              <input type="text" class="form-input" id="cfg-signed" value="${Utils.escHtml(config.signedBy || '')}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Folio Actual</label>
            <input type="number" class="form-input" id="cfg-folio" value="${Storage.folio.getCurrent()}" style="max-width:200px">
            <p class="form-hint">La siguiente cotización usará el número siguiente a este</p>
          </div>
        </div>

        <button class="btn btn-primary btn-lg" id="cfg-save"><i data-lucide="save" style="width:16px;height:16px;margin-right:6px;"></i> Guardar Configuración</button>
      </div>
    `;

    document.getElementById('cfg-save').addEventListener('click', () => {
      const apiUrl = document.getElementById('cfg-api-url').value.trim();
      const currentApiUrl = localStorage.getItem('ig_api_url') || '';
      
      Storage.config.save({
        gallonCost: parseFloat(document.getElementById('cfg-gallon').value) || 450,
        ivaRate: parseFloat(document.getElementById('cfg-iva').value) || 16,
        companyName: document.getElementById('cfg-company').value.trim(),
        companyRfc: document.getElementById('cfg-rfc').value.trim(),
        companyAddress: document.getElementById('cfg-address').value.trim(),
        companyCity: document.getElementById('cfg-city').value.trim(),
        companyPhone: document.getElementById('cfg-phone').value.trim(),
        sucursal: document.getElementById('cfg-sucursal').value.trim(),
        almacen: document.getElementById('cfg-almacen').value.trim(),
        signedBy: document.getElementById('cfg-signed').value.trim()
      });
      Storage.folio.set(parseInt(document.getElementById('cfg-folio').value) || 5885);

      if (apiUrl !== currentApiUrl) {
        if (apiUrl) {
          localStorage.setItem('ig_api_url', apiUrl);
          Utils.showToast('Conectando y sincronizando con base de datos...', 'info');
          Storage.syncWithBackend().then((success) => {
            if (success) {
              Utils.showToast('¡Base de datos conectada y sincronizada con éxito!', 'success');
              setTimeout(() => location.reload(), 1500);
            } else {
              Utils.showToast('Error: No se pudo establecer conexión con Railway', 'error');
              localStorage.setItem('ig_api_url', currentApiUrl); // revert
            }
          });
        } else {
          localStorage.removeItem('ig_api_url');
          Utils.showToast('Desconectado de base de datos. Modo local activo.', 'info');
          setTimeout(() => location.reload(), 1500);
        }
      } else {
        Utils.showToast('Configuración guardada', 'success');
      }
    });
  }

  // ── Public Methods ──
  function showNewClientModal() {
    location.hash = 'client-new';
  }

  function renderNewClientStandalone(main) {
    main.innerHTML = `
      <div class="fade-in">
        <div class="page-header">
          <div>
            <h1><button class="btn btn-ghost" onclick="location.hash='clients'">← </button><span class="icon">➕</span> Nuevo Cliente</h1>
          </div>
        </div>
        <div class="card">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Empresa *</label>
              <input type="text" class="form-input" id="nc-company" placeholder="Nombre de la empresa">
            </div>
            <div class="form-group">
              <label class="form-label">Contacto *</label>
              <input type="text" class="form-input" id="nc-name" placeholder="Nombre del contacto">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input type="text" class="form-input" id="nc-phone" placeholder="Teléfono">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="nc-email" placeholder="Email">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Cliente *</label>
            <div class="selection-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))">
              ${Object.entries(Utils.CLIENT_TYPES).map(([key, ct]) => `
                <div class="selection-card" data-client-type="${key}" style="padding:16px">
                  <h3 style="font-size:0.9rem">${ct.label}</h3>
                  <p style="font-size:0.85rem;color:var(--accent-light);font-weight:700">Factor ${ct.factor}</p>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="flex justify-between mt-4">
            <button class="btn btn-secondary" onclick="location.hash='clients'">← Cancelar</button>
            <button class="btn btn-primary btn-lg" id="nc-save" disabled>💾 Crear Cliente</button>
          </div>
        </div>
      </div>
    `;

    let selectedType = null;
    main.querySelectorAll('[data-client-type]').forEach(card => {
      card.addEventListener('click', () => {
        main.querySelectorAll('[data-client-type]').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedType = card.dataset.clientType;
        document.getElementById('nc-save').disabled = false;
      });
    });

    document.getElementById('nc-save').addEventListener('click', () => {
      const company = document.getElementById('nc-company').value.trim();
      const name = document.getElementById('nc-name').value.trim();
      if (!company || !name || !selectedType) {
        Utils.showToast('Completa los campos obligatorios', 'warning');
        return;
      }
      Storage.clients.add({
        id: Utils.uuid(),
        company, name,
        phone: document.getElementById('nc-phone').value.trim(),
        email: document.getElementById('nc-email').value.trim(),
        clientType: selectedType,
        factor: Utils.CLIENT_TYPES[selectedType].factor,
        createdAt: new Date().toISOString()
      });
      Utils.showToast(`Cliente "${company}" creado`, 'success');
      location.hash = 'clients';
    });
  }

  function showNewClientModal() {
    renderNewClientStandalone(document.getElementById('main-content'));
  }

  function deleteClient(id) {
    const ok = window.confirm('¿Estás seguro de eliminar este cliente y todos sus datos?');
    if (ok) {
      Storage.clients.remove(id);
      Utils.showToast('Cliente eliminado', 'success');
      renderClientsList();
    }
  }

  function deleteQuotation(id) {
    const ok = window.confirm('¿Estás seguro de eliminar esta cotización?');
    if (ok) {
      Storage.quotations.remove(id);
      Utils.showToast('Cotización eliminada', 'success');
      renderQuotationsList();
    }
  }

  function downloadPDF(quotationId) {
    try {
      const q = Storage.quotations.getById(quotationId);
      if (!q) { Utils.showToast('Cotización no encontrada', 'error'); return; }
      const client = Storage.clients.getById(q.clientId);
      PDFGenerator.download(q, client || { company: 'N/A', name: '' });
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Error al descargar PDF: " + err.message + "\nStack: " + err.stack);
    }
  }

  function previewPDF(quotationId) {
    try {
      const q = Storage.quotations.getById(quotationId);
      if (!q) { Utils.showToast('Cotización no encontrada', 'error'); return; }
      const client = Storage.clients.getById(q.clientId);
      PDFGenerator.preview(q, client || { company: 'N/A', name: '' });
    } catch (err) {
      console.error("Error previewing PDF:", err);
      alert("Error al previsualizar PDF: " + err.message + "\nStack: " + err.stack);
    }
  }

  function importExcelForClient(clientId) {
    const client = Storage.clients.getById(clientId);
    if (!client) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="min-width:520px">
        <div class="modal-header">
          <h2>📁 Importar Excel - ${Utils.escHtml(client.company)}</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="file-upload-zone" id="modal-drop-zone">
            <div class="upload-icon">📁</div>
            <h3>Arrastra tu archivo Excel aquí</h3>
            <p>o haz clic para seleccionar (.xlsx, .xls)</p>
            <input type="file" id="modal-file-input" accept=".xlsx,.xls" style="display:none">
          </div>
          <div id="modal-import-status" class="mt-3"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const dropZone = overlay.querySelector('#modal-drop-zone');
    const fileInput = overlay.querySelector('#modal-file-input');

    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
    dropZone.ondragleave = () => dropZone.classList.remove('dragover');
    dropZone.ondrop = (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); };
    fileInput.onchange = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); };

    async function handleFile(file) {
      const status = overlay.querySelector('#modal-import-status');
      status.innerHTML = '<div class="flex items-center gap-3"><div class="spinner"></div><span>Procesando...</span></div>';

      try {
        const result = await ExcelImporter.parseFile(file);
        Storage.priceLists.save(clientId, result.products);
        status.innerHTML = `<div class="badge badge-success" style="padding:12px;font-size:0.9rem">✅ ${result.summary.totalProducts} productos importados (${result.summary.withPrices} con precios)</div>`;
        Utils.showToast(`${result.summary.totalProducts} productos importados`, 'success');
        setTimeout(() => {
          overlay.remove();
          location.hash = `client-detail/${clientId}`;
          handleRoute();
        }, 1500);
      } catch (err) {
        status.innerHTML = `<div class="badge badge-error" style="padding:12px">❌ ${err.message}</div>`;
      }
    }
  }

  function startQuotationForClient(clientId) {
    location.hash = 'quotation-new';
    setTimeout(() => renderNewQuotation(clientId), 50);
  }

  function removeProduct(clientId, productId) {
    Storage.priceLists.remove(clientId, productId);
    renderClientDetail(clientId);
    Utils.showToast('Producto eliminado', 'success');
  }

  function showAddProductModal(clientId) {
    const client = Storage.clients.getById(clientId);
    if (!client) return;

    const existingTypes = Storage.priceLists.getTypes(clientId);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="min-width:480px">
        <div class="modal-header">
          <h2><i data-lucide="plus" class="icon-inline" style="width: 18px; height: 18px; color: var(--accent-primary);"></i> Agregar Producto</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group mb-3">
            <label class="form-label">Tipo de Equipo *</label>
            <input type="text" class="form-input" id="p-type" placeholder="Ej: CONDENSADORA, EVAPORADOR" list="existing-types-list">
            <datalist id="existing-types-list">
              ${existingTypes.map(t => `<option value="${Utils.escHtml(t)}">`).join('')}
            </datalist>
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Modelo *</label>
            <input type="text" class="form-input" id="p-model" placeholder="Ej: SLMB4125ET">
          </div>
          <div class="form-row mb-3">
            <div class="form-group">
              <label class="form-label">Precio Serpentín (USD)</label>
              <input type="number" class="form-input" id="p-price-serp" placeholder="Ej: 150.00" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Precio Serp. + Gabinete (USD)</label>
              <input type="number" class="form-input" id="p-price-gab" placeholder="Ej: 220.00" step="0.01" min="0">
            </div>
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Precio Recubrimiento Completo (USD)</label>
            <input type="number" class="form-input" id="p-price-comp" placeholder="Ej: 380.00" step="0.01" min="0">
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button class="btn btn-primary" id="p-save-btn">Guardar Producto</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    if (window.lucide) window.lucide.createIcons();

    overlay.querySelector('#p-save-btn').addEventListener('click', () => {
      const type = overlay.querySelector('#p-type').value.trim().toUpperCase();
      const model = overlay.querySelector('#p-model').value.trim();
      const serpVal = overlay.querySelector('#p-price-serp').value;
      const gabVal = overlay.querySelector('#p-price-gab').value;
      const compVal = overlay.querySelector('#p-price-comp').value;

      if (!type || !model) {
        Utils.showToast('Tipo y Modelo son requeridos', 'warning');
        return;
      }

      const offers = {};
      if (serpVal !== '') offers.serpentin = parseFloat(serpVal);
      if (gabVal !== '') offers.serpentin_gabinete = parseFloat(gabVal);
      if (compVal !== '') offers.recubrimiento_completo = parseFloat(compVal);

      const newProduct = {
        id: Utils.uuid(),
        type,
        model,
        offers
      };

      Storage.priceLists.add(clientId, newProduct);
      Utils.showToast('Producto agregado con éxito', 'success');
      overlay.remove();
      renderClientDetail(clientId);
    });
  }

  function showEditProductModal(clientId, productId) {
    const products = Storage.priceLists.get(clientId);
    const p = products.find(prod => prod.id === productId);
    if (!p) { Utils.showToast('Producto no encontrado', 'error'); return; }

    const existingTypes = Storage.priceLists.getTypes(clientId);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="min-width:480px">
        <div class="modal-header">
          <h2><i data-lucide="edit" class="icon-inline" style="width: 18px; height: 18px; color: var(--accent-primary);"></i> Editar Producto</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group mb-3">
            <label class="form-label">Tipo de Equipo *</label>
            <input type="text" class="form-input" id="p-type" value="${Utils.escHtml(p.type)}" placeholder="Ej: CONDENSADORA, EVAPORADOR" list="existing-types-list">
            <datalist id="existing-types-list">
              ${existingTypes.map(t => `<option value="${Utils.escHtml(t)}">`).join('')}
            </datalist>
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Modelo *</label>
            <input type="text" class="form-input" id="p-model" value="${Utils.escHtml(p.model)}" placeholder="Ej: SLMB4125ET">
          </div>
          <div class="form-row mb-3">
            <div class="form-group">
              <label class="form-label">Precio Serpentín (USD)</label>
              <input type="number" class="form-input" id="p-price-serp" value="${p.offers.serpentin !== undefined ? p.offers.serpentin : ''}" placeholder="Ej: 150.00" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Precio Serp. + Gabinete (USD)</label>
              <input type="number" class="form-input" id="p-price-gab" value="${p.offers.serpentin_gabinete !== undefined ? p.offers.serpentin_gabinete : ''}" placeholder="Ej: 220.00" step="0.01" min="0">
            </div>
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Precio Recubrimiento Completo (USD)</label>
            <input type="number" class="form-input" id="p-price-comp" value="${p.offers.recubrimiento_completo !== undefined ? p.offers.recubrimiento_completo : ''}" placeholder="Ej: 380.00" step="0.01" min="0">
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button class="btn btn-primary" id="p-save-btn">Guardar Cambios</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    if (window.lucide) window.lucide.createIcons();

    overlay.querySelector('#p-save-btn').addEventListener('click', () => {
      const type = overlay.querySelector('#p-type').value.trim().toUpperCase();
      const model = overlay.querySelector('#p-model').value.trim();
      const serpVal = overlay.querySelector('#p-price-serp').value;
      const gabVal = overlay.querySelector('#p-price-gab').value;
      const compVal = overlay.querySelector('#p-price-comp').value;

      if (!type || !model) {
        Utils.showToast('Tipo y Modelo son requeridos', 'warning');
        return;
      }

      const offers = {};
      if (serpVal !== '') offers.serpentin = parseFloat(serpVal);
      if (gabVal !== '') offers.serpentin_gabinete = parseFloat(gabVal);
      if (compVal !== '') offers.recubrimiento_completo = parseFloat(compVal);

      Storage.priceLists.update(clientId, productId, {
        type,
        model,
        offers
      });
      Utils.showToast('Producto actualizado con éxito', 'success');
      overlay.remove();
      renderClientDetail(clientId);
    });
  }

  function showEditClientModal(clientId) {
    const client = Storage.clients.getById(clientId);
    if (!client) { Utils.showToast('Cliente no encontrado', 'error'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="min-width:540px">
        <div class="modal-header">
          <h2><i data-lucide="edit" class="icon-inline" style="width:18px;height:18px;color:var(--accent-primary)"></i> Editar Cliente - ${Utils.escHtml(client.company)}</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row mb-3">
            <div class="form-group">
              <label class="form-label">Nombre Comercial (Empresa) *</label>
              <input type="text" class="form-input" id="edit-c-company" value="${Utils.escHtml(client.company)}">
            </div>
            <div class="form-group">
              <label class="form-label">Nombre de Contacto *</label>
              <input type="text" class="form-input" id="edit-c-name" value="${Utils.escHtml(client.name)}">
            </div>
          </div>
          <div class="form-row mb-3">
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input type="text" class="form-input" id="edit-c-phone" value="${Utils.escHtml(client.phone || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="edit-c-email" value="${Utils.escHtml(client.email || '')}">
            </div>
          </div>
          
          <div class="form-group mb-3">
            <label class="form-label">Tipo de Cliente (Factor Predeterminado)</label>
            <select class="form-select" id="edit-c-type">
              ${Object.entries(Utils.CLIENT_TYPES).map(([key, ct]) => `
                <option value="${key}" ${client.clientType === key ? 'selected' : ''}>
                  ${ct.label} (Factor default: ${ct.factor})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Factor de Multiplicación Personalizado</label>
            <input type="number" class="form-input" id="edit-c-factor" value="${client.factor}" step="0.1" min="1">
            <p class="form-hint" style="margin-top: 4px;">Este factor multiplica el costo de serpentín calculado para generar los precios de oferta.</p>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button class="btn btn-primary" id="edit-c-save-btn">Guardar Cambios</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    if (window.lucide) window.lucide.createIcons();

    // Auto-update factor input when client type changes
    const typeSelect = overlay.querySelector('#edit-c-type');
    const factorInput = overlay.querySelector('#edit-c-factor');
    typeSelect.addEventListener('change', () => {
      const selectedType = typeSelect.value;
      factorInput.value = Utils.CLIENT_TYPES[selectedType].factor;
    });

    overlay.querySelector('#edit-c-save-btn').addEventListener('click', () => {
      const company = overlay.querySelector('#edit-c-company').value.trim();
      const name = overlay.querySelector('#edit-c-name').value.trim();
      const phone = overlay.querySelector('#edit-c-phone').value.trim();
      const email = overlay.querySelector('#edit-c-email').value.trim();
      const clientType = typeSelect.value;
      const factor = parseFloat(factorInput.value) || Utils.CLIENT_TYPES[clientType].factor;

      if (!company || !name) {
        Utils.showToast('Empresa y Contacto son obligatorios', 'warning');
        return;
      }

      Storage.clients.update(clientId, {
        company,
        name,
        phone,
        email,
        clientType,
        factor
      });

      Utils.showToast('Cliente actualizado con éxito', 'success');
      overlay.remove();
      renderClientDetail(clientId);
    });
  }

  function renderAdminPanel() {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      document.getElementById('main-content').innerHTML = `<div class="card mt-4"><div class="empty-state"><h3>Acceso denegado</h3><p>Solo administradores pueden ver esta sección.</p></div></div>`;
      return;
    }

    function refresh() {
      const users = Auth.getUsers();
      const main = document.getElementById('main-content');
      main.innerHTML = `
        <div class="fade-in">
          <div class="page-header">
            <div>
              <h1><i data-lucide="shield" class="icon-inline" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;color:var(--accent-primary);"></i> Administración de Usuarios</h1>
              <p class="subtitle">Gestión de cuentas del sistema</p>
            </div>
            <button class="btn btn-primary" id="admin-new-user-btn">
              <i data-lucide="user-plus" style="width:16px;height:16px;margin-right:6px;"></i> Nuevo Usuario
            </button>
          </div>
          <div class="card">
            <div class="card-header"><h2><i data-lucide="users" style="width:16px;height:16px;margin-right:6px;color:var(--accent-primary);"></i> Usuarios Registrados</h2></div>
            <table class="data-table">
              <thead><tr>
                <th>Usuario</th><th>Nombre</th><th>Rol</th><th>Acciones</th>
              </tr></thead>
              <tbody>
                ${users.map((u, idx) => `
                  <tr>
                    <td><code>${Utils.escHtml(u.username)}</code></td>
                    <td>${Utils.escHtml(u.name)}</td>
                    <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">${u.role}</span></td>
                    <td style="display:flex;gap:6px;">
                      <button class="btn btn-sm btn-secondary admin-edit-btn" data-idx="${idx}" title="Editar">
                        <i data-lucide="edit" style="width:13px;height:13px;"></i>
                      </button>
                      <button class="btn btn-sm btn-secondary admin-pw-btn" data-idx="${idx}" title="Cambiar contraseña">
                        <i data-lucide="key" style="width:13px;height:13px;"></i>
                      </button>
                      ${u.username !== currentUser.username ? `
                      <button class="btn btn-sm btn-danger admin-del-btn" data-idx="${idx}" title="Eliminar">
                        <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
                      </button>` : '<span style="font-size:0.75rem;color:var(--text-muted);">(tú)</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      document.getElementById('admin-new-user-btn').onclick = () => showUserModal(null);

      main.querySelectorAll('.admin-edit-btn').forEach(btn => {
        btn.onclick = () => showUserModal(parseInt(btn.dataset.idx));
      });
      main.querySelectorAll('.admin-pw-btn').forEach(btn => {
        btn.onclick = () => showPasswordModal(parseInt(btn.dataset.idx));
      });
      main.querySelectorAll('.admin-del-btn').forEach(btn => {
        btn.onclick = () => {
          const users = Auth.getUsers();
          const u = users[parseInt(btn.dataset.idx)];
          if (confirm(`¿Eliminar usuario "${u.username}"?`)) {
            Auth.deleteUser(u.username);
            Utils.showToast('Usuario eliminado', 'success');
            refresh();
          }
        };
      });
    }

    function showUserModal(idx) {
      const users = Auth.getUsers();
      const editing = idx !== null ? users[idx] : null;
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';
      overlay.innerHTML = `
        <div class="modal" style="min-width:460px;">
          <div class="modal-header">
            <h2><i data-lucide="${editing ? 'edit' : 'user-plus'}" style="width:18px;height:18px;color:var(--accent-primary);margin-right:6px;"></i> ${editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group mb-3">
              <label class="form-label">Nombre Completo *</label>
              <input type="text" class="form-input" id="au-name" value="${editing ? Utils.escHtml(editing.name) : ''}" placeholder="Ej: Fernando Zamarripa">
            </div>
            <div class="form-group mb-3">
              <label class="form-label">Usuario (login) *</label>
              <input type="text" class="form-input" id="au-username" value="${editing ? Utils.escHtml(editing.username) : ''}" placeholder="Ej: fernando" ${editing ? 'readonly style="opacity:0.6;"' : ''}>
            </div>
            ${!editing ? `
            <div class="form-group mb-3">
              <label class="form-label">Contraseña *</label>
              <div class="input-pass-wrapper">
                <input type="password" class="form-input" id="au-pass" placeholder="Mínimo 6 caracteres">
                <button type="button" class="toggle-pass-btn" id="au-pass-toggle">
                  <i data-lucide="eye" style="width:16px;height:16px;"></i>
                </button>
              </div>
              <div class="pw-strength-wrapper">
                <div class="pw-strength-bar">
                  <div class="pw-strength-fill" id="au-pass-strength-fill"></div>
                </div>
                <span class="pw-strength-text" id="au-pass-strength-text"></span>
              </div>
            </div>
            <div class="form-group mb-3">
              <label class="form-label">Confirmar Contraseña *</label>
              <div class="input-pass-wrapper">
                <input type="password" class="form-input" id="au-pass2" placeholder="Repite la contraseña">
                <button type="button" class="toggle-pass-btn" id="au-pass2-toggle">
                  <i data-lucide="eye" style="width:16px;height:16px;"></i>
                </button>
              </div>
            </div>` : ''}
            <div class="form-group mb-3">
              <label class="form-label">Rol *</label>
              <select class="form-select" id="au-role">
                <option value="admin" ${editing?.role === 'admin' ? 'selected' : ''}>Administrador</option>
                <option value="vendedor" ${editing?.role === 'vendedor' ? 'selected' : ''}>Vendedor</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 mt-4">
              <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
              <button class="btn btn-primary" id="au-save-btn">${editing ? 'Guardar Cambios' : 'Crear Usuario'}</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      if (window.lucide) window.lucide.createIcons();

      if (!editing) {
        Utils.initPasswordHelper({
          inputEl: overlay.querySelector('#au-pass'),
          toggleBtnEl: overlay.querySelector('#au-pass-toggle'),
          strengthFillEl: overlay.querySelector('#au-pass-strength-fill'),
          strengthTextEl: overlay.querySelector('#au-pass-strength-text')
        });
        Utils.initPasswordHelper({
          inputEl: overlay.querySelector('#au-pass2'),
          toggleBtnEl: overlay.querySelector('#au-pass2-toggle')
        });
      }

      overlay.querySelector('#au-save-btn').onclick = () => {
        const name = overlay.querySelector('#au-name').value.trim();
        const username = overlay.querySelector('#au-username').value.trim().toLowerCase();
        const role = overlay.querySelector('#au-role').value;
        if (!name || !username) { Utils.showToast('Nombre y usuario son obligatorios', 'warning'); return; }

        if (editing) {
          Auth.updateUser(editing.username, { name, role });
          Utils.showToast('Usuario actualizado', 'success');
        } else {
          const passEl = overlay.querySelector('#au-pass');
          const pass2El = overlay.querySelector('#au-pass2');
          const pass = passEl.value;
          const pass2 = pass2El.value;

          passEl.style.borderColor = '';
          pass2El.style.borderColor = '';

          if (!pass || pass.length < 6) { 
            Utils.showToast('La contraseña debe tener al menos 6 caracteres', 'warning'); 
            passEl.style.borderColor = 'var(--error)';
            return; 
          }
          if (pass !== pass2) { 
            Utils.showToast('Las contraseñas no coinciden', 'error'); 
            passEl.style.borderColor = 'var(--error)';
            pass2El.style.borderColor = 'var(--error)';
            
            const modal = overlay.querySelector('.modal');
            modal.classList.add('shake');
            setTimeout(() => modal.classList.remove('shake'), 500);
            return; 
          }
          const result = Auth.createUser({ username, name, password: pass, role });
          if (!result.success) { Utils.showToast(result.error, 'error'); return; }
          Utils.showToast('Usuario creado', 'success');
        }
        overlay.remove();
        refresh();
      };
    }

    function showPasswordModal(idx) {
      const users = Auth.getUsers();
      const u = users[idx];
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';
      overlay.innerHTML = `
        <div class="modal" style="min-width:400px;">
          <div class="modal-header">
            <h2><i data-lucide="key" style="width:18px;height:18px;color:var(--accent-primary);margin-right:6px;"></i> Cambiar Contraseña — ${Utils.escHtml(u.username)}</h2>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group mb-3">
              <label class="form-label">Nueva Contraseña *</label>
              <div class="input-pass-wrapper">
                <input type="password" class="form-input" id="cpw-new" placeholder="Mínimo 6 caracteres">
                <button type="button" class="toggle-pass-btn" id="cpw-new-toggle">
                  <i data-lucide="eye" style="width:16px;height:16px;"></i>
                </button>
              </div>
              <div class="pw-strength-wrapper">
                <div class="pw-strength-bar">
                  <div class="pw-strength-fill" id="cpw-strength-fill"></div>
                </div>
                <span class="pw-strength-text" id="cpw-strength-text"></span>
              </div>
            </div>
            <div class="form-group mb-3">
              <label class="form-label">Confirmar Nueva Contraseña *</label>
              <div class="input-pass-wrapper">
                <input type="password" class="form-input" id="cpw-new2" placeholder="Repite la contraseña">
                <button type="button" class="toggle-pass-btn" id="cpw-new2-toggle">
                  <i data-lucide="eye" style="width:16px;height:16px;"></i>
                </button>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
              <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
              <button class="btn btn-primary" id="cpw-save-btn">Cambiar Contraseña</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      if (window.lucide) window.lucide.createIcons();

      Utils.initPasswordHelper({
        inputEl: overlay.querySelector('#cpw-new'),
        toggleBtnEl: overlay.querySelector('#cpw-new-toggle'),
        strengthFillEl: overlay.querySelector('#cpw-strength-fill'),
        strengthTextEl: overlay.querySelector('#cpw-strength-text')
      });
      Utils.initPasswordHelper({
        inputEl: overlay.querySelector('#cpw-new2'),
        toggleBtnEl: overlay.querySelector('#cpw-new2-toggle')
      });

      overlay.querySelector('#cpw-save-btn').onclick = async () => {
        const newPassEl = overlay.querySelector('#cpw-new');
        const newPass2El = overlay.querySelector('#cpw-new2');
        const newPass = newPassEl.value;
        const newPass2 = newPass2El.value;

        newPassEl.style.borderColor = '';
        newPass2El.style.borderColor = '';

        if (!newPass || newPass.length < 6) { 
          Utils.showToast('La contraseña debe tener al menos 6 caracteres', 'warning'); 
          newPassEl.style.borderColor = 'var(--error)';
          return; 
        }
        if (newPass !== newPass2) { 
          Utils.showToast('Las contraseñas no coinciden', 'error'); 
          newPassEl.style.borderColor = 'var(--error)';
          newPass2El.style.borderColor = 'var(--error)';
          
          const modal = overlay.querySelector('.modal');
          modal.classList.add('shake');
          setTimeout(() => modal.classList.remove('shake'), 500);
          return; 
        }

        const saveBtn = overlay.querySelector('#cpw-save-btn');
        const origText = saveBtn.textContent;
        saveBtn.textContent = 'Guardando...';
        saveBtn.disabled = true;

        const result = await Auth.changePassword(u.username, newPass);
        if (result.success) {
          Utils.showToast('Contraseña actualizada', 'success');
          overlay.remove();
        } else {
          Utils.showToast(result.error || 'Error al actualizar contraseña', 'error');
          saveBtn.textContent = origText;
          saveBtn.disabled = false;
          
          const modal = overlay.querySelector('.modal');
          modal.classList.add('shake');
          setTimeout(() => modal.classList.remove('shake'), 500);
        }
      };
    }

    refresh();
  }

  return {
    init, showNewClientModal, deleteClient, deleteQuotation,
    downloadPDF, previewPDF, importExcelForClient,
    startQuotationForClient, removeProduct, showAddProductModal,
    showEditProductModal, showEditClientModal, renderAdminPanel, _removeItem: () => {}
  };
})();

