import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { captureId, demoRequest, SesionDemo } from '../../services/digitalizacionMemory'
import EscanerExpediente from '../../components/archive/EscanerExpediente'

export default function CapturaMovil({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SesionDemo | null>(null)
  const [confirmed, setConfirmed] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [capture, setCapture] = useState('')
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [connectionError, setConnectionError] = useState('')
  const [message, setMessage] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const selectedRevision = useRef(0)

  useEffect(() => {
    let disposed = false
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const next = await demoRequest('state', { session: sessionId })
        if (!next.closed) await demoRequest('join', { session: sessionId })
        if (!disposed) { setSession(next); setConnectionError('') }
      } catch (e) { if (!disposed) setConnectionError(`Sin conexión: ${(e as Error).message}`) }
      if (!disposed) timer = setTimeout(poll, 2000)
    }
    void poll()
    return () => { disposed = true; clearTimeout(timer) }
  }, [sessionId])
  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file); setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  useEffect(() => {
    if (!file) return
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [file])

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const photo = event.target.files?.[0]; event.target.value = ''
    if (!photo) return
    setError(''); setMessage('')
    if (photo.size > 12 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) { setError('Selecciona una imagen JPEG, PNG o WebP de hasta 12 MB.'); return }
    const id = captureId()
    setFile(photo); setCapture(id); setRevision(selectedRevision.current); setBusy(true)
    try { setSession(await demoRequest('reserve', { session: sessionId, revision: selectedRevision.current, capture: id })) }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  async function discard() {
    setBusy(true); setError('')
    try { await demoRequest('cancel', { session: sessionId, capture }); setFile(null); setCapture(''); setMessage('Captura descartada. Puedes tomar otra foto.') }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  async function send() {
    if (!file) return
    setBusy(true); setError(''); setMessage('Enviando página…')
    try {
      // Consultar primero permite confirmar un envío cuyo resultado se perdió en la red.
      let next = await demoRequest('state', { session: sessionId })
      if (!next.pages.some(p => p.id === capture)) {
        await demoRequest('reserve', { session: sessionId, revision, capture })
        next = await demoRequest('upload', { session: sessionId, revision, capture }, file)
      }
      setSession(next); setFile(null); setCapture(''); setMessage('Página recibida correctamente en la computadora.')
    } catch (e) { setError((e as Error).message); setMessage('No se confirmó el envío. Conserva la foto y reintenta.') } finally { setBusy(false) }
  }

  const scanPending = session?.scan?.status === 'pending'
  const paused = session?.expedientes?.[session.active?.id ?? '']?.estado === 'PENDIENTE'
  const canCapture = session && !session.closed && session.active && !paused && confirmed === session.revision && !file && !busy && !connectionError && !scanPending
  return <main className="et-mobile-page"><div className="et-phone">
    <EscanerExpediente connected={!!session && !session.closed && !connectionError} disabled={!session || session.closed || !!file || busy || !!connectionError || scanPending} onRead={async value => {
      const next = await demoRequest('scan', { session: sessionId, scan: captureId(), value })
      setSession(next); setConfirmed(null); setMessage(''); setError('')
    }} />
    {session?.scan && <p role="status" className={session.scan.status === 'rejected' ? 'et-error mt-3' : 'et-phone-status'}>{session.scan.status === 'pending' ? 'Buscando en la computadora vinculada… Mantén Archivo Central abierto.' : session.scan.message}</p>}
    <section className="et-capture-card space-y-4"><h3>📷 Captura de documentos</h3>
    <p className="font-mono font-bold break-all">{session?.active?.codigo || (session?.closed ? 'Sesión cerrada. Escanea un nuevo QR.' : 'Esperando el siguiente expediente…')}</p>
    {(error || connectionError) && <p role="alert" className="bg-red-50 text-red-700 p-3 rounded">{error || connectionError}</p>}
    {paused && <p role="status" className="rounded-lg bg-amber-50 text-amber-700 p-3">Digitalización pausada. La vinculación sigue activa. Pulsa «Seguir digitalizando» en la computadora para continuar.</p>}
    {session?.active && !session.closed && !paused && confirmed !== session.revision && !file && <button disabled={scanPending || !!connectionError || busy} className="et-button et-button-dark w-full disabled:opacity-40" onClick={() => { setConfirmed(session.revision); setMessage('Expediente confirmado. Puedes comenzar.'); setError('') }}>Comenzar este expediente</button>}
    <input ref={input} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => void choose(e)} />
    <button className="btn-archivo w-full py-4 disabled:opacity-40" disabled={!canCapture} onClick={() => { selectedRevision.current = session!.revision; input.current?.click() }}>📷 Tomar foto</button>
    {preview && <div className="space-y-3"><img className="max-h-96 w-full object-contain rounded" src={preview} alt="Vista previa de la página pendiente" /><div className="flex gap-3"><button disabled={busy} className="border rounded p-3 flex-1" onClick={() => void discard()}>Descartar / repetir</button><button disabled={busy || !!connectionError} className="btn-archivo p-3 flex-1 disabled:opacity-40" onClick={() => void send()}>{busy ? 'Procesando…' : 'Enviar / reintentar'}</button></div></div>}
    <p role="status">{message}</p>
    <p>{session?.pages.filter(p => p.expedienteId === session.active?.id).length || 0} páginas recibidas para el expediente activo.</p>
    <p className="text-sm text-arc-inkSoft">Revisa que la hoja esté completa y legible. Mantén esta página abierta para continuar con el siguiente expediente. Descarta o envía la foto pendiente antes de cambiar.</p>
    </section></div></main>
}
