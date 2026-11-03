import { useEffect, useRef, useState } from 'react'
import { Expediente } from '../../types/archive'
import ImprimirEtiquetas from './ImprimirEtiquetas'
import './Etiquetado.css'

interface Props { archivos: Expediente[]; highlightedIds?: string[]; onAcknowledge: (ids: string[]) => void; onOpen: (id: string) => void; onMobile: () => void; onRegister: () => void }
export default function EtiquetadoArchivo({ archivos, highlightedIds = [], onAcknowledge, onOpen, onMobile, onRegister }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [shelf, setShelf] = useState('')
  const [page, setPage] = useState(1)
  const [printing, setPrinting] = useState(false)
  const selectAll = useRef<HTMLInputElement>(null)
  const selection = archivos.filter(a => selected.includes(a.id))
  const filtered = archivos.filter(a => (!shelf || a.estante === shelf) && `${a.codigo} ${a.tipo} ${a.modulo} ${a.anio}`.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')))
  const pages = Math.max(1, Math.ceil(filtered.length / 8))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * 8, current * 8)
  const all = visible.length > 0 && visible.every(a => selected.includes(a.id))
  useEffect(() => { if (selectAll.current) selectAll.current.indeterminate = !all && visible.some(a => selected.includes(a.id)) }, [all, visible, selected])
  const latest = archivos[0]
  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id])
    onAcknowledge([id])
  }
  function togglePage() {
    setSelected(prev => all ? prev.filter(id => !visible.some(a => a.id === id)) : [...new Set([...prev, ...visible.map(a => a.id)])])
    onAcknowledge(visible.map(a => a.id))
  }
  return <section className="et-workspace" aria-labelledby="et-title">
    <header className="et-section-header">
      <div><h2 id="et-title">Etiquetas QR</h2><p>Selecciona expedientes para imprimir sus etiquetas.</p></div>
      <div className="et-section-actions">
        <button className="et-button et-button-primary" disabled={!selection.length} onClick={() => setPrinting(true)}>Imprimir etiquetas{selection.length > 0 && ` (${selection.length})`}</button>
        <button className="et-button et-button-secondary" onClick={onMobile}>▣ Probar vista móvil</button>
      </div>
    </header>
    {latest && <section className="et-latest-record" aria-labelledby="et-latest-title">
      <div><h3 id="et-latest-title">Último expediente registrado</h3><strong>{latest.codigo || 'Sin código'}</strong><p className="et-capitalize">{latest.tipo} · {latest.modulo}</p></div>
      <button type="button" className="et-button et-button-secondary" onClick={() => onOpen(latest.id)}>Ver último expediente</button>
    </section>}
    <div className="et-catalog"><div className="et-catalog-heading"><div><span className="et-kicker">EXPLORAR ARCHIVO</span><h3>Expedientes para etiquetar <span>{archivos.length}</span></h3></div></div>
      <div className="et-table-tools"><label className="et-filter-search"><span aria-hidden="true">⌕</span><input aria-label="Buscar expedientes para imprimir" placeholder="Buscar por código, área, tipo o año…" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} /></label><select aria-label="Filtrar estante" value={shelf} onChange={e => { setShelf(e.target.value); setPage(1) }}><option value="">Todos los estantes</option>{Array.from(new Set(archivos.map(a => a.estante))).sort().map(k => <option key={k} value={k}>Estante {k}</option>)}</select></div>
      {selection.length > 0 && <div className="et-selection" role="status"><span><b>{selection.length}</b> expedientes seleccionados · incluye otras páginas o filtros</span><button onClick={() => setSelected([])}>Limpiar selección</button></div>}
      {!selection.length && <div className="et-selection-hint" role="status">Selecciona uno o más expedientes para habilitar la impresión de etiquetas.</div>}
      <div className="et-table-scroll">
        <table className="et-table">
          <thead><tr>
            <th><input ref={selectAll} type="checkbox" aria-label="Seleccionar expedientes de esta página" checked={all} disabled={!visible.length} onChange={togglePage} /></th>
            <th>Expediente</th><th>Ubicación física</th><th>Año / Tomo</th><th><span className="sr-only">Acción</span></th>
          </tr></thead>
          <tbody>{visible.map(a => <tr key={a.id} className={`${selected.includes(a.id) ? 'is-selected' : ''} ${highlightedIds.includes(a.id) ? 'is-new' : ''}`}>
            <td><input type="checkbox" aria-label={`Seleccionar ${a.codigo}`} checked={selected.includes(a.id)} onChange={() => toggle(a.id)} /></td>
            <td><button className="et-record" onClick={() => onOpen(a.id)}><span className="et-record-icon">▤</span><span><strong>{a.codigo || 'Sin código'}</strong><small className="et-capitalize">{a.tipo || 'Sin tipo'}</small></span></button>{highlightedIds.includes(a.id) && <div className="et-row-notice"><span className="et-new-badge">Pendiente de revisar</span><button type="button" aria-label={`Descartar aviso de ${a.codigo}`} title="Descartar aviso" onClick={() => onAcknowledge([a.id])}>×</button></div>}</td>
            <td><strong className="et-location">E{a.estante} <span>→</span> N{a.nivel}</strong><small className="et-cell-sub et-capitalize">{a.modulo}</small></td>
            <td>{a.anio}<small className="et-cell-sub">{a.tomo ? `Tomo ${a.tomo}` : 'Tomo único'}</small></td>
            <td><button className="et-detail-link" aria-label={`Ver detalle de ${a.codigo}`} onClick={() => onOpen(a.id)}><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>Ver detalle</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      {visible.length === 0 && <div className="et-empty"><span>▦</span><h4>{archivos.length ? 'No encontramos coincidencias' : 'Tu archivo comienza aquí'}</h4><p>{archivos.length ? 'Prueba otro código o cambia el estante.' : 'Registra el primer expediente para visualizar y crear sus etiquetas.'}</p>{!archivos.length && <button className="et-button et-button-dark" onClick={onRegister}>Registrar expediente</button>}</div>}
      <footer className="et-table-footer"><span>{filtered.length ? (current - 1) * 8 + 1 : 0}–{Math.min(current * 8, filtered.length)} de {filtered.length} expedientes</span><div><button disabled={current === 1} aria-label="Página anterior" onClick={() => setPage(current - 1)}>←</button><span>{current} / {pages}</span><button disabled={current === pages} aria-label="Página siguiente" onClick={() => setPage(current + 1)}>→</button></div></footer>
    </div>{printing && <ImprimirEtiquetas archivos={selection} onClose={() => setPrinting(false)} />}
  </section>
}
