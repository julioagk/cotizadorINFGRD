/* ========================================
   Excel Importer - Parse .xlsx files
   Uses SheetJS (loaded via CDN in HTML)
   ======================================== */

window.ExcelImporter = (() => {

  /**
   * Parse an Excel file and extract equipment data
   * Hoja 1: TIPO | MODELO (equipment catalog)
   * Hoja 2: Price tables by category with offers
   */
  function parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const result = parseWorkbook(workbook);
          resolve(result);
        } catch (err) {
          reject(new Error('Error al leer el archivo Excel: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Error al cargar el archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  function parseWorkbook(workbook) {
    const sheetNames = workbook.SheetNames;
    const products = [];

    // Try to find catalog sheet (Hoja 1) and price sheet (Hoja 2)
    const catalogSheet = workbook.Sheets[sheetNames[0]];
    const priceSheet = sheetNames.length > 1 ? workbook.Sheets[sheetNames[1]] : null;

    // Parse catalog from first sheet
    const catalogData = XLSX.utils.sheet_to_json(catalogSheet, { header: 1, defval: null });
    
    // Parse prices from second sheet if available
    let priceData = [];
    if (priceSheet) {
      priceData = XLSX.utils.sheet_to_json(priceSheet, { header: 1, defval: null });
    }

    // Build price lookup from sheet 2
    const priceSections = parsePriceSections(priceData);
    
    // Build products from catalog
    const catalog = parseCatalog(catalogData);

    // Try to merge catalog with prices
    if (priceSections.length > 0) {
      // Add products from price sections (these have actual prices)
      for (const section of priceSections) {
        for (const item of section.items) {
          products.push({
            id: Utils.uuid(),
            type: section.type,
            model: item.model,
            offers: item.offers
          });
        }
      }
    }

    // Add catalog items that don't have prices yet
    const priceModels = new Set(products.map(p => p.model.toUpperCase()));
    for (const item of catalog) {
      if (!priceModels.has(item.model.toUpperCase())) {
        // Check if this model can be matched to a price section
        const matched = findPriceForModel(item, priceSections);
        products.push({
          id: Utils.uuid(),
          type: item.type,
          model: item.model,
          offers: matched || {}
        });
      }
    }

    return {
      products,
      catalog,
      priceSections,
      summary: {
        totalProducts: products.length,
        withPrices: products.filter(p => Object.keys(p.offers).length > 0).length,
        types: [...new Set(products.map(p => p.type))].sort()
      }
    };
  }

  function parseCatalog(data) {
    const items = [];
    const seen = new Set();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0] || !row[1]) continue;

      const type = String(row[0]).trim().toUpperCase();
      const model = String(row[1]).trim();

      // Skip header row
      if (type === 'TIPO' || type === 'TYPE') continue;

      const key = `${type}|${model}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ type: normalizeType(type), model });
      }
    }

    return items;
  }

  function parsePriceSections(data) {
    const sections = [];
    let currentSection = null;
    let currentHeaders = null;
    let rightHeaders = null;
    let sectionType = '';

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      // Detect section headers
      const rowStr = row.filter(c => c).map(c => String(c).toUpperCase()).join(' ');

      if (rowStr.includes('CONDENSADORES DESCARGA HORIZONTAL') || rowStr.includes('PAQUETES') || 
          rowStr.includes('EVAPORADORES') || rowStr.includes('MANEJADORAS') ||
          rowStr.includes('CHILLERS') || rowStr.includes('VRF')) {
        
        // Detect if there's a right-side section too
        if (rowStr.includes('CONDENSADORES DESCARGA HORIZONTAL')) {
          sectionType = 'CONDENSADORES DESC. HORIZONTAL';
        } else if (rowStr.includes('PAQUETES')) {
          sectionType = 'PAQUETES';
        } else {
          sectionType = rowStr.trim();
        }
        
        // Save previous section
        if (currentSection && currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { type: sectionType, items: [] };
        currentHeaders = null;
        continue;
      }

      // Detect column headers
      if (row.some(c => c && (String(c).toUpperCase().includes('MODELO') || 
          String(c).toUpperCase().includes('CAPACIDAD')))) {
        currentHeaders = [];
        rightHeaders = [];
        
        for (let j = 0; j < row.length; j++) {
          const val = row[j] ? String(row[j]).toUpperCase().trim() : '';
          if (j <= 5) {
            currentHeaders.push(val);
          } else {
            rightHeaders.push(val);
          }
        }
        continue;
      }

      // Parse data rows
      if (currentSection && currentHeaders) {
        const col2 = row[2]; // Model/Capacity column (column C)
        const col3 = row[3]; // First price column (column D)
        
        if (col2 && col3 !== null && col3 !== undefined && typeof col3 === 'number') {
          const model = String(col2).trim();
          const offers = {};

          // Left-side data
          if (col3 !== null && typeof col3 === 'number') {
            offers.serpentin = col3;
          }
          if (row[4] !== null && typeof row[4] === 'number') {
            // Check if header says "GABINETE"
            const h4 = currentHeaders[4] || currentHeaders[3] || '';
            if (h4.includes('GABINETE')) {
              offers.serpentin_gabinete = row[4];
            } else {
              offers.serpentin_gabinete = row[4];
            }
          }
          if (row[5] !== null && typeof row[5] === 'number') {
            offers.recubrimiento_completo = row[5];
          } else if (row[4] !== null && typeof row[4] === 'number' && !row[5]) {
            // Only 2 columns: serpentin and recubrimiento
            offers.recubrimiento_completo = row[4];
            delete offers.serpentin_gabinete;
          }

          currentSection.items.push({ model, offers });

          // Right-side data (for condensadores with horizontal/vertical split)
          if (row[6] && row[7] !== null && typeof row[7] === 'number') {
            const rightModel = String(row[6]).trim();
            const rightOffers = {};
            if (typeof row[7] === 'number') rightOffers.serpentin = row[7];
            if (typeof row[8] === 'number') rightOffers.recubrimiento_completo = row[8];

            // Create or find the vertical section
            let vertSection = sections.find(s => s.type === 'CONDENSADORES DESC. VERTICAL');
            if (!vertSection) {
              vertSection = { type: 'CONDENSADORES DESC. VERTICAL', items: [] };
              sections.push(vertSection);
            }
            vertSection.items.push({ model: rightModel, offers: rightOffers });
          }
        }
      }
    }

    // Save last section
    if (currentSection && currentSection.items.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }

  function findPriceForModel(catalogItem, priceSections) {
    // Try to find a matching price by model name
    for (const section of priceSections) {
      for (const item of section.items) {
        if (item.model.toUpperCase() === catalogItem.model.toUpperCase()) {
          return item.offers;
        }
      }
    }
    return null;
  }

  function normalizeType(type) {
    const map = {
      'EVAPORADOR': 'EVAPORADOR',
      'EVAPORADORA': 'EVAPORADOR',
      'MINISPLIT COND': 'MINISPLIT CONDENSADOR',
      'MINISPLIT CONDENSADOR': 'MINISPLIT CONDENSADOR',
      'CONDENSADORA': 'CONDENSADORA',
      'CONDENSADOR': 'CONDENSADORA',
      'MANEJADORA': 'MANEJADORA',
      'PAQUETE': 'PAQUETE',
      'EQUIPO PAQUETE': 'PAQUETE',
      'VRF': 'VRF',
      'CHILLER': 'CHILLER',
      'CHILLERS': 'CHILLER'
    };
    return map[type.toUpperCase()] || type;
  }

  /**
   * Simple import: read any Excel with at least model and price columns
   * Returns flat array of products
   */
  function parseSimple(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const allProducts = [];

          for (const name of wb.SheetNames) {
            const sheet = wb.Sheets[name];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
            
            for (let i = 0; i < json.length; i++) {
              const row = json[i];
              if (!row || row.every(c => c === null)) continue;
              
              // Find cells that look like model names and prices
              const textCells = row.filter(c => c && typeof c === 'string' && c.length > 2);
              const numCells = row.filter(c => typeof c === 'number' && c > 0);
              
              if (textCells.length > 0 && numCells.length > 0) {
                const type = textCells.length > 1 ? textCells[0] : 'GENERAL';
                const model = textCells.length > 1 ? textCells[1] : textCells[0];
                const offers = {};
                
                if (numCells[0]) offers.serpentin = numCells[0];
                if (numCells[1]) offers.serpentin_gabinete = numCells[1];
                if (numCells[2]) offers.recubrimiento_completo = numCells[2];

                allProducts.push({
                  id: Utils.uuid(),
                  type: normalizeType(type),
                  model,
                  offers
                });
              }
            }
          }

          resolve(allProducts);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  return { parseFile, parseSimple };
})();
