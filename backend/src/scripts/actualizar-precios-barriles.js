require('dotenv').config();
const { Producto } = require('../models');
const sequelize = require('../config/database');

async function actualizarPreciosBarriles() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');

    // Obtener todos los productos que son barriles
    const barriles = await Producto.findAll({
      where: {
        presentacion: 'Barril'
      }
    });

    console.log(`📦 Encontrados ${barriles.length} barriles`);

    for (const barril of barriles) {
      // Calcular precio del barril completo
      // Si es Club Colombia o Stella Artois: $450,000
      // Si es otro: usar precio_mayorista o un default
      let precioBarril;
      
      if (barril.nombre.toLowerCase().includes('club colombia')) {
        precioBarril = 450000;
      } else if (barril.nombre.toLowerCase().includes('stella')) {
        precioBarril = 450000;
      } else if (barril.precio_mayorista) {
        // Si ya tiene precio mayorista, multiplicar por capacidad estimada
        precioBarril = parseFloat(barril.precio_mayorista) * 85;
      } else {
        precioBarril = 450000; // Default
      }

      await barril.update({
        precio_barril: precioBarril
      });

      console.log(`✅ ${barril.nombre}: $${precioBarril.toLocaleString('es-CO')}`);
    }

    console.log('✅ Precios de barriles actualizados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarPreciosBarriles();