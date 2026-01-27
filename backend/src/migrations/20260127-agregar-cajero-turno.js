'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Agregar columna cajero_id
      await queryInterface.addColumn('turnos', 'cajero_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      // Copiar usuario_id a cajero_id para turnos existentes
      await queryInterface.sequelize.query(`
        UPDATE turnos 
        SET cajero_id = usuario_id 
        WHERE cajero_id IS NULL;
      `);

      console.log('✅ Campo cajero_id agregado exitosamente');
    } catch (error) {
      console.error('❌ Error en migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('turnos', 'cajero_id');
  }
};