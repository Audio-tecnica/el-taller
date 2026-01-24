const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Producto = sequelize.define(
  "Producto",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    categoria_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    precio_venta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    precio_mayorista: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    presentacion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
      comment: "Ej: Barril, Botella, Lata, Litro, etc",
    },
    stock_local1: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    stock_local2: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    stock_total: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this.stock_local1 || 0) + (this.stock_local2 || 0);
      },
    },
    alerta_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    disponible_b2b: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    presentacion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    // Campos para gestión de barriles
    unidad_medida: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "unidades", // 'unidades' o 'barriles'
    },
    capacidad_barril: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 85, // vasos por barril
    },
    // Local 1
    barril_activo_local1: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    vasos_disponibles_local1: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // Local 2
    barril_activo_local2: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    vasos_disponibles_local2: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "productos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Producto;
