import { FormEvent, useEffect, useRef, useState } from 'react'
import { Expediente } from '../../types/archive'
import { scanMatches } from '../../utils/archiveLabels'
import './Etiquetado.css'

export default function BuscadorEscaner({ archivos, onOpen, onMobile }: { archivos: Expediente[]; onOpen: (id: string) => void; onMobile: () => void }) {
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [focused, setFocused] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const open = useRef(onOpen)
  open.current = onOpen
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !document.querySelector('[role="dialog"]')) { e.preventDefault(); input.current?.focus() }
    }
    const outside = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setFocused(false) }
    window.addEventListener('keydown', shortcut); document.addEventListener('pointerdown', outside)
    return () => { window.removeEventListener('keydown', shortcut); document.removeEventListener('pointerdown', outside) }
  }, [])
  function choose(id: string) { setQuery(''); setMessage(''); setFocused(false); open.current(id) }
  useEffect(() => {
    if (!focused || !query.trim()) return
    const exact = scanMatches(archivos, query)
    if (exact.length !== 1) return
    const timer = window.setTimeout(() => { setQuery(''); setMessage(''); setFocused(false); open.current(exact[0].id) }, 450)
    return () => window.clearTimeout(timer)
  }, [query, archivos, focused])
  const exact = scanMatches(archivos, query)
  const results = exact.length ? exact : archivos.filter(a => query.trim() && `${a.codigo} ${a.tipo} ${a.modulo} ${a.anio}`.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')))
  function submit(e: FormEvent) {
    e.preventDefault()
    if (exact.length === 1) choose(exact[0].id)
    else { setFocused(true); setMessage(exact.length > 1 ? 'Hay códigos repetidos. Selecciona el expediente correcto o utiliza su QR único.' : 'Selecciona un resultado o escanea el código completo.') }
  }
  return <div className="et-global"><div className="et-global-inner">
    <div className="et-brand"><span className="et-brand-mark" aria-hidden="true">▥</span><div><strong>Archivo<span> / Scan</span></strong><small>LOCALIZA · ETIQUETA · DIGITALIZA</small></div></div>
    <div className="et-search-wrap" ref={box}><form className={`et-search ${focused ? 'is-focused' : ''}`} onSubmit={submit}><span aria-hidden="true">⌕</span><input ref={input} aria-label="Buscar o escanear expediente" placeholder="Busca o escanea el código del expediente…" value={query} autoComplete="off" onFocus={() => setFocused(true)} onChange={e => { setQuery(e.target.value); setMessage('') }} onKeyDown={e => { if (e.key === 'Escape') { setFocused(false); input.current?.blur() } }} /><button type="submit" aria-label="Buscar expediente"><span aria-hidden="true">▥</span></button><kbd>Ctrl K</kbd></form>
      {focused && <div className="et-results"><div className="et-results-heading"><span>LECTOR USB / QR</span><span className="et-live-dot">Listo para leer</span></div>{message && <p role="status">{message}</p>}{!query.trim() ? <p>Escanea con el cursor aquí. Enter abre el expediente; también puedes buscar por código, área o año.</p> : results.length === 0 ? <p>No se encontró este expediente en el archivo.</p> : <>{results.slice(0, 6).map(a => <button key={a.id} onClick={() => choose(a.id)}><span className="et-result-icon">▤</span><span><strong>{a.codigo}</strong><small>{a.tipo} · Estante {a.estante} · {a.modulo}</small></span><span aria-hidden="true">↗</span></button>)}{results.length > 6 && <p>{results.length} coincidencias. Escribe más para precisar la búsqueda.</p>}</>}</div>}
    </div><button className="et-mobile-shortcut" onClick={onMobile}><span aria-hidden="true">▣</span><span>Vista móvil</span></button>
  </div></div>
}
