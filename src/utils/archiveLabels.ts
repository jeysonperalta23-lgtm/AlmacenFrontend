import { Expediente } from '../types/archive'

const PREFIX = 'ALMACEN:EXP:'
export function labelPayload(id: string) { return `${PREFIX}${encodeURIComponent(id)}` }
export function scanMatches(archivos: Expediente[], raw: string): Expediente[] {
  const value = raw.trim()
  if (!value) return []
  if (value.startsWith(PREFIX)) {
    try { const id = decodeURIComponent(value.slice(PREFIX.length)); return archivos.filter(a => a.id === id) }
    catch { return [] }
  }
  return archivos.filter(a => a.codigo.trim().toLocaleUpperCase('es') === value.toLocaleUpperCase('es'))
}
// Limitar la longitud mantiene las barras legibles en etiquetas A4 de 63,5 mm.
export function canBarcode(code: string) { return /^[\x20-\x7E]{1,24}$/.test(code) }
