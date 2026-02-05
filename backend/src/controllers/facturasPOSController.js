// Intentar cargar pdfkit de forma segura
let PDFDocument;
try {
  PDFDocument = require("pdfkit");
  console.log("✅ PDFKit cargado correctamente");
} catch (error) {
  console.error("⚠️ No se pudo cargar PDFKit:", error.message);
  PDFDocument = null;
}

const { Pedido, ItemPedido, Producto, Mesa, Local, Usuario } = require("../models");

const facturasPOSController = {
  // Generar PDF de factura/ticket
  generarFacturaPDF: async (req, res) => {
    // Verificar si PDFKit está disponible
    if (!PDFDocument) {
      return res.status(501).json({ 
        error: "Generación de PDF no disponible",
        mensaje: "PDFKit no está instalado correctamente. Ejecute: npm install pdfkit"
      });
    }

    try {
      const { pedido_id } = req.params;

      // Obtener pedido completo
      const pedido = await Pedido.findByPk(pedido_id, {
        include: [
          { 
            model: Mesa, 
            as: "mesa",
            include: [{ model: Local, as: "local" }]
          },
          { 
            model: ItemPedido, 
            as: "items", 
            include: [{ model: Producto, as: "producto" }] 
          },
          { 
            model: Usuario, 
            as: "usuario",
            attributes: ['nombre', 'apellido']
          }
        ],
      });

      if (!pedido) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      // Calcular impuestos (Impoconsumo 8%)
      const subtotalConImpuesto = parseFloat(pedido.subtotal);
      const baseGravable = subtotalConImpuesto / 1.08;
      const impoconsumo = subtotalConImpuesto - baseGravable;
      const cortesia = parseFloat(pedido.monto_cortesia) || 0;
      const totalFinal = Math.max(0, subtotalConImpuesto - cortesia);

      // Crear PDF
      const doc = new PDFDocument({ 
        size: [226.77, 841.89], // 80mm de ancho (ticket térmica)
        margins: { top: 10, bottom: 10, left: 10, right: 10 }
      });

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=factura-${pedido.id}.pdf`);
      
      // Pipe del PDF a la respuesta
      doc.pipe(res);

      // ─────────────────────────────────────────
      // ENCABEZADO
      // ─────────────────────────────────────────
      doc.fontSize(14).font('Helvetica-Bold').text('EL TALLER', { align: 'center' });
      doc.fontSize(8).font('Helvetica').text('Bar & Cervecería', { align: 'center' });
      doc.moveDown(0.3);
      
      // Información del negocio
      doc.fontSize(7);
      doc.text('NIT: 123456789-0', { align: 'center' });
      doc.text('Calle 123 #45-67', { align: 'center' });
      doc.text('Tel: 300 123 4567', { align: 'center' });
      doc.text('Montería, Córdoba', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica-Bold').text('FACTURA POS', { align: 'center' });
      doc.moveDown(0.3);

      // Línea separadora
      doc.strokeColor('#000000').lineWidth(0.5).moveTo(10, doc.y).lineTo(216.77, doc.y).stroke();
      doc.moveDown(0.3);

      // ─────────────────────────────────────────
      // INFORMACIÓN DEL PEDIDO
      // ─────────────────────────────────────────
      doc.fontSize(7).font('Helvetica');
      
      const fecha = new Date(pedido.closed_at || pedido.created_at);
      const fechaStr = fecha.toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      doc.text(`Fecha: ${fechaStr}`, 10, doc.y);
      doc.text(`Factura No: ${pedido.id.slice(0, 8).toUpperCase()}`, 10, doc.y);
      doc.text(`Mesa: ${pedido.mesa?.numero || 'N/A'}`, 10, doc.y);
      doc.text(`Local: ${pedido.mesa?.local?.nombre || 'N/A'}`, 10, doc.y);
      doc.text(`Atendido por: ${pedido.usuario?.nombre || 'N/A'} ${pedido.usuario?.apellido || ''}`, 10, doc.y);
      doc.text(`Método de pago: ${pedido.metodo_pago?.toUpperCase() || 'N/A'}`, 10, doc.y);
      
      doc.moveDown(0.5);

      // Línea separadora
      doc.strokeColor('#000000').lineWidth(0.5).moveTo(10, doc.y).lineTo(216.77, doc.y).stroke();
      doc.moveDown(0.3);

      // ─────────────────────────────────────────
      // DETALLE DE PRODUCTOS
      // ─────────────────────────────────────────
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('CANT  PRODUCTO', 10, doc.y, { continued: true, width: 140 });
      doc.text('TOTAL', { align: 'right', width: 66.77 });
      
      doc.moveDown(0.2);
      doc.strokeColor('#000000').lineWidth(0.5).moveTo(10, doc.y).lineTo(216.77, doc.y).stroke();
      doc.moveDown(0.3);

      // Items
      doc.fontSize(7).font('Helvetica');
      
      pedido.items.forEach(item => {
        const cantidad = item.cantidad;
        const nombre = item.producto?.nombre || 'Producto';
        const precioUnit = parseFloat(item.precio_unitario);
        const subtotalItem = parseFloat(item.subtotal);

        // Línea cantidad + nombre
        doc.text(`${cantidad}x   ${nombre}`, 10, doc.y, { width: 206.77 });
        
        // Precio unitario y subtotal
        const yPos = doc.y;
        doc.text(`$${precioUnit.toLocaleString('es-CO')} c/u`, 15, yPos, { width: 90, align: 'left' });
        doc.text(`$${subtotalItem.toLocaleString('es-CO')}`, 10, yPos, { width: 206.77, align: 'right' });
        
        doc.moveDown(0.4);
      });

      doc.moveDown(0.3);

      // Línea separadora
      doc.strokeColor('#000000').lineWidth(0.5).moveTo(10, doc.y).lineTo(216.77, doc.y).stroke();
      doc.moveDown(0.3);

      // ─────────────────────────────────────────
      // TOTALES CON DESGLOSE DE IMPUESTOS
      // ─────────────────────────────────────────
      doc.fontSize(7).font('Helvetica');

      // Base gravable
      let yPos = doc.y;
      doc.text('Base gravable:', 10, yPos, { width: 140 });
      doc.text(`$${Math.round(baseGravable).toLocaleString('es-CO')}`, 10, yPos, { width: 206.77, align: 'right' });
      doc.moveDown(0.3);

      // Impoconsumo
      yPos = doc.y;
      doc.text('Impoconsumo (8%):', 10, yPos, { width: 140 });
      doc.text(`$${Math.round(impoconsumo).toLocaleString('es-CO')}`, 10, yPos, { width: 206.77, align: 'right' });
      doc.moveDown(0.3);

      // Línea
      doc.strokeColor('#000000').lineWidth(0.5).moveTo(10, doc.y).lineTo(216.77, doc.y).stroke();
      doc.moveDown(0.3);

      // Subtotal
      yPos = doc.y;
      doc.text('Subtotal:', 10, yPos, { width: 140 });
      doc.text(`$${subtotalConImpuesto.toLocaleString('es-CO')}`, 10, yPos, { width: 206.77, align: 'right' });
      doc.moveDown(0.3);

      // Cortesía (si aplica)
      if (cortesia > 0) {
        yPos = doc.y;
        doc.text(`Cortesía (${pedido.razon_cortesia || 'N/A'}):`, 10, yPos, { width: 140 });
        doc.text(`-$${cortesia.toLocaleString('es-CO')}`, 10, yPos, { width: 206.77, align: 'right' });
        doc.moveDown(0.3);
      }

      // Línea doble
      doc.strokeColor('#000000').lineWidth(1).moveTo(10, doc.y).lineTo(216.77, doc.y).stroke();
      doc.moveDown(0.3);

      // Total final
      doc.fontSize(10).font('Helvetica-Bold');
      yPos = doc.y;
      doc.text('TOTAL:', 10, yPos, { width: 140 });
      doc.text(`$${totalFinal.toLocaleString('es-CO')}`, 10, yPos, { width: 206.77, align: 'right' });
      
      doc.moveDown(0.5);

      // Línea doble
      doc.strokeColor('#000000').lineWidth(1).moveTo(10, doc.y).lineTo(216.77, doc.y).stroke();
      doc.moveDown(0.5);

      // ─────────────────────────────────────────
      // PIE DE PÁGINA
      // ─────────────────────────────────────────
      doc.fontSize(7).font('Helvetica');
      doc.text('¡Gracias por su compra!', { align: 'center' });
      doc.moveDown(0.2);
      doc.text('Vuelva pronto', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(6);
      doc.text('Esta es una representación de factura POS', { align: 'center' });
      doc.text('No válida como factura electrónica', { align: 'center' });

      // Finalizar PDF
      doc.end();

    } catch (error) {
      console.error("Error generando factura PDF:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener datos de factura (para previsualización)
  obtenerDatosFactura: async (req, res) => {
    try {
      const { pedido_id } = req.params;

      const pedido = await Pedido.findByPk(pedido_id, {
        include: [
          { 
            model: Mesa, 
            as: "mesa",
            include: [{ model: Local, as: "local" }]
          },
          { 
            model: ItemPedido, 
            as: "items", 
            include: [{ model: Producto, as: "producto" }] 
          },
          { 
            model: Usuario, 
            as: "usuario",
            attributes: ['nombre', 'apellido']
          }
        ],
      });

      if (!pedido) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      // Calcular impuestos
      const subtotalConImpuesto = parseFloat(pedido.subtotal);
      const baseGravable = subtotalConImpuesto / 1.08;
      const impoconsumo = subtotalConImpuesto - baseGravable;
      const cortesia = parseFloat(pedido.monto_cortesia) || 0;
      const totalFinal = Math.max(0, subtotalConImpuesto - cortesia);

      res.json({
        pedido: {
          id: pedido.id,
          fecha: pedido.closed_at || pedido.created_at,
          mesa: pedido.mesa?.numero,
          local: pedido.mesa?.local?.nombre,
          atendidoPor: `${pedido.usuario?.nombre || ''} ${pedido.usuario?.apellido || ''}`.trim(),
          metodoPago: pedido.metodo_pago,
          estado: pedido.estado,
        },
        items: pedido.items.map(item => ({
          cantidad: item.cantidad,
          producto: item.producto?.nombre,
          precioUnitario: parseFloat(item.precio_unitario),
          subtotal: parseFloat(item.subtotal),
        })),
        totales: {
          baseGravable: Math.round(baseGravable),
          impoconsumo: Math.round(impoconsumo),
          subtotal: subtotalConImpuesto,
          cortesia,
          razonCortesia: pedido.razon_cortesia,
          totalFinal,
        }
      });

    } catch (error) {
      console.error("Error obteniendo datos de factura:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = facturasPOSController;