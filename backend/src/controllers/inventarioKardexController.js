const {
  Producto,
  MovimientoInventario,
  Proveedor,
  Local,
  Categoria,
  Usuario,
  Compra,
  Impuesto,
  CompraImpuesto,
} = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

const inventarioKardexController = {
  // ==========================================
  // COMPRAS Y ENTRADAS
  // ==========================================

  registrarCompra: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        proveedor_id,
        local_id,
        numero_factura,
        fecha_factura,
        productos,
        observaciones,
        // ⭐ NUEVOS CAMPOS
        forma_pago,           // 'contado' o 'credito'
        impuestos_aplicados,  // Array de impuestos [{impuesto_id, porcentaje}]
        // Campos para compras a crédito
        dias_credito,
        fecha_vencimiento_manual, // Opcional: sobrescribir el cálculo automático
      } = req.body;
      const usuario_id = req.usuario.id;

      if (!productos || productos.length === 0) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "Debe incluir al menos un producto" });
      }

      // Validar forma de pago
      const formaPago = forma_pago || 'contado';
      if (!['contado', 'credito'].includes(formaPago)) {
        await t.rollback();
        return res.status(400).json({ error: 'Forma de pago inválida' });
      }

      const proveedor = await Proveedor.findByPk(proveedor_id, {
        transaction: t,
      });
      if (!proveedor) {
        await t.rollback();
        return res.status(404).json({ error: "Proveedor no encontrado" });
      }

      // Generar número de compra
      const anio = new Date().getFullYear();
      const ultimaCompra = await Compra.findOne({
        where: { numero_compra: { [Op.like]: `COM-${anio}-%` } },
        order: [["numero_compra", "DESC"]],
        transaction: t,
      });

      let contador = 1;
      if (ultimaCompra) {
        contador = parseInt(ultimaCompra.numero_compra.split("-")[2]) + 1;
      }

      const numero_compra = `COM-${anio}-${String(contador).padStart(5, "0")}`;

      // ================================================
      // PROCESAR PRODUCTOS Y ACTUALIZAR INVENTARIO
      // ================================================
      let subtotal = 0;
      const movimientos = [];

      for (const item of productos) {
        if (item.cantidad <= 0) {
          await t.rollback();
          return res.status(400).json({ error: "Cantidad inválida" });
        }

        const producto = await Producto.findByPk(item.producto_id, {
          transaction: t,
        });
        if (!producto) {
          await t.rollback();
          return res
            .status(404)
            .json({ error: `Producto ${item.producto_id} no encontrado` });
        }

        const stockField =
          local_id === "00000000-0000-0000-0000-000000000001"
            ? "stock_local1"
            : "stock_local2";

        const stockAnterior = producto[stockField];
        const stockNuevo = stockAnterior + item.cantidad;
        const costoTotal = item.cantidad * item.costo_unitario;

        subtotal += costoTotal;

        // Recalcular costo promedio
        const stockTotalAnterior =
          (producto.stock_local1 || 0) + (producto.stock_local2 || 0);
        const nuevoCostoPromedio =
          stockTotalAnterior + item.cantidad > 0
            ? (producto.costo_promedio * stockTotalAnterior + costoTotal) /
              (stockTotalAnterior + item.cantidad)
            : item.costo_unitario;

        await producto.update(
          {
            [stockField]: stockNuevo,
            ultimo_costo: item.costo_unitario,
            costo_promedio: nuevoCostoPromedio,
          },
          { transaction: t },
        );

        if (item.precio_venta) {
          await producto.update(
            { precio_venta: item.precio_venta },
            { transaction: t },
          );
        }

        const movimiento = await MovimientoInventario.create(
          {
            producto_id: item.producto_id,
            local_id,
            tipo: "compra",
            cantidad: item.cantidad,
            stock_anterior: stockAnterior,
            stock_nuevo: stockNuevo,
            costo_unitario: item.costo_unitario,
            costo_total: costoTotal,
            proveedor_id,
            numero_factura,
            fecha_factura,
            fecha_movimiento: new Date(),
            motivo: `Compra a ${proveedor.nombre}`,
            observaciones,
            usuario_id,
          },
          { transaction: t },
        );

        movimientos.push(movimiento);
      }

      // ================================================
      // CALCULAR IMPUESTOS
      // ================================================
      
      let totalImpuestos = 0;
      let totalRetenciones = 0;
      const impuestosRegistrados = [];
      
      if (impuestos_aplicados && impuestos_aplicados.length > 0) {
        // Ordenar impuestos por orden de aplicación
        const impuestosOrdenados = [];
        
        for (const impAplicado of impuestos_aplicados) {
          const impuesto = await Impuesto.findByPk(impAplicado.impuesto_id, { transaction: t });
          if (!impuesto) {
            await t.rollback();
            return res.status(404).json({ error: `Impuesto ${impAplicado.impuesto_id} no encontrado` });
          }
          impuestosOrdenados.push({
            ...impAplicado,
            impuesto
          });
        }
        
        // Ordenar: primero impuestos, luego retenciones
        impuestosOrdenados.sort((a, b) => {
          if (a.impuesto.tipo === 'Impuesto' && b.impuesto.tipo === 'Retencion') return -1;
          if (a.impuesto.tipo === 'Retencion' && b.impuesto.tipo === 'Impuesto') return 1;
          return a.impuesto.orden - b.impuesto.orden;
        });
        
        // Calcular cada impuesto
        let baseCalculo = subtotal;
        
        for (let i = 0; i < impuestosOrdenados.length; i++) {
          const impAplicado = impuestosOrdenados[i];
          const impuesto = impAplicado.impuesto;
          
          // Determinar base de cálculo según configuración
          if (impuesto.base_calculo === 'Total' && i > 0) {
            // Si es base Total, usar subtotal + impuestos ya aplicados
            baseCalculo = subtotal + totalImpuestos;
          } else {
            baseCalculo = subtotal;
          }
          
          const porcentajeAplicado = impAplicado.porcentaje || impuesto.porcentaje;
          const montoImpuesto = (baseCalculo * parseFloat(porcentajeAplicado)) / 100;
          
          if (impuesto.tipo === 'Impuesto') {
            totalImpuestos += montoImpuesto;
          } else {
            totalRetenciones += montoImpuesto;
          }
          
          impuestosRegistrados.push({
            impuesto_id: impuesto.id,
            base_calculo: baseCalculo,
            monto_impuesto: montoImpuesto,
            tipo: impuesto.tipo,
            porcentaje_aplicado: porcentajeAplicado,
            orden_aplicacion: i + 1
          });
        }
      }

      const totalCompra = subtotal + totalImpuestos - totalRetenciones;

      // ================================================
      // CALCULAR FECHA DE VENCIMIENTO PARA CRÉDITO
      // ================================================
      let fechaVencimiento = null;
      let diasCreditoFinal = null;
      
      if (formaPago === 'credito') {
        if (fecha_vencimiento_manual) {
          fechaVencimiento = fecha_vencimiento_manual;
        } else {
          // Obtener días de crédito del proveedor o usar el especificado
          diasCreditoFinal = dias_credito || proveedor.terminos_pago_dias || 30;
          
          const fechaBase = fecha_factura ? new Date(fecha_factura) : new Date();
          fechaVencimiento = new Date(fechaBase);
          fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCreditoFinal);
        }
      }

      // ================================================
      // CREAR REGISTRO DE COMPRA
      // ================================================
      const compra = await Compra.create(
        {
          numero_compra,
          proveedor_id,
          local_id,
          numero_factura,
          fecha_factura,
          subtotal,
          impuestos: totalImpuestos - totalRetenciones,
          total: totalCompra,
          estado: "recibida",
          observaciones,
          usuario_id,
          // ⭐ NUEVOS CAMPOS
          forma_pago: formaPago,
          estado_pago: formaPago === 'contado' ? 'pagado' : 'pendiente',
          fecha_vencimiento: fechaVencimiento,
          dias_credito: diasCreditoFinal,
          monto_pagado: formaPago === 'contado' ? totalCompra : 0,
          saldo_pendiente: formaPago === 'contado' ? 0 : totalCompra
        },
        { transaction: t },
      );

      // ================================================
      // REGISTRAR IMPUESTOS APLICADOS
      // ================================================
      if (impuestosRegistrados.length > 0) {
        for (const impReg of impuestosRegistrados) {
          await CompraImpuesto.create({
            compra_id: compra.id,
            ...impReg
          }, { transaction: t });
        }
      }

      // ================================================
      // SI ES AL CONTADO, CREAR PAGO AUTOMÁTICO
      // ================================================
      if (formaPago === 'contado') {
        const { PagoCompra } = require('../models');
        
        // Generar número de pago
        const ultimoPago = await PagoCompra.findOne({
          where: { numero_pago: { [Op.like]: `PAG-${anio}-%` } },
          order: [['numero_pago', 'DESC']],
          transaction: t
        });
        
        let contadorPago = 1;
        if (ultimoPago) {
          contadorPago = parseInt(ultimoPago.numero_pago.split('-')[2]) + 1;
        }
        
        const numeroPago = `PAG-${anio}-${String(contadorPago).padStart(5, '0')}`;
        
        await PagoCompra.create({
          compra_id: compra.id,
          numero_pago: numeroPago,
          fecha_pago: new Date(),
          monto_pago: totalCompra,
          forma_pago: 'efectivo',
          observaciones: 'Pago automático - Compra al contado',
          usuario_id
        }, { transaction: t });
      }

      // ================================================
      // OBTENER DATOS COMPLETOS ANTES DEL COMMIT
      // ================================================
      const compraCompleta = await Compra.findByPk(compra.id, {
        transaction: t,  // ⭐ IMPORTANTE: Usar la transacción
        include: [
          { model: Proveedor, as: 'proveedor' },
          { 
            model: CompraImpuesto, 
            as: 'impuestos',
            include: [{ model: Impuesto, as: 'impuesto' }]
          }
        ]
      });

      // ================================================
      // COMMIT AL FINAL DE TODO
      // ================================================
      await t.commit();

      // ================================================
      // RESPUESTA EXITOSA
      // ================================================
      res.json({
        mensaje: "Compra registrada exitosamente",
        compra: compraCompleta,
        movimientos: movimientos.length,
        resumen: {
          subtotal,
          total_impuestos: totalImpuestos,
          total_retenciones: totalRetenciones,
          total: totalCompra,
          forma_pago: formaPago,
          estado_pago: compra.estado_pago,
          fecha_vencimiento: fechaVencimiento,
          saldo_pendiente: compra.saldo_pendiente
        }
      });
    } catch (error) {
      // Verificar que la transacción no haya sido finalizada
      if (t && !t.finished) {
        await t.rollback();
      }
      console.error("Error en registrarCompra:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Registrar devolución a proveedor (salida)
  registrarDevolucionProveedor: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        producto_id,
        local_id,
        proveedor_id,
        cantidad,
        costo_unitario,
        numero_factura,
        motivo,
        observaciones,
      } = req.body;
      const usuario_id = req.usuario.id;

      const producto = await Producto.findByPk(producto_id, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const stockField =
        local_id === "00000000-0000-0000-0000-000000000001"
          ? "stock_local1"
          : "stock_local2";
      const stockAnterior = producto[stockField];

      if (stockAnterior < cantidad) {
        await t.rollback();
        return res.status(400).json({
          error: `Stock insuficiente. Disponible: ${stockAnterior}, Solicitado: ${cantidad}`,
        });
      }

      const stockNuevo = stockAnterior - cantidad;

      await producto.update({ [stockField]: stockNuevo }, { transaction: t });

      const movimiento = await MovimientoInventario.create(
        {
          producto_id,
          local_id,
          tipo: "devolucion_proveedor",
          cantidad: -cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          costo_unitario,
          costo_total: cantidad * costo_unitario,
          proveedor_id,
          numero_factura,
          motivo: motivo || "Devolución a proveedor",
          observaciones,
          usuario_id,
        },
        { transaction: t },
      );

      await t.commit();

      res.json({
        mensaje: "Devolución registrada exitosamente",
        movimiento,
      });
    } catch (error) {
      await t.rollback();
      console.error("Error en registrarDevolucionProveedor:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // =====================================================
  // INVENTARIO CONSOLIDADO (KARDEX BASED)
  // =====================================================
  obtenerInventarioConsolidado: async (req, res) => {
    try {
      const resultados = await MovimientoInventario.findAll({
        attributes: [
          "producto_id",
          "local_id",
          [sequelize.fn("SUM", sequelize.col("cantidad")), "stock_calculado"],
        ],
        include: [
          {
            model: Producto,
            as: "producto",
            attributes: ["id", "nombre"],
          },
          {
            model: Local,
            as: "local",
            attributes: ["id", "nombre"],
          },
        ],
        group: ["producto_id", "local_id", "producto.id", "local.id"],
        order: [
          ["producto_id", "ASC"],
          ["local_id", "ASC"],
        ],
      });

      res.json(resultados);
    } catch (error) {
      console.error("Error inventario consolidado:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================
  // AJUSTES DE INVENTARIO
  // ==========================================

  // Ajuste de inventario (positivo o negativo)
  ajustarInventario: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        producto_id,
        local_id,
        cantidad_contada,
        motivo,
        observaciones,
        autorizado_por,
      } = req.body;
      const usuario_id = req.usuario.id;

      const producto = await Producto.findByPk(producto_id, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const stockField =
        local_id === "00000000-0000-0000-0000-000000000001"
          ? "stock_local1"
          : "stock_local2";
      const stockAnterior = producto[stockField];
      const diferencia = cantidad_contada - stockAnterior;

      if (diferencia === 0) {
        await t.rollback();
        return res.status(400).json({
          error:
            "El stock contado es igual al stock actual. No se requiere ajuste.",
        });
      }

      const tipo = diferencia > 0 ? "ajuste_positivo" : "ajuste_negativo";

      await producto.update(
        { [stockField]: cantidad_contada },
        { transaction: t },
      );

      const movimiento = await MovimientoInventario.create(
        {
          producto_id,
          local_id,
          tipo,
          cantidad: diferencia,
          stock_anterior: stockAnterior,
          stock_nuevo: cantidad_contada,
          motivo: motivo || "Ajuste por conteo físico",
          observaciones,
          usuario_id,
          autorizado_por,
        },
        { transaction: t },
      );

      await t.commit();

      res.json({
        mensaje: `Ajuste de inventario registrado (${diferencia > 0 ? "+" : ""}${diferencia} unidades)`,
        movimiento,
      });
    } catch (error) {
      await t.rollback();
      console.error("Error en ajustarInventario:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Registrar merma
  registrarMerma: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        producto_id,
        local_id,
        cantidad,
        motivo,
        observaciones,
        autorizado_por,
      } = req.body;
      const usuario_id = req.usuario.id;

      const producto = await Producto.findByPk(producto_id, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const stockField =
        local_id === "00000000-0000-0000-0000-000000000001"
          ? "stock_local1"
          : "stock_local2";
      const stockAnterior = producto[stockField];

      if (stockAnterior < cantidad) {
        await t.rollback();
        return res.status(400).json({
          error: `Stock insuficiente. Disponible: ${stockAnterior}, Solicitado: ${cantidad}`,
        });
      }

      const stockNuevo = stockAnterior - cantidad;

      await producto.update({ [stockField]: stockNuevo }, { transaction: t });

      const movimiento = await MovimientoInventario.create(
        {
          producto_id,
          local_id,
          tipo: "merma",
          cantidad: -cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          costo_unitario: producto.costo_promedio,
          costo_total: cantidad * producto.costo_promedio,
          motivo: motivo || "Merma de inventario",
          observaciones,
          usuario_id,
          autorizado_por,
        },
        { transaction: t },
      );

      await t.commit();

      res.json({
        mensaje: "Merma registrada exitosamente",
        movimiento,
        costo_merma: cantidad * producto.costo_promedio,
      });
    } catch (error) {
      await t.rollback();
      console.error("Error en registrarMerma:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================
  // TRANSFERENCIAS ENTRE LOCALES
  // ==========================================

  // Transferir entre locales (mejorado)
  transferirEntreLocales: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        producto_id,
        local_origen_id,
        local_destino_id,
        cantidad,
        motivo,
        observaciones,
      } = req.body;
      const usuario_id = req.usuario.id;

      if (local_origen_id === local_destino_id) {
        await t.rollback();
        return res.status(400).json({
          error: "El local de origen y destino deben ser diferentes",
        });
      }

      const producto = await Producto.findByPk(producto_id, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const stockFieldOrigen =
        local_origen_id === "00000000-0000-0000-0000-000000000001"
          ? "stock_local1"
          : "stock_local2";
      const stockFieldDestino =
        local_destino_id === "00000000-0000-0000-0000-000000000001"
          ? "stock_local1"
          : "stock_local2";

      const stockOrigen = producto[stockFieldOrigen];
      const stockDestino = producto[stockFieldDestino];

      if (stockOrigen < cantidad) {
        await t.rollback();
        return res.status(400).json({
          error: `Stock insuficiente en local origen. Disponible: ${stockOrigen}, Solicitado: ${cantidad}`,
        });
      }

      await producto.update(
        {
          [stockFieldOrigen]: stockOrigen - cantidad,
          [stockFieldDestino]: stockDestino + cantidad,
        },
        { transaction: t },
      );

      // Movimiento de salida
      const movSalida = await MovimientoInventario.create(
        {
          producto_id,
          local_id: local_origen_id,
          tipo: "salida_transferencia",
          cantidad: -cantidad,
          stock_anterior: stockOrigen,
          stock_nuevo: stockOrigen - cantidad,
          local_origen_id,
          local_destino_id,
          costo_unitario: producto.costo_promedio,
          costo_total: cantidad * producto.costo_promedio,
          motivo: motivo || "Transferencia entre locales",
          observaciones,
          usuario_id,
        },
        { transaction: t },
      );

      // Movimiento de entrada
      const movEntrada = await MovimientoInventario.create(
        {
          producto_id,
          local_id: local_destino_id,
          tipo: "entrada_transferencia",
          cantidad: cantidad,
          stock_anterior: stockDestino,
          stock_nuevo: stockDestino + cantidad,
          local_origen_id,
          local_destino_id,
          costo_unitario: producto.costo_promedio,
          costo_total: cantidad * producto.costo_promedio,
          motivo: motivo || "Transferencia entre locales",
          observaciones,
          usuario_id,
          movimiento_relacionado_id: movSalida.id,
        },
        { transaction: t },
      );

      // Relacionar movimientos
      await movSalida.update(
        { movimiento_relacionado_id: movEntrada.id },
        { transaction: t },
      );

      await t.commit();

      res.json({
        mensaje: `Transferencia completada: ${cantidad} unidades`,
        movimiento_salida: movSalida,
        movimiento_entrada: movEntrada,
      });
    } catch (error) {
      await t.rollback();
      console.error("Error en transferirEntreLocales:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================
  // CONSULTAS Y REPORTES KARDEX
  // ==========================================

  // Obtener kardex de un producto
  getKardexProducto: async (req, res) => {
    try {
      const { producto_id } = req.params;
      const { fecha_inicio, fecha_fin, local_id, limit = 100 } = req.query;

      const where = { producto_id };

      if (local_id) where.local_id = local_id;

      if (fecha_inicio && fecha_fin) {
        where.fecha_movimiento = {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
        };
      }

      const movimientos = await MovimientoInventario.findAll({
        where,
        include: [
          {
            model: Producto,
            as: "producto",
            attributes: ["id", "nombre", "codigo"],
          },
          { model: Local, as: "local", attributes: ["id", "nombre"] },
          { model: Proveedor, as: "proveedor", attributes: ["id", "nombre"] },
          { model: Usuario, as: "usuario", attributes: ["id", "nombre"] },
        ],
        order: [["fecha_movimiento", "DESC"]],
        limit: parseInt(limit),
      });

      // Calcular totales
      const resumen = {
        total_entradas: 0,
        total_salidas: 0,
        valor_entradas: 0,
        valor_salidas: 0,
        stock_inicial:
          movimientos.length > 0
            ? movimientos[movimientos.length - 1].stock_anterior
            : 0,
        stock_final: movimientos.length > 0 ? movimientos[0].stock_nuevo : 0,
      };

      movimientos.forEach((mov) => {
        if (mov.cantidad > 0) {
          resumen.total_entradas += mov.cantidad;
          resumen.valor_entradas += parseFloat(mov.costo_total || 0);
        } else {
          resumen.total_salidas += Math.abs(mov.cantidad);
          resumen.valor_salidas += parseFloat(
            mov.valor_venta || mov.costo_total || 0,
          );
        }
      });

      res.json({
        producto_id,
        movimientos,
        resumen,
      });
    } catch (error) {
      console.error("Error en getKardexProducto:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener todos los movimientos con filtros
  getMovimientos: async (req, res) => {
    try {
      const {
        producto_id,
        local_id,
        tipo,
        proveedor_id,
        fecha_inicio,
        fecha_fin,
        limit = 50,
      } = req.query;

      const where = {};
      if (producto_id) where.producto_id = producto_id;
      if (local_id) where.local_id = local_id;
      if (tipo) where.tipo = tipo;
      if (proveedor_id) where.proveedor_id = proveedor_id;

      if (fecha_inicio && fecha_fin) {
        where.fecha_movimiento = {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
        };
      }

      const movimientos = await MovimientoInventario.findAll({
        where,
        include: [
          {
            model: Producto,
            as: "producto",
            attributes: ["id", "nombre"],
            required: false,
          },
          {
            model: Local,
            as: "local",
            attributes: ["id", "nombre"],
            required: false,
          },
          {
            model: Proveedor,
            as: "proveedor",
            attributes: ["id", "nombre"],
            required: false,
          },
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "nombre"],
            required: false,
          },
        ],
        order: [["fecha_movimiento", "DESC"]],
        limit: parseInt(limit),
      });

      res.json(movimientos);
    } catch (error) {
      console.error("Error en getMovimientos:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================
  // INVENTARIO VALORIZADO MEJORADO - COMPATIBLE
  // Versión que funciona con la estructura actual sin cambios en BD
  // ==========================================

  getInventarioValorizado: async (req, res) => {
    try {
      const { local_id } = req.query;

      console.log('📊 ===== INVENTARIO VALORIZADO =====');
      console.log('🏢 Local filtro:', local_id || 'Todos');

      const productos = await Producto.findAll({
        where: { activo: true },
        include: [
          { 
            model: Categoria, 
            as: "categoria",
            required: false 
          }
        ],
        order: [["nombre", "ASC"]],
      });

      console.log(`📦 Total productos activos: ${productos.length}`);

      // Calcular fecha de 90 días atrás para análisis de rotación
      const fecha90DiasAtras = new Date();
      fecha90DiasAtras.setDate(fecha90DiasAtras.getDate() - 90);

      const inventarioValorizado = await Promise.all(productos.map(async (p) => {
        const stockLocal1 = p.stock_local1 || 0;
        const stockLocal2 = p.stock_local2 || 0;
        const stockTotal = stockLocal1 + stockLocal2;

        // Determinar stock según filtro de local
        let stock = stockTotal;
        let nombreLocal = "Todos los locales";
        if (local_id === "00000000-0000-0000-0000-000000000001") {
          stock = stockLocal1;
          nombreLocal = "Castellana";
        }
        if (local_id === "00000000-0000-0000-0000-000000000002") {
          stock = stockLocal2;
          nombreLocal = "Avenida 1ra";
        }

        // Calcular valores financieros
        const costoPromedio = parseFloat(p.costo_promedio || 0);
        const ultimoCosto = parseFloat(p.ultimo_costo || 0);
        const precioVenta = parseFloat(p.precio_venta || 0);
        
        const valorCosto = stock * costoPromedio;
        const valorVenta = stock * precioVenta;
        const utilidadPotencial = valorVenta - valorCosto;
        
        const margenPorcentaje = costoPromedio > 0
          ? ((precioVenta - costoPromedio) / costoPromedio) * 100
          : 0;
        
        const margenAbsoluto = precioVenta - costoPromedio;

        // ⭐ ANÁLISIS DE ROTACIÓN - Últimos 90 días
        const whereMovimientos = {
          producto_id: p.id,
          tipo: 'venta',
          fecha_movimiento: {
            [Op.gte]: fecha90DiasAtras
          }
        };

        // Si hay filtro de local, aplicarlo a los movimientos
        if (local_id) {
          whereMovimientos.local_id = local_id;
        }

        let ventasUltimos90Dias = 0;
        try {
          const sumResult = await MovimientoInventario.sum('cantidad', {
            where: whereMovimientos
          });
          ventasUltimos90Dias = Math.abs(sumResult || 0);
        } catch (error) {
          console.log(`⚠️ No se pudo calcular rotación para ${p.nombre}:`, error.message);
          ventasUltimos90Dias = 0;
        }

        // Calcular rotación diaria promedio
        const rotacionDiaria = ventasUltimos90Dias / 90;
        
        // Días de inventario disponible (a este ritmo de venta)
        const diasInventario = rotacionDiaria > 0 
          ? Math.round(stock / rotacionDiaria)
          : 999;

        // Clasificación de rotación
        let clasificacionRotacion = 'Sin movimiento';
        let colorRotacion = 'red';
        
        if (ventasUltimos90Dias === 0) {
          clasificacionRotacion = 'Sin movimiento';
          colorRotacion = 'red';
        } else if (diasInventario <= 30) {
          clasificacionRotacion = 'Alta rotación';
          colorRotacion = 'green';
        } else if (diasInventario <= 90) {
          clasificacionRotacion = 'Rotación media';
          colorRotacion = 'yellow';
        } else {
          clasificacionRotacion = 'Baja rotación';
          colorRotacion = 'orange';
        }

        // Estado del stock
        const alertaStock = p.alerta_stock || 5;
        const stockBajo = stockTotal <= alertaStock;
        const stockCritico = stockTotal <= (alertaStock / 2);
        const sinStock = stockTotal === 0;

        return {
          // Información básica
          producto_id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          categoria: p.categoria?.nombre || 'Sin categoría',
          categoria_id: p.categoria_id,
          
          // Stock
          stock,
          stock_local1: stockLocal1,
          stock_local2: stockLocal2,
          stock_total: stockTotal,
          local_filtrado: nombreLocal,
          alerta_stock: alertaStock,
          
          // Estados de stock
          stock_bajo: stockBajo,
          stock_critico: stockCritico,
          sin_stock: sinStock,
          
          // Precios y costos
          costo_promedio: costoPromedio,
          ultimo_costo: ultimoCosto,
          precio_venta: precioVenta,
          
          // Valores calculados
          valor_inventario_costo: valorCosto,
          valor_inventario_venta: valorVenta,
          utilidad_potencial: utilidadPotencial,
          margen_porcentaje: margenPorcentaje.toFixed(2),
          margen_absoluto: margenAbsoluto,
          
          // ⭐ DATOS DE ROTACIÓN
          ventas_90_dias: ventasUltimos90Dias,
          rotacion_diaria: rotacionDiaria.toFixed(2),
          dias_inventario: diasInventario === 999 ? '∞' : diasInventario,
          clasificacion_rotacion: clasificacionRotacion,
          color_rotacion: colorRotacion,
        };
      }));

      console.log(`✅ Inventario valorizado calculado: ${inventarioValorizado.length} productos`);

      // Filtrar productos con stock 0 si no hay filtro de local
      const inventarioFiltrado = local_id 
        ? inventarioValorizado 
        : inventarioValorizado.filter(p => p.stock > 0);

      console.log(`📊 Productos después de filtro: ${inventarioFiltrado.length}`);

      // ⭐ CALCULAR TOTALES Y MÉTRICAS GLOBALES
      const totales = {
        // Totales básicos
        total_productos: inventarioFiltrado.length,
        total_productos_activos: inventarioFiltrado.filter(p => p.stock > 0).length,
        
        // Valores financieros
        valor_total_costo: inventarioFiltrado.reduce((sum, p) => sum + p.valor_inventario_costo, 0),
        valor_total_venta: inventarioFiltrado.reduce((sum, p) => sum + p.valor_inventario_venta, 0),
        utilidad_potencial_total: inventarioFiltrado.reduce((sum, p) => sum + p.utilidad_potencial, 0),
        margen_promedio_ponderado: 0,
        
        // Alertas de stock
        productos_sin_stock: inventarioFiltrado.filter(p => p.sin_stock).length,
        productos_stock_critico: inventarioFiltrado.filter(p => p.stock_critico).length,
        productos_stock_bajo: inventarioFiltrado.filter(p => p.stock_bajo).length,
        
        // ⭐ ANÁLISIS DE ROTACIÓN
        productos_alta_rotacion: inventarioFiltrado.filter(p => p.clasificacion_rotacion === 'Alta rotación').length,
        productos_media_rotacion: inventarioFiltrado.filter(p => p.clasificacion_rotacion === 'Rotación media').length,
        productos_baja_rotacion: inventarioFiltrado.filter(p => p.clasificacion_rotacion === 'Baja rotación').length,
        productos_sin_movimiento: inventarioFiltrado.filter(p => p.clasificacion_rotacion === 'Sin movimiento').length,
        
        // Totales de ventas
        ventas_90_dias_total: inventarioFiltrado.reduce((sum, p) => sum + p.ventas_90_dias, 0),
      };

      // Calcular margen promedio ponderado (por valor, no por producto)
      totales.margen_promedio_ponderado = totales.valor_total_costo > 0
        ? ((totales.utilidad_potencial_total / totales.valor_total_costo) * 100).toFixed(2)
        : "0.00";

      // ⭐ DESGLOSE POR LOCAL (solo si no hay filtro de local)
      let desglosePorLocal = null;
      if (!local_id) {
        desglosePorLocal = {
          castellana: {
            valor_costo: 0,
            valor_venta: 0,
            utilidad_potencial: 0,
            productos_con_stock: 0,
          },
          avenida_1ra: {
            valor_costo: 0,
            valor_venta: 0,
            utilidad_potencial: 0,
            productos_con_stock: 0,
          }
        };

        inventarioValorizado.forEach(p => {
          // Castellana (Local 1)
          const valorCostoL1 = p.stock_local1 * p.costo_promedio;
          const valorVentaL1 = p.stock_local1 * p.precio_venta;
          desglosePorLocal.castellana.valor_costo += valorCostoL1;
          desglosePorLocal.castellana.valor_venta += valorVentaL1;
          desglosePorLocal.castellana.utilidad_potencial += (valorVentaL1 - valorCostoL1);
          if (p.stock_local1 > 0) desglosePorLocal.castellana.productos_con_stock++;

          // Avenida 1ra (Local 2)
          const valorCostoL2 = p.stock_local2 * p.costo_promedio;
          const valorVentaL2 = p.stock_local2 * p.precio_venta;
          desglosePorLocal.avenida_1ra.valor_costo += valorCostoL2;
          desglosePorLocal.avenida_1ra.valor_venta += valorVentaL2;
          desglosePorLocal.avenida_1ra.utilidad_potencial += (valorVentaL2 - valorCostoL2);
          if (p.stock_local2 > 0) desglosePorLocal.avenida_1ra.productos_con_stock++;
        });
      }

      // ⭐ TOP PRODUCTOS (para el dashboard)
      const topProductos = {
        mayor_valor: [...inventarioFiltrado]
          .sort((a, b) => b.valor_inventario_costo - a.valor_inventario_costo)
          .slice(0, 5),
        
        mayor_utilidad: [...inventarioFiltrado]
          .sort((a, b) => b.utilidad_potencial - a.utilidad_potencial)
          .slice(0, 5),
        
        mayor_rotacion: [...inventarioFiltrado]
          .filter(p => p.ventas_90_dias > 0)
          .sort((a, b) => b.ventas_90_dias - a.ventas_90_dias)
          .slice(0, 5),
        
        sin_movimiento: [...inventarioFiltrado]
          .filter(p => p.ventas_90_dias === 0 && p.stock > 0)
          .sort((a, b) => b.valor_inventario_costo - a.valor_inventario_costo)
          .slice(0, 5),
      };

      console.log('✅ ===== RESPUESTA PREPARADA =====');
      console.log(`📦 Productos: ${inventarioFiltrado.length}`);
      console.log(`💰 Valor total: $${totales.valor_total_costo.toLocaleString()}`);
      console.log(`🔄 Alta rotación: ${totales.productos_alta_rotacion}`);
      console.log(`💤 Sin movimiento: ${totales.productos_sin_movimiento}`);

      res.json({
        productos: inventarioFiltrado,
        totales,
        desglosePorLocal,
        topProductos,
        filtros_aplicados: {
          local_id: local_id || null,
        },
        fecha_calculo: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error en getInventarioValorizado:", error);
      console.error("Stack:", error.stack);
      res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },
};

module.exports = inventarioKardexController;