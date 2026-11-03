import { ChangeEvent, useEffect, useRef, useState } from 'react'
import type { IScannerControls } from '@zxing/browser'
import './Etiquetado.css'

interface Props {
  onRead: (value: string) => void | Promise<void>
  disabled?: boolean; preview?: boolean; connected?: boolean
}
export default function EscanerExpediente({ onRead, disabled = false, preview = false, connected = false }: Props) {
  const [scanning, setScanning] = useState(false)
  const [working, setWorking] = useState(false)
  const [manual, setManual] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const video = useRef<HTMLVideoElement>(null)
  const photo = useRef<HTMLInputElement>(null)
  const controls = useRef<IScannerControls | null>(null)
  const onReadRef = useRef(onRead)
  onReadRef.current = onRead
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  async function read(value: string) {
    if (!value.trim()) { setError('Escanea una etiqueta o escribe el código completo.'); return }
    controls.current?.stop(); setScanning(false); setWorking(true); setError(''); setMessage('')
    try {
      await onReadRef.current(value.trim())
      if (mounted.current) { setMessage(preview ? 'Expediente localizado en este navegador.' : 'Etiqueta leída. Consulta el resultado de la computadora debajo.'); setManual('') }
    } catch (e) { if (mounted.current) setError((e as Error).message) }
    finally { if (mounted.current) setWorking(false) }
  }
  const readRef = useRef(read)
  readRef.current = read
  useEffect(() => {
    if (!scanning) return
    let stopped = false
    let current: IScannerControls | undefined
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('La cámara en vivo requiere HTTPS o localhost. Puedes subir una foto de la etiqueta o escribir su código.')
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (stopped || !video.current) return
        const reader = new BrowserMultiFormatReader()
        current = await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } }, audio: false }, video.current, (result, _error, scanner) => {
          if (!result || stopped) return
          stopped = true; scanner.stop(); void readRef.current(result.getText())
        })
        controls.current = current
        if (stopped) current.stop()
      } catch (e) {
        if (!stopped) {
          setError((e as Error).name === 'NotAllowedError' ? 'Permite el acceso a la cámara o usa una foto de la etiqueta.' : (e as Error).message)
          setScanning(false)
        }
      }
    }
    void start()
    return () => { stopped = true; current?.stop(); controls.current?.stop(); controls.current = null }
  }, [scanning])
  useEffect(() => { if (disabled) setScanning(false) }, [disabled])
  async function fromPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    setScanning(false); setError(''); setMessage('')
    if (file.size > 12 * 1024 * 1024) { setError('Usa una imagen de etiqueta de hasta 12 MB.'); return }
    setWorking(true)
    const url = URL.createObjectURL(file)
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const result = await new BrowserMultiFormatReader().decodeFromImageUrl(url)
      if (mounted.current) await readRef.current(result.getText())
    } catch { if (mounted.current) setError('No se detectó un QR o código de barras legible. Acerca la etiqueta, mejora la iluminación o escribe el código.') }
    finally { URL.revokeObjectURL(url); if (mounted.current) setWorking(false) }
  }
  return <><div className="et-phone-header"><span>▥ Archivo / Scan</span><span className="et-live-dot">{preview ? 'Vista previa' : connected ? 'Celular vinculado' : 'Sin vinculación'}</span></div><span className="et-kicker">TU ARCHIVO, A UN ESCANEO</span><h2>Encuentra.<br />Conecta. Digitaliza.</h2><p className="et-phone-intro">Apunta a la etiqueta del expediente y continúa trabajando con sus documentos.</p>
    {scanning ? <><div className="et-camera"><video ref={video} muted playsInline /><div className="et-camera-overlay" /><span className="et-camera-caption">Centra el QR o las barras dentro del recuadro</span></div><button className="et-button et-button-outline w-full" onClick={() => setScanning(false)}>Cerrar cámara</button></> : <button className="et-scan-launch" disabled={disabled || working} onClick={() => { setError(''); setMessage(''); setScanning(true) }}><span className="et-scan-symbol" aria-hidden="true">▦</span><strong>{working ? 'Leyendo etiqueta…' : 'Escanear Expediente'}</strong><small>QR o código de barras · Cámara trasera</small></button>}
    <input ref={photo} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={event => void fromPhoto(event)} />
    <button className="et-upload-qr" disabled={disabled || working} onClick={() => photo.current?.click()}>Leer una foto de la etiqueta</button>
    <div className="et-phone-divider">O INGRESA EL CÓDIGO</div><form className="et-manual-form" onSubmit={e => { e.preventDefault(); if (!disabled && !working) void read(manual) }}><input aria-label="Código del expediente" placeholder="Ej. OAB-OC-2026" value={manual} onChange={e => setManual(e.target.value)} disabled={disabled || working} autoComplete="off" /><button disabled={disabled || working} aria-label="Localizar expediente">→</button></form>
    {error && <p role="alert" className="et-error mt-3">{error}</p>}{message && <p role="status" className="et-phone-status">{message}</p>}
    <div className="et-phone-footer">{preview ? 'Vista de prueba en esta computadora. Para usar tu celular, abre Digitalizar y vincúlalo con el QR de la sesión.' : 'La computadora debe tener Archivo Central abierto. El código se sincroniza mediante la sesión vinculada.'}</div>
  </>
}
