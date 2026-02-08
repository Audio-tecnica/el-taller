const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
require('./utils/keepAlive');

// ⭐ Agregar sequelize para la migración
const sequelize = require('./config/database');

const app = express();
const server = http.createServer(app);

// Importar rutas de gastos
const gastosRoutes = require('./routes/gastos');

// Registrar rutas
app.use('/api/gastos', gastosRoutes);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.includes('.vercel.app') || origin === 'http://localhost:5173') {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware - CORS primero
const allowedOrigins = [
  "http://localhost:5173",
  "https://el-taller-phi.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      // ⭐ Permitir cualquier URL de Vercel
      if (origin.includes('.vercel.app')) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware necesarios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Hacer io accesible en los controladores
app.set('io', io);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "🍺 El Taller API is running",
    timestamp: new Date(),
    websocket: "enabled"
  });
});

// Y agrega un endpoint de health check adicional
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
const authRoutes = require("./routes/authRoutes");
const setupRoutes = require("./routes/setupRoutes");
const categoriasRoutes = require("./routes/categoriasRoutes");
const productosRoutes = require("./routes/productosRoutes");
const mesasRoutes = require("./routes/mesasRoutes");
const pedidosRoutes = require("./routes/pedidosRoutes");
const cortesiasRoutes = require("./routes/cortesiasRoutes");
const turnosRoutes = require("./routes/turnosRoutes");
const barrilesRoutes = require('./routes/barrilesRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes'); 
const reportesRoutes = require('./routes/reportesRoutes');

