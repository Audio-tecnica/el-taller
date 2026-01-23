const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Mesa = sequelize.define('Mesa', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  local_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  capacidad: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  estado: {
    type: DataTypes.ENUM('disponible', 'ocupada', 'reservada'),
    defaultValue: 'disponible'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'mesas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Mesa;