import { Expediente } from '../../types/archive'
import Badge, { getBadgeInfo } from './Badge'

interface TablaExpedientesProps {
  archivos: Expediente[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onDigitalizar?: (id: string) => void
  photoCounts?: Record<string, number>
}

function EstadoDigitalBadge({ estado }: { estado: Expediente['estadoDigital'] }) {
  if (estado === 'PENDIENTE') {
    return (
      <span
        style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
      >
        🟡 Pendiente
      </span>
    )
  }
  if (estado === 'FINALIZADO') {
    return (
      <span
        style={{ background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0' }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
      >
        ✅ Digitalizado
      </span>
    )
  }
  return null
}

export default function TablaExpedientes({ archivos, onEdit, onDelete, onDigitalizar, photoCounts = {} }: TablaExpedientesProps) {
  if (!archivos.length) {
    return (
      <div className="text-[13px] text-arc-inkSoft p-3.5">
        Aún no hay expedientes registrados. Usa el formulario de arriba para agregar el primero.
      </div>
    )
  }

  const sorted = [...archivos].sort(
    (a, b) =>
      Number(a.estante) - Number(b.estante) ||
      a.modulo.localeCompare(b.modulo) ||
      Number(a.anio) - Number(b.anio)
  )

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="text-left text-[11.5px] text-arc-inkSoft font-semibold p-2 border-b-[1.5px] border-arc-ink">Código</th>
          <th className="text-left text-[11.5px] text-arc-inkSoft font-semibold p-2 border-b-[1.5px] border-arc-ink">Ubicación</th>
          <th className="text-left text-[11.5px] text-arc-inkSoft font-semibold p-2 border-b-[1.5px] border-arc-ink">Tipo</th>
          <th className="text-left text-[11.5px] text-arc-inkSoft font-semibold p-2 border-b-[1.5px] border-arc-ink">Año</th>
          <th className="text-left text-[11.5px] text-arc-inkSoft font-semibold p-2 border-b-[1.5px] border-arc-ink">Estado</th>
          <th className="text-left text-[11.5px] text-arc-inkSoft font-semibold p-2 border-b-[1.5px] border-arc-ink">Opciones</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(a => {
          const b = getBadgeInfo(a.anio)
          const esPendiente = a.estadoDigital === 'PENDIENTE'
          const esFinalizado = a.estadoDigital === 'FINALIZADO'
          return (
            <tr key={a.id} className={`group${esPendiente ? ' bg-amber-50/60' : ''}`}>
              <td className="p-2 py-2.5 border-b border-arc-line align-middle group-last:border-b-0">
                <span className="font-mono text-[12px] bg-arc-paper px-1.5 py-0.5 rounded border border-arc-line">{a.codigo}</span>
              </td>
              <td className="p-2 py-2.5 border-b border-arc-line align-middle group-last:border-b-0">E{a.estante} · {a.modulo} · N{a.nivel}</td>
              <td className="p-2 py-2.5 border-b border-arc-line align-middle group-last:border-b-0">{a.tipo}</td>
              <td className="p-2 py-2.5 border-b border-arc-line align-middle group-last:border-b-0">{a.anio}{a.tomo ? ` / T${a.tomo}` : ''}</td>
              <td className="p-2 py-2.5 border-b border-arc-line align-middle group-last:border-b-0">
                <div className="flex flex-col gap-1.5">
                  <Badge cls={b.cls} txt={b.txt} />
                  <EstadoDigitalBadge estado={a.estadoDigital} />
                </div>
              </td>
              <td className="p-2 py-2.5 border-b border-arc-line align-middle group-last:border-b-0">
                <button className="bg-none border-none text-arc-inkSoft text-[12.5px] cursor-pointer underline p-0 font-sans" onClick={() => onEdit(a.id)}>Editar</button>
                {onDigitalizar && (
                  esPendiente ? (
                    <button
                      type="button"
                      className="block my-2 rounded-lg px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                      style={{ background: '#F59E0B' }}
                      onClick={() => onDigitalizar(a.id)}
                      aria-label={`Seguir digitalizando ${a.codigo}`}
                    >
                      ▶ Seguir digitalizando
                    </button>
                  ) : esFinalizado ? (
                    <button
                      type="button"
                      className="block my-2 rounded-lg px-3 py-2 text-xs font-bold transition-opacity hover:opacity-80"
                      style={{ background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0' }}
                      onClick={() => onDigitalizar(a.id)}
                      aria-label={`Ver imágenes de ${a.codigo}`}
                    >
                      📂 {photoCounts[a.id] ? `${photoCounts[a.id]} páginas` : 'Ver'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="block my-2 rounded-lg bg-arc-paper2 text-arc-red px-3 py-2 text-xs font-bold"
                      onClick={() => onDigitalizar(a.id)}
                      aria-label={`Digitalizar ${a.codigo}`}
                    >
                      📷 {photoCounts[a.id] ? `${photoCounts[a.id]} páginas` : 'Digitalizar'}
                    </button>
                  )
                )}
                {' · '}
                <button
                  className="bg-none border-none text-[12.5px] cursor-pointer underline p-0 font-sans text-arc-redDark"
                  onClick={() => {
                    if (window.confirm('¿Eliminar este expediente?')) onDelete(a.id)
                  }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

