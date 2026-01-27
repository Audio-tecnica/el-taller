'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('intentos_acceso', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      exitoso: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      motivo_rechazo: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fecha_intento: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Crear índices para optimizar consultas
    await queryInterface.addIndex('intentos_acceso', ['usuario_id']);
    await queryInterface.addIndex('intentos_acceso', ['fecha_intento']);
    await queryInterface.addIndex('intentos_acceso', ['exitoso']);
    await queryInterface.addIndex('intentos_acceso', ['email']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('intentos_acceso');
  }
};
