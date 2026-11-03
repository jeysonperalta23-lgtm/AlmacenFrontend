import { RegistroFisico } from '../../types/inventory';

interface TablaInventarioProps {
  registros: RegistroFisico[];
  onDeleteRegistro?: (id: string) => void;
}

export default function TablaInventario({ registros, onDeleteRegistro }: TablaInventarioProps) {
  if (registros.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">Aún no hay registros</h3>
        <p className="text-slate-500 text-sm max-w-sm">
          Comienza a registrar las cajas y tomos utilizando el formulario de la izquierda. Los datos aparecerán aquí.
        </p>
      </div>
    );
  }

  // Ordenar registros por estante y luego módulo
  const registrosOrdenados = [...registros].sort((a, b) => {
    if (a.estante !== b.estante) return a.estante - b.estante;
    return a.modulo.localeCompare(b.modulo);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Foto Real del Archivo</h2>
          <p className="text-sm text-slate-500 mt-1">
            Total registrado: <span className="font-medium text-emerald-600">{registros.reduce((acc, curr) => acc + curr.cantidad, 0)}</span> unidades
          </p>
        </div>
        <button className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
          Exportar a Excel
        </button>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white sticky top-0 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="px-4 py-3 pl-6">Ubicación</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Año</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3 text-right pr-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrosOrdenados.map((registro) => (
              <tr key={registro.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 pl-6">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">E{registro.estante}</span>
                    <span className="text-slate-400">-</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs">M{registro.modulo}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{registro.area}</td>
                <td className="px-4 py-3 text-slate-700">
                  {registro.tipoDocumento}
                  {registro.notasAdicionales && (
                    <span className="ml-2 inline-flex items-center w-4 h-4 rounded-full bg-amber-100 text-amber-600 justify-center cursor-help" title={registro.notasAdicionales}>
                      i
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{registro.anio}</td>
                <td className="px-4 py-3 text-slate-900 font-medium">
                  {registro.cantidad} <span className="text-slate-500 font-normal text-xs">{registro.unidad.toLowerCase()}{registro.cantidad !== 1 ? 's' : ''}</span>
                </td>
                <td className="px-4 py-3 text-right pr-6">
                  <button 
                    onClick={() => onDeleteRegistro?.(registro.id)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
