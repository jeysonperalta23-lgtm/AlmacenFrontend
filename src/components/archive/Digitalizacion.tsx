import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Expediente } from '../../types/archive'
import { DemoApiError, demoRequest, imageUrl, PaginaDemo, readCaptureUrl, readDemo, SesionDemo, syncPages, writeCaptureUrl, writeDemo } from '../../services/digitalizacionMemory'
import Modal from './Modal'

export default function Digitalizacion({ expediente, onClose }: {
  expediente: Expediente
  onClose: () => void
}) {
  const [session, setSession] = useState<SesionDemo | null>(null)
  const [credentials, setCredentials] = useState<{ id: string; key: string } | null>(null)
  const [pages, setPages] = useState<PaginaDemo[]>([])
  const [error, setError] = useState('')
  const [connectionError, setConnectionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [qr, setQr] = useState('')
  const [baseUrl, setBaseUrl] = useState(() => readCaptureUrl() || `${window.location.origin}${window.location.pathname}`)
  const [link, setLink] = useState('')
  const [zoom, setZoom] = useState<PaginaDemo | null>(null)
  const [finished, setFinished] = useState(false)
  const [networkUrls, setNetworkUrls] = useState<{ name: string; url: string }[]>([])
  const initialExpediente = useRef(expediente)
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    let disposed = false
    const exp = initialExpediente.current
    async function restore() {
      try {
        const data = readDemo()
        setPages(data.pages.filter(page => page.expedienteId === exp.id))
        const status = data.digitalizacion?.[exp.id]?.estado ?? exp.estado ?? exp.estadoDigital
        const previousPages = data.pages.filter(page => page.expedienteId === exp.id)
        const sessionId = data.digitalizacion?.[exp.id]?.id_sesion ?? exp.id_sesion ?? previousPages[previousPages.length - 1]?.session
        const credential = data.sessions.find(item => item.id === sessionId)
        if (!credential) return
        let next = await demoRequest('state', { session: credential.id })
        if (disposed) return
        syncPages(next)
        setPages(readDemo().pages.filter(page => page.expedienteId === exp.id))
        if (next.closed) { setSession(next); setError('La sesión anterior está cerrada. Genera un QR para continuar; las páginas recibidas se conservan.'); return }
        if (status !== 'FINALIZADO' && next.expedientes?.[exp.id]?.estado !== 'FINALIZADO') {
          next = await demoRequest('activate', { session: credential.id, key: credential.key, expediente: { id: exp.id, codigo: exp.codigo } })
          if (disposed) return
          syncPages(next)
        } else setFinished(true)
        const latest = readDemo()
        latest.sessions = [...latest.sessions.filter(item => item.id !== credential.id), credential]
        writeDemo(latest)
        setCredentials(credential); setSession(next)
        setPages(readDemo().pages.filter(page => page.expedienteId === exp.id))
        const savedUrl = readCaptureUrl()
        if (savedUrl) {
          const url = new URL(savedUrl)
          url.search = ''; url.hash = ''; url.searchParams.set('captura', credential.id)
          const code = await QRCode.toDataURL(url.toString(), { width: 240, margin: 2 })
          if (!disposed) { setLink(url.toString()); setQr(code) }
        }
      } catch (e) {
        if (!disposed) setError(e instanceof DemoApiError && e.status === 404 ? 'La sesión anterior ya no está disponible. Genera un QR para continuar; se conserva el índice de páginas recibidas.' : (e as Error).message)
      } finally { if (!disposed) setRestoring(false) }
    }
    void restore()
    return () => { disposed = true }
  }, [])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const controller = new AbortController()
    void fetch('/__demo/network', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('No se pudieron detectar las direcciones de red.')
      return response.json() as Promise<{ name: string; address: string }[]>
    }).then(addresses => {
      setNetworkUrls(addresses.map(entry => {
        const url = new URL(window.location.href)
        url.hostname = entry.address; url.search = ''; url.hash = ''
        return { name: entry.name, url: url.toString() }
      }))
    }).catch(() => { /* La dirección manual sigue disponible si no hay detección. */ })
    return () => controller.abort()
  }, [])

  function changeAddress(value: string) { setBaseUrl(value); setQr(''); setLink(''); setError('') }

  function refresh() { setPages(readDemo().pages.filter(p => p.expedienteId === expediente.id)) }
  useEffect(() => {
    try { setPages(readDemo().pages.filter(p => p.expedienteId === expediente.id)) } catch (e) { setError((e as Error).message) }
  }, [expediente.id])

  async function run(action: () => Promise<void>) {
    setBusy(true); setError('')
    try { await action() } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  async function connect() {
    let url: URL
    try { url = new URL(baseUrl.trim()) } catch { throw new Error('Selecciona una dirección de red o escribe una URL completa, incluyendo http:// y el puerto de la aplicación.') }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Usa una dirección http o https accesible desde el celular.')
    if (['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)) throw new Error('Introduce la IP de red de la computadora en lugar de localhost. Ejemplo: http://192.168.1.50:5173/archivo')
    const data = readDemo()
    const sessionId = data.digitalizacion?.[expediente.id]?.id_sesion ?? expediente.id_sesion
    let credential = data.sessions.find(item => item.id === sessionId) ?? data.sessions[data.sessions.length - 1]
    let current: SesionDemo | null = null
    if (credential) {
      // No crear una segunda sesión ante una interrupción de red.
      try { current = await demoRequest('state', { session: credential.id }) }
      catch (e) { if (!(e instanceof DemoApiError) || e.status !== 404) throw e }
    }
    if (!current || current.closed) {
      const created = await demoRequest('create')
      if (!created.key) throw new Error('No se recibió la clave de la sesión.')
      credential = { id: created.id, key: created.key }
      data.sessions.push(credential); writeDemo(data)
    }
    const active = current && !current.closed && current.active?.id === expediente.id && current.expedientes?.[expediente.id]?.estado === 'EN_PROCESO'
      ? current : await demoRequest('activate', { session: credential.id, key: credential.key, expediente: { id: expediente.id, codigo: expediente.codigo } })
    syncPages(active)
    const latest = readDemo()
    latest.sessions = [...latest.sessions.filter(item => item.id !== credential.id), credential]
    writeDemo(latest)
    url.search = ''; url.hash = ''
    url.searchParams.set('captura', credential.id)
    const captureLink = url.toString()
    const code = await QRCode.toDataURL(captureLink, { width: 240, margin: 2 })
    writeCaptureUrl(baseUrl)
    setCredentials(credential); setSession(active); setFinished(false); setLink(captureLink); setQr(code); refresh()
  }

  useEffect(() => {
    if (!credentials) return
    let disposed = false
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const next = await demoRequest('state', { session: credentials!.id })
        if (!disposed) {
          syncPages(next); setSession(next)
          setPages(readDemo().pages.filter(p => p.expedienteId === expediente.id))
          setConnectionError('')
        }
      } catch (e) { if (!disposed) setConnectionError(`Conexión interrumpida: ${(e as Error).message}`) }
      if (!disposed) timer = setTimeout(poll, 2000)
    }
    timer = setTimeout(poll, 2000)
    return () => { disposed = true; clearTimeout(timer) }
  }, [credentials, expediente.id])

  function reorder(index: number, delta: number) {
    try {
      const data = readDemo()
      const first = data.pages.findIndex(p => p.id === pages[index].id)
      const second = data.pages.findIndex(p => p.id === pages[index + delta].id)
      ;[data.pages[first], data.pages[second]] = [data.pages[second], data.pages[first]]
      writeDemo(data); refresh()
    } catch (e) { setError((e as Error).message) }
  }

  const pending = !!session?.pending
  const working = busy || restoring
  const isActive = session?.active?.id === expediente.id && !finished
  return <Modal isOpen onClose={() => { if (!working) onClose() }} title="📷 Digitalizar expediente">
    <div className="space-y-4 text-arc-ink">
      <div><p className="font-mono font-bold break-all">{expediente.codigo}</p><p>{expediente.tipo} · {expediente.modulo}</p><p className="text-xs text-arc-inkSoft">Modo demostración · datos en memoria · sin base de datos</p></div>
      <label className="block text-sm">1. Dirección de la aplicación accesible desde el celular
        <input className="w-full border rounded p-2 mt-1" value={baseUrl} onChange={e => changeAddress(e.target.value)} placeholder="http://192.168.1.50:5173/archivo" disabled={working} />
      </label>
      {networkUrls.length > 0 && <div className="space-y-2 text-sm"><p>Selecciona la conexión que comparte tu celular (normalmente Wi-Fi):</p>{networkUrls.map(entry => <button key={entry.url} disabled={busy} className="block w-full text-left border rounded-lg p-2 hover:bg-arc-paper disabled:opacity-50" onClick={() => changeAddress(entry.url)}><span className="font-semibold">{entry.name}</span><span className="block text-xs break-all">{entry.url}</span></button>)}</div>}
      <button className="btn-archivo px-4 py-2 disabled:opacity-50" disabled={working} onClick={() => void run(connect)}>{restoring ? 'Recuperando sesión y páginas…' : busy ? 'Procesando…' : '2. Generar código QR / vincular celular'}</button>
      {!qr && <div className="border-2 border-dashed border-arc-line rounded-xl p-4 text-sm text-center" role="status">{restoring ? 'Recuperando la vinculación anterior…' : credentials && !session?.closed ? 'Vinculación recuperada. Puedes continuar desde el mismo celular.' : busy ? 'Preparando el código QR…' : 'El código QR aparecerá aquí después de seleccionar la dirección y pulsar «Generar código QR». Apache debe estar iniciado en XAMPP.'}</div>}
      {error && <p role="alert" className="text-red-700 bg-red-50 p-3 rounded">{error}</p>}
      {connectionError && <p role="alert" className="text-red-700 bg-red-50 p-3 rounded">{connectionError}</p>}
      {session && <p role="status" className="font-semibold">{session.closed ? 'Sesión cerrada' : finished ? 'Expediente finalizado.' : !isActive ? 'Este expediente ya no está activo. Vuelve a vincularlo para continuar.' : session.expedientes?.[expediente.id]?.estado === 'PENDIENTE' ? 'Digitalización pausada.' : pending ? 'Foto pendiente en el celular' : Date.now() / 1000 - session.lastSeen < 12 ? 'Celular conectado' : 'Esperando conexión del celular'}</p>}
      {qr && session && !session.closed && <div className="text-center"><img className="mx-auto" src={qr} alt="QR para abrir la cámara del celular" /><p className="text-sm">Escanea el QR. Si el celular ya está vinculado, conserva su página abierta.</p><a className="text-xs underline break-all" href={link} target="_blank" rel="noreferrer">{link}</a></div>}
      <p className="font-bold">{pages.length} páginas recibidas</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {pages.map((page, index) => <div key={page.id} className="border rounded-lg p-2 space-y-2">
          <button className="w-full" onClick={() => setZoom(page)} aria-label={`Ampliar página ${index + 1}`}><img className="h-28 w-full object-contain" src={imageUrl(page)} alt={`Página ${index + 1}`} /></button>
          <p className="text-sm text-center">Página {index + 1}</p>
          <div className="flex justify-between gap-2">
            <button disabled={index === 0 || busy} aria-label="Mover página antes" onClick={() => reorder(index, -1)}>←</button>
            <button disabled={busy} className="text-red-700 text-xs" onClick={() => void run(async () => {
              const credential = readDemo().sessions.find(s => s.id === page.session)
              if (!credential) throw new Error('No está disponible la clave de esta captura.')
              const next = await demoRequest('remove', { session: credential.id, key: credential.key, page: page.id })
              syncPages(next); refresh()
            })}>Quitar</button>
            <button disabled={index === pages.length - 1 || busy} aria-label="Mover página después" onClick={() => reorder(index, 1)}>→</button>
          </div>
        </div>)}
      </div>
      {zoom && <div className="border rounded p-2"><button className="underline mb-2" onClick={() => setZoom(null)}>Cerrar vista ampliada</button><img src={imageUrl(zoom)} alt="Página ampliada" className="w-full" /></div>}
      {credentials && session && !session.closed && <div className="flex flex-wrap gap-3">
        <button className="btn-archivo px-4 py-2 rounded-lg disabled:opacity-50" disabled={working || pending || !isActive || pages.length === 0} onClick={() => void run(async () => {
          const next = await demoRequest('finish', { session: credentials.id, key: credentials.key, expedienteId: expediente.id })
          syncPages(next)
          setSession(next); setFinished(true); onClose()
        })}>Finalizar expediente</button>
        {isActive && (
          <button
            className="px-4 py-2 rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors"
            style={{ background: '#f4efe5', border: '1.5px solid #d9cfc4', color: '#78614a' }}
            disabled={working || pending}
            onClick={() => void run(async () => {
              const next = await demoRequest('pause', { session: credentials.id, key: credentials.key, expedienteId: expediente.id })
              syncPages(next); setSession(next); refresh(); onClose()
            })}
          >
            ⏸ Seguir digitalizando más tarde
          </button>
        )}
        <button className="border rounded px-3 py-2 disabled:opacity-50" disabled={busy || pending} onClick={() => void run(async () => { setSession(await demoRequest('close', { session: credentials.id, key: credentials.key })) })}>Cerrar sesión del celular</button>
      </div>}
      <button className="underline text-sm" disabled={working} onClick={onClose}>Volver a la tabla (mantener vinculación)</button>
    </div>
  </Modal>
}
