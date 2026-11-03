import { expect, test } from '@playwright/test'

test('digitalización: sincroniza en memoria, aísla cambios y se reinicia al recargar', async ({ page }) => {
  await page.goto('/archivo')
  const result = await page.evaluate(async () => {
    const { readDemo, writeDemo, syncPages, readCaptureUrl, writeCaptureUrl } = await import('/src/services/digitalizacionMemory.ts')
    const data = readDemo()
    data.pages.push({ id: 'p1', expedienteId: 'exp1', session: 's1', fecha: '2026-09-14' })
    const beforeWrite = readDemo().pages.length
    writeDemo(data)
    data.pages.length = 0
    const afterMutation = readDemo().pages.length
    const session = { id: 's1', closed: false, active: null, revision: 1, pending: null, lastSeen: 0, pages: [], sequence: 2, expedientes: { exp1: { estado: 'FINALIZADO', id_sesion: 's1', paginas_capturadas: 0, updatedAt: 2 } } }
    syncPages(session)
    syncPages({ ...session, sequence: 1, pages: [{ id: 'obsoleta', expedienteId: 'exp1', session: 's1', fecha: '2026-09-14' }] })
    writeCaptureUrl('http://192.168.1.50:5179/archivo')
    return { beforeWrite, afterMutation, store: readDemo(), url: readCaptureUrl() }
  })
  expect(result.beforeWrite).toBe(0)
  expect(result.afterMutation).toBe(1)
  expect(result.store.pages).toEqual([])
  expect(result.store.finished).toEqual(['exp1'])
  expect(result.url).toBe('http://192.168.1.50:5179/archivo')
  await page.reload()
  const reset = await page.evaluate(async () => {
    const { readDemo, readCaptureUrl } = await import('/src/services/digitalizacionMemory.ts')
    return { store: readDemo(), url: readCaptureUrl() }
  })
  expect(reset).toEqual({ store: { version: 1, sessions: [], pages: [], finished: [] }, url: '' })
})
