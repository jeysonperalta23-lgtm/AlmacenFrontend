import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Expediente } from '../../types/archive'
import { canBarcode } from '../../utils/archiveLabels'
import CodigoEtiqueta from './CodigoEtiqueta'
import Modal from './Modal'

export default function ImprimirEtiquetas({ archivos, onClose }: { archivos: Expediente[]; onClose: () => void }) {
  const [format, setFormat] = useState<'a4' | 'thermal'>('a4')
  const [copies, setCopies] = useState(1)
  const [barcode, setBarcode] = useState(true)
  const [error, setError] = useState('')
  const printRoot = useRef<HTMLDivElement>(null)
  const labels = archivos.flatMap(a => Array.from({ length: copies }, () => a))
  const areas = Array.from(new Set(archivos.map(a => a.modulo || 'Área no indicada')))
  const perPage = format === 'a4' ? 21 : 1
  const pages = Array.from({ length: Math.ceil(labels.length / perPage) }, (_, i) => labels.slice(i * perPage, (i + 1) * perPage))
  function print() {
    const root = printRoot.current
    if (!root || !labels.length || root.querySelectorAll('[data-label-ready="true"]').length !== labels.length || Array.from(root.querySelectorAll('img')).some(img => !img.complete || !img.naturalWidth)) {
      setError('Las etiquetas aún se están generando. Espera un momento y vuelve a imprimir.'); return
    }
    setError(''); window.print()
  }
  return <><Modal isOpen onClose={onClose} wide title="Confirmar impresión de etiquetas">
    <div className="et-confirm-summary" role="status">
      <span className="et-confirm-count" aria-hidden="true">{labels.length}</span>
      <div><h4>Revisa tu selección</h4><p>Estás a punto de generar <strong>{labels.length} {labels.length === 1 ? 'etiqueta' : 'etiquetas'}</strong> para <span className="et-capitalize">{areas.join(', ')}</span>.</p><small>{archivos.length} expedientes · {copies} {copies === 1 ? 'copia' : 'copias'} por expediente</small></div>
    </div>
    <div className="et-print-layout"><aside className="et-print-options"><span className="et-kicker">PREPARAR IMPRESIÓN</span><h3>Del archivo<br />a la etiqueta.</h3><p>QR único, ubicación física y código legible en una sola etiqueta.</p>
      <label className="et-field">Formato de papel<select value={format} onChange={e => { setFormat(e.target.value as 'a4' | 'thermal'); setError('') }}><option value="a4">Hoja A4 · 21 etiquetas</option><option value="thermal">Térmica · 80 × 50 mm</option></select></label>
      <div className="et-format-info">{format === 'a4' ? '63,5 × 38,1 mm · 3 columnas × 7 filas · separación 2 mm · margen 7 mm' : 'Una etiqueta por página · 80 × 50 mm · margen de página 0 mm'}</div>
      <label className="et-field">Copias por expediente<select value={copies} onChange={e => setCopies(Number(e.target.value))}>{[1, 2, 3, 4, 5, 10].map(n => <option key={n} value={n}>{n} {n === 1 ? 'copia' : 'copias'}</option>)}</select></label>
      <label className="et-check"><input type="checkbox" checked={barcode} onChange={e => setBarcode(e.target.checked)} /> Incluir código de barras CODE128</label>
      {barcode && archivos.some(a => !canBarcode(a.codigo)) && <p>Los códigos con caracteres no compatibles o más de 24 caracteres usarán únicamente QR para conservar la legibilidad.</p>}
      <div className="et-print-summary"><div><strong>{labels.length}</strong><span>etiquetas</span></div><div><strong>{pages.length}</strong><span>{format === 'a4' ? 'hojas A4' : 'stickers'}</span></div></div>
      <button className="et-button et-button-primary" onClick={print} disabled={!labels.length}>Confirmar e Imprimir</button><p className="et-print-tip">En el diálogo de impresión: escala 100%, sin encabezados ni pies. Selecciona el tamaño de papel indicado y prueba primero una hoja.</p>{error && <p className="et-error" role="alert">{error}</p>}
    </aside><div className="et-preview"><div className="et-preview-heading"><span className="et-live-dot">QR y barras reales</span><span>{format === 'a4' ? 'A4 / 210 × 297 mm' : '80 × 50 mm'}</span></div><div className={`et-preview-canvas ${format}`}><div className="et-preview-labels">{labels.slice(0, format === 'a4' ? 6 : 1).map((a, i) => <CodigoEtiqueta key={`${a.id}-${i}`} expediente={a} barcode={barcode} />)}</div></div><p className="et-preview-caption">Vista ampliada · mostrando {Math.min(labels.length, format === 'a4' ? 6 : 1)} de {labels.length} etiquetas. La impresión incluye toda la selección.</p></div></div>
  </Modal>{createPortal(<div ref={printRoot} className={`et-print-root ${format}`} aria-hidden="true"><style>{`@media print { @page { size: ${format === 'a4' ? 'A4 portrait' : '80mm 50mm'}; margin: ${format === 'a4' ? '7mm' : '0'}; } }`}</style>{pages.map((page, index) => <div className="et-print-sheet" key={index}>{page.map((a, i) => <CodigoEtiqueta key={`${a.id}-${i}`} expediente={a} barcode={barcode} />)}</div>)}</div>, document.body)}</>
}
