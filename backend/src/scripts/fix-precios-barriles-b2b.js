require('dotenv').config();
const { Producto } = require('../models');
const sequelize = require('../config/database');

async function fixPreciosBarriles() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // 1. Agregar columna precio_barril si no existe
    console.log('📋 Verificando columna precio_barril...');
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='productos' AND column_name='precio_barril';
    `);

    if (results.length === 0) {
      console.log('➕ Agregando columna precio_barril...');
      await sequelize.query(`
        ALTER TABLE productos 
        ADD COLUMN precio_barril DECIMAL(10,2) NULL 
        COMMENT 'Precio de barril completo para ventas B2B';
      `);
      console.log('✅ Columna agregada\n');
    } else {
      console.log('✅ Columna ya existe\n');
    }

    // 2. Buscar y actualizar productos tipo Barril
    const barriles = await Producto.findAll({
      where: {
        presentacion: 'Barril'
      }
    });

    console.log(`📦 Encontrados ${barriles.length} productos tipo Barril:\n`);

    for (const barril of barriles) {
      console.log(`📌 ${barril.nombre}`);
      console.log(`   Precio actual venta (por vaso): $${parseFloat(barril.precio_venta).toLocaleString('es-CO')}`);
      
      // Configurar precios correctos
      await barril.update({
        precio_venta: 8000,         // Precio por vaso en el bar (POS)
        precio_mayorista: 4000,     // Costo por vaso (para cálculos internos)
        precio_barril: 450000,      // Precio barril completo para B2B
        disponible_b2b: true        // Habilitar para B2B
      });

      console.log(`   ✅ Actualizado:`);
      console.log(`      - Precio vaso (POS): $8.000`);
      console.log(`      - Costo vaso: $4.000`);
      console.log(`      - Precio barril B2B: $450.000`);
      console.log(`      - Disponible B2B: SÍ\n`);
    }

    console.log('✅ Todos los precios actualizados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPreciosBarriles();