import { useState } from "react";
import toast from "react-hot-toast";

export default function ModalCambiarMesa({ 
  mesaOrigen, 
  mesasDisponibles, 
  onCambiar, 
  onCerrar,
  loading 
}) {
  const [mesaDestinoId, setMesaDestinoId] = useState("");

  const handleConfirmar = async () => {
    if (!mesaDestinoId) {
      toast.error("Selecciona una mesa de destino");
      return;
    }

    const mesaDestino = mesasDisponibles.find(m => m.id === mesaDestinoId);
    
    if (!mesaDestino) {
      toast.error("Mesa no válida");
      return;
    }

    await onCambiar(mesaOrigen, mesaDestino);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border-2 border-[#D4B896]/30 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Cambiar de Mesa</h2>
            <p className="text-sm text-gray-400">Selecciona la nueva mesa</p>
          </div>
          <button
            onClick={onCerrar}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mesa Actual */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-xs text-red-400 uppercase font-semibold mb-1">Mesa Actual</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-white">{mesaOrigen.numero}</p>
              <p className="text-xs text-gray-400">Pedido activo</p>
            </div>
          </div>
        </div>

        {/* Flecha */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-[#D4B896]/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[#D4B896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Selección de Mesa Destino */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-400 mb-3">
            Nueva Mesa
          </label>
          
          {mesasDisponibles.length === 0 ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <p className="text-yellow-500 text-sm">No hay mesas disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {mesasDisponibles.map(mesa => (
                <button
                  key={mesa.id}
                  onClick={() => setMesaDestinoId(mesa.id)}
                  disabled={loading}
                  className={
                    "p-4 rounded-xl border-2 transition-all " +
                    (mesaDestinoId === mesa.id
                      ? "bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20"
                      : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-emerald-500/50")
                  }
                >
                  <div className="w-8 h-8 mx-auto mb-2 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <p className="text-white font-bold text-sm">{mesa.numero}</p>
                  <p className="text-[10px] text-emerald-400 uppercase">Libre</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 font-semibold rounded-xl transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading || !mesaDestinoId || mesasDisponibles.length === 0}
            className="flex-1 px-4 py-3 bg-[#D4B896] hover:bg-[#c4a886] text-[#0a0a0a] font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin"></div>
                Moviendo...
              </>
            ) : (
              "Confirmar Cambio"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
