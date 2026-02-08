import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Logo de El Taller (base64 - puedes reemplazar con tu logo real)
const LOGO_BASE64 = ""; // Opcional: agregar logo en base64

const formatMoney = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value || 0);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Configuración de colores del tema
const COLORS = {
  primary: '#D4B896',
  secondary: '#1F2937',
  text: '#374151',
  light: '#F3F4F6'
};

// Agregar encabezado con logo
const addHeader = (doc, title) => {
  // Título del restaurante
  doc.setFontSize(20);
  doc.setTextColor(COLORS.secondary);
  doc.text('EL TALLER', 105, 15, { align: 'center' });
  
  // Subtítulo
  doc.setFontSize(12);
  doc.setTextColor(COLORS.text);
  doc.text(title, 105, 22, { align: 'center' });
  
  // Fecha de generación
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.text(`Generado: ${formatDate(new Date())}`, 105, 28, { align: 'center' });
  
  // Línea separadora
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);
  
  return 38; // Retorna la posición Y donde continuar
};

// Agregar pie de página
const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text);
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
};

export const generarPDFVentasDetalladas = (datos, fechaInicio, fechaFin) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Reporte de Ventas Detalladas');
  
  // Período
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, 20, yPos);
  yPos += 10;
  
  // Resumen
  const totalVentas = datos.reduce((sum, v) => sum + (v.total || 0), 0);
  const totalPedidos = datos.length;
  
  doc.setFillColor(COLORS.light);
  doc.rect(20, yPos, 170, 20, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.text('RESUMEN', 25, yPos + 7);
  
  doc.setFontSize(9);
  doc.text(`Total Pedidos: ${totalPedidos}`, 25, yPos + 14);
  doc.text(`Total Ventas: ${formatMoney(totalVentas)}`, 100, yPos + 14);
  
  yPos += 28;
  
  // Tabla de ventas
  const tableData = datos.map(v => [
    new Date(v.fecha).toLocaleDateString('es-CO'),
    v.mesa || 'N/A',
    v.local || 'N/A',
    v.mesero || 'Sin mesero',
    formatMoney(v.total),
    v.metodo_pago || 'efectivo'
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [['Fecha', 'Mesa', 'Local', 'Mesero', 'Total', 'Método Pago']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.secondary,
      fontSize: 9,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: COLORS.light
    }
  });
  
  addFooter(doc);
  doc.save(`ventas-detalladas-${fechaInicio}-${fechaFin}.pdf`);
};

