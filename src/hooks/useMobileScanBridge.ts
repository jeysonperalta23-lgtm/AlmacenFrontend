import { useEffect, useRef, useState } from 'react'
import { Expediente } from '../types/archive'
import { DemoApiError, demoRequest, readDemo, syncPages } from '../services/digitalizacionMemory'
import { scanMatches } from '../utils/archiveLabels'

/** El PC resuelve los códigos con su catálogo local; el móvil nunca recibe la clave del propietario. */
export function useMobileScanBridge(archivos: Expediente[], onDetected: (id: string) => void) {
  const current = useRef({ archivos, onDetected })
  current.current = { archivos, onDetected }
  const [error, setError] = useState('')
  useEffect(() => {
    let disposed = false
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const store = readDemo()
        const credential = store.sessions[store.sessions.length - 1]
        if (credential) {
          let session = await demoRequest('state', { session: credential.id })
          if (disposed) return
          if (!session.closed && session.scan?.status === 'pending') {
            const matches = scanMatches(current.current.archivos, session.scan.value)
            const expediente = matches.length === 1 ? matches[0] : null
            session = await demoRequest('resolveScan', {
              session: credential.id, key: credential.key, scan: session.scan.id,
              expediente: expediente ? { id: expediente.id, codigo: expediente.codigo } : null,
              message: matches.length > 1 ? 'Código repetido. Escanea el QR único del expediente.' : 'No se encontró el expediente en esta computadora.',
            })
            if (disposed) return
            if (session.scan?.status === 'accepted' && expediente) current.current.onDetected(expediente.id)
          }
          syncPages(session)
        }
        if (!disposed) setError('')
      } catch (e) {
        if (!disposed) setError(e instanceof DemoApiError && e.status === 404 ? '' : `Escaneo móvil sin conexión: ${(e as Error).message}`)
      }
      if (!disposed) timer = setTimeout(poll, 1500)
    }
    void poll()
    return () => { disposed = true; clearTimeout(timer) }
  }, [])
  return error
}
