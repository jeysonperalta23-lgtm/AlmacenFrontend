import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'
import { Expediente } from '../../types/archive'
import { canBarcode, labelPayload } from '../../utils/archiveLabels'

export default function CodigoEtiqueta({ expediente, barcode = true }: { expediente: Expediente; barcode?: boolean }) {
  const [qr, setQr] = useState('')
  const [error, setError] = useState('')
  const bars = useRef<SVGSVGElement>(null)
  const printable = barcode && canBarcode(expediente.codigo)
  useEffect(() => {
    let cancelled = false
    setQr(''); setError('')
    void QRCode.toDataURL(labelPayload(expediente.id), { width: 360, margin: 4, errorCorrectionLevel: 'M' })
      .then(value => { if (!cancelled) setQr(value) })
      .catch(() => { if (!cancelled) setError('No se pudo generar el QR.') })
    return () => { cancelled = true }
  }, [expediente.id])
  useEffect(() => {
    if (printable && bars.current) JsBarcode(bars.current, expediente.codigo, { format: 'CODE128', displayValue: false, margin: 0, marginLeft: 20, marginRight: 20, height: 35, width: 2, background: '#ffffff', lineColor: '#000000' })
  }, [expediente.codigo, printable])
  return <article className="et-label" data-label-ready={!!qr && !error}>
    <div className="et-label-top"><span>ARCHIVO CENTRAL</span><span>E{expediente.estante} · N{expediente.nivel}</span></div>
    <div className="et-label-main"><div className="et-label-qr">{qr ? <img src={qr} alt={`QR de ${expediente.codigo}`} /> : <span>{error || 'Generando QR…'}</span>}</div><div className="et-label-info"><strong>{expediente.codigo || 'Sin código'}</strong><b>{expediente.tipo}</b><span>{expediente.modulo}</span><small>Año {expediente.anio} {expediente.tomo && `· Tomo ${expediente.tomo}`}</small></div></div>
    {printable ? <svg ref={bars} className="et-label-barcode" role="img" aria-label={`Código de barras ${expediente.codigo}`} /> : <div className="et-label-foot">IDENTIFICACIÓN ÚNICA · ESCANEA EL QR</div>}
  </article>
}
