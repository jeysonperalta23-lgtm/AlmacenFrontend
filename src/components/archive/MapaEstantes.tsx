import { CSSProperties, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Expediente, Estructura } from '../../types/archive'
import { imageUrl, PaginaDemo } from '../../services/digitalizacionMemory'
import './MapaEstantes.css'

interface MapaEstantesProps {
  estructura: Estructura
  archivos: Expediente[]
  pages: PaginaDemo[]
  photoError: string
  onDigitalizar: (id: string) => void
}

const colors = ['#2563a6', '#25805d', '#8952a0', '#b26726', '#287e86', '#a54764']
function moduleColor(modulo: string) {
  const name = modulo.trim().toLocaleLowerCase('es')
  if (name === 'abastecimiento') return colors[0]
  if (name === 'contabilidad') return colors[1]
  const hash = Array.from(name).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0)
  return colors[hash % colors.length]
}
const naturalSort = (a: string, b: string) => a.localeCompare(b, 'es', { numeric: true })
const levelOf = (a: Expediente) => a.nivel.trim() || 'Sin nivel'
function matchesTerm(a: Expediente, term: string) {
  return [a.codigo, a.modulo, a.tipo, a.anio, a.tomo, a.obs, a.nivel]
    .some(value => (value ?? '').toLocaleLowerCase('es').includes(term))
}

function PageImage({ page, label }: { page: PaginaDemo; label: string }) {
  const [failed, setFailed] = useState(false)
  return failed
    ? <span className="shelf-image-error" role="status">No se pudo cargar {label.toLowerCase()}.</span>
    : <img src={imageUrl(page)} alt={label} loading="lazy" onError={() => setFailed(true)} />
}

function FolderDetails({ expediente, pages, photoError, onDigitalizar }: {
  expediente: Expediente; pages: PaginaDemo[]; photoError: string; onDigitalizar: (id: string) => void
}) {
  const [previewId, setPreviewId] = useState<string | null>(null)
  const previewRef = useRef<HTMLElement>(null)
  const preview = pages.find(page => page.id === previewId) ?? pages[0]
  const esPendiente = expediente.estadoDigital === 'PENDIENTE'
  const esFinalizado = expediente.estadoDigital === 'FINALIZADO'
  return <>
    <header className="shelf-detail-header" style={{ borderTopColor: moduleColor(expediente.modulo) }}>
      <span className="shelf-eyebrow">Carpeta abierta</span>
      <h3 id="shelf-detail-title">{expediente.codigo || 'Sin código'}</h3>
      <p>{expediente.modulo}</p>
      {esPendiente && (
        <span style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginTop: 6 }}>
          🟡 Digitalización pendiente
        </span>
      )}
      {esFinalizado && (
        <span style={{ background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginTop: 6 }}>
          ✅ Digitalizado
        </span>
      )}
    </header>
    <div className="shelf-detail-body">
      <dl className="shelf-metadata">
        <div><dt>Tipo de documento</dt><dd>{expediente.tipo || 'Sin tipo'}</dd></div>
        <div><dt>Ubicación física</dt><dd>Estante {expediente.estante} · Nivel {levelOf(expediente)}</dd></div>
        <div><dt>Año / Tomo</dt><dd>{expediente.anio || 'Sin año'}{expediente.tomo && ` · Tomo ${expediente.tomo}`}</dd></div>
      </dl>
      {expediente.obs && <p className="shelf-note">{expediente.obs}</p>}
      <h4 className="shelf-gallery-title">Imágenes digitalizadas <span>{pages.length}</span></h4>
      {photoError ? <p className="shelf-image-error" role="alert">{photoError}</p> : preview ? <>
        <figure ref={previewRef} tabIndex={-1} aria-label="Vista de imágenes adjuntas" className="shelf-preview">
          <PageImage key={`${preview.session}/${preview.id}`} page={preview} label={`Página ${pages.indexOf(preview) + 1} de ${expediente.codigo}`} />
          <figcaption>Página {pages.indexOf(preview) + 1} de {pages.length} · <a href={imageUrl(preview)} target="_blank" rel="noreferrer">Abrir original ↗</a></figcaption>
        </figure>
        <div className="shelf-thumbnails" role="group" aria-label="Páginas digitalizadas">
          {pages.map((page, index) => <button type="button" key={`${page.session}/${page.id}`} aria-label={`Ver página ${index + 1}`} aria-pressed={page.id === preview.id} onClick={() => setPreviewId(page.id)}>
            <PageImage page={page} label={`Miniatura ${index + 1}`} /><span>{index + 1}</span>
          </button>)}
        </div>
      </> : <p className="shelf-empty-photos">Este expediente aún no tiene imágenes digitalizadas.</p>}
      {esPendiente ? (
        <button
          type="button"
          className="shelf-digitize"
          style={{ background: '#F59E0B', color: 'white', border: 'none', fontWeight: 700 }}
          onClick={() => onDigitalizar(expediente.id)}
        >
          ▶ Seguir digitalizando
        </button>
      ) : esFinalizado ? (
        pages.length > 0 && (
          <button type="button" className="btn-archivo shelf-digitize" onClick={() => {
            previewRef.current?.focus({ preventScroll: true })
            previewRef.current?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
          }}>Visualizar las imágenes adjuntas</button>
        )
      ) : pages.length > 0 ? (
        <button type="button" className="btn-archivo shelf-digitize" onClick={() => {
          previewRef.current?.focus({ preventScroll: true })
          previewRef.current?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
        }}>Visualizar las imágenes adjuntas</button>
      ) : (
        <button type="button" className="btn-archivo shelf-digitize" onClick={() => onDigitalizar(expediente.id)}>Digitalizar / vincular celular</button>
      )}
    </div>
  </>
}

