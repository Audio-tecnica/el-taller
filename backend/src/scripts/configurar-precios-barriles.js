require('dotenv').config();
const { Producto } = require('../models');
const sequelize = require('../config/database');

async function configurarPreciosBarriles() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // Buscar productos que son barriles
    const barriles = await Producto.findAll({
      where: {
        presentacion: 'Barril'
      }
    });

    console.log(`📦 Encontrados ${barriles.length} productos tipo Barril:\n`);

    for (const barril of barriles) {
      console.log(`📌 Producto: ${barril.nombre}`);
      console.log(`   Precio actual venta: $${parseFloat(barril.precio_venta).toLocaleString('es-CO')}`);
      console.log(`   Precio actual mayorista: $${parseFloat(barril.precio_mayorista || 0).toLocaleString('es-CO')}`);
      
      // Actualizar con los precios correctos
      await barril.update({
        precio_venta: 8000,        // Precio por vaso en el bar
        precio_mayorista: 4000,    // Costo por vaso (no se usa en B2B)
        precio_barril: 450000      // Precio del barril completo para B2B
      });

      console.log(`   ✅ Actualizado:`);
      console.log(`      - Precio vaso (bar): $8.000`);
      console.log(`      - Costo vaso: $4.000`);
      console.log(`      - Precio barril B2B: $450.000\n`);
    }

    console.log('✅ Todos los precios de barriles actualizados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

configurarPreciosBarriles();