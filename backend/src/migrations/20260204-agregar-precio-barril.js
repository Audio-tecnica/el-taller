module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('productos', 'precio_barril', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Precio de barril completo para ventas B2B'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('productos', 'precio_barril');
  }
};