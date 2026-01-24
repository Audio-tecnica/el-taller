const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

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

// ✅ MIDDLEWARE NECESARIOS (ESTO ES LO QUE FALTA)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "🍺 El Taller API is running",
    timestamp: new Date(),
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

app.use("/api/turnos", turnosRoutes);
app.use("/api/cortesias", cortesiasRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/mesas", mesasRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use('/api/barriles', barrilesRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🍺 El Taller Backend - Ready!`);
});