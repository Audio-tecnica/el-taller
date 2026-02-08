const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UrlCorta = sequelize.define('UrlCorta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: false,
    comment: 'Código corto único para la URL (ej: abc123)'
  },
  url_original: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'URL completa original'
  },
  tipo: {
    type: DataTypes.STRING(50),
    defaultValue: 'factura',
    comment: 'Tipo de recurso (factura, pedido, etc)'
  },
  vistas: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Contador de accesos'
  },
  expira_en: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de expiración opcional (null = nunca expira)'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'urls_cortas',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['codigo']
    },
    {
      fields: ['activo']
    }
  ]
});

module.exports = UrlCorta;
