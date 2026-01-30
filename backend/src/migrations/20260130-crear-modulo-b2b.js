const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Crear tabla clientes_b2b
    await queryInterface.createTable('clientes_b2b', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      tipo_documento: {
        type: DataTypes.ENUM('NIT', 'CC', 'CE', 'RUT'),
        allowNull: false,
        defaultValue: 'NIT'
      },
      numero_documento: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      razon_social: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      nombre_comercial: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      nombre_contacto: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      cargo_contacto: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      telefono: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      telefono_secundario: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      direccion: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      ciudad: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Montería'
      },
      departamento: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Córdoba'
      },
      codigo_postal: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      limite_credito: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      credito_disponible: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      dias_credito: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      descuento_porcentaje: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
      },
      banco: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      tipo_cuenta: {
        type: DataTypes.ENUM('Ahorros', 'Corriente'),
        allowNull: true
      },
      numero_cuenta: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      estado: {
        type: DataTypes.ENUM('Activo', 'Inactivo', 'Suspendido', 'Bloqueado'),
        allowNull: false,
        defaultValue: 'Activo'
      },
      bloqueado_por_mora: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      dias_mora_maximo: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      notas: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      total_ventas: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
      },
      total_facturas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      ultima_compra: {
        type: DataTypes.DATE,
        allowNull: true
      },
      creado_por: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      actualizado_por: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      fecha_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para clientes_b2b
    await queryInterface.addIndex('clientes_b2b', ['numero_documento'], { unique: true });
    await queryInterface.addIndex('clientes_b2b', ['razon_social']);
    await queryInterface.addIndex('clientes_b2b', ['estado']);
    await queryInterface.addIndex('clientes_b2b', ['email']);

    // 2. Crear tabla ventas_b2b
    await queryInterface.createTable('ventas_b2b', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      numero_factura: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      cliente_b2b_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'clientes_b2b',
          key: 'id'
        }
      },
      local_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'locales',
          key: 'id'
        }
      },
      pedido_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'pedidos',
          key: 'id'
        }
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      descuento: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      iva: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      monto_pagado: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      saldo_pendiente: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      estado_pago: {
        type: DataTypes.ENUM('Pendiente', 'Parcial', 'Pagado', 'Vencido', 'Anulado'),
        allowNull: false,
        defaultValue: 'Pendiente'
      },
      fecha_venta: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      fecha_vencimiento: {
        type: DataTypes.DATE,
        allowNull: false
      },
      fecha_pago_completo: {
        type: DataTypes.DATE,
        allowNull: true
      },
      dias_mora: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      metodo_pago: {
        type: DataTypes.ENUM('Credito', 'Efectivo', 'Transferencia', 'Mixto'),
        allowNull: false,
        defaultValue: 'Credito'
      },
      notas: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      observaciones_anulacion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      vendedor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      anulado_por: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      fecha_anulacion: {
        type: DataTypes.DATE,
        allowNull: true
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      fecha_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para ventas_b2b
    await queryInterface.addIndex('ventas_b2b', ['numero_factura'], { unique: true });
    await queryInterface.addIndex('ventas_b2b', ['cliente_b2b_id']);
    await queryInterface.addIndex('ventas_b2b', ['estado_pago']);
    await queryInterface.addIndex('ventas_b2b', ['fecha_venta']);
    await queryInterface.addIndex('ventas_b2b', ['fecha_vencimiento']);
    await queryInterface.addIndex('ventas_b2b', ['local_id']);

    // 3. Crear tabla items_venta_b2b
    await queryInterface.createTable('items_venta_b2b', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      venta_b2b_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'ventas_b2b',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      producto_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'productos',
          key: 'id'
        }
      },
      nombre_producto: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      descuento_porcentaje: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
      },
      descuento_monto: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      fecha_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para items_venta_b2b
    await queryInterface.addIndex('items_venta_b2b', ['venta_b2b_id']);
    await queryInterface.addIndex('items_venta_b2b', ['producto_id']);

    // 4. Crear tabla pagos_b2b
    await queryInterface.createTable('pagos_b2b', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      numero_recibo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      venta_b2b_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'ventas_b2b',
          key: 'id'
        }
      },
      cliente_b2b_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'clientes_b2b',
          key: 'id'
        }
      },
      monto: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      metodo_pago: {
        type: DataTypes.ENUM('Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Otro'),
        allowNull: false
      },
      referencia_pago: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      banco: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      fecha_pago: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      notas: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      recibido_por: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      turno_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'turnos',
          key: 'id'
        }
      },
      estado: {
        type: DataTypes.ENUM('Aplicado', 'Anulado'),
        allowNull: false,
        defaultValue: 'Aplicado'
      },
      anulado_por: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      fecha_anulacion: {
        type: DataTypes.DATE,
        allowNull: true
      },
      motivo_anulacion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      fecha_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para pagos_b2b
    await queryInterface.addIndex('pagos_b2b', ['numero_recibo'], { unique: true });
    await queryInterface.addIndex('pagos_b2b', ['venta_b2b_id']);
    await queryInterface.addIndex('pagos_b2b', ['cliente_b2b_id']);
    await queryInterface.addIndex('pagos_b2b', ['fecha_pago']);
    await queryInterface.addIndex('pagos_b2b', ['estado']);
  },

  down: async (queryInterface, Sequelize) => {
    // Eliminar en orden inverso debido a las dependencias
    await queryInterface.dropTable('pagos_b2b');
    await queryInterface.dropTable('items_venta_b2b');
    await queryInterface.dropTable('ventas_b2b');
    await queryInterface.dropTable('clientes_b2b');
  }
};
