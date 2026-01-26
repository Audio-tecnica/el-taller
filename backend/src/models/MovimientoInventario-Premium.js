const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MovimientoInventario = sequelize.define(
  "MovimientoInventario",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    numero_movimiento: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
    },
    fecha_movimiento: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    producto_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "productos",
        key: "id",
      },
    },
    local_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "locales",
        key: "id",
      },
    },
    tipo: {
      type: DataTypes.ENUM(
        "compra",
        "devolucion_proveedor",
        "entrada_transferencia",
        "salida_transferencia",
        "venta",
        "devolucion_cliente",
        "ajuste_positivo",
        "ajuste_negativo",
        "merma",
        "donacion",
        "muestra",
        "consumo_interno",
        "produccion",
      ),
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notZero(value) {
          if (value === 0) {
            throw new Error("La cantidad no puede ser cero");
          }
        },
      },
    },
    stock_anterior: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stock_nuevo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Costos
    costo_unitario: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true, // ⭐ Debe estar en true
    },
    costo_total: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: true, // ⭐ Debe estar en true
    },
    // Precios de venta
    precio_venta: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true,
    },
    valor_venta: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: true,
    },
    // Información de compra
    proveedor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "proveedores",
        key: "id",
      },
    },
    numero_factura: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fecha_factura: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // Información de transferencia
    local_origen_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "locales",
        key: "id",
      },
    },
    local_destino_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "locales",
        key: "id",
      },
    },
    movimiento_relacionado_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "movimientos_inventario",
        key: "id",
      },
    },
    // Información de venta
    pedido_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "pedidos",
        key: "id",
      },
    },
    // Motivo y observaciones
    motivo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Auditoría
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    autorizado_por: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
  },
  {
    tableName: "movimientos_inventario",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["producto_id", "fecha_movimiento"] },
      { fields: ["local_id", "fecha_movimiento"] },
      { fields: ["tipo", "fecha_movimiento"] },
      { fields: ["numero_movimiento"], unique: true },
    ],
  },
);

// Métodos de instancia útiles
MovimientoInventario.prototype.esEntrada = function () {
  return [
    "compra",
    "devolucion_cliente",
    "entrada_transferencia",
    "ajuste_positivo",
  ].includes(this.tipo);
};

MovimientoInventario.prototype.esSalida = function () {
  return [
    "venta",
    "devolucion_proveedor",
    "salida_transferencia",
    "ajuste_negativo",
    "merma",
    "donacion",
    "muestra",
    "consumo_interno",
  ].includes(this.tipo);
};

MovimientoInventario.prototype.requiereCosto = function () {
  return ["compra", "devolucion_cliente"].includes(this.tipo);
};

MovimientoInventario.prototype.requiereProveedor = function () {
  return this.tipo === "compra";
};

module.exports = MovimientoInventario;
