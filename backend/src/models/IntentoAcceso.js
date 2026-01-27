const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IntentoAcceso = sequelize.define('IntentoAcceso', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: true, // Puede ser null si el usuario no existe
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  exitoso: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  motivo_rechazo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_intento: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'intentos_acceso',
  timestamps: false
});

module.exports = IntentoAcceso;