export const generarPDFCompras = (datos, fechaInicio, fechaFin) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Reporte de Compras');
  
  // Período
  doc.setFontSize(10);
  doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, 20, yPos);
  yPos += 10;
  
  // Resumen
  const totalCompras = datos.reduce((sum, c) => sum + (c.total || 0), 0);
  
  doc.setFillColor(COLORS.light);
  doc.rect(20, yPos, 170, 20, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.text('RESUMEN', 25, yPos + 7);
  
  doc.setFontSize(9);
  doc.text(`Total Compras: ${datos.length}`, 25, yPos + 14);
  doc.text(`Monto Total: ${formatMoney(totalCompras)}`, 100, yPos + 14);
  
  yPos += 28;
  
  // Tabla de compras
  const tableData = datos.map(c => [
    new Date(c.fecha).toLocaleDateString('es-CO'),
    c.proveedor || 'N/A',
    c.factura || 'N/A',
    c.producto || 'N/A',
    c.cantidad,
    formatMoney(c.costo_unitario),
    formatMoney(c.total)
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [['Fecha', 'Proveedor', 'Factura', 'Producto', 'Cant.', 'Costo Unit.', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.secondary,
      fontSize: 8,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7,
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: COLORS.light
    }
  });
  
  addFooter(doc);
  doc.save(`compras-${fechaInicio}-${fechaFin}.pdf`);
};

export const generarPDFInventario = (datos) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Inventario Valorizado');
  
  // Resumen
  const valorTotal = datos.reduce((sum, p) => sum + (p.valor_total || 0), 0);
  
  doc.setFillColor(COLORS.light);
  doc.rect(20, yPos, 170, 20, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.text('RESUMEN', 25, yPos + 7);
  
  doc.setFontSize(9);
  doc.text(`Total Productos: ${datos.length}`, 25, yPos + 14);
  doc.text(`Valor Total: ${formatMoney(valorTotal)}`, 100, yPos + 14);
  
  yPos += 28;
  
  // Tabla de inventario
  const tableData = datos.map(p => [
    p.codigo || 'N/A',
    p.producto || 'N/A',
    p.categoria || 'Sin categoría',
    p.stock_local1 || 0,
    p.stock_local2 || 0,
    p.stock_total || 0,
    formatMoney(p.costo_promedio),
    formatMoney(p.valor_total)
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [['Código', 'Producto', 'Categoría', 'L1', 'L2', 'Total', 'Costo Prom.', 'Valor']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.secondary,
      fontSize: 7,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7,
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: COLORS.light
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 15 },
      4: { cellWidth: 15 },
      5: { cellWidth: 15 },
      6: { cellWidth: 20 },
      7: { cellWidth: 25 }
    }
  });
  
  addFooter(doc);
  doc.save(`inventario-valorizado-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generarPDFKardex = (datos, fechaInicio, fechaFin) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Kardex de Inventario');
  
  // Período
  doc.setFontSize(10);
  doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, 20, yPos);
  yPos += 10;
  
  // Resumen
  doc.setFillColor(COLORS.light);
  doc.rect(20, yPos, 170, 15, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.text('RESUMEN', 25, yPos + 7);
  
  doc.setFontSize(9);
  doc.text(`Total Movimientos: ${datos.length}`, 25, yPos + 12);
  
  yPos += 23;
  
  // Tabla de kardex
  const tableData = datos.map(k => [
    new Date(k.fecha).toLocaleDateString('es-CO'),
    k.producto || 'N/A',
    k.tipo || 'N/A',
    k.cantidad || 0,
    k.stock_anterior || 0,
    k.stock_nuevo || 0,
    k.origen || 'N/A'
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [['Fecha', 'Producto', 'Tipo', 'Cant.', 'Stock Ant.', 'Stock Nuevo', 'Origen']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.secondary,
      fontSize: 8,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7,
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: COLORS.light
    }
  });
  
  addFooter(doc);
  doc.save(`kardex-${fechaInicio}-${fechaFin}.pdf`);
};

export const generarPDFEstadoResultados = (datos, fechaInicio, fechaFin) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Estado de Resultados');
  
  // Período
  doc.setFontSize(10);
  doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, 20, yPos);
  yPos += 15;
  
  // Sección de Ingresos
  doc.setFontSize(12);
  doc.setTextColor(COLORS.secondary);
  doc.text('INGRESOS', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.text('Ventas Brutas:', 25, yPos);
  doc.text(formatMoney(datos.ingresos?.ventas_brutas || 0), 150, yPos, { align: 'right' });
  yPos += 6;
  
  doc.text('(-) Descuentos:', 25, yPos);
  doc.text(formatMoney(datos.ingresos?.descuentos || 0), 150, yPos, { align: 'right' });
  yPos += 6;
  
  doc.setFont(undefined, 'bold');
  doc.text('Ventas Netas:', 25, yPos);
  doc.text(formatMoney(datos.ingresos?.ventas_netas || 0), 150, yPos, { align: 'right' });
  yPos += 12;
  
  // Sección de Costos
  doc.setFont(undefined, 'normal');
  doc.setFontSize(12);
  doc.setTextColor(COLORS.secondary);
  doc.text('COSTOS', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.text('Costo de Ventas:', 25, yPos);
  doc.text(formatMoney(datos.costos?.costo_ventas || 0), 150, yPos, { align: 'right' });
  yPos += 12;
  
  // Utilidad Bruta
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.secondary);
  doc.text('UTILIDAD BRUTA:', 25, yPos);
  doc.text(formatMoney(datos.utilidad_bruta || 0), 150, yPos, { align: 'right' });
  yPos += 6;
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(`Margen: ${(datos.margen_bruto || 0).toFixed(2)}%`, 25, yPos);
  yPos += 12;
  
  // Gastos Operativos
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.text('Gastos Operativos:', 25, yPos);
  doc.text(formatMoney(datos.gastos_operativos || 0), 150, yPos, { align: 'right' });
  yPos += 12;
  
  // Utilidad Neta
  doc.setFillColor(COLORS.primary);
  doc.rect(20, yPos, 170, 15, 'F');
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLORS.secondary);
  doc.text('UTILIDAD NETA:', 25, yPos + 10);
  doc.text(formatMoney(datos.utilidad_neta || 0), 185, yPos + 10, { align: 'right' });
  
  addFooter(doc);
  doc.save(`estado-resultados-${fechaInicio}-${fechaFin}.pdf`);
};

export const generarPDFCierreCaja = (datos, fechaInicio) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Cierre de Caja');
  
  // Período
  doc.setFontSize(10);
  doc.text(`Fecha: ${formatDate(fechaInicio)}`, 20, yPos);
  yPos += 15;
  
  // Resumen General
  doc.setFillColor(COLORS.light);
  doc.rect(20, yPos, 170, 25, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(COLORS.secondary);
  doc.text('RESUMEN GENERAL', 25, yPos + 7);
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.text(`Total Pedidos: ${datos.total_pedidos || 0}`, 25, yPos + 14);
  doc.text(`Total Ventas: ${formatMoney(datos.total_ventas || 0)}`, 25, yPos + 21);
  
  yPos += 35;
  
  // Métodos de Pago
  doc.setFontSize(11);
  doc.setTextColor(COLORS.secondary);
  doc.text('DETALLE POR MÉTODO DE PAGO', 20, yPos);
  yPos += 10;
  
  const tableData = (datos.metodos_pago || []).map(m => [
    m.metodo || 'N/A',
    m.cantidad || 0,
    formatMoney(m.total || 0)
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [['Método de Pago', 'Cantidad', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.secondary,
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: COLORS.light
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Total por tipo
  doc.setFillColor(COLORS.light);
  doc.rect(20, yPos, 170, 20, 'F');
  
  doc.setFontSize(10);
  doc.text(`Efectivo: ${formatMoney(datos.efectivo || 0)}`, 25, yPos + 7);
  doc.text(`Tarjeta: ${formatMoney(datos.tarjeta || 0)}`, 25, yPos + 14);
  doc.text(`Transferencia: ${formatMoney(datos.transferencia || 0)}`, 100, yPos + 14);
  
  addFooter(doc);
  doc.save(`cierre-caja-${fechaInicio}.pdf`);
};

export const generarPDFGastos = (datos, fechaInicio, fechaFin) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, 'Reporte de Gastos');
  
  // Período
  doc.setFontSize(10);
  doc.text(`Período: ${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, 20, yPos);
  yPos += 15;
  
  if (datos.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(COLORS.text);
    doc.text('No hay gastos registrados en este período', 105, yPos + 20, { align: 'center' });
  } else {
    const totalGastos = datos.reduce((sum, g) => sum + (g.monto || 0), 0);
    
    doc.setFillColor(COLORS.light);
    doc.rect(20, yPos, 170, 15, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(COLORS.secondary);
    doc.text('RESUMEN', 25, yPos + 7);
    
    doc.setFontSize(9);
    doc.text(`Total Gastos: ${formatMoney(totalGastos)}`, 25, yPos + 12);
    
    yPos += 23;
    
    const tableData = datos.map(g => [
      new Date(g.fecha).toLocaleDateString('es-CO'),
      g.categoria || 'N/A',
      g.concepto || 'N/A',
      formatMoney(g.monto)
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Fecha', 'Categoría', 'Concepto', 'Monto']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.secondary,
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: COLORS.light
      }
    });
  }
  
  addFooter(doc);
  doc.save(`gastos-${fechaInicio}-${fechaFin}.pdf`);
};