const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // Agregar campo para guardar el porcentaje de IVA aplicado
    await queryInterface.addColumn('compras', 'iva_porcentaje', {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Porcentaje de IVA aplicado a la compra (ej: 19.00 para 19%)'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('compras', 'iva_porcentaje');
  }
};