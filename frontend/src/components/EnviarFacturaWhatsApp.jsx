import { useState } from "react";
import toast from "react-hot-toast";

export default function EnviarFacturaWhatsApp({ pedidoId, totalPedido, mesaNumero, pedido }) {
  const [telefono, setTelefono] = useState("");

  const formatearTelefono = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    const limitado = numeros.slice(0, 10);
    
    if (limitado.length <= 3) {
      return limitado;
    } else if (limitado.length <= 6) {
      return `${limitado.slice(0, 3)} ${limitado.slice(3)}`;
    } else {
      return `${limitado.slice(0, 3)} ${limitado.slice(3, 6)} ${limitado.slice(6)}`;
    }
  };

  const handleTelefonoChange = (e) => {
    const formateado = formatearTelefono(e.target.value);
    setTelefono(formateado);
  };

  const handleEnviarWhatsApp = () => {
    const soloNumeros = telefono.replace(/\s/g, '');
    
    if (soloNumeros.length !== 10) {
      toast.error('Ingresa un número válido de 10 dígitos');
      return;
    }

    // Generar URL de la factura
    const urlFactura = `${window.location.origin}/api/facturas/pdf/${pedidoId}`;

    // Obtener total de múltiples fuentes posibles
    let total = 0;
    if (totalPedido) {
      total = Number(totalPedido);
    } else if (pedido?.total) {
      total = Number(pedido.total);
    } else if (pedido?.subtotal) {
      total = Number(pedido.subtotal);
    }

    // Formatear total
    const totalFormateado = total.toLocaleString('es-CO');

    // Obtener mesa de múltiples fuentes
    const mesa = mesaNumero || pedido?.mesa?.numero || pedido?.mesa_numero || 'N/A';

    // Crear mensaje de WhatsApp
    const mensaje = `¡Gracias por tu compra en El Taller! 🍺

Mesa: ${mesa}
Total: $${totalFormateado}

📄 Descarga tu factura aquí:
${urlFactura}

¡Vuelve pronto!`;

    // Generar link de WhatsApp
    const urlWhatsApp = `https://wa.me/57${soloNumeros}?text=${encodeURIComponent(mensaje)}`;

    // Abrir WhatsApp
    window.open(urlWhatsApp, '_blank');
    
    toast.success('WhatsApp abierto. Envía el mensaje al cliente 📱');
    
    // Limpiar campo
    setTimeout(() => {
      setTelefono("");
    }, 1000);
  };

  return (
    <div className="border-t border-[#2a2a2a] pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span className="text-sm font-medium text-gray-300">Enviar factura por WhatsApp</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-sm text-gray-500">🇨🇴</span>
            <span className="text-sm text-gray-400">+57</span>
          </div>
          
          <input
            type="tel"
            value={telefono}
            onChange={handleTelefonoChange}
            placeholder="300 123 4567"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && telefono.replace(/\s/g, '').length === 10) {
                handleEnviarWhatsApp();
              }
            }}
            className="w-full pl-20 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={handleEnviarWhatsApp}
          disabled={!telefono || telefono.replace(/\s/g, '').length !== 10}
          className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-[#2a2a2a] disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Abrir WhatsApp
        </button>

        <p className="text-xs text-gray-600 text-center">
          Se abrirá WhatsApp con el mensaje listo para enviar
        </p>
      </div>
    </div>
  );
}