require('dotenv').config();
const sequelize = require('../config/database');

async function limpiarFacturasB2B() {
  try {
    console.log('🗑️  Limpiando todas las facturas B2B...');
    
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // 1. Eliminar pagos B2B (si la tabla existe)
    try {
      await sequelize.query('DELETE FROM pagos_b2b');
      console.log('✅ Pagos B2B eliminados');
    } catch (error) {
      console.log('⚠️  Tabla pagos_b2b no existe aún');
    }

    // 2. Eliminar items de ventas B2B
    await sequelize.query('DELETE FROM items_venta_b2b');
    console.log('✅ Items de ventas B2B eliminados');

    // 3. Eliminar movimientos de inventario B2B
    await sequelize.query(`
      DELETE FROM movimientos_inventario 
      WHERE tipo_movimiento = 'Venta B2B' 
         OR tipo_movimiento = 'Anulación Venta B2B'
    `);
    console.log('✅ Movimientos de inventario B2B eliminados');

    // 4. Eliminar ventas B2B
    await sequelize.query('DELETE FROM ventas_b2b');
    console.log('✅ Ventas B2B eliminadas');

    // 5. Resetear estadísticas de clientes
    await sequelize.query(`
      UPDATE clientes_b2b 
      SET credito_utilizado = 0,
          total_ventas = 0,
          total_facturas = 0,
          ultima_compra = NULL
    `);
    console.log('✅ Estadísticas de clientes reseteadas');

    // Verificar que todo esté limpio
    console.log('\n📊 Verificación final:');
    const [results] = await sequelize.query(`
      SELECT 'Ventas B2B' as tabla, COUNT(*) as registros FROM ventas_b2b
      UNION ALL
      SELECT 'Items Venta B2B', COUNT(*) FROM items_venta_b2b
    `);
    
    console.table(results);
    
    console.log('\n🎉 ¡Todas las facturas B2B han sido eliminadas!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

limpiarFacturasB2B();