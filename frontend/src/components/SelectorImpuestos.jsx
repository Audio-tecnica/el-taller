import { useState, useEffect } from 'react';
import impuestosService from '../services/impuestosService';

/**
 * Componente para seleccionar impuestos en facturas B2B
 * 
 * Props:
 * - impuestosSeleccionados: Array de IDs de impuestos seleccionados
 * - onImpuestosChange: Callback cuando cambian los impuestos seleccionados
 * - impuestosCliente: Array de impuestos predeterminados del cliente (opcional)
 * - subtotal: Monto subtotal para calcular preview
 * - disabled: Si el selector está deshabilitado
 */
export default function SelectorImpuestos({
  impuestosSeleccionados = [],
  onImpuestosChange,
  impuestosCliente = [],
  subtotal = 0,
  disabled = false
}) {
  const [impuestosDisponibles, setImpuestosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculoPreview, setCalculoPreview] = useState(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  // Cargar impuestos disponibles
  useEffect(() => {
    cargarImpuestos();
  }, []);

  // Precargar impuestos del cliente cuando cambia
  useEffect(() => {
    if (impuestosCliente.length > 0 && impuestosSeleccionados.length === 0) {
      const idsCliente = impuestosCliente.map(ic => ic.impuesto_id || ic.id);
      onImpuestosChange(idsCliente);
    }
  }, [impuestosCliente]);

  // Calcular preview cuando cambian los seleccionados o el subtotal
  useEffect(() => {
    if (impuestosSeleccionados.length > 0 && subtotal > 0) {
      calcularPreview();
    } else {
      setCalculoPreview(null);
    }
  }, [impuestosSeleccionados, subtotal]);

  const cargarImpuestos = async () => {
    try {
      setLoading(true);
      const data = await impuestosService.obtenerImpuestosActivos();
      setImpuestosDisponibles(data);
    } catch (error) {
      console.error('Error al cargar impuestos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularPreview = () => {
    const seleccionados = impuestosDisponibles.filter(imp => 
      impuestosSeleccionados.includes(imp.id)
    );
    const resultado = impuestosService.calcularTotalesLocal(subtotal, seleccionados);
    setCalculoPreview(resultado);
  };

  const handleToggleImpuesto = (impuestoId) => {
    if (disabled) return;
    
    const nuevaSeleccion = impuestosSeleccionados.includes(impuestoId)
      ? impuestosSeleccionados.filter(id => id !== impuestoId)
      : [...impuestosSeleccionados, impuestoId];
    
    onImpuestosChange(nuevaSeleccion);
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(valor || 0);
  };

  // Separar por tipo
  const impuestos = impuestosDisponibles.filter(i => i.tipo === 'Impuesto');
  const retenciones = impuestosDisponibles.filter(i => i.tipo === 'Retencion');

  // Impuestos comunes (los más usados)
  const impuestosComunes = ['IVA19', 'IVA5', 'INC8', 'IVA0'];
  const retencionesComunes = ['RFTE25', 'RIVA15'];

  const impuestosFiltrados = mostrarTodos 
    ? impuestos 
    : impuestos.filter(i => impuestosComunes.includes(i.codigo));
  
  const retencionesFiltradas = mostrarTodos 
    ? retenciones 
    : retenciones.filter(i => retencionesComunes.includes(i.codigo));

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-8 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sección de Impuestos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <span className="text-lg">📊</span>
          Impuestos (suman al total)
        </h4>
        <div className="flex flex-wrap gap-2">
          {impuestosFiltrados.map(impuesto => {
            const isSelected = impuestosSeleccionados.includes(impuesto.id);
            const esDelCliente = impuestosCliente.some(ic => 
              (ic.impuesto_id || ic.id) === impuesto.id
            );
            
            return (
              <button
                key={impuesto.id}
                type="button"
                onClick={() => handleToggleImpuesto(impuesto.id)}
                disabled={disabled}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${isSelected 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${esDelCliente && !isSelected ? 'ring-2 ring-blue-300' : ''}
                `}
                title={impuesto.descripcion}
              >
                <span className="font-bold">{impuesto.nombre}</span>
                {esDelCliente && (
                  <span className="ml-1 text-xs opacity-75">★</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sección de Retenciones */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
          <span className="text-lg">📉</span>
          Retenciones (restan del total)
        </h4>
        <div className="flex flex-wrap gap-2">
          {retencionesFiltradas.map(retencion => {
            const isSelected = impuestosSeleccionados.includes(retencion.id);
            const esDelCliente = impuestosCliente.some(ic => 
              (ic.impuesto_id || ic.id) === retencion.id
            );
            
            return (
              <button
                key={retencion.id}
                type="button"
                onClick={() => handleToggleImpuesto(retencion.id)}
                disabled={disabled}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${isSelected 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-400'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${esDelCliente && !isSelected ? 'ring-2 ring-orange-300' : ''}
                `}
                title={retencion.descripcion}
              >
                <span className="font-bold">{retencion.nombre}</span>
                {esDelCliente && (
                  <span className="ml-1 text-xs opacity-75">★</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggle para ver todos */}
      <button
        type="button"
        onClick={() => setMostrarTodos(!mostrarTodos)}
        className="text-sm text-gray-500 hover:text-gray-700 underline"
      >
        {mostrarTodos ? '← Ver menos opciones' : 'Ver más opciones →'}
      </button>

      {/* Preview de cálculo */}
      {calculoPreview && subtotal > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            📋 Preview de Impuestos
          </h4>
          
          {/* Detalle de impuestos aplicados */}
          {calculoPreview.detalle.length > 0 && (
            <div className="space-y-1 mb-3 text-sm">
              {calculoPreview.detalle.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex justify-between ${
                    item.tipo === 'Retencion' ? 'text-orange-600' : 'text-blue-600'
                  }`}
                >
                  <span>
                    {item.nombre} ({item.porcentaje}%)
                  </span>
                  <span className="font-medium">
                    {item.tipo === 'Retencion' ? '−' : '+'} {formatearMoneda(item.monto)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Totales */}
          <div className="border-t border-gray-300 pt-2 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>{formatearMoneda(calculoPreview.subtotal)}</span>
            </div>
            {calculoPreview.total_impuestos > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>+ Impuestos:</span>
                <span>{formatearMoneda(calculoPreview.total_impuestos)}</span>
              </div>
            )}
            {calculoPreview.total_retenciones > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>− Retenciones:</span>
                <span>{formatearMoneda(calculoPreview.total_retenciones)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-800 pt-1 border-t border-gray-200">
              <span>Neto a Pagar:</span>
              <span className="text-emerald-600">{formatearMoneda(calculoPreview.neto_a_pagar)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Nota sobre impuestos del cliente */}
      {impuestosCliente.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          ★ Impuestos predeterminados del cliente
        </p>
      )}
    </div>
  );
}
