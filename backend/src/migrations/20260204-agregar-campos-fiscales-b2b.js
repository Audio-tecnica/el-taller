module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ventas_b2b', 'base_imponible', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    });
    
    await queryInterface.addColumn('ventas_b2b', 'iva_porcentaje', {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 19.00
    });
    
    await queryInterface.addColumn('ventas_b2b', 'iva_monto', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    });
    
    await queryInterface.addColumn('ventas_b2b', 'otros_impuestos', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    });
    
    await queryInterface.addColumn('ventas_b2b', 'retefuente', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    });
    
    await queryInterface.addColumn('ventas_b2b', 'reteiva', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    });
    
    await queryInterface.addColumn('ventas_b2b', 'cufe', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    
    await queryInterface.addColumn('ventas_b2b', 'qr_code', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('ventas_b2b', 'estado_dian', {
      type: Sequelize.ENUM('Pendiente', 'Enviado', 'Aprobado', 'Rechazado'),
      defaultValue: 'Pendiente'
    });
    
    await queryInterface.addColumn('ventas_b2b', 'fecha_envio_dian', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('ventas_b2b', 'respuesta_dian', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ventas_b2b', 'base_imponible');
    await queryInterface.removeColumn('ventas_b2b', 'iva_porcentaje');
    await queryInterface.removeColumn('ventas_b2b', 'iva_monto');
    await queryInterface.removeColumn('ventas_b2b', 'otros_impuestos');
    await queryInterface.removeColumn('ventas_b2b', 'retefuente');
    await queryInterface.removeColumn('ventas_b2b', 'reteiva');
    await queryInterface.removeColumn('ventas_b2b', 'cufe');
    await queryInterface.removeColumn('ventas_b2b', 'qr_code');
    await queryInterface.removeColumn('ventas_b2b', 'estado_dian');
    await queryInterface.removeColumn('ventas_b2b', 'fecha_envio_dian');
    await queryInterface.removeColumn('ventas_b2b', 'respuesta_dian');
  }
};