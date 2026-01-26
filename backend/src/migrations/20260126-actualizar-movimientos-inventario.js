'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction();
    
    try {
      // Obtener el nombre del tipo ENUM actual
      const [enumTypes] = await queryInterface.sequelize.query(`
        SELECT typname 
        FROM pg_type 
        WHERE typname LIKE 'enum_movimientos_inventario_tipo%'
        ORDER BY typname DESC
        LIMIT 1;
      `, { transaction: t });

      const enumTypeName = enumTypes[0]?.typname || 'enum_movimientos_inventario_tipo';

      // Agregar nuevos valores al ENUM uno por uno
      const newValues = [
        'compra',
        'devolucion_proveedor',
        'ajuste_positivo',
        'ajuste_negativo',
        'merma',
        'donacion',
        'consumo_interno',
        'salida_transferencia',
        'entrada_transferencia'
      ];

      for (const value of newValues) {
        try {
          await queryInterface.sequelize.query(`
            ALTER TYPE "${enumTypeName}" ADD VALUE IF NOT EXISTS '${value}';
          `, { transaction: t });
        } catch (error) {
          // El valor ya existe, continuar
          console.log(`Valor '${value}' ya existe en el ENUM`);
        }
      }

      // Verificar y agregar columnas faltantes
      const tableDescription = await queryInterface.describeTable('movimientos_inventario', { transaction: t });

      if (!tableDescription.numero_movimiento) {
        await queryInterface.addColumn('movimientos_inventario', 'numero_movimiento', {
          type: Sequelize.STRING(20),
          allowNull: true
        }, { transaction: t });
      }

      if (!tableDescription.fecha_movimiento) {
        await queryInterface.addColumn('movimientos_inventario', 'fecha_movimiento', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }, { transaction: t });
      }

      if (!tableDescription.proveedor_id) {
        await queryInterface.addColumn('movimientos_inventario', 'proveedor_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'proveedores',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction: t });
      }

      if (!tableDescription.costo_unitario) {
        await queryInterface.addColumn('movimientos_inventario', 'costo_unitario', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true
        }, { transaction: t });
      }

      if (!tableDescription.costo_total) {
        await queryInterface.addColumn('movimientos_inventario', 'costo_total', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true
        }, { transaction: t });
      }

      if (!tableDescription.valor_venta) {
        await queryInterface.addColumn('movimientos_inventario', 'valor_venta', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true
        }, { transaction: t });
      }

      if (!tableDescription.numero_factura) {
        await queryInterface.addColumn('movimientos_inventario', 'numero_factura', {
          type: Sequelize.STRING(50),
          allowNull: true
        }, { transaction: t });
      }

      if (!tableDescription.fecha_factura) {
        await queryInterface.addColumn('movimientos_inventario', 'fecha_factura', {
          type: Sequelize.DATEONLY,
          allowNull: true
        }, { transaction: t });
      }

      if (!tableDescription.observaciones) {
        await queryInterface.addColumn('movimientos_inventario', 'observaciones', {
          type: Sequelize.TEXT,
          allowNull: true
        }, { transaction: t });
      }

      if (!tableDescription.local_origen_id) {
        await queryInterface.addColumn('movimientos_inventario', 'local_origen_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'locales',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction: t });
      }

      if (!tableDescription.local_destino_id) {
        await queryInterface.addColumn('movimientos_inventario', 'local_destino_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'locales',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction: t });
      }

      if (!tableDescription.movimiento_relacionado_id) {
        await queryInterface.addColumn('movimientos_inventario', 'movimiento_relacionado_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'movimientos_inventario',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction: t });
      }

      if (!tableDescription.autorizado_por) {
        await queryInterface.addColumn('movimientos_inventario', 'autorizado_por', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'usuarios',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction: t });
      }

      // Eliminar constraint antiguo si existe
      await queryInterface.sequelize.query(`
        ALTER TABLE movimientos_inventario 
        DROP CONSTRAINT IF EXISTS check_costos_compra;
      `, { transaction: t });

      // Crear nuevo constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE movimientos_inventario 
        ADD CONSTRAINT check_costos_compra 
        CHECK (
          tipo != 'compra' OR 
          (costo_unitario IS NOT NULL AND costo_total IS NOT NULL AND proveedor_id IS NOT NULL)
        );
      `, { transaction: t });

      await t.commit();
      console.log('✅ Migración completada exitosamente');
    } catch (error) {
      await t.rollback();
      console.error('❌ Error en migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Eliminar constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE movimientos_inventario 
      DROP CONSTRAINT IF EXISTS check_costos_compra;
    `);

    // Eliminar columnas agregadas
    const columnsToRemove = [
      'numero_movimiento',
      'fecha_movimiento',
      'proveedor_id',
      'costo_unitario',
      'costo_total',
      'valor_venta',
      'numero_factura',
      'fecha_factura',
      'observaciones',
      'local_origen_id',
      'local_destino_id',
      'movimiento_relacionado_id',
      'autorizado_por'
    ];

    for (const column of columnsToRemove) {
      try {
        await queryInterface.removeColumn('movimientos_inventario', column);
      } catch (error) {
        console.log(`Columna ${column} no existe o no se pudo eliminar`);
      }
    }
  }
};