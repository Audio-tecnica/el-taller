import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { proveedoresService } from "../../services/proveedoresService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

// Componentes de tabs
import TabResumen from "./tabs/TabResumen";
import TabFacturas from "./tabs/TabFacturas";
import TabProductos from "./tabs/TabProductos";
import TabHistorial from "./tabs/TabHistorial";

export default function DetalleProveedor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [proveedor, setProveedor] = useState(null);
  const [tabActivo, setTabActivo] = useState("resumen");
  const [estadisticas, setEstadisticas] = useState(null);

  useEffect(() => {
    cargarProveedor();
  }, [id]);

  const cargarProveedor = async () => {
    try {
      setLoading(true);
      
      const provData = await proveedoresService.getById(id);
      setProveedor(provData);
      
      const stats = await proveedoresService.getEstadisticas(id);
      setEstadisticas(stats.estadisticas);
      
    } catch (error) {
      console.error("Error al cargar proveedor:", error);
      toast.error("Error al cargar información del proveedor");
      navigate("/proveedores");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "resumen", nombre: "📊 Resumen", icono: "📊" },
    { id: "facturas", nombre: "🧾 Facturas", icono: "🧾" },
    { id: "productos", nombre: "📦 Productos", icono: "📦" },
    { id: "historial", nombre: "📈 Historial", icono: "📈" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg font-medium">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Proveedor no encontrado</p>
          <button
            onClick={() => navigate("/proveedores")}
            className="px-6 py-3 bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] rounded-lg font-bold hover:shadow-lg hover:shadow-[#D4B896]/30 transition"
          >
            Volver a Proveedores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
      <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#D4B896]/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/proveedores")}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <img src={logo} alt="El Taller" className="w-10 h-10 rounded-xl object-contain bg-black" />
              <div>
                <h1 className="text-xl font-black text-white">{proveedor.nombre}</h1>
                <p className="text-xs text-[#D4B896]">{proveedor.codigo}</p>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/proveedores")}
                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Información de Contacto</h3>
              <div className="space-y-2">
                {proveedor.nit && (
                  <div>
                    <span className="text-xs text-gray-600">NIT:</span>
                    <p className="text-sm text-white">{proveedor.nit}</p>
                  </div>
                )}
                {proveedor.telefono && (
                  <div>
                    <span className="text-xs text-gray-600">Teléfono:</span>
                    <p className="text-sm text-white">{proveedor.telefono}</p>
                  </div>
                )}
                {proveedor.email && (
                  <div>
                    <span className="text-xs text-gray-600">Email:</span>
                    <p className="text-sm text-white truncate">{proveedor.email}</p>
                  </div>
                )}
                {proveedor.direccion && (
                  <div>
                    <span className="text-xs text-gray-600">Dirección:</span>
                    <p className="text-sm text-white">{proveedor.direccion}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Persona de Contacto</h3>
              <div className="space-y-2">
                {proveedor.contacto_nombre && (
                  <div>
                    <span className="text-xs text-gray-600">Nombre:</span>
                    <p className="text-sm text-white">{proveedor.contacto_nombre}</p>
                  </div>
                )}
                {proveedor.contacto_telefono && (
                  <div>
                    <span className="text-xs text-gray-600">Teléfono:</span>
                    <p className="text-sm text-white">{proveedor.contacto_telefono}</p>
                  </div>
                )}
                {proveedor.terminos_pago && (
                  <div>
                    <span className="text-xs text-gray-600">Términos de Pago:</span>
                    <p className="text-sm text-[#D4B896] font-medium">{proveedor.terminos_pago}</p>
                  </div>
                )}
              </div>
            </div>

            {estadisticas && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Estadísticas</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                    <span className="text-xs text-gray-400">Total Compras</span>
                    <span className="text-lg font-bold text-white">{estadisticas.total_compras}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                    <span className="text-xs text-gray-400">Monto Total</span>
                    <span className="text-lg font-bold text-[#D4B896]">
                      ${estadisticas.monto_total?.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                    <span className="text-xs text-gray-400">Productos Únicos</span>
                    <span className="text-lg font-bold text-white">{estadisticas.productos_diferentes}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {proveedor.notas && (
            <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
              <span className="text-xs text-gray-600">Notas:</span>
              <p className="text-sm text-gray-300 mt-1">{proveedor.notas}</p>
            </div>
          )}
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <div className="border-b border-[#2a2a2a] bg-[#0a0a0a]/50">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabActivo(tab.id)}
                  className={`
                    flex-1 min-w-fit px-6 py-4 text-sm font-medium transition-all
                    ${tabActivo === tab.id
                      ? 'text-[#D4B896] border-b-2 border-[#D4B896] bg-[#1a1a1a]'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]/50'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icono}</span>
                  {tab.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {tabActivo === "resumen" && (
              <TabResumen 
                proveedor={proveedor} 
                estadisticas={estadisticas}
                onRecargar={cargarProveedor}
              />
            )}
            {tabActivo === "facturas" && (
              <TabFacturas proveedorId={id} />
            )}
            {tabActivo === "productos" && (
              <TabProductos proveedorId={id} />
            )}
            {tabActivo === "historial" && (
              <TabHistorial proveedorId={id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}