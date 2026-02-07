const PDFDocument = require('pdfkit');
const { Compra, Proveedor, Local, MovimientoInventario, Producto } = require('../models');
const { Op } = require('sequelize');
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

    // Si no se encuentran movimientos con compra_id, buscar por otros criterios
    let movimientosFinal = movimientos;
    if (movimientos.length === 0) {
      console.log(`⚠️ No se encontraron movimientos con compra_id para ${id}, buscando por otros criterios...`);
      
      movimientosFinal = await MovimientoInventario.findAll({
        where: {
          tipo: 'compra',
          proveedor_id: compra.proveedor_id,
          local_id: compra.local_id,
          [Op.or]: [
            { numero_factura: compra.numero_factura },
            { 
              fecha_factura: compra.fecha_factura || compra.fecha_compra
            }
          ]
        },
        include: [
          {
            model: Producto,
            as: 'producto',
            attributes: ['nombre', 'codigo']
          }
        ],
        limit: 50 // Limitar por seguridad
      });

      console.log(`📦 Encontrados ${movimientosFinal.length} movimientos por criterios alternativos`);
    }

    const doc = new PDFDocument({ 
      size: 'LETTER',
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    const filename = `factura_${compra.numero_factura || compra.numero_compra}_${Date.now()}.pdf`;
    const filepath = path.join(PDF_DIR, filename);

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // ===== HEADER =====
    // Logo y título
    doc
      .fontSize(26)
      .font('Helvetica-Bold')
      .fillColor('#D4B896')
      .text('EL TALLER', 40, 40);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Sistema de Gestión de Inventario', 40, 70);

    // Cuadro de información de factura (derecha)
    const boxX = 380;
    const boxY = 40;
    doc
      .fillColor('#D4B896')
      .rect(boxX, boxY, 175, 85)
      .fill();

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .text('FACTURA DE COMPRA', boxX + 10, boxY + 10, { width: 155, align: 'center' });

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .text('N° Factura:', boxX + 10, boxY + 35)
      .font('Helvetica')
      .text(compra.numero_factura || 'N/A', boxX + 75, boxY + 35);

    doc
      .font('Helvetica-Bold')
      .text('N° Compra:', boxX + 10, boxY + 50)
      .font('Helvetica')
      .text(compra.numero_compra, boxX + 75, boxY + 50);

    doc
      .font('Helvetica-Bold')
      .text('Fecha:', boxX + 10, boxY + 65)
      .font('Helvetica')
      .text(new Date(compra.fecha_factura || compra.fecha_compra).toLocaleDateString('es-CO'), boxX + 75, boxY + 65);

    // Línea separadora
    doc
      .strokeColor('#D4B896')
      .lineWidth(1)
      .moveTo(40, 140)
      .lineTo(555, 140)
      .stroke();

    // ===== INFORMACIÓN DEL PROVEEDOR =====
    let currentY = 155;
    
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('DATOS DEL PROVEEDOR', 40, currentY);

    currentY += 20;
    
    // Fondo del proveedor
    doc
      .fillColor('#F5F5F5')
      .rect(40, currentY - 5, 515, 80)
      .fill();

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Razón Social:', 50, currentY)
      .font('Helvetica')
      .text(compra.proveedor?.nombre || 'N/A', 140, currentY);

    if (compra.proveedor?.nit) {
      currentY += 15;
      doc
        .font('Helvetica-Bold')
        .text('NIT:', 50, currentY)
        .font('Helvetica')
        .text(compra.proveedor.nit, 140, currentY);
    }

    currentY += 15;
    doc
      .font('Helvetica-Bold')
      .text('Teléfono:', 50, currentY)
      .font('Helvetica')
      .text(compra.proveedor?.telefono || 'N/A', 140, currentY);

    doc
      .font('Helvetica-Bold')
      .text('Email:', 290, currentY)
      .font('Helvetica')
      .text(compra.proveedor?.email || 'N/A', 340, currentY, { width: 200 });

    if (compra.proveedor?.direccion) {
      currentY += 15;
      doc
        .font('Helvetica-Bold')
        .text('Dirección:', 50, currentY)
        .font('Helvetica')
        .text(compra.proveedor.direccion, 140, currentY, { width: 400 });
    }

    currentY += 25;

    // ===== INFORMACIÓN DE LA COMPRA =====
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Local:', 50, currentY)
      .font('Helvetica')
      .text(compra.local?.nombre || 'N/A', 140, currentY);

    // Estado de la compra
    const estadoText = compra.estado.charAt(0).toUpperCase() + compra.estado.slice(1);
    const estadoColor = compra.estado === 'recibida' ? '#10b981' : 
                       compra.estado === 'pendiente' ? '#fbbf24' : '#ef4444';
    
    doc
      .font('Helvetica-Bold')
      .text('Estado:', 290, currentY)
      .fillColor(estadoColor)
      .font('Helvetica-Bold')
      .text(estadoText, 340, currentY);

    doc.fillColor('#000000');
    currentY += 20;

    // ===== TABLA DE PRODUCTOS =====
    doc
      .strokeColor('#CCCCCC')
      .lineWidth(1)
      .moveTo(40, currentY)
      .lineTo(555, currentY)
      .stroke();

    currentY += 10;

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('DETALLE DE PRODUCTOS', 40, currentY);

    currentY += 20;

    // Header de tabla
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .rect(40, currentY, 515, 22)
      .fillAndStroke('#1a1a1a', '#1a1a1a');

    doc
      .fillColor('#FFFFFF')
      .text('Código', 45, currentY + 7, { width: 70 })
      .text('Producto', 120, currentY + 7, { width: 200 })
      .text('Cantidad', 325, currentY + 7, { width: 60, align: 'right' })
      .text('Costo Unit.', 390, currentY + 7, { width: 75, align: 'right' })
      .text('Subtotal', 470, currentY + 7, { width: 80, align: 'right' });

    currentY += 22;

    // Productos
    doc.fillColor('#000000');
    
    if (movimientosFinal.length === 0) {
      // Mostrar mensaje si no hay productos
      currentY += 10;
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#999999')
        .text('No se encontraron productos asociados a esta compra', 40, currentY, { 
          width: 515, 
          align: 'center' 
        });
      currentY += 30;
    } else {
      movimientosFinal.forEach((mov, index) => {
        if (index % 2 === 0) {
          doc
            .fillColor('#f9f9f9')
            .rect(40, currentY, 515, 18)
            .fill();
          doc.fillColor('#000000');
        }

        doc
          .fontSize(8)
          .font('Helvetica')
          .text(mov.producto?.codigo || 'N/A', 45, currentY + 5, { width: 70 })
          .text(mov.producto?.nombre || 'Producto', 120, currentY + 5, { width: 200 })
          .text(mov.cantidad.toString(), 325, currentY + 5, { width: 60, align: 'right' })
          .text(formatCurrency(mov.costo_unitario), 390, currentY + 5, { width: 75, align: 'right' })
          .text(formatCurrency(mov.costo_total), 470, currentY + 5, { width: 80, align: 'right' });

        currentY += 18;
      });
    }

    currentY += 5;
    doc
      .strokeColor('#CCCCCC')
      .lineWidth(1)
      .moveTo(40, currentY)
      .lineTo(555, currentY)
      .stroke();

    // ===== TOTALES =====
    currentY += 15;

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#000000')
      .text('Subtotal:', 390, currentY, { width: 75, align: 'right' })
      .font('Helvetica-Bold')
      .text(formatCurrency(compra.subtotal), 470, currentY, { width: 80, align: 'right' });

    currentY += 15;
    
    // Calcular el IVA real
    const ivaReal = parseFloat(compra.impuestos) || 0;
    const porcentajeIVA = compra.subtotal > 0 ? (ivaReal / compra.subtotal * 100).toFixed(2) : 0;
    
    doc
      .font('Helvetica')
      .text(`IVA (${porcentajeIVA}%):`, 390, currentY, { width: 75, align: 'right' })
      .font('Helvetica-Bold')
      .text(formatCurrency(ivaReal), 470, currentY, { width: 80, align: 'right' });

    if (parseFloat(compra.descuento) > 0) {
      currentY += 15;
      doc
        .font('Helvetica')
        .text('Descuento:', 390, currentY, { width: 75, align: 'right' })
        .font('Helvetica-Bold')
        .fillColor('#ef4444')
        .text(`-${formatCurrency(compra.descuento)}`, 470, currentY, { width: 80, align: 'right' });
      doc.fillColor('#000000');
    }

    currentY += 20;

    // TOTAL final
    doc
      .rect(365, currentY - 5, 190, 28)
      .fillAndStroke('#D4B896', '#D4B896');

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('TOTAL:', 390, currentY + 3, { width: 75, align: 'right' })
      .text(formatCurrency(compra.total), 470, currentY + 3, { width: 80, align: 'right' });

    // Observaciones
    if (compra.observaciones) {
      currentY += 40;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('OBSERVACIONES:', 40, currentY);
      
      currentY += 15;
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(compra.observaciones, 40, currentY, { width: 515 });
    }

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        'Documento generado automáticamente por El Taller - Sistema de Gestión',
        40,
        750,
        { align: 'center', width: 515 }
      );

    doc
      .text(
        `Generado: ${new Date().toLocaleString('es-CO')}`,
        40,
        765,
        { align: 'center', width: 515 }
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