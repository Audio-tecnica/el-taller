module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Verificar si las columnas ya existen antes de agregarlas
      const tableInfo = await queryInterface.describeTable('ventas_b2b');
      
      // Agregar campo precio_barril a productos si no existe
      const productosInfo = await queryInterface.describeTable('productos');
      if (!productosInfo.precio_barril) {
        await queryInterface.addColumn('productos', 'precio_barril', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Precio de barril completo para ventas B2B'
        }, { transaction });
      }
      
      // Agregar campos fiscales a ventas_b2b si no existen
      if (!tableInfo.base_imponible) {
        await queryInterface.addColumn('ventas_b2b', 'base_imponible', {
          type: Sequelize.DECIMAL(12, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!tableInfo.iva_porcentaje) {
        await queryInterface.addColumn('ventas_b2b', 'iva_porcentaje', {
          type: Sequelize.DECIMAL(5, 2),
          defaultValue: 19.00
        }, { transaction });
      }
      
      if (!tableInfo.iva_monto) {
        await queryInterface.addColumn('ventas_b2b', 'iva_monto', {
          type: Sequelize.DECIMAL(12, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!tableInfo.otros_impuestos) {
        await queryInterface.addColumn('ventas_b2b', 'otros_impuestos', {
          type: Sequelize.DECIMAL(12, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!tableInfo.retefuente) {
        await queryInterface.addColumn('ventas_b2b', 'retefuente', {
          type: Sequelize.DECIMAL(12, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!tableInfo.reteiva) {
        await queryInterface.addColumn('ventas_b2b', 'reteiva', {
          type: Sequelize.DECIMAL(12, 2),
          defaultValue: 0
        }, { transaction });
      }
      
      if (!tableInfo.cufe) {
        await queryInterface.addColumn('ventas_b2b', 'cufe', {
          type: Sequelize.STRING(100),
          allowNull: true
        }, { transaction });
      }
      
      if (!tableInfo.qr_code) {
        await queryInterface.addColumn('ventas_b2b', 'qr_code', {
          type: Sequelize.TEXT,
          allowNull: true
        }, { transaction });
      }
      
      if (!tableInfo.estado_dian) {
        await queryInterface.addColumn('ventas_b2b', 'estado_dian', {
          type: Sequelize.STRING(20),
          defaultValue: 'Pendiente'
        }, { transaction });
      }
      
      if (!tableInfo.fecha_envio_dian) {
        await queryInterface.addColumn('ventas_b2b', 'fecha_envio_dian', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }
      
      if (!tableInfo.respuesta_dian) {
        await queryInterface.addColumn('ventas_b2b', 'respuesta_dian', {
          type: Sequelize.TEXT,
          allowNull: true
        }, { transaction });
      }
      
      await transaction.commit();
      console.log('✅ Migración B2B completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.removeColumn('productos', 'precio_barril', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'base_imponible', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'iva_porcentaje', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'iva_monto', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'otros_impuestos', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'retefuente', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'reteiva', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'cufe', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'qr_code', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'estado_dian', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'fecha_envio_dian', { transaction });
      await queryInterface.removeColumn('ventas_b2b', 'respuesta_dian', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};