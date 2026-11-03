import { useState } from 'react'
import { Estructura } from '../../types/archive'

interface ConfigEstantesProps {
  estructura: Estructura
  onAddEstante: () => void
  onAddModulo: (estante: string, nombre: string) => void
  onRemoveModulo: (estante: string, idx: number) => void
}

export default function ConfigEstantes({ estructura, onAddEstante, onAddModulo, onRemoveModulo }: ConfigEstantesProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const estantes = Object.keys(estructura).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))

  function handleAdd(estante: string) {
    const val = (inputs[estante] ?? '').trim()
    if (!val) return
    onAddModulo(estante, val)
    setInputs(prev => ({ ...prev, [estante]: '' }))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-arc-brass/40 bg-arc-paper p-4 space-y-3">
        <div>
          <h4 className="font-serif font-bold text-lg text-arc-ink">Estantes físicos</h4>
          <p className="text-[13px] text-arc-inkSoft" role="status">{estantes.length} estantes configurados</p>
          <p className="text-[12px] text-arc-inkSoft mt-1">Cada nuevo estante recibe el siguiente número disponible. Después puedes asignarle sus módulos o áreas.</p>
        </div>
        <button type="button" className="btn-archivo rounded-xl px-4 py-2.5 text-[13px]" onClick={onAddEstante}>＋ Agregar nuevo estante</button>
      </div>
      {estantes.map(key => {
        const modulos = estructura[key] ?? []
        return (
          <section className="rounded-2xl border border-arc-line bg-arc-paper p-4 shadow-sm" key={key} aria-label={`Estante ${key}`}>
            <h4 className="font-serif text-[17px] m-0 mb-3 font-bold">Estante {key}</h4>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {modulos.length === 0 ? (
                <span className="text-[12px] text-arc-inkSoft">Sin módulos.</span>
              ) : (
                modulos.map((m, idx) => (
                  <span className="flex max-w-full items-center gap-1.5 bg-white border border-arc-line rounded-full px-2.5 py-1 text-[12.5px]" key={m + idx}>
                    <span className="break-words min-w-0">{m}</span>
                    <button
                      className="bg-none border-none cursor-pointer text-arc-inkSoft text-[13px] leading-none p-0"
                      type="button"
                      aria-label={`Quitar ${m} de Estante ${key}`}
                      title={`Quitar ${m}`}
                      onClick={() => onRemoveModulo(key, idx)}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 font-sans text-[13px] px-2.5 py-1.5 border-[1.5px] border-arc-line rounded-[7px] outline-none transition-colors focus:border-arc-red"
                type="text"
                aria-label={`Nuevo módulo para Estante ${key}`}
                placeholder={`Nuevo módulo, ej. Tesorería`}
                value={inputs[key] ?? ''}
                onChange={ev => setInputs(prev => ({ ...prev, [key]: ev.target.value }))}
                onKeyDown={ev => { if (ev.key === 'Enter') { ev.preventDefault(); handleAdd(key) } }}
              />
              <button
                className="bg-transparent border-[1.5px] border-arc-ink text-arc-ink px-4 py-1.5 rounded-lg text-[13px] cursor-pointer font-sans transition-colors hover:bg-arc-paper2 disabled:opacity-40 disabled:cursor-not-allowed"
                type="button"
                disabled={!(inputs[key] ?? '').trim()}
                onClick={() => handleAdd(key)}>
                Agregar
              </button>
            </div>
          </section>
        )
      })}
    </div>
  )
}
