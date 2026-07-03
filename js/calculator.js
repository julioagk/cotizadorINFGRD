/* ========================================
   Calculator Module - Coil Calculator
   ======================================== */

window.Calculator = (() => {

  const FACTORS = {
    condensador: 0.09,  // gal/m²
    evaporador: 0.16    // gal/m²
  };

  function calculate(params) {
    const { coilType, area, multiplier, clientFactor } = params;
    const config = Storage.config.get();
    const gallonCost = config.gallonCost || 450;

    const factorPerM2 = FACTORS[coilType] || 0.09;
    const gallonsBase = area * factorPerM2;
    const gallonsTotal = gallonsBase * multiplier;
    const materialCost = gallonsTotal * gallonCost;
    const finalPrice = materialCost * clientFactor;

    return {
      coilType,
      area,
      multiplier,
      clientFactor,
      factorPerM2,
      gallonCost,
      gallonsBase: Math.round(gallonsBase * 10000) / 10000,
      gallonsTotal: Math.round(gallonsTotal * 10000) / 10000,
      materialCost: Math.round(materialCost * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100
    };
  }

  function render(containerId, opts = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const clientFactor = opts.clientFactor || 3.0;
    const onAdd = opts.onAdd || null;
    const clientType = opts.clientType || 'oem';

    container.innerHTML = `
      <div class="card fade-in">
        <div class="card-header">
          <h2><i data-lucide="calculator" class="icon-inline" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px; color: var(--accent-primary);"></i> Calculadora de Serpentines</h2>
          ${opts.clientName ? `<span class="badge badge-primary">${Utils.escHtml(opts.clientName)}</span>` : ''}
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tipo de Serpentín</label>
            <select class="form-select" id="calc-coil-type">
              <option value="condensador">Serpentín Condensador (0.09 gal/m²)</option>
              <option value="evaporador">Serpentín Evaporador (0.16 gal/m²)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Largo (IN)</label>
            <input type="number" class="form-input" id="calc-length" placeholder="Ej: 40" min="0.1" step="0.1" value="">
          </div>
          <div class="form-group">
            <label class="form-label">Alto (IN)</label>
            <input type="number" class="form-input" id="calc-height" placeholder="Ej: 30" min="0.1" step="0.1" value="">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">\u00c1rea Calculada (m\u00b2)</label>
            <input type="text" class="form-input" id="calc-area-display" placeholder="0.00" readonly style="opacity:0.7; font-weight: 500;">
          </div>
          ${onAdd ? `
          <div class="form-group">
            <label class="form-label">Factor del Cliente</label>
            <input type="text" class="form-input" id="calc-factor-display"
              value="${clientFactor}" readonly
              style="opacity:0.75; font-weight:700; color:var(--accent-primary);">
            <input type="hidden" id="calc-factor" value="${clientFactor}">
          </div>
          ` : `
          <div class="form-group">
            <label class="form-label">Factor del Cliente</label>
            <select class="form-select" id="calc-factor">
              ${Object.entries(Utils.CLIENT_TYPES).map(([key, ct]) => `
                <option value="${ct.factor}" ${Math.abs(ct.factor - clientFactor) < 0.01 ? 'selected' : ''}>
                  ${ct.label} (Factor ${ct.factor})
                </option>
              `).join('')}
            </select>
          </div>
          `}
          <div class="form-group">
            <label class="form-label">Costo por Gal\u00f3n (USD)</label>
            <input type="number" class="form-input" id="calc-gallon-cost" value="${Storage.config.get().gallonCost}" step="1" readonly style="opacity:0.7">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Multiplicador de Aplicaciones</label>
          <p class="form-hint mb-2">Selecciona x2 o x3 si el serpentín requiere aplicaciones múltiples por su ancho</p>
          <div class="multiplier-group" id="calc-multiplier-group">
            <button class="multiplier-btn active" data-value="1">×1</button>
            <button class="multiplier-btn" data-value="2">×2</button>
            <button class="multiplier-btn" data-value="3">×3</button>
          </div>
        </div>

        ${onAdd ? `
        <div class="mt-3 mb-4 p-3 border rounded" style="background: rgba(0, 180, 216, 0.04); border: 1px solid rgba(0, 180, 216, 0.2); border-radius: 8px; text-align: left;">
          <h4 style="margin: 0 0 12px 0; font-size: 0.9rem; font-weight: 600; color: var(--accent-primary); display: flex; align-items: center; gap: 6px;">
            <i data-lucide="file-text" style="width:15px;height:15px;color: var(--accent-primary);"></i> Detalles del Concepto a Generar
          </h4>
          <div class="form-row" style="margin-bottom: 8px;">
            <div class="form-group" style="flex: 1.2; margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.75rem; margin-bottom: 2px;">Modelo / Clave *</label>
              <input type="text" class="form-input" id="calc-add-model" placeholder="Ej: SERP-COND-5TR" style="background: var(--bg-surface); padding: 8px 12px; font-size: 0.9rem;">
            </div>
            <div class="form-group" style="flex: 1.8; margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.75rem; margin-bottom: 2px;">Tipo / Categoría *</label>
              <input type="text" class="form-input" id="calc-add-type" placeholder="Ej: CONDENSADORA, EVAPORADOR" style="background: var(--bg-surface); padding: 8px 12px; font-size: 0.9rem;">
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.75rem; margin-bottom: 2px;">Descripción del Concepto *</label>
            <input type="text" class="form-input" id="calc-add-description" placeholder="Descripción en cotización" style="background: var(--bg-surface); padding: 8px 12px; font-size: 0.9rem;">
          </div>
          
          <div class="flex items-center gap-2 mt-3" style="cursor: pointer; user-select: none;">
            <input type="checkbox" id="calc-add-to-pricelist" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent-primary); margin: 0;">
            <label for="calc-add-to-pricelist" style="margin: 0; cursor: pointer; font-weight: 500; font-size: 0.85rem; color: var(--text-primary); display: flex; align-items: center; gap: 4px;">
              <i data-lucide="save" style="width: 13px; height: 13px; color: var(--accent-primary); display: inline-block; vertical-align: middle;"></i>
              Guardar este producto en el catálogo de este cliente
            </label>
          </div>
        </div>
        ` : ''}

        <div class="calc-result-box" id="calc-results" style="display:none">
          <div class="calc-result-row">
            <span class="calc-result-label">Galones base</span>
            <span class="calc-result-value" id="res-gallons-base">-</span>
          </div>
          <div class="calc-result-row">
            <span class="calc-result-label">Galones con multiplicador</span>
            <span class="calc-result-value" id="res-gallons-total">-</span>
          </div>
          <div class="calc-result-row">
            <span class="calc-result-label">Costo material</span>
            <span class="calc-result-value" id="res-material-cost">-</span>
          </div>
          <div class="calc-result-row total">
            <span class="calc-result-label"><i data-lucide="dollar-sign" style="width:16px;height:16px;vertical-align:middle;display:inline-flex;margin-right:2px;"></i> Precio Final</span>
            <span class="calc-result-value" id="res-final-price">-</span>
          </div>
        </div>

        ${onAdd ? `
        <div class="mt-4 flex justify-between">
          <button class="btn btn-secondary" id="calc-reset"><i data-lucide="refresh-cw" style="width:14px;height:14px;margin-right:4px;"></i> Limpiar</button>
          <button class="btn btn-primary btn-lg" id="calc-add-btn" disabled>
            <i data-lucide="plus" style="width:16px;height:16px;margin-right:4px;"></i> Agregar a Cotización
          </button>
        </div>
        ` : ''}
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // State
    let currentMultiplier = 1;
    let lastResult = null;

    // Multiplier buttons
    container.querySelectorAll('.multiplier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.multiplier-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMultiplier = parseInt(btn.dataset.value);
        recalculate();
      });
    });

    // Auto-recalculate on input change
    const lengthInput = container.querySelector('#calc-length');
    const heightInput = container.querySelector('#calc-height');
    const areaDisplay = container.querySelector('#calc-area-display');
    const factorSelect = container.querySelector('#calc-factor');
    const coilTypeSelect = container.querySelector('#calc-coil-type');

    lengthInput.addEventListener('input', recalculate);
    heightInput.addEventListener('input', recalculate);
    factorSelect.addEventListener('change', recalculate);
    coilTypeSelect.addEventListener('change', recalculate);

    function recalculate() {
      const length = parseFloat(lengthInput.value);
      const height = parseFloat(heightInput.value);
      const resultsBox = container.querySelector('#calc-results');

      if (!length || length <= 0 || !height || height <= 0) {
        areaDisplay.value = '';
        resultsBox.style.display = 'none';
        if (container.querySelector('#calc-add-btn')) {
          container.querySelector('#calc-add-btn').disabled = true;
        }
        lastResult = null;
        return;
      }

      // Convert area from sq inches to sq meters (1 sq in = 0.00064516 sq m)
      const area = Math.round((length * height * 0.00064516) * 10000) / 10000;
      areaDisplay.value = area.toFixed(4) + ' m²';

      const result = calculate({
        coilType: coilTypeSelect.value,
        area,
        multiplier: currentMultiplier,
        clientFactor: parseFloat(factorSelect.value)
      });

      lastResult = result;

      container.querySelector('#res-gallons-base').textContent = result.gallonsBase.toFixed(4) + ' gal';
      container.querySelector('#res-gallons-total').textContent = result.gallonsTotal.toFixed(4) + ' gal';
      container.querySelector('#res-material-cost').textContent = '$' + Utils.formatCurrency(result.materialCost) + ' USD';
      container.querySelector('#res-final-price').textContent = '$' + Utils.formatCurrency(result.finalPrice) + ' USD';

      // Prefill details inputs if present
      const addModelInput = container.querySelector('#calc-add-model');
      const addTypeInput = container.querySelector('#calc-add-type');
      const addDescInput = container.querySelector('#calc-add-description');

      if (addModelInput) {
        const oldValue = addModelInput.dataset.auto || '';
        if (!addModelInput.value || addModelInput.value === oldValue) {
          const coilCode = result.coilType === 'condensador' ? 'COND' : 'EVAP';
          const newVal = `SERP-${coilCode}-${area}M2`.toUpperCase();
          addModelInput.value = newVal;
          addModelInput.dataset.auto = newVal;
        }
      }
      if (addTypeInput) {
        const oldValue = addTypeInput.dataset.auto || '';
        if (!addTypeInput.value || addTypeInput.value === oldValue) {
          const newVal = result.coilType === 'condensador' ? 'CONDENSADORA' : 'EVAPORADOR';
          addTypeInput.value = newVal;
          addTypeInput.dataset.auto = newVal;
        }
      }
      if (addDescInput) {
        const oldValue = addDescInput.dataset.auto || '';
        if (!addDescInput.value || addDescInput.value === oldValue) {
          const coilLabel = result.coilType === 'condensador' ? 'Condensador' : 'Evaporador';
          const newVal = `APLICACION DE ANTICORROSIVO INFINIGUARD A SERPENTIN ${coilLabel.toUpperCase()} DE ${length}X${height}" (${area} M2)`.toUpperCase();
          addDescInput.value = newVal;
          addDescInput.dataset.auto = newVal;
        }
      }

      resultsBox.style.display = 'block';

      if (window.lucide) {
        window.lucide.createIcons();
      }

      if (container.querySelector('#calc-add-btn')) {
        container.querySelector('#calc-add-btn').disabled = false;
      }
    }

    // Add to quotation button
    if (onAdd) {
      container.querySelector('#calc-add-btn').addEventListener('click', () => {
        if (lastResult && onAdd) {
          const customModel = (container.querySelector('#calc-add-model') ? container.querySelector('#calc-add-model').value.trim() : '');
          const customType = (container.querySelector('#calc-add-type') ? container.querySelector('#calc-add-type').value.trim().toUpperCase() : '');
          const customDesc = (container.querySelector('#calc-add-description') ? container.querySelector('#calc-add-description').value.trim() : '');
          const saveToPricelist = (container.querySelector('#calc-add-to-pricelist') ? container.querySelector('#calc-add-to-pricelist').checked : false);

          if (container.querySelector('#calc-add-model') && (!customModel || !customType || !customDesc)) {
            Utils.showToast('Por favor completa todos los campos del concepto', 'warning');
            return;
          }

          const coilLabel = lastResult.coilType === 'condensador' ? 'Condensador' : 'Evaporador';
          const offerLabel = `Serpentín ${coilLabel}`;

          onAdd({
            model: customModel || `SERP-${coilLabel.substring(0, 4).toUpperCase()}-${lastResult.area}m²`,
            description: customDesc || `Aplicación de recubrimiento anticorrosivo - Serpentín ${coilLabel} - ${lengthInput.value}"x${heightInput.value}" (${lastResult.area} m²) - ×${lastResult.multiplier}`,
            offer: offerLabel,
            unitPrice: lastResult.finalPrice,
            calculationData: lastResult,
            saveToPricelist: saveToPricelist,
            productType: customType || (lastResult.coilType === 'condensador' ? 'CONDENSADORA' : 'EVAPORADOR')
          });

          Utils.showToast('Producto agregado a la cotización', 'success');
          
          lengthInput.value = '';
          heightInput.value = '';
          areaDisplay.value = '';
          if (container.querySelector('#calc-add-model')) {
            container.querySelector('#calc-add-model').value = '';
            container.querySelector('#calc-add-model').dataset.auto = '';
          }
          if (container.querySelector('#calc-add-type')) {
            container.querySelector('#calc-add-type').value = '';
            container.querySelector('#calc-add-type').dataset.auto = '';
          }
          if (container.querySelector('#calc-add-description')) {
            container.querySelector('#calc-add-description').value = '';
            container.querySelector('#calc-add-description').dataset.auto = '';
          }
          if (container.querySelector('#calc-add-to-pricelist')) {
            container.querySelector('#calc-add-to-pricelist').checked = false;
          }
          
          container.querySelector('#calc-results').style.display = 'none';
          container.querySelector('#calc-add-btn').disabled = true;
          lastResult = null;
        }
      });

      container.querySelector('#calc-reset').addEventListener('click', () => {
        lengthInput.value = '';
        heightInput.value = '';
        areaDisplay.value = '';
        coilTypeSelect.value = 'condensador';
        currentMultiplier = 1;
        container.querySelectorAll('.multiplier-btn').forEach(b => b.classList.remove('active'));
        container.querySelector('.multiplier-btn[data-value="1"]').classList.add('active');
        container.querySelector('#calc-results').style.display = 'none';
        if (container.querySelector('#calc-add-btn')) {
          container.querySelector('#calc-add-btn').disabled = true;
        }
        lastResult = null;
      });
    }
  }

  // Standalone calculator page
  function renderPage() {
    const main = document.getElementById('main-content');
    const clients = Storage.clients.getAll();

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i data-lucide="calculator" class="icon-inline" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; color: var(--accent-primary);"></i> Calculadora de Serpentines</h1>
          <p class="subtitle">Calcula el costo de recubrimiento anticorrosivo basado en el \u00e1rea del serpent\u00edn</p>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header"><h2><i data-lucide="user" style="width:16px;height:16px;margin-right:6px;vertical-align:middle;color:var(--accent-primary)"></i> Asignar a Cliente</h2></div>
        <div class="form-row" style="align-items:flex-end;">
          <div class="form-group" style="flex:2;">
            <label class="form-label">Cliente (opcional)</label>
            <select class="form-select" id="calc-client-select">
              <option value="">-- Sin cliente (Factor manual) --</option>
              ${clients.map(c => `<option value="${c.id}" data-factor="${c.factor}" data-name="${Utils.escHtml(c.company)}">${Utils.escHtml(c.company)} \u2014 Factor ${c.factor}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Cliente seleccionado</label>
            <input type="text" class="form-input" id="calc-client-display" value="Ninguno" readonly style="opacity:0.7;">
          </div>
        </div>
      </div>

      <div id="standalone-calculator"></div>
    `;

    let currentFactor = 3.0;

    function renderCalc() {
      Calculator.render('standalone-calculator', {
        clientFactor: currentFactor,
        clientType: 'oem',
        onAdd: null
      });
    }

    renderCalc();

    document.getElementById('calc-client-select').addEventListener('change', (e) => {
      const opt = e.target.selectedOptions[0];
      if (opt && opt.dataset.factor) {
        currentFactor = parseFloat(opt.dataset.factor);
        document.getElementById('calc-client-display').value = opt.dataset.name || 'Seleccionado';
      } else {
        currentFactor = 3.0;
        document.getElementById('calc-client-display').value = 'Ninguno';
      }
      renderCalc();
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  return { calculate, render, renderPage };
})();
