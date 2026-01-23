const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  categoria_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  precio_venta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  precio_mayorista: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  stock_local1: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stock_local2: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stock_total: {
    type: DataTypes.VIRTUAL,
    get() {
      return (this.stock_local1 || 0) + (this.stock_local2 || 0);
    }
  },
  alerta_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  disponible_b2b: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'productos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Producto;