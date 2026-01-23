const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('administrador', 'cajero', 'ayudante'),
    allowNull: false
  },
  local_asignado_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  puede_autorizar_cortesias: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  monto_maximo_cortesia: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Método para comparar contraseñas
Usuario.prototype.validarPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// Hook para hashear password antes de crear
Usuario.beforeCreate(async (usuario) => {
  if (usuario.password_hash) {
    usuario.password_hash = await bcrypt.hash(usuario.password_hash, 10);
  }
});

module.exports = Usuario;