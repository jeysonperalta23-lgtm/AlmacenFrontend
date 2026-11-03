import { FormEvent, useState } from 'react';
import { RegistroFisico, UnidadMedida } from '../../types/inventory';

interface RegistroFisicoFormProps {
  onAddRegistro: (registro: Omit<RegistroFisico, 'id'>) => void;
}

const AREAS_COMUNES = ['Abastecimiento', 'Secretaría', 'Contabilidad', 'Recursos Humanos', 'Gerencia', 'Operaciones'];
const TIPOS_COMUNES = ['Facturas', 'Resoluciones', 'Expedientes', 'Contratos', 'Oficios', 'Memorándums', 'Informes'];
const UNIDADES: UnidadMedida[] = ['Caja', 'Tomo', 'Carpeta', 'Paquete'];

export default function RegistroFisicoForm({ onAddRegistro }: RegistroFisicoFormProps) {
  // Estado para mantener la ubicación (útil para registrar varios seguidos)
  const [estante, setEstante] = useState<number>(1);
  const [modulo, setModulo] = useState<string>('A');
  
  // Estado para los datos del lote actual
  const [area, setArea] = useState<string>('');
  const [tipoDocumento, setTipoDocumento] = useState<string>('');
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [cantidad, setCantidad] = useState<number>(1);
  const [unidad, setUnidad] = useState<UnidadMedida>('Caja');
  const [notasAdicionales, setNotasAdicionales] = useState<string>('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!area || !tipoDocumento || cantidad < 1) return;

    onAddRegistro({
      estante,
      modulo,
      area,
      tipoDocumento,
      anio,
      cantidad,
      unidad,
      notasAdicionales: notasAdicionales.trim() || undefined,
    });

    // Limpiar solo los campos específicos del lote, manteniendo la ubicación (estante y módulo)
    setArea('');
    setTipoDocumento('');
    setCantidad(1);
    setNotasAdicionales('');
    
    // Devolvemos el foco al área para un flujo rápido
    document.getElementById('area')?.focus();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Nuevo Registro</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ubicación (Persiste entre registros) */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="estante">Estante N°</label>
            <input
              id="estante"
              type="number"
              min="1"
              value={estante}
              onChange={(e) => setEstante(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="modulo">Módulo</label>
            <input
              id="modulo"
              type="text"
              value={modulo}
              onChange={(e) => setModulo(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none uppercase"
              placeholder="Ej: A, B, 1"
              required
            />
          </div>
        </div>

        {/* Datos del Documento */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="area">Área / Departamento</label>
            <input
              id="area"
              type="text"
              list="areas-list"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="Selecciona o escribe..."
              required
            />
            <datalist id="areas-list">
              {AREAS_COMUNES.map(a => <option key={a} value={a} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="tipoDocumento">Tipo de Documento</label>
            <input
              id="tipoDocumento"
              type="text"
              list="tipos-list"
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="Selecciona o escribe..."
              required
            />
            <datalist id="tipos-list">
              {TIPOS_COMUNES.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="anio">Año</label>
              <input
                id="anio"
                type="number"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="cantidad">Cantidad</label>
              <input
                id="cantidad"
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="unidad">Unidad</label>
              <select
                id="unidad"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value as UnidadMedida)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
              >
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="notas">Notas / Observaciones</label>
            <input
              id="notas"
              type="text"
              value={notasAdicionales}
              onChange={(e) => setNotasAdicionales(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="Opcional..."
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 text-white font-medium py-2.5 rounded-xl hover:bg-emerald-700 transition-colors focus:ring-4 focus:ring-emerald-500/20 outline-none"
        >
          Guardar y Agregar Otro
        </button>
      </form>
    </div>
  );
}