// ⭐ NUEVAS RUTAS KARDEX
const inventarioKardexRoutes = require('./routes/inventarioKardexRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const reportesPremiumRoutes = require('./routes/reportesPremiumRoutes');

// ⭐ RUTAS B2B
const clientesB2BRoutes = require('./routes/clientesB2BRoutes');
const ventasB2BRoutes = require('./routes/ventasB2BRoutes');
const pagosB2BRoutes = require('./routes/pagosB2BRoutes');

// ⭐ RUTAS IMPUESTOS
const impuestosRoutes = require('./routes/impuestosRoutes');

// ⭐ RUTAS FACTURAS POS
const facturasRoutes = require('./routes/facturasRoutes');

// ⭐ RUTAS FACTURAS DE COMPRA
const facturasCompraRoutes = require('./routes/facturasCompraRoutes');

// Servir archivos PDF estáticos
const path = require('path');
app.use('/pdfs', express.static(path.join(__dirname, '../pdfs')));

// Registrar todas las rutas
app.use('/api/reportes', reportesRoutes);
app.use("/api/turnos", turnosRoutes);
app.use("/api/cortesias", cortesiasRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/mesas", mesasRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use('/api/barriles', barrilesRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/inventario-kardex', inventarioKardexRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/reportes-premium', reportesPremiumRoutes);
app.use('/api/clientes-b2b', clientesB2BRoutes);
app.use('/api/ventas-b2b', ventasB2BRoutes);
app.use('/api/pagos-b2b', pagosB2BRoutes);
app.use('/api/impuestos', impuestosRoutes);
app.use('/api/facturas', facturasRoutes); // ⭐ FACTURAS POS
app.use('/api/facturas-compra', facturasCompraRoutes); // ⭐ FACTURAS DE COMPRA

// Socket.IO - Manejo de conexiones
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  
  socket.on('join_local', (local) => {
    socket.join(`local_${local}`);
    console.log(`📍 Socket ${socket.id} se unió a local_${local}`);
  });
  
  socket.on('join_mesa', (mesaId) => {
    socket.join(`mesa_${mesaId}`);
    console.log(`🍽️ Socket ${socket.id} se unió a mesa_${mesaId}`);
  });
  
  socket.on('leave_mesa', (mesaId) => {
    socket.leave(`mesa_${mesaId}`);
    console.log(`🚪 Socket ${socket.id} salió de mesa_${mesaId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// Exportar io para usarlo en otros módulos
module.exports.io = io;

// Función helper para emitir eventos
app.emitEvent = (event, data, room = null) => {
  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }
};

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// ⭐ MIGRACIÓN AUTOMÁTICA DE IMPUESTOS
const ejecutarMigracionImpuestos = async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'impuestos');
    `);
    
    if (!results[0].exists) {
      console.log('🔄 Creando tablas de impuestos...');
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS impuestos (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          codigo VARCHAR(20) NOT NULL UNIQUE,
          nombre VARCHAR(100) NOT NULL,
          descripcion TEXT,
          tipo VARCHAR(20) NOT NULL DEFAULT 'Impuesto',
          porcentaje DECIMAL(5,2) NOT NULL,
          base_calculo VARCHAR(20) NOT NULL DEFAULT 'Subtotal',
          aplica_a VARCHAR(30) NOT NULL DEFAULT 'Todos',
          cuenta_contable VARCHAR(20),
          orden INTEGER NOT NULL DEFAULT 0,
          activo BOOLEAN NOT NULL DEFAULT true,
          fecha_creacion TIMESTAMP DEFAULT NOW(),
          fecha_actualizacion TIMESTAMP DEFAULT NOW()
        );
      `);

      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS cliente_impuestos (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          cliente_b2b_id UUID NOT NULL REFERENCES clientes_b2b(id) ON DELETE CASCADE,
          impuesto_id UUID NOT NULL REFERENCES impuestos(id) ON DELETE CASCADE,
          porcentaje_personalizado DECIMAL(5,2),
          activo BOOLEAN NOT NULL DEFAULT true,
          fecha_creacion TIMESTAMP DEFAULT NOW(),
          UNIQUE(cliente_b2b_id, impuesto_id)
        );
      `);

      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS venta_impuestos (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          venta_b2b_id UUID NOT NULL REFERENCES ventas_b2b(id) ON DELETE CASCADE,
          impuesto_id UUID NOT NULL REFERENCES impuestos(id),
          codigo_impuesto VARCHAR(20) NOT NULL,
          nombre_impuesto VARCHAR(100) NOT NULL,
          tipo VARCHAR(20) NOT NULL,
          porcentaje DECIMAL(5,2) NOT NULL,
          base DECIMAL(12,2) NOT NULL,
          monto DECIMAL(12,2) NOT NULL,
          fecha_creacion TIMESTAMP DEFAULT NOW()
        );
      `);

      await sequelize.query(`
        INSERT INTO impuestos (codigo, nombre, descripcion, tipo, porcentaje, base_calculo, aplica_a, orden) VALUES
        ('IVA19', 'IVA 19%', 'Tarifa general', 'Impuesto', 19.00, 'Subtotal', 'Todos', 1),
        ('IVA5', 'IVA 5%', 'Tarifa reducida', 'Impuesto', 5.00, 'Subtotal', 'Todos', 2),
        ('IVA0', 'IVA Exento', 'Exentos', 'Impuesto', 0.00, 'Subtotal', 'Todos', 3),
        ('INC8', 'Impoconsumo 8%', 'Bares y restaurantes', 'Impuesto', 8.00, 'Subtotal', 'Todos', 4),
        ('RFTE25', 'ReteFuente 2.5%', 'Por compras', 'Retencion', 2.50, 'Subtotal', 'Todos', 10),
        ('RFTE35', 'ReteFuente 3.5%', 'Por servicios', 'Retencion', 3.50, 'Subtotal', 'Todos', 11),
        ('RIVA15', 'ReteIVA 15%', '15% del IVA', 'Retencion', 15.00, 'Subtotal', 'Todos', 12),
        ('RICA', 'ReteICA', 'Varía por municipio', 'Retencion', 0.69, 'Subtotal', 'Todos', 13)
        ON CONFLICT (codigo) DO NOTHING;
      `);

      console.log('✅ Tablas de impuestos creadas exitosamente');
    } else {
      console.log('✅ Tablas de impuestos ya existen');
    }
  } catch (error) {
    console.log('⚠️ Migración impuestos:', error.message);
  }
};

const PORT = process.env.PORT || 5000;

// Usar server.listen con migración automática
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🍺 El Taller Backend - Ready!`);
  console.log(`🔌 WebSocket enabled`);
  
  // Ejecutar migración automática
  await ejecutarMigracionImpuestos();
});