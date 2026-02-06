const PDFDocument = require('pdfkit');
const { Compra, Proveedor, Local, MovimientoInventario, Producto } = require('../models');
const fs = require('fs');
const path = require('path');

// Directorio para almacenar PDFs
const PDF_DIR = path.join(__dirname, '../../pdfs/facturas');

// Crear directorio si no existe
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

/**
 * Generar PDF de factura de compra
 */
const generarPDFFactura = async (req, res) => {
  try {
    const { id } = req.params;

    const compra = await Compra.findByPk(id, {
      include: [
        {
          model: Proveedor,
          as: 'proveedor',
          attributes: ['nombre', 'nit', 'telefono', 'email', 'direccion']
        },
        {
          model: Local,
          as: 'local',
          attributes: ['nombre']
        }
      ]
    });

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    const movimientos = await MovimientoInventario.findAll({
      where: { 
        compra_id: id,
        tipo: 'compra'
      },
      include: [
        {
          model: Producto,
          as: 'producto',
          attributes: ['nombre', 'codigo']
        }
      ]
    });

    const doc = new PDFDocument({ 
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const filename = `factura_${compra.numero_factura || compra.numero_compra}_${Date.now()}.pdf`;
    const filepath = path.join(PDF_DIR, filename);

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#D4B896')
      .text('EL TALLER', 50, 50);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Sistema de Gestión', 50, 78);

    doc
      .strokeColor('#D4B896')
      .lineWidth(2)
      .moveTo(50, 100)
      .lineTo(562, 100)
      .stroke();

    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('FACTURA DE COMPRA', 50, 120);

    // Información de la factura
    const infoY = 120;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('N° Factura:', 400, infoY)
      .font('Helvetica')
      .text(compra.numero_factura || 'N/A', 480, infoY);

    doc
      .font('Helvetica-Bold')
      .text('N° Compra:', 400, infoY + 15)
      .font('Helvetica')
      .text(compra.numero_compra, 480, infoY + 15);

    doc
      .font('Helvetica-Bold')
      .text('Fecha:', 400, infoY + 30)
      .font('Helvetica')
      .text(new Date(compra.fecha_factura || compra.fecha_compra).toLocaleDateString('es-CO'), 480, infoY + 30);

    doc
      .font('Helvetica-Bold')
      .text('Local:', 400, infoY + 45)
      .font('Helvetica')
      .text(compra.local?.nombre || 'N/A', 480, infoY + 45);

    const estadoColor = compra.estado === 'recibida' ? '#10b981' : 
                       compra.estado === 'pendiente' ? '#fbbf24' : '#ef4444';
    doc
      .font('Helvetica-Bold')
      .text('Estado:', 400, infoY + 60)
      .fillColor(estadoColor)
      .font('Helvetica-Bold')
      .text(compra.estado.toUpperCase(), 480, infoY + 60);

    doc.fillColor('#000000');

    // Información del proveedor
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('DATOS DEL PROVEEDOR', 50, 220);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Razón Social:', 50, 240)
      .font('Helvetica')
      .text(compra.proveedor?.nombre || 'N/A', 140, 240);

    if (compra.proveedor?.nit) {
      doc
        .font('Helvetica-Bold')
        .text('NIT:', 50, 255)
        .font('Helvetica')
        .text(compra.proveedor.nit, 140, 255);
    }

    if (compra.proveedor?.telefono) {
      doc
        .font('Helvetica-Bold')
        .text('Teléfono:', 50, 270)
        .font('Helvetica')
        .text(compra.proveedor.telefono, 140, 270);
    }

    if (compra.proveedor?.email) {
      doc
        .font('Helvetica-Bold')
        .text('Email:', 50, 285)
        .font('Helvetica')
        .text(compra.proveedor.email, 140, 285);
    }

    if (compra.proveedor?.direccion) {
      doc
        .font('Helvetica-Bold')
        .text('Dirección:', 50, 300)
        .font('Helvetica')
        .text(compra.proveedor.direccion, 140, 300, { width: 400 });
    }

    doc
      .strokeColor('#CCCCCC')
      .lineWidth(1)
      .moveTo(50, 330)
      .lineTo(562, 330)
      .stroke();

    // Tabla de productos
    let tableTop = 350;
    
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('DETALLE DE PRODUCTOS', 50, tableTop);

    tableTop += 25;

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .rect(50, tableTop, 512, 20)
      .fillAndStroke('#1a1a1a', '#1a1a1a');

    doc
      .fillColor('#FFFFFF')
      .text('Código', 55, tableTop + 6, { width: 80 })
      .text('Producto', 140, tableTop + 6, { width: 180 })
      .text('Cantidad', 325, tableTop + 6, { width: 60, align: 'right' })
      .text('Costo Unit.', 390, tableTop + 6, { width: 80, align: 'right' })
      .text('Subtotal', 475, tableTop + 6, { width: 80, align: 'right' });

    doc.fillColor('#000000');
    tableTop += 25;

    movimientos.forEach((mov, index) => {
      const y = tableTop + (index * 20);
      
      if (index % 2 === 0) {
        doc
          .fillColor('#f9f9f9')
          .rect(50, y - 3, 512, 20)
          .fill();
        doc.fillColor('#000000');
      }

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(mov.producto?.codigo || 'N/A', 55, y, { width: 80 })
        .text(mov.producto?.nombre || 'Producto', 140, y, { width: 180 })
        .text(mov.cantidad.toString(), 325, y, { width: 60, align: 'right' })
        .text(formatCurrency(mov.costo_unitario), 390, y, { width: 80, align: 'right' })
        .text(formatCurrency(mov.costo_total), 475, y, { width: 80, align: 'right' });
    });

    const afterProductsY = tableTop + (movimientos.length * 20) + 10;
    doc
      .strokeColor('#CCCCCC')
      .lineWidth(1)
      .moveTo(50, afterProductsY)
      .lineTo(562, afterProductsY)
      .stroke();

    // Totales
    const totalesY = afterProductsY + 20;
    
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Subtotal:', 390, totalesY, { width: 80, align: 'right' })
      .font('Helvetica-Bold')
      .text(formatCurrency(compra.subtotal), 475, totalesY, { width: 80, align: 'right' });

    doc
      .font('Helvetica')
      .text(`IVA (${compra.iva_porcentaje || 0}%):`, 390, totalesY + 15, { width: 80, align: 'right' })
      .font('Helvetica-Bold')
      .text(formatCurrency(compra.impuestos), 475, totalesY + 15, { width: 80, align: 'right' });

    if (parseFloat(compra.descuento) > 0) {
      doc
        .font('Helvetica')
        .text('Descuento:', 390, totalesY + 30, { width: 80, align: 'right' })
        .font('Helvetica-Bold')
        .fillColor('#ef4444')
        .text(`-${formatCurrency(compra.descuento)}`, 475, totalesY + 30, { width: 80, align: 'right' });
      doc.fillColor('#000000');
    }

    const totalY = parseFloat(compra.descuento) > 0 ? totalesY + 50 : totalesY + 35;
    doc
      .rect(380, totalY - 5, 182, 25)
      .fillAndStroke('#D4B896', '#D4B896');

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('TOTAL:', 390, totalY + 3, { width: 80, align: 'right' })
      .text(formatCurrency(compra.total), 475, totalY + 3, { width: 80, align: 'right' });

    if (compra.observaciones) {
      const obsY = totalY + 40;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('OBSERVACIONES:', 50, obsY);
      
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(compra.observaciones, 50, obsY + 15, { width: 512 });
    }

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        'Documento generado automáticamente por El Taller - Sistema de Gestión',
        50,
        750,
        { align: 'center', width: 512 }
      );

    doc
      .text(
        `Fecha de generación: ${new Date().toLocaleString('es-CO')}`,
        50,
        765,
        { align: 'center', width: 512 }
      );

    doc.end();

    stream.on('finish', async () => {
      const pdfUrl = `/pdfs/facturas/${filename}`;
      await compra.update({ factura_pdf_url: pdfUrl });

      res.json({
        mensaje: 'PDF generado exitosamente',
        pdf_url: pdfUrl,
        filename
      });
    });

    stream.on('error', (error) => {
      console.error('Error al escribir PDF:', error);
      res.status(500).json({ error: 'Error al generar PDF' });
    });

  } catch (error) {
    console.error('Error en generarPDFFactura:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Descargar PDF de factura
 */
const descargarPDFFactura = async (req, res) => {
  try {
    const { id } = req.params;

    const compra = await Compra.findByPk(id);
    
    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    if (!compra.factura_pdf_url) {
      return res.status(404).json({ 
        error: 'PDF no generado. Genera el PDF primero.' 
      });
    }

    const filename = path.basename(compra.factura_pdf_url);
    const filepath = path.join(PDF_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ 
        error: 'Archivo PDF no encontrado en el servidor' 
      });
    }

    res.download(filepath, filename);

  } catch (error) {
    console.error('Error en descargarPDFFactura:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Editar factura de compra (solo si está pendiente)
 */
const editarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numero_factura,
      fecha_factura,
      observaciones,
      subtotal,
      impuestos,
      descuento,
      total
    } = req.body;

    const compra = await Compra.findByPk(id);
    
    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    if (compra.estado !== 'pendiente') {
      return res.status(400).json({ 
        error: 'Solo se pueden editar compras en estado pendiente' 
      });
    }

    await compra.update({
      numero_factura,
      fecha_factura,
      observaciones,
      subtotal,
      impuestos,
      descuento,
      total
    });

    if (compra.factura_pdf_url) {
      const filename = path.basename(compra.factura_pdf_url);
      const filepath = path.join(PDF_DIR, filename);
      
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      
      await compra.update({ factura_pdf_url: null });
    }

    res.json({
      mensaje: 'Factura actualizada exitosamente',
      compra
    });

  } catch (error) {
    console.error('Error en editarFactura:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Anular factura de compra
 */
const anularFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const compra = await Compra.findByPk(id);
    
    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    if (compra.estado === 'cancelada') {
      return res.status(400).json({ 
        error: 'La compra ya está cancelada' 
      });
    }

    await compra.update({
      estado: 'cancelada',
      observaciones: `ANULADA: ${motivo || 'Sin motivo especificado'}. ${compra.observaciones || ''}`
    });

    res.json({
      mensaje: 'Factura anulada exitosamente',
      compra
    });

  } catch (error) {
    console.error('Error en anularFactura:', error);
    res.status(500).json({ error: error.message });
  }
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

module.exports = {
  generarPDFFactura,
  descargarPDFFactura,
  editarFactura,
  anularFactura
};