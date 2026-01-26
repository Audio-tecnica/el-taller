const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://el-taller-phi.vercel.app",
    ],
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
app.use('/api/inventario', inventarioRoutes); // ⭐ AGREGADO

// Socket.IO - Manejo de conexiones
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  
  // El cliente puede unirse a rooms por local
  socket.on('join_local', (local) => {
    socket.join(`local_${local}`);
    console.log(`📍 Socket ${socket.id} se unió a local_${local}`);
  });
  
  // El cliente puede unirse a una mesa específica
  socket.on('join_mesa', (mesaId) => {
    socket.join(`mesa_${mesaId}`);
    console.log(`🍽️ Socket ${socket.id} se unió a mesa_${mesaId}`);
  });
  
  // Salir de una mesa
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

// Función helper para emitir eventos (usar en controladores)
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

const PORT = process.env.PORT || 5000;

// Usar server.listen en lugar de app.listen para Socket.IO
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🍺 El Taller Backend - Ready!`);
  console.log(`🔌 WebSocket enabled`);
});