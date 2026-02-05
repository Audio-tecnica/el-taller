require('dotenv').config();
const sequelize = require('../config/database');

async function limpiarFacturasB2B() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🗑️  Limpiando todas las facturas B2B...\n');
    
    // 1. Eliminar pagos B2B
    try {
      const [, pagosMeta] = await sequelize.query(
        'DELETE FROM pagos_b2b',
        { transaction }
      );
      console.log(`✅ Pagos B2B eliminados`);
    } catch (e) {
      console.log('⚠️  Tabla pagos_b2b no existe (normal)');
    }

    // 2. Eliminar items de ventas
    await sequelize.query(
      'DELETE FROM items_venta_b2b',
      { transaction }
    );
    console.log(`✅ Items de ventas eliminados`);

    // 3. Eliminar movimientos de inventario (SIN tipo_movimiento)
    await sequelize.query(
      `DELETE FROM movimientos_inventario 
       WHERE observaciones LIKE '%Venta B2B%'
          OR observaciones LIKE '%venta B2B%'
          OR observaciones LIKE '%Anulación%B2B%'`,
      { transaction }
    );
    console.log(`✅ Movimientos de inventario eliminados`);

    // 4. Eliminar ventas
    await sequelize.query(
      'DELETE FROM ventas_b2b',
      { transaction }
    );
    console.log(`✅ Ventas B2B eliminadas`);

    // 5. Resetear clientes
    await sequelize.query(
      `UPDATE clientes_b2b 
       SET credito_utilizado = 0,
           total_ventas = 0,
           total_facturas = 0,
           ultima_compra = NULL`,
      { transaction }
    );
    console.log(`✅ Clientes reseteados`);

    // COMMIT
    await transaction.commit();
    console.log('\n🎉 ¡LIMPIEZA COMPLETA EXITOSA!\n');

    // Verificación final
    console.log('📊 VERIFICACIÓN FINAL:\n');
    const [ventas] = await sequelize.query('SELECT COUNT(*) as count FROM ventas_b2b');
    const [items] = await sequelize.query('SELECT COUNT(*) as count FROM items_venta_b2b');
    const [clientes] = await sequelize.query(
      'SELECT razon_social, credito_utilizado, total_ventas, total_facturas FROM clientes_b2b'
    );

    console.log(`Ventas B2B: ${ventas[0].count}`);
    console.log(`Items: ${items[0].count}`);
    console.log('\nClientes:');
    console.table(clientes);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

limpiarFacturasB2B();