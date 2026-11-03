import { useEffect, useId, useRef, ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  wide?: boolean
  variant?: 'default' | 'detail'
}

/**
 * Contenedor modal genérico y reutilizable.
 * - Cierra con ESC o clic fuera del panel.
 * - Bloquea el scroll del body mientras está abierto.
 * - Si se pasa `title`, renderiza la cabecera estándar del Archivo.
 */
export default function Modal({ isOpen, onClose, children, title, wide = false, variant = 'default' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!isOpen) return
    const previous = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? [])
    if (!panel?.contains(document.activeElement)) (focusable()[0] ?? panel)?.focus()
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0], last = elements[elements.length - 1]
      if (!first) { event.preventDefault(); panel?.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', trapFocus)
    return () => { document.removeEventListener('keydown', trapFocus); if (previous?.isConnected) previous.focus() }
  }, [isOpen])
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-arc-ink/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel modal con scroll interno si el contenido es largo */}
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'Ventana del archivo'} tabIndex={-1} className={`w-full ${variant === 'detail' ? 'max-w-4xl et-detail-modal' : wide ? 'max-w-5xl' : 'max-w-xl'} bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden ring-1 ring-arc-ink/10 border border-arc-line animate-slideUp flex flex-col`}>
        {title && (
          <div className={`flex justify-between items-center gap-3 px-6 py-4 border-b shrink-0 ${variant === 'detail' ? 'border-slate-200 bg-slate-50' : 'border-arc-line bg-arc-paper'}`}>
            <h3 id={titleId} className={`font-bold text-xl m-0 break-words min-w-0 ${variant === 'detail' ? 'text-slate-900' : 'font-serif text-arc-ink'}`}>{title}</h3>
            <button onClick={onClose} aria-label="Cerrar" className="text-arc-inkSoft hover:text-arc-red transition-colors bg-transparent border-none cursor-pointer p-1 rounded-lg hover:bg-arc-paper2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className={variant === 'detail' ? 'p-4 sm:p-6 min-h-0 overflow-y-auto et-detail-body' : 'p-6 max-h-[70vh] overflow-y-auto'}>
          {children}
        </div>
      </div>
    </div>
  )
}
