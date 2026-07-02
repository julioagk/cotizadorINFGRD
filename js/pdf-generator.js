/* ========================================
   PDF Generator - jsPDF + autoTable
   Replicates InfiniGuard quotation format
   ======================================== */

window.PDFGenerator = (() => {

  function generate(quotation, client) {
    const config = Storage.config.get();
    const jsPDF = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
    if (!jsPDF) throw new Error('La librería jsPDF no está cargada.');

    const doc = new jsPDF('portrait', 'mm', 'letter');
    const safeClient = client || { company: 'Cliente', name: '', phone: '' };
    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // ── Color palette (matches reference exactly) ──
    const cyan      = [0, 180, 216];
    const lightCyan = [224, 247, 250];
    const darkText  = [30, 30, 30];
    const grayText  = [120, 120, 120];
    const grayBg    = [237, 237, 237];
    const white     = [255, 255, 255];

    // ═══════════════════════════════════════════════
    // HEADER BAND — full width light-cyan background
    // ═══════════════════════════════════════════════
    const headerH = 33;
    doc.setFillColor(...lightCyan);
    doc.rect(margin, y, pageW - margin * 2, headerH, 'F');

    // Company name — large cyan bold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...cyan);
    doc.text('INFINIGUARD MEXICO', margin + 4, y + 11);

    // RFC + address — small dark text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkText);
    doc.text(`RFC ${config.companyRfc || 'IME191002KLA'}`, margin + 4, y + 18);
    doc.text(config.companyAddress || 'KAPPA 420, Parque Industrial Milenium, Del. Ciudad Apodaca', margin + 4, y + 23);
    doc.text(config.companyCity   || 'Apodaca, Nuevo León, México CP: 66626', margin + 4, y + 28);

    // "Cotización" label — right side, large gray
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(22);
    doc.setTextColor(...grayText);
    doc.text('Cotización', pageW - margin - 4, y + 12, { align: 'right' });

    // Folio number — very large cyan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...cyan);
    doc.text(quotation.folio || '', pageW - margin - 4, y + 25, { align: 'right' });

    y += headerH + 2;

    // ═══════════════════════════════════════════════
    // RIGHT METADATA COLUMN
    // left side = "Cotizado a:" block (starts below header)
    // right side = Emitida / date / Folio / Sucursal / Almacén
    // ═══════════════════════════════════════════════
    const rightLabelX = pageW - margin - 55;
    const rightValueX = pageW - margin - 4;

    // "Emitida" gray label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...grayText);
    doc.text('Emitida', rightValueX, y + 2, { align: 'right' });

    // Date in cyan
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...cyan);
    doc.text(Utils.formatDate(quotation.date), rightValueX, y + 7, { align: 'right' });

    // Folio row
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text('Folio :', rightLabelX, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.folio || '', rightValueX, y + 13, { align: 'right' });

    let metaY = y + 18;

    // Sucursal
    doc.setFont('helvetica', 'bold');
    doc.text('Sucursal:', rightLabelX, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(config.sucursal || 'MAT', rightValueX, metaY, { align: 'right' });
    metaY += 5;

    // Almacén
    doc.setFont('helvetica', 'bold');
    doc.text('Almacén:', rightLabelX, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(config.almacen || 'GENERAL', rightValueX, metaY, { align: 'right' });

    // ═══════════════════════════════════════════════
    // "COTIZADO A:" block — left half, below header
    // ═══════════════════════════════════════════════
    const leftW = pageW / 2 - margin - 5;  // left column width

    // Gray bar label
    doc.setFillColor(...grayBg);
    doc.rect(margin, y, leftW, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkText);
    doc.text('Cotizado a:', margin + 2, y + 4.2);

    // Company name in cyan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...cyan);
    doc.text(safeClient.company || '', margin + 2, y + 10);

    // Contact lines
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkText);

    let cY = y + 14;
    if (quotation.contactName) {
      doc.text(`Contacto :  ${quotation.contactName}`, margin + 2, cY);
      cY += 4;
    }
    const tel = quotation.contactPhone || safeClient.phone;
    if (tel) {
      doc.text(`Tels : ${tel}`, margin + 2, cY);
      cY += 4;
    }
    if (quotation.contactName) {
      doc.text(`AT'N.     ${quotation.contactName}`, margin + 2, cY);
      cY += 4;
    }

    // Push y past the taller of the two columns
    const leftColBottom = cY + 1;
    const rightColBottom = metaY + 7;
    y = Math.max(leftColBottom, rightColBottom);

    // "A continuación..." text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkText);
    doc.text('A continuación pongo a su consideración la siguiente cotización:', margin + 2, y + 1);
    y += 5;

    // ═══════════════════════════════════════════════
    // "OTROS DATOS" section
    // ═══════════════════════════════════════════════
    doc.setFillColor(...grayBg);
    doc.rect(margin, y, pageW - margin * 2, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkText);
    doc.text('Otros datos', margin + 2, y + 4.2);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('En atención a:', margin + 2, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.attentionTo || quotation.contactName || '', margin + 45, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.text('Firmada por:', margin + 2, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.signedBy || config.signedBy || '', margin + 45, y + 14);
    y += 18;

    // ═══════════════════════════════════════════════
    // ITEMS TABLE
    // ═══════════════════════════════════════════════
    const currency = quotation.currency || 'USD';

    const tableBody = quotation.items.map(item => [
      parseFloat(item.quantity).toFixed(2),
      'SERV',
      item.attribute || '',
      item.clave || item.model || '',
      item.description || '',
      Utils.formatCurrency(item.unitPrice),
      Utils.formatCurrency(item.amount || item.quantity * item.unitPrice),
      currency
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'plain',
      head: [['Cant.', 'Unid.', 'Atrib.', 'Clave', 'Descripción', 'P.Unitario', 'Importe', 'Mon']],
      body: tableBody,
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: darkText,
        lineColor: [220, 220, 220],
        lineWidth: { bottom: 0.2 }
      },
      headStyles: {
        fillColor: grayBg,
        textColor: darkText,
        fontStyle: 'bold',
        lineColor: [200, 200, 200],
        lineWidth: { bottom: 0.3 }
      },
      columnStyles: {
        0: { cellWidth: 13, halign: 'center' },
        1: { cellWidth: 13, halign: 'center' },
        2: { cellWidth: 13, halign: 'center' },
        3: { cellWidth: 30, textColor: cyan },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 11, halign: 'center' }
      },
      didParseCell: function(data) {
        // Clave column → cyan body cells
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = cyan;
        }
        // Description column → Prepend Clave/Model to description text
        if (data.section === 'body' && data.column.index === 4) {
          const model = data.row.raw[3] || '';
          if (model) {
            data.cell.text.unshift(model);
          }
        }
      },
      willDrawCell: function(data) {
        // Description column → intercept and store text
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.originalText = [...data.cell.text];
          data.cell.text = []; // clear to prevent default drawing
        }
      },
      didDrawCell: function(data) {
        // Description column → manually draw custom colored lines
        if (data.section === 'body' && data.column.index === 4 && data.cell.originalText) {
          const textX = data.cell.x + data.cell.padding('left');
          const fontSize = data.cell.styles.fontSize;
          const scaleFactor = doc.internal.scaleFactor;
          const lineHeight = (fontSize / scaleFactor) * 1.15;
          let textY = data.cell.y + data.cell.padding('top') + (fontSize / scaleFactor);

          data.cell.originalText.forEach((line, idx) => {
            if (idx === 0) {
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(...cyan);
            } else {
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(...darkText);
            }
            doc.text(line, textX, textY);
            textY += lineHeight;
          });
          
          // Restore default fonts/colors just in case
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...darkText);
        }
      }
    });

    y = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 12 : y + 45;

    // ═══════════════════════════════════════════════
    // TOTALS — Styled Gray Box Layout
    // ═══════════════════════════════════════════════
    const subtotal = quotation.subtotal || 0;
    const iva      = quotation.iva      || 0;
    const total    = quotation.total    || 0;

    // Determine rows to render
    const rows = [
      { label: 'Importe', value: subtotal },
      { label: 'Subtotal', value: subtotal }
    ];

    if (quotation.applyIva && iva > 0) {
      rows.push({ label: 'I.V.A.', value: iva });
    }

    rows.push({ label: 'TOTAL', value: total });

    // Draw gray container box
    const boxW = 68;
    const boxX = pageW - margin - boxW;
    const rowH = 5;
    const boxH = rows.length * rowH + 2; // pad top/bottom
    
    doc.setFillColor(240, 240, 240);
    doc.rect(boxX, y - 4, boxW, boxH, 'F');

    let currentY = y - 1;
    doc.setFontSize(8.5);

    rows.forEach(row => {
      // Label (bold dark text)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkText);
      doc.text(row.label, boxX + 2.5, currentY);

      // Value (cyan, normal/bold)
      doc.setFont('helvetica', row.label === 'TOTAL' ? 'bold' : 'normal');
      doc.setTextColor(...cyan);
      doc.text(Utils.formatCurrency(row.value), pageW - margin - 14, currentY, { align: 'right' });

      // Currency (cyan, bold)
      doc.setFont('helvetica', 'bold');
      doc.text(currency, pageW - margin - 2, currentY, { align: 'right' });

      currentY += rowH;
    });

    y = currentY + 1;

    // Total in words
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...grayText);
    const totalWords = Utils.numberToWords(total, currency);
    doc.text(totalWords, boxX + 1, y);
    y += 10;

    // Observations (if any)
    if (quotation.observations) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...grayText);
      doc.text(quotation.observations, margin + 2, y, { maxWidth: pageW - margin * 2 - 10 });
      y += 8;
    }

    // ── Footer ──
    const footerY = pageH - 12;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayText);
    doc.text('1 / 1', pageW - margin - 4, footerY, { align: 'right' });

    return doc;
  }

  function download(quotation, client) {
    const doc = generate(quotation, client);
    const safeClient = client || { company: 'cliente' };
    const filename = `COT_${quotation.folio}_${(safeClient.company || 'cliente').replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
  }

  function preview(quotation, client) {
    const doc = generate(quotation, client);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  return { generate, download, preview };
})();
