const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

async function addBarrilFields() {
  try {
    console.log('🚀 Agregando campos para gestión de barriles...');
    
    // Verificar si las columnas ya existen
    const [columns] = await sequelize.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name='productos' AND column_name='unidad_medida'`,
      { type: QueryTypes.SELECT }
    );

    if (!columns) {
      await sequelize.query(`
        ALTER TABLE productos 
        ADD COLUMN unidad_medida VARCHAR(20) DEFAULT 'unidades',
        ADD COLUMN capacidad_barril INTEGER DEFAULT 85,
        ADD COLUMN barril_activo_local1 BOOLEAN DEFAULT false,
        ADD COLUMN vasos_disponibles_local1 INTEGER DEFAULT 0,
        ADD COLUMN barril_activo_local2 BOOLEAN DEFAULT false,
        ADD COLUMN vasos_disponibles_local2 INTEGER DEFAULT 0
      `);
      console.log('✅ Columnas agregadas exitosamente');
      
      // Actualizar productos de barril existentes
      await sequelize.query(`
        UPDATE productos 
        SET unidad_medida = 'barriles' 
        WHERE categoria_id IN (
          SELECT id FROM categorias WHERE nombre LIKE '%Barril%'
        )
      `);
      console.log('✅ Productos de barril actualizados');
    } else {
      console.log('⚠️  Las columnas ya existen');
    }
  } catch (error) {
    console.error('❌ Error al agregar campos:', error);
    throw error;
  }
}

module.exports = { addBarrilFields };