'use strict';

/**
 * MIGRACIÓN: Sistema de Impuestos Flexibles
 * 
 * Crea las tablas necesarias para manejar impuestos configurables por cliente B2B:
 * 1. impuestos - Catálogo de impuestos disponibles
 * 2. cliente_impuestos - Impuestos predeterminados por cliente
 * 3. venta_impuestos - Impuestos aplicados en cada factura
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ═══════════════════════════════════════════════════════════════════
      // 1. TABLA: impuestos (Catálogo de impuestos)
      // ═══════════════════════════════════════════════════════════════════
      await queryInterface.createTable('impuestos', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        codigo: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true,
          comment: 'Código único del impuesto (IVA19, INC8, RETE25, etc.)'
        },
        nombre: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Nombre descriptivo del impuesto'
        },
        descripcion: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Descripción detallada del impuesto'
        },
        tipo: {
          type: Sequelize.ENUM('Impuesto', 'Retencion'),
          allowNull: false,
          defaultValue: 'Impuesto',
          comment: 'Impuesto suma al total, Retención resta del total'
        },
        porcentaje: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          comment: 'Porcentaje del impuesto (ej: 19.00 para 19%)'
        },
        base_calculo: {
          type: Sequelize.ENUM('Subtotal', 'Total', 'BaseGravable'),
          allowNull: false,
          defaultValue: 'Subtotal',
          comment: 'Sobre qué monto se calcula el impuesto'
        },
        aplica_a: {
          type: Sequelize.ENUM('Todos', 'GranContribuyente', 'RegimenComun', 'RegimenSimplificado'),
          allowNull: false,
          defaultValue: 'Todos',
          comment: 'A qué tipo de contribuyente aplica'
        },
        cuenta_contable: {
          type: Sequelize.STRING(20),
          allowNull: true,
          comment: 'Cuenta contable para integración'
        },
        orden: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Orden de aplicación (primero impuestos, luego retenciones)'
        },
        activo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        fecha_creacion: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        fecha_actualizacion: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Índices para impuestos
      await queryInterface.addIndex('impuestos', ['codigo'], { 
        unique: true, 
        transaction 
      });
      await queryInterface.addIndex('impuestos', ['tipo'], { transaction });
      await queryInterface.addIndex('impuestos', ['activo'], { transaction });

      // ═══════════════════════════════════════════════════════════════════
      // 2. TABLA: cliente_impuestos (Impuestos predeterminados por cliente)
      // ═══════════════════════════════════════════════════════════════════
      await queryInterface.createTable('cliente_impuestos', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        cliente_b2b_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'clientes_b2b',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        impuesto_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'impuestos',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        porcentaje_personalizado: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Si es null, usa el porcentaje del catálogo'
        },
        activo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        fecha_creacion: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Índice único para evitar duplicados
      await queryInterface.addIndex('cliente_impuestos', ['cliente_b2b_id', 'impuesto_id'], { 
        unique: true,
        name: 'idx_cliente_impuesto_unico',
        transaction 
      });

      // ═══════════════════════════════════════════════════════════════════
      // 3. TABLA: venta_impuestos (Impuestos aplicados por factura)
      // ═══════════════════════════════════════════════════════════════════
      await queryInterface.createTable('venta_impuestos', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        venta_b2b_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'ventas_b2b',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        impuesto_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'impuestos',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        codigo_impuesto: {
          type: Sequelize.STRING(20),
          allowNull: false,
          comment: 'Copia del código para histórico'
        },
        nombre_impuesto: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Copia del nombre para histórico'
        },
        tipo: {
          type: Sequelize.ENUM('Impuesto', 'Retencion'),
          allowNull: false,
          comment: 'Copia del tipo para histórico'
        },
        porcentaje: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          comment: 'Porcentaje aplicado'
        },
        base: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          comment: 'Base sobre la que se calculó'
        },
        monto: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          comment: 'Monto calculado del impuesto/retención'
        },
        fecha_creacion: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Índices para venta_impuestos
      await queryInterface.addIndex('venta_impuestos', ['venta_b2b_id'], { transaction });
      await queryInterface.addIndex('venta_impuestos', ['impuesto_id'], { transaction });

      // ═══════════════════════════════════════════════════════════════════
      // 4. AGREGAR CAMPOS A ventas_b2b
      // ═══════════════════════════════════════════════════════════════════
      
      // Total impuestos (suma de todos los impuestos)
      await queryInterface.addColumn('ventas_b2b', 'total_impuestos', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Suma de todos los impuestos aplicados'
      }, { transaction });

      // Total retenciones (suma de todas las retenciones)
      await queryInterface.addColumn('ventas_b2b', 'total_retenciones', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Suma de todas las retenciones aplicadas'
      }, { transaction });

      // ═══════════════════════════════════════════════════════════════════
      // 5. AGREGAR CAMPO A clientes_b2b
      // ═══════════════════════════════════════════════════════════════════
      
      // Tipo de contribuyente (para aplicar impuestos según régimen)
      await queryInterface.addColumn('clientes_b2b', 'tipo_contribuyente', {
        type: Sequelize.ENUM('GranContribuyente', 'RegimenComun', 'RegimenSimplificado', 'NoAplica'),
        allowNull: false,
        defaultValue: 'RegimenComun',
        comment: 'Tipo de contribuyente para aplicar retenciones'
      }, { transaction });

      // ═══════════════════════════════════════════════════════════════════
      // 6. INSERTAR IMPUESTOS PREDETERMINADOS
      // ═══════════════════════════════════════════════════════════════════
      const now = new Date();
      
      await queryInterface.bulkInsert('impuestos', [
        // IMPUESTOS (suman al total)
        {
          id: queryInterface.sequelize.fn('uuid_generate_v4'),
          codigo: 'IVA19',
          nombre: 'IVA 19%',
          descripcion: 'Impuesto al Valor Agregado - Tarifa general',
          tipo: 'Impuesto',
          porcentaje: 19.00,
          base_calculo: 'Subtotal',
          aplica_a: 'Todos',
          cuenta_contable: '2408',
          orden: 1,
          activo: true,
          fecha_creacion: now,
          fecha_actualizacion: now
        },
        {
          id: queryInterface.sequelize.fn('uuid_generate_v4'),
          codigo: 'IVA5',
          nombre: 'IVA 5%',
          descripcion: 'Impuesto al Valor Agregado - Tarifa reducida',
          tipo: 'Impuesto',
          porcentaje: 5.00,
          base_calculo: 'Subtotal',
          aplica_a: 'Todos',
          cuenta_contable: '2408',
          orden: 2,
          activo: true,
          fecha_creacion: now,
          fecha_actualizacion: now
        },
        {
          id: queryInterface.sequelize.fn('uuid_generate_v4'),
          codigo: 'IVA0',
          nombre: 'IVA Exento',
          descripcion: 'Productos exentos de IVA',
          tipo: 'Impuesto',
          porcentaje: 0.00,
          base_calculo: 'Subtotal',
          aplica_a: 'Todos',
          cuenta_contable: '2408',
          orden: 3,
          activo: true,
          fecha_creacion: now,
          fecha_actualizacion: now
        },
        {
          id: queryInterface.sequelize.fn('uuid_generate_v4'),
          codigo: 'INC8',
          nombre: 'Impoconsumo 8%',
          descripcion: 'Impuesto Nacional al Consumo - Bares y restaurantes',
          tipo: 'Impuesto',
          porcentaje: 8.00,
          base_calculo: 'Subtotal',
          aplica_a: 'Todos',
          cuenta_contable: '2412',
          orden: 4,
          activo: true,
          fecha_creacion: now,
          fecha_actualizacion: now
        },
        // RETENCIONES (restan del total)
        {
          id: queryInterface.sequelize.fn('uuid_generate_v4'),
          codigo: 'RFTE25',
          nombre: 'ReteFuente 2.5%',
          descripcion: 'Retención en la fuente por compras',
          tipo: 'Retencion',
          porcentaje: 2.50,
          base_calculo: 'Subtotal',
          aplica_a: 'GranContribuyente',
          cuenta_contable: '2365',
          orden: 10,
          activo: true,
          fecha_creacion: now,
          fecha_actualizacion: now
        },
        {
          id: queryInterface.sequelize.fn('uuid_generate_v4'),
          codigo: 'RFTE35',
          nombre: 'ReteFuente 3.5%',
          descripcion: 'Retención en la fuente por servicios',
          tipo: 'Retencion',
          porcentaje: 3.50,
          base_calculo: 'Subtotal',
          aplica_a: 'GranContribuyente',
          cuenta_contable: '2365',
          orden: 11,
          activo: true,
          fecha_creacion: now,
          fecha_actualizacion: now
        },
        {
          id: queryInterface.sequelize.fn('uuid_generate_v4'),
          codigo: 'RIVA15',
          nombre: 'ReteIVA 15%',
          descripcion: 'Retención de IVA (15% del IVA)',
          tipo: 'Retencion',
          porcentaje: 15.00,
          base_calculo: 'BaseGravable',
          aplica_a: 'GranContribuyente',
          cuenta_contable: '2367',
          orden: 12,
          activo: true,
          fecha_creacion: now,
          fecha_actualizacion: now
        },
        {
          id: queryInterface.sequelize.fn('uuid_generate_v4'),
          codigo: 'RICA',
          nombre: 'ReteICA',
          descripcion: 'Retención de ICA (varía según municipio)',
          tipo: 'Retencion',
          porcentaje: 0.69,
          base_calculo: 'Subtotal',
          aplica_a: 'RegimenComun',
          cuenta_contable: '2368',
          orden: 13,
          activo: true,
          fecha_creacion: now,
          fecha_actualizacion: now
        }
      ], { transaction });

      await transaction.commit();
      console.log('✅ Migración de sistema de impuestos completada');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Eliminar columnas agregadas
      await queryInterface.removeColumn('ventas_b2b', 'total_impuestos', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'total_retenciones', { transaction });
      await queryInterface.removeColumn('clientes_b2b', 'tipo_contribuyente', { transaction });

      // Eliminar tablas
      await queryInterface.dropTable('venta_impuestos', { transaction });
      await queryInterface.dropTable('cliente_impuestos', { transaction });
      await queryInterface.dropTable('impuestos', { transaction });

      // Eliminar ENUMs
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_impuestos_tipo";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_impuestos_base_calculo";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_impuestos_aplica_a";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_venta_impuestos_tipo";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_clientes_b2b_tipo_contribuyente";', { transaction });

      await transaction.commit();
      console.log('✅ Rollback de migración completado');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
