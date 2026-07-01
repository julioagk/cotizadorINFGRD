/* ========================================
   Utils Module - Formatting & Helpers
   ======================================== */

window.Utils = (() => {

  function uuid() {
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }) + '-' + Date.now().toString(36);
  }

  function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}.`;
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  // Number to words (Spanish)
  function numberToWords(num, currency = 'USD') {
    const unidades = ['', 'Un', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve'];
    const especiales = ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve'];
    const decenas = ['', 'Diez', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa'];
    const centenas = ['', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos'];

    if (num === 0) return 'Cero';

    function convertGroup(n) {
      if (n === 0) return '';
      if (n === 100) return 'Cien';

      let result = '';
      if (n >= 100) {
        result += centenas[Math.floor(n / 100)] + ' ';
        n %= 100;
      }
      if (n >= 20) {
        result += decenas[Math.floor(n / 10)];
        const u = n % 10;
        if (u > 0) result += ' y ' + unidades[u];
        return result.trim();
      }
      if (n >= 10) return result + especiales[n - 10];
      if (n > 0) return result + unidades[n];
      return result.trim();
    }

    const entero = Math.floor(Math.abs(num));
    const decimales = Math.round((Math.abs(num) - entero) * 100);
    let texto = '';

    if (entero === 0) {
      texto = 'Cero';
    } else if (entero === 1) {
      texto = 'Un';
    } else {
      const millones = Math.floor(entero / 1000000);
      const miles = Math.floor((entero % 1000000) / 1000);
      const unids = entero % 1000;

      if (millones > 0) {
        texto += (millones === 1 ? 'Un Millón' : convertGroup(millones) + ' Millones') + ' ';
      }
      if (miles > 0) {
        texto += (miles === 1 ? 'Mil' : convertGroup(miles) + ' Mil') + ' ';
      }
      if (unids > 0) {
        texto += convertGroup(unids);
      }
    }

    texto = texto.trim();
    const currName = currency === 'USD' ? 'Dólares' : 'Pesos';
    const decStr = decimales.toString().padStart(2, '0');

    return `${texto} ${currName} ${decStr}/100 ${currency}`;
  }

  // Client type definitions
  const CLIENT_TYPES = {
    oem: { label: 'OEM', factor: 3.0, color: 'success' },
    distribuidor_fabrica: { label: 'Distribuidor Fábrica', factor: 3.7, color: 'primary' },
    distribuidor: { label: 'Distribuidor / Wholesaler', factor: 4.0, color: 'info' },
    refrigeracion: { label: 'Refrigeración Industrial', factor: 4.5, color: 'warning' },
    contratista: { label: 'Contratista', factor: 4.8, color: 'error' }
  };

  // Offer type definitions
  const OFFER_TYPES = {
    serpentin: { label: 'Serpentín Condensador / Evaporador', short: 'Serpentín' },
    serpentin_gabinete: { label: 'Serpentín + Gabinete', short: 'Serpentín + Gab.' },
    recubrimiento_completo: { label: 'Recubrimiento Completo', short: 'Rec. Completo' }
  };

  // Toast notification
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }

  // Confirm dialog
  function confirm(message, title = 'Confirmar') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';
      overlay.innerHTML = `
        <div class="modal" style="min-width:400px;max-width:460px">
          <div class="modal-header">
            <h2>⚠️ ${title}</h2>
          </div>
          <div class="modal-body">
            <p style="font-size:0.95rem">${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
            <button class="btn btn-danger" id="confirm-ok">Eliminar</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#confirm-cancel').onclick = () => { overlay.remove(); resolve(false); };
      overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); resolve(true); };
    });
  }

  // Escape HTML
  function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return {
    uuid, formatCurrency, formatDate, formatDateShort, today,
    numberToWords, CLIENT_TYPES, OFFER_TYPES,
    showToast, confirm, escHtml
  };
})();
