import { useState, useEffect } from "react";
import clientesB2BService from "../../services/clientesB2BService";
import FormularioCliente from "./FormularioCliente";
import DetalleCliente from "./DetalleCliente";

export default function ClientesB2B() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalFormulario, setModalFormulario] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [buscar, setBuscar] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [resumen, setResumen] = useState(null);
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    totalPaginas: 1,
    total: 0,
  });

  useEffect(() => {
    cargarClientes();
    cargarResumen();
  }, [buscar, filtroEstado, paginacion.pagina]);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const params = {
        pagina: paginacion.pagina,
        limite: 20,
        ...(buscar && { buscar }),
        ...(filtroEstado && { estado: filtroEstado }),
      };

      const data = await clientesB2BService.obtenerClientes(params);
      setClientes(data.clientes);
      setPaginacion({
        pagina: data.pagina,
        totalPaginas: data.totalPaginas,
        total: data.total,
      });
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      alert("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const cargarResumen = async () => {
    try {
      const data = await clientesB2BService.obtenerResumenGeneral();
      setResumen(data);
    } catch (error) {
      console.error("Error al cargar resumen:", error);
    }
  };

  const handleNuevoCliente = () => {
    setClienteSeleccionado(null);
    setModalFormulario(true);
  };

  const handleEditarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalFormulario(true);
  };

  const handleVerDetalle = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalDetalle(true);
  };

  const handleGuardarCliente = async () => {
    setModalFormulario(false);
    await cargarClientes();
    await cargarResumen();
  };

  const handleCambiarEstado = async (cliente, nuevoEstado) => {
    const motivo = prompt(`¿Motivo para cambiar estado a ${nuevoEstado}?`);
    if (!motivo) return;

    try {
      await clientesB2BService.cambiarEstado(cliente.id, nuevoEstado, motivo);
      await cargarClientes();
      await cargarResumen();
      alert("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("Error al cambiar estado");
    }
  };

  const getEstadoBadge = (estado) => {
    const colores = {
      Activo: "bg-green-100 text-green-800",
      Inactivo: "bg-gray-100 text-gray-800",
      Suspendido: "bg-yellow-100 text-yellow-800",
      Bloqueado: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${colores[estado]}`}
      >
        {estado}
      </span>
    );
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor);
  };

  if (loading && clientes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Cargando clientes...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Clientes B2B</h1>
        <p className="text-gray-600">
          Gestión de clientes corporativos y cartera
        </p>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Total Clientes</div>
            <div className="text-2xl font-bold text-gray-800">
              {resumen.totalClientes}
            </div>
            <div className="text-xs text-green-600">
              {resumen.clientesActivos} activos
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Cartera Total</div>
            <div className="text-2xl font-bold text-[#D4B896]">
              {formatearMoneda(resumen.totalCartera)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Cartera Vencida</div>
            <div className="text-2xl font-bold text-red-600">
              {formatearMoneda(resumen.carteraVencida)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Bloqueados</div>
            <div className="text-2xl font-bold text-orange-600">
              {resumen.clientesBloqueados}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Buscar por razón social, documento, email o teléfono..."
              value={buscar}
              onChange={(e) => {
                setBuscar(e.target.value);
                setPaginacion({ ...paginacion, pagina: 1 });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginacion({ ...paginacion, pagina: 1 });
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Suspendido">Suspendido</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>
            <button
              onClick={handleNuevoCliente}
              className="px-6 py-2 bg-[#D4B896] text-black font-semibold rounded-lg hover:bg-[#c4a886] transition"
            >
              + Nuevo Cliente
            </button>
            <Link to="/ventas-b2b" className="menu-item">
              <span>📄</span>
              <span>Ventas B2B</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crédito
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {cliente.razon_social}
                      </div>
                      <div className="text-sm text-gray-600">
                        {cliente.tipo_documento}: {cliente.numero_documento}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-gray-800">
                        {cliente.nombre_contacto}
                      </div>
                      <div className="text-sm text-gray-600">
                        {cliente.email}
                      </div>
                      <div className="text-sm text-gray-600">
                        {cliente.telefono}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        Límite: {formatearMoneda(cliente.limite_credito)}
                      </div>
                      <div className="text-sm text-green-600">
                        Disponible:{" "}
                        {formatearMoneda(cliente.credito_disponible)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {cliente.dias_credito} días
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getEstadoBadge(cliente.estado)}
                    {cliente.bloqueado_por_mora && (
                      <div className="mt-1">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Bloqueado por mora
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleVerDetalle(cliente)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleEditarCliente(cliente)}
                        className="px-3 py-1 text-sm bg-[#D4B896] text-black rounded hover:bg-[#c4a886] transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          handleCambiarEstado(cliente, "Bloqueado")
                        }
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        Cambiar Estado
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {paginacion.totalPaginas > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {clientes.length} de {paginacion.total} clientes
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPaginacion({
                    ...paginacion,
                    pagina: paginacion.pagina - 1,
                  })
                }
                disabled={paginacion.pagina === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                Página {paginacion.pagina} de {paginacion.totalPaginas}
              </span>
              <button
                onClick={() =>
                  setPaginacion({
                    ...paginacion,
                    pagina: paginacion.pagina + 1,
                  })
                }
                disabled={paginacion.pagina === paginacion.totalPaginas}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulario */}
      {modalFormulario && (
        <FormularioCliente
          cliente={clienteSeleccionado}
          onClose={() => setModalFormulario(false)}
          onGuardar={handleGuardarCliente}
        />
      )}

      {/* Modal Detalle */}
      {modalDetalle && clienteSeleccionado && (
        <DetalleCliente
          clienteId={clienteSeleccionado.id}
          onClose={() => setModalDetalle(false)}
          onEditar={handleEditarCliente}
        />
      )}
    </div>
  );
}