export default function MapaEstantes({ estructura, archivos, pages, photoError, onDigitalizar }: MapaEstantesProps) {
  const [search, setSearch] = useState('')
  const [activeEstante, setActiveEstante] = useState<string | null>(null)
  const [selectedExpediente, setSelectedExpediente] = useState<string | null>(null)
  const selectorRef = useRef<HTMLDivElement>(null)
  const selectorId = useId()
  const [canScroll, setCanScroll] = useState({ left: false, right: false })
  const term = search.trim().toLocaleLowerCase('es')
  const shelves = useMemo(() => {
    const grouped = new Map<string, Expediente[]>(Object.keys(estructura).map(key => [key, []]))
    archivos.forEach(a => {
      const key = String(a.estante)
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(a)
    })
    return [...grouped].sort(([a], [b]) => naturalSort(a, b)).map(([id, items]) => ({ id, items }))
  }, [estructura, archivos])
  useEffect(() => {
    const selector = selectorRef.current
    if (!selector) return
    const update = () => setCanScroll({
      left: selector.scrollLeft > 1,
      right: selector.scrollLeft + selector.clientWidth < selector.scrollWidth - 1,
    })
    const observer = new ResizeObserver(update)
    observer.observe(selector)
    selector.addEventListener('scroll', update, { passive: true })
    update()
    return () => { observer.disconnect(); selector.removeEventListener('scroll', update) }
  }, [shelves.length])

  function scrollShelves(direction: number) {
    const selector = selectorRef.current
    if (!selector) return
    selector.scrollBy({
      left: direction * selector.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }
  const active = shelves.find(shelf => shelf.id === activeEstante) ?? shelves[0]
  const levels = useMemo(() => {
    const grouped = new Map<string, Expediente[]>()
    active?.items.forEach(a => {
      const level = levelOf(a)
      if (!grouped.has(level)) grouped.set(level, [])
      grouped.get(level)!.push(a)
    })
    return [...grouped].sort(([a], [b]) => naturalSort(a, b))
      .map(([level, items]) => ({ level, items: [...items].sort((a, b) => naturalSort(a.modulo, b.modulo) || naturalSort(a.codigo, b.codigo)) }))
  }, [active])
  const selected = active?.items.find(a => a.id === selectedExpediente)
  const selectedPages = useMemo(() => pages.filter(page => page.expedienteId === selected?.id), [pages, selected?.id])
  const modules = [...new Set([...(estructura[active?.id ?? ''] ?? []), ...(active?.items.map(a => a.modulo) ?? [])])]
  const matchCount = active?.items.filter(a => matchesTerm(a, term)).length ?? 0

  return <section className="shelf-map" aria-label="Mapa visual de estantes">
    <div className="shelf-toolbar">
      <div><span className="shelf-eyebrow">Archivo físico</span><h2>Explora tus estantes</h2></div>
      <label className="shelf-search">Buscar expediente
        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Código, área, tipo, año o nivel…" />
      </label>
    </div>
    <div className="shelf-carousel">
      <button type="button" className="shelf-carousel-arrow" aria-label="Ver estantes anteriores" aria-controls={selectorId} disabled={!canScroll.left} onClick={() => scrollShelves(-1)}><span aria-hidden="true">‹</span></button>
      <div ref={selectorRef} id={selectorId} className="shelf-selector" role="group" aria-label="Seleccionar estante">
        {shelves.map(shelf => <button type="button" key={shelf.id} aria-pressed={active?.id === shelf.id} onClick={() => { setActiveEstante(shelf.id); setSelectedExpediente(null) }}>
          Estante {shelf.id}<span>{term ? `${shelf.items.filter(a => matchesTerm(a, term)).length} coincidencias` : `${shelf.items.length} exp.`}</span>
        </button>)}
      </div>
      <button type="button" className="shelf-carousel-arrow" aria-label="Ver estantes siguientes" aria-controls={selectorId} disabled={!canScroll.right} onClick={() => scrollShelves(1)}><span aria-hidden="true">›</span></button>
    </div>
    <div className="shelf-layout">
      <div className="shelf-visual">
        <div className="shelf-caption"><h3>{active ? `Estante ${active.id}` : 'Sin estantes'}</h3><span>{active?.items.length ?? 0} expedientes · {levels.length} niveles registrados</span></div>
        <p className="shelf-hint">Selecciona un lomo para abrir su carpeta. Desliza cada repisa para ver más expedientes.</p>
        {term && <p className="shelf-results" role="status">{matchCount ? `${matchCount} coincidencias en este estante.` : 'Sin coincidencias en este estante. Revisa los contadores de los otros estantes.'}</p>}
        <div className="shelf-legend" aria-label="Colores por módulo">{modules.map(modulo => <span key={modulo}><i style={{ backgroundColor: moduleColor(modulo) }} />{modulo || 'Sin módulo'}</span>)}</div>
        <div className="shelf-frame">
          {levels.length ? levels.map(({ level, items }) => <section className="shelf-level" key={level} aria-label={`Nivel ${level}`}>
            <div className="shelf-level-label"><h4>{level === 'Sin nivel' ? level : `Nivel ${level}`}</h4><span>{items.length} exp.</span></div>
            <div className="shelf-row" tabIndex={0} role="group" aria-label={`Carpetas del nivel ${level}`}>
              {items.map(a => {
                const match = !term || matchesTerm(a, term)
                return <button type="button" key={a.id} className={`shelf-folder${!match ? ' is-dim' : ''}${term && match ? ' is-match' : ''}`} style={{ '--folder-color': moduleColor(a.modulo) } as CSSProperties}
                  aria-label={`${a.codigo || 'Sin código'} · ${a.modulo} · ${a.tipo} · Año ${a.anio} · Nivel ${level}`} aria-pressed={selected?.id === a.id}
                  title={`${a.codigo || 'Sin código'} · ${a.modulo} · ${a.tipo} · ${a.anio}`} onClick={() => setSelectedExpediente(a.id)}>
                  <span className="shelf-folder-year">{a.anio || '—'}</span><span className="shelf-folder-code">{a.codigo || 'Sin código'}</span><span className="shelf-folder-ring" aria-hidden="true" />
                </button>
              })}
            </div>
          </section>) : <div className="shelf-empty">Este estante está vacío.<span>Los expedientes aparecerán organizados por su nivel al registrarlos.</span></div>}
        </div>
      </div>
      <aside className="shelf-detail" aria-labelledby="shelf-detail-title">
        {selected ? <FolderDetails key={selected.id} expediente={selected} pages={selectedPages} photoError={photoError} onDigitalizar={onDigitalizar} /> : <div className="shelf-detail-empty"><span aria-hidden="true">▤</span><h3 id="shelf-detail-title">Abre una carpeta</h3><p>Selecciona un expediente del estante para consultar sus detalles e imágenes aquí.</p></div>}
      </aside>
    </div>
  </section>
}
