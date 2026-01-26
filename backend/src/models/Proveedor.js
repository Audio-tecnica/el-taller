const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  codigo: {
    type: DataTypes.STRING(20),
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  nit: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contacto_nombre: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  contacto_telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  terminos_pago: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ej: Contado, 30 días, 60 días'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'proveedores',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Proveedor;
