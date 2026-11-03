import { Expediente, Estructura } from '../types/archive'

export type Revision = 'imagenes' | 'datos' | 'ubicacion' | 'duplicados' | `estante:${string}`
export type DigitalStatus = 'Pendiente' | 'En proceso' | 'Completado'
export interface Capacity { total: number; threshold: number }
export interface Notice {
  id: string; titulo: string; contenido: string; autor: string
  tipo: 'Comunicado' | 'Mantenimiento' | 'Campaña de digitalización'
  prioridad: 'Normal' | 'Alta'; estante: string
  publicado: string; inicio: string; fin: string; actividad: string; enlace: string
  archivado: boolean
}
export interface ArchiveOperations {
  notices: Notice[]
  capacities: Record<string, Capacity>
  statuses: Record<string, DigitalStatus>
}
export function missingFields(a: Expediente) {
  return (['codigo', 'estante', 'modulo', 'nivel', 'tipo', 'anio'] as const).filter(key => !a[key]?.trim())
}
export function selectPending(archivos: Expediente[], estructura: Estructura, counts: Record<string, number>, filter: Revision) {
  const codes = new Map<string, number>()
  for (const a of archivos) {
    const code = a.codigo?.trim().toLocaleUpperCase('es')
    if (code) codes.set(code, (codes.get(code) ?? 0) + 1)
  }
  return archivos.filter(a => {
    if (filter === 'imagenes') return !(counts[a.id] > 0)
    if (filter === 'datos') return missingFields(a).length > 0
    if (filter === 'ubicacion') return !estructura[a.estante]?.includes(a.modulo)
    if (filter === 'duplicados') return (codes.get(a.codigo?.trim().toLocaleUpperCase('es')) ?? 0) > 1
    return a.estante === filter.slice('estante:'.length)
  })
}
export function noticeState(n: Notice, today: string) {
  if (n.archivado || n.fin < today) return 'Historial'
  return n.inicio > today ? 'Programados' : 'Vigentes'
}
export function digitalStatus(id: string, counts: Record<string, number>, operations: ArchiveOperations): DigitalStatus {
  if (!(counts[id] > 0)) return 'Pendiente'
  return operations.statuses[id] ?? 'En proceso'
}
