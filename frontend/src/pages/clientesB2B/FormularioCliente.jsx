import { useState, useEffect } from 'react';
import clientesB2BService from '../../services/clientesB2BService';

export default function FormularioCliente({ cliente, onClose, onGuardar }) {
  const [formData, setFormData] = useState({
    tipo_documento: 'NIT',
    numero_documento: '',
    razon_social: '',
    nombre_comercial: '',
    email: '',
    telefono: '',
    telefono_secundario: '',
    nombre_contacto: '',
    cargo_contacto: '',
    direccion: '',
    ciudad: 'Montería',
    departamento: 'Córdoba',
    codigo_postal: '',
    limite_credito: 0,
    dias_credito: 30,
    descuento_porcentaje: 0,
    banco: '',
    tipo_cuenta: '',
    numero_cuenta: '',
    notas: ''
  });

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (cliente) {
      setFormData({
        tipo_documento: cliente.tipo_documento || 'NIT',
        numero_documento: cliente.numero_documento || '',
        razon_social: cliente.razon_social || '',
        nombre_comercial: cliente.nombre_comercial || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        telefono_secundario: cliente.telefono_secundario || '',
        nombre_contacto: cliente.nombre_contacto || '',
        cargo_contacto: cliente.cargo_contacto || '',
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad || 'Montería',
        departamento: cliente.departamento || 'Córdoba',
        codigo_postal: cliente.codigo_postal || '',
        limite_credito: cliente.limite_credito || 0,
        dias_credito: cliente.dias_credito || 30,
        descuento_porcentaje: cliente.descuento_porcentaje || 0,
        banco: cliente.banco || '',
        tipo_cuenta: cliente.tipo_cuenta || '',
        numero_cuenta: cliente.numero_cuenta || '',
        notas: cliente.notas || ''
      });
    }
  }, [cliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.razon_social || !formData.numero_documento || !formData.email || !formData.telefono || !formData.nombre_contacto) {
      alert('Por favor complete todos los campos obligatorios (*)');
      return;
    }

    try {
      setGuardando(true);
      
      if (cliente) {
        await clientesB2BService.actualizarCliente(cliente.id, formData);
      } else {
        await clientesB2BService.crearCliente(formData);
      }
      
      onGuardar();
      onClose();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert(error.response?.data?.error || 'Error al guardar cliente');
    } finally {
      setGuardando(false);
    }
  };

  // Prevenir cierre al hacer clic dentro del modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            {cliente ? 'Editar Cliente B2B' : 'Nuevo Cliente B2B'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información de Identificación */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Identificación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Documento *
                </label>
                <select
                  name="tipo_documento"
                  value={formData.tipo_documento}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="NIT">NIT</option>
                  <option value="CC">Cédula</option>
                  <option value="CE">Cédula Extranjería</option>
                  <option value="RUT">RUT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número Documento *
                </label>
                <input
                  type="text"
                  name="numero_documento"
                  value={formData.numero_documento}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 900123456-7"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
            </div>
          </section>

          {/* Información de la Empresa */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de la Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón Social *
                </label>
                <input
                  type="text"
                  name="razon_social"
                  value={formData.razon_social}
                  onChange={handleChange}
                  required
                  placeholder="Nombre legal de la empresa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  name="nombre_comercial"
                  value={formData.nombre_comercial}
                  onChange={handleChange}
                  placeholder="Nombre comercial"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
            </div>
          </section>

          {/* Información de Contacto */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Contacto *
                </label>
                <input
                  type="text"
                  name="nombre_contacto"
                  value={formData.nombre_contacto}
                  onChange={handleChange}
                  required
                  placeholder="Nombre del contacto principal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  name="cargo_contacto"
                  value={formData.cargo_contacto}
                  onChange={handleChange}
                  placeholder="Ej: Gerente de Compras"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="email@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  placeholder="3001234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono Secundario
                </label>
                <input
                  type="tel"
                  name="telefono_secundario"
                  value={formData.telefono_secundario}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
            </div>
          </section>

          {/* Dirección */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dirección</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                  placeholder="Calle, número, barrio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  name="codigo_postal"
                  value={formData.codigo_postal}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
            </div>
          </section>

          {/* Información Comercial */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Comercial</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Crédito ($)
                </label>
                <input
                  type="number"
                  name="limite_credito"
                  value={formData.limite_credito}
                  onChange={handleChange}
                  min="0"
                  step="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Días de Crédito
                </label>
                <input
                  type="number"
                  name="dias_credito"
                  value={formData.dias_credito}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  name="descuento_porcentaje"
                  value={formData.descuento_porcentaje}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>
          </section>

          {/* Información Bancaria */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Bancaria (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco
                </label>
                <input
                  type="text"
                  name="banco"
                  value={formData.banco}
                  onChange={handleChange}
                  placeholder="Nombre del banco"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  name="tipo_cuenta"
                  value={formData.tipo_cuenta}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Seleccione...</option>
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  name="numero_cuenta"
                  value={formData.numero_cuenta}
                  onChange={handleChange}
                  placeholder="Número de cuenta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
            </div>
          </section>

          {/* Notas */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas / Observaciones
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows="3"
              placeholder="Información adicional sobre el cliente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white placeholder-gray-400 resize-none"
            />
          </section>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2 bg-[#D4B896] text-black font-semibold rounded-lg hover:bg-[#c4a886] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? 'Guardando...' : cliente ? 'Actualizar' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}