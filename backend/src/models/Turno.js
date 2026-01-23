const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Turno = sequelize.define('Turno', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  local_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  efectivo_inicial: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  efectivo_esperado: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  efectivo_real: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  diferencia: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  total_efectivo: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total_transferencias: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total_nequi: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total_ventas: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total_cortesias: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  cantidad_pedidos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  estado: {
    type: DataTypes.ENUM('abierto', 'cerrado'),
    defaultValue: 'abierto'
  },
  fecha_apertura: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_cierre: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notas_cierre: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'turnos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Turno;