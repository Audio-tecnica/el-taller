const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Impuesto = sequelize.define('Impuesto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Código único del impuesto (IVA19, INC8, RETE25, etc.)'
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre descriptivo del impuesto'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada del impuesto'
  },
  tipo: {
    type: DataTypes.ENUM('Impuesto', 'Retencion'),
    allowNull: false,
    defaultValue: 'Impuesto',
    comment: 'Impuesto suma al total, Retención resta del total'
  },
  porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Porcentaje del impuesto (ej: 19.00 para 19%)'
  },
  base_calculo: {
    type: DataTypes.ENUM('Subtotal', 'Total', 'BaseGravable'),
    allowNull: false,
    defaultValue: 'Subtotal',
    comment: 'Sobre qué monto se calcula el impuesto'
  },
  aplica_a: {
    type: DataTypes.ENUM('Todos', 'GranContribuyente', 'RegimenComun', 'RegimenSimplificado'),
    allowNull: false,
    defaultValue: 'Todos',
    comment: 'A qué tipo de contribuyente aplica'
  },
  cuenta_contable: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Cuenta contable para integración'
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Orden de aplicación (primero impuestos, luego retenciones)'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'impuestos',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion'
});

// Método para calcular el monto del impuesto
Impuesto.prototype.calcularMonto = function(base) {
  const baseNumero = parseFloat(base) || 0;
  const porcentaje = parseFloat(this.porcentaje) || 0;
  return (baseNumero * porcentaje) / 100;
};

// Método estático para obtener impuestos activos
Impuesto.obtenerActivos = async function() {
  return await this.findAll({
    where: { activo: true },
    order: [['tipo', 'ASC'], ['orden', 'ASC']]
  });
};

module.exports = Impuesto;
