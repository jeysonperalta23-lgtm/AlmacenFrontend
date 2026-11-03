import { Dispatch, SetStateAction, useSyncExternalStore } from 'react'

export function useMemoryState<T>(store: {
  get: () => T
  set: Dispatch<SetStateAction<T>>
  subscribe: (listener: () => void) => () => void
}): [T, Dispatch<SetStateAction<T>>] {
  return [useSyncExternalStore(store.subscribe, store.get), store.set]
}
