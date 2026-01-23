const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware - CORS primero
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '🍺 El Taller API is running',
    timestamp: new Date()
  });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const setupRoutes = require('./routes/setupRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');
const productosRoutes = require('./routes/productosRoutes');
const mesasRoutes = require('./routes/mesasRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const cortesiasRoutes = require('./routes/cortesiasRoutes');
const turnosRoutes = require('./routes/turnosRoutes');

app.use('/api/turnos', turnosRoutes);
app.use('/api/cortesias', cortesiasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🍺 El Taller Backend - Ready!`);
});