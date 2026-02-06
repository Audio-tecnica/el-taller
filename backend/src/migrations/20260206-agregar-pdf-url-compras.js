const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('compras', 'factura_pdf_url', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL del PDF de factura generado'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('compras', 'factura_pdf_url');
  }
};