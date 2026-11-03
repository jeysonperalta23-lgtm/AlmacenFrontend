import { Expediente, Estructura } from '../types/archive'
import { ArchiveOperations } from '../utils/archiveAlerts'

// Estado compartido durante la vida de la página; una recarga lo reinicia.
function createMemoryState<T>(initial: T) {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set: (next: T | ((previous: T) => T)) => {
      const updated = typeof next === 'function' ? (next as (previous: T) => T)(value) : next
      if (Object.is(value, updated)) return
      value = updated
      listeners.forEach(listener => listener())
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

export const estructuraMemory = createMemoryState<Estructura>({
  '1': ['Abastecimiento', 'Secretaría'],
  '2': ['Contabilidad', 'Recursos Humanos'],
  '3': ['Archivo pasivo'],
})
export const archivosMemory = createMemoryState<Expediente[]>([])
export const pendingIdsMemory = createMemoryState<string[]>([])
export const highlightedIdsMemory = createMemoryState<string[]>([])
export const operationsMemory = createMemoryState<ArchiveOperations>({ notices: [], capacities: {}, statuses: {} })
