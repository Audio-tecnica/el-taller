const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Iniciando migración: Mejora del Sistema de Compras');

      // ================================================
      // 1. AGREGAR CAMPOS A LA TABLA COMPRAS
      // ================================================
      console.log('📝 Agregando campos de pago a tabla compras...');
      
      await queryInterface.addColumn('compras', 'forma_pago', {
        type: DataTypes.ENUM('contado', 'credito'),
        allowNull: false,
        defaultValue: 'contado',
        comment: 'Forma de pago: contado o crédito'
      }, { transaction });

      await queryInterface.addColumn('compras', 'estado_pago', {
        type: DataTypes.ENUM('pendiente', 'pagado', 'parcial'),
        allowNull: false,
        defaultValue: 'pendiente',
        comment: 'Estado del pago de la compra'
      }, { transaction });

      await queryInterface.addColumn('compras', 'fecha_vencimiento', {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha de vencimiento para compras a crédito'
      }, { transaction });

      await queryInterface.addColumn('compras', 'dias_credito', {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Días de crédito otorgados por el proveedor'
      }, { transaction });

      await queryInterface.addColumn('compras', 'monto_pagado', {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
        comment: 'Monto total pagado de la compra'
      }, { transaction });

      await queryInterface.addColumn('compras', 'saldo_pendiente', {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
        comment: 'Saldo pendiente de pago'
      }, { transaction });

      // ================================================
      // 2. CREAR TABLA COMPRAS_IMPUESTOS
      // ================================================
      console.log('📝 Creando tabla compras_impuestos...');
      
      await queryInterface.createTable('compras_impuestos', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        compra_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'compras',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        impuesto_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'impuestos',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        base_calculo: {
          type: DataTypes.DECIMAL(14, 4),
          allowNull: false,
          comment: 'Monto sobre el cual se calcula el impuesto'
        },
        monto_impuesto: {
          type: DataTypes.DECIMAL(14, 4),
          allowNull: false,
          comment: 'Monto calculado del impuesto'
        },
        tipo: {
          type: DataTypes.ENUM('Impuesto', 'Retencion'),
          allowNull: false,
          comment: 'Tipo de impuesto aplicado'
        },
        porcentaje_aplicado: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          comment: 'Porcentaje del impuesto al momento de la compra'
        },
        orden_aplicacion: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Orden en que se aplicó el impuesto'
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Índices para compras_impuestos
      await queryInterface.addIndex('compras_impuestos', ['compra_id'], {
        name: 'idx_compras_impuestos_compra',
        transaction
      });

      await queryInterface.addIndex('compras_impuestos', ['impuesto_id'], {
        name: 'idx_compras_impuestos_impuesto',
        transaction
      });

      // ================================================
      // 3. CREAR TABLA PAGOS_COMPRAS
      // ================================================
      console.log('📝 Creando tabla pagos_compras...');
      
      await queryInterface.createTable('pagos_compras', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        compra_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'compras',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        numero_pago: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true,
          comment: 'Número consecutivo del pago (PAG-2026-00001)'
        },
        fecha_pago: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Fecha en que se realizó el pago'
        },
        monto_pago: {
          type: DataTypes.DECIMAL(14, 4),
          allowNull: false,
          comment: 'Monto del pago realizado'
        },
        forma_pago: {
          type: DataTypes.ENUM('efectivo', 'transferencia', 'cheque', 'tarjeta', 'otro'),
          allowNull: false,
          defaultValue: 'efectivo',
          comment: 'Forma de pago utilizada'
        },
        numero_referencia: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Número de referencia del pago (cheque, transferencia, etc.)'
        },
        banco: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Banco utilizado para el pago'
        },
        observaciones: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        usuario_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'usuarios',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        anulado: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        fecha_anulacion: {
          type: DataTypes.DATE,
          allowNull: true
        },
        motivo_anulacion: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Índices para pagos_compras
      await queryInterface.addIndex('pagos_compras', ['compra_id'], {
        name: 'idx_pagos_compras_compra',
        transaction
      });

      await queryInterface.addIndex('pagos_compras', ['fecha_pago'], {
        name: 'idx_pagos_compras_fecha',
        transaction
      });

      await queryInterface.addIndex('pagos_compras', ['usuario_id'], {
        name: 'idx_pagos_compras_usuario',
        transaction
      });

      // ================================================
      // 4. ACTUALIZAR COMPRAS EXISTENTES
      // ================================================
      console.log('📝 Actualizando compras existentes...');
      
      // Marcar todas las compras existentes como pagadas al contado
      await queryInterface.sequelize.query(`
        UPDATE compras 
        SET 
          forma_pago = 'contado',
          estado_pago = 'pagado',
          monto_pagado = total,
          saldo_pendiente = 0
        WHERE estado = 'recibida'
      `, { transaction });

      await transaction.commit();
      console.log('✅ Migración completada exitosamente');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Revirtiendo migración: Mejora del Sistema de Compras');

      // Eliminar tablas
      await queryInterface.dropTable('pagos_compras', { transaction });
      await queryInterface.dropTable('compras_impuestos', { transaction });

      // Eliminar columnas de compras
      await queryInterface.removeColumn('compras', 'saldo_pendiente', { transaction });
      await queryInterface.removeColumn('compras', 'monto_pagado', { transaction });
      await queryInterface.removeColumn('compras', 'dias_credito', { transaction });
      await queryInterface.removeColumn('compras', 'fecha_vencimiento', { transaction });
      await queryInterface.removeColumn('compras', 'estado_pago', { transaction });
      await queryInterface.removeColumn('compras', 'forma_pago', { transaction });

      await transaction.commit();
      console.log('✅ Migración revertida exitosamente');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error revirtiendo migración:', error);
      throw error;
    }
  }
};