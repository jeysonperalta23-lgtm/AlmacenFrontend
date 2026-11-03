import { Expediente, UbicacionArchivo } from '../../types/archive'
import CodigoEtiqueta from './CodigoEtiqueta'

function ubicacion(value: UbicacionArchivo) {
  return `Estante ${value.estante} · ${value.modulo} · Nivel ${value.nivel}`
}

export default function DetalleExpediente({ expediente: a, paginas }: { expediente: Expediente; paginas: number }) {
  const campos = [
    ['Entidad / Institución', a.entidad],
    ['Área / Subgerencia', a.area || a.modulo],
    ['Tipo de Documento / Contenido', a.tipo],
    ['Ubicación física', ubicacion(a)],
    ['Ubicación / Jurisdicción', a.jurisdiccion],
    ['Año / Tomo', [a.anio, a.tomo ? `Tomo ${a.tomo}` : ''].filter(Boolean).join(' · ')],
    ['Rango de folios', a.folioDesde && a.folioHasta ? `${a.folioDesde} al ${a.folioHasta}` : ''],
    ['Fecha de registro', a.fecha],
    ['Digitalización', `${paginas} páginas asociadas`],
    ['Estado digital', (a.estado ?? a.estadoDigital ?? 'PENDIENTE').replace(/_/g, ' ')],
  ].filter(([, value]) => value?.trim() && !/^no registrad[oa]$/i.test(value.trim()))
  return <>
    <div className="et-detail-layout">
      <div>
        <dl className="et-detail-grid">{campos.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        {a.obs?.trim() && <div className="et-detail-observations"><h4 className="font-bold text-sm">Observaciones</h4><p className="et-detail-note">{a.obs}</p></div>}
        <section className="et-location-history" aria-label="Historial de ubicación">
          <details><summary>Historial de ubicación{a.historialUbicacion?.length ? ` (${a.historialUbicacion.length})` : ''}</summary>
          {a.historialUbicacion?.length ? <ol>{a.historialUbicacion.map((movimiento, index) => <li key={`${movimiento.fecha}-${index}`}>
            <time dateTime={movimiento.fecha}>{new Date(movimiento.fecha).toLocaleString('es-PE')}</time>
            {movimiento.anterior ? <><div>Desde: {ubicacion(movimiento.anterior)}</div><div>Hasta: {ubicacion(movimiento.nueva)}</div></> : <div>Registro inicial: {ubicacion(movimiento.nueva)}</div>}
          </li>)}</ol> : <p>No hay movimientos registrados.</p>}
          </details>
        </section>
      </div>
      <aside className="et-detail-qr"><h4>Código QR del expediente</h4><CodigoEtiqueta expediente={a} barcode={false} /></aside>
    </div>
  </>
}
