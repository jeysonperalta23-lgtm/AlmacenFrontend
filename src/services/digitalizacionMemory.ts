import { EstadoDigital } from '../types/archive'

export interface PaginaDemo { id: string; expedienteId: string; session: string; fecha: string }
export interface ProgresoDigital { estado: EstadoDigital; id_sesion: string; paginas_capturadas: number; updatedAt: number }
export interface SesionDemo {
  id: string; closed: boolean; active: { id: string; codigo: string } | null
  revision: number; pending: { id: string; expires: number } | null; lastSeen: number; pages: PaginaDemo[]
  scan?: { id: string; value: string; status: 'pending' | 'accepted' | 'rejected'; message: string; created: number } | null
  expedientes?: Record<string, ProgresoDigital>
  sequence?: number
}
interface Store { version: number; sessions: { id: string; key: string }[]; pages: PaginaDemo[]; finished: string[]; digitalizacion?: Record<string, ProgresoDigital>; sequences?: Record<string, number> }
let store: Store = { version: 1, sessions: [], pages: [], finished: [] }
let captureUrl = ''
export function readCaptureUrl() { return captureUrl }
export function writeCaptureUrl(url: string) { captureUrl = url }
export function readDemo(): Store {
  return structuredClone(store)
}
export function writeDemo(data: Store) {
  store = structuredClone(data)
  window.dispatchEvent(new Event('demo-updated'))
}
export function syncPages(session: SesionDemo) {
  const data = readDemo()
  if (session.sequence !== undefined && session.sequence <= (data.sequences?.[session.id] ?? -1)) return
  const before = JSON.stringify(data)
  const ids = new Set(session.pages.map(p => p.id))
  data.pages = data.pages.filter(p => p.session !== session.id || ids.has(p.id))
  const existing = new Set(data.pages.map(p => p.id))
  data.pages.push(...session.pages.filter(p => !existing.has(p.id)))
  data.digitalizacion ??= {}
  for (const [id, progress] of Object.entries(session.expedientes ?? {})) {
    if (progress.updatedAt >= (data.digitalizacion[id]?.updatedAt ?? 0)) {
      data.digitalizacion[id] = progress
      data.finished = data.finished.filter(value => value !== id)
      if (progress.estado === 'FINALIZADO') data.finished.push(id)
    }
  }
  if (session.sequence !== undefined) data.sequences = { ...data.sequences, [session.id]: session.sequence }
  if (JSON.stringify(data) !== before) writeDemo(data)
}
const API = import.meta.env.VITE_DEMO_API_URL || (import.meta.env.DEV ? '/demo-api' : '/ALMACEN/api/demo.php')
export class DemoApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}
export async function demoRequest(action: string, data: Record<string, unknown> = {}, photo?: File): Promise<SesionDemo & { key?: string }> {
  let body: BodyInit
  const headers: Record<string, string> = {}
  if (photo) {
    const form = new FormData()
    Object.entries(data).forEach(([k, v]) => form.append(k, String(v)))
    form.append('photo', photo); body = form
  } else { headers['Content-Type'] = 'application/json'; body = JSON.stringify(data) }
  const response = await fetch(`${API}?action=${action}`, { method: 'POST', headers, body, signal: AbortSignal.timeout(60000) })
  const result = await response.json().catch(() => { throw new Error('No se pudo crear o consultar la sesión de captura. Inicia Apache en el panel de XAMPP y vuelve a intentarlo. Si Apache usa otro puerto, ajusta el proxy /demo-api en vite.config.ts.') })
  if (!response.ok) throw new DemoApiError(result.error || 'No se pudo completar la operación.', response.status)
  return result
}
export function imageUrl(page: PaginaDemo) { return `${API}?action=image&session=${encodeURIComponent(page.session)}&page=${encodeURIComponent(page.id)}` }
export function captureId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('')
}
