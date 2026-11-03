import { expect, test } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const records = Array.from({ length: 10 }, (_, i) => ({ id: `exp_test_${i + 1}`, codigo: i === 6 || i === 7 ? 'DUP-2026' : `OAB-OC-2026-${String(i + 1).padStart(2, '0')}`, estante: i % 2 ? '2' : '1', modulo: i % 2 ? 'Contabilidad' : 'Abastecimiento', nivel: '2', tipo: 'Órdenes de compra', anio: '2026', tomo: 'II', obs: 'Expediente de prueba', fecha: '2026-09-10' }))
async function seed(page, credentials) {
  await page.goto('/archivo')
  await page.evaluate(async ({ records, credentials }) => {
    const { archivosMemory, estructuraMemory } = await import('/src/services/archiveMemory.ts')
    const { writeDemo } = await import('/src/services/digitalizacionMemory.ts')
    archivosMemory.set(records)
    estructuraMemory.set({ '1': ['Abastecimiento'], '2': ['Contabilidad'] })
    if (credentials) writeDemo({ version: 1, sessions: [credentials], pages: [], finished: [] })
  }, { records, credentials })
}

test('selección entre páginas, QR/barras decodificables, impresión A4/térmica y vista móvil', async ({ page }, testInfo) => {
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await seed(page)
  await page.locator('.tabs-archivo button').filter({ hasText: 'Explorar' }).click()
  await expect(page.getByRole('heading', { name: 'Etiquetas QR', exact: true })).toBeVisible()
  await expect(page.locator('.et-section-header').getByRole('button', { name: 'Probar vista móvil' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Imprimir etiquetas', exact: true })).toBeDisabled()
  await expect(page.getByText('Selecciona uno o más expedientes para habilitar la impresión de etiquetas.')).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Etiqueta', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: `Ver detalle de ${records[0].codigo}`, exact: true }).click()
  await expect(page.locator('.et-detail-qr [data-label-ready="true"]')).toHaveCount(1)
  await expect(page.getByRole('region', { name: 'Historial de ubicación' })).toContainText('No hay movimientos registrados')
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
  await page.screenshot({ path: testInfo.outputPath('etiquetado-desktop.png'), fullPage: true })
  await page.getByLabel('Seleccionar OAB-OC-2026-01', { exact: true }).check()
  await page.getByLabel('Página siguiente', { exact: true }).click()
  await page.getByLabel('Seleccionar OAB-OC-2026-09', { exact: true }).check()
  await page.getByRole('button', { name: 'Imprimir etiquetas (2)', exact: true }).click()
  await expect(page.locator('.et-print-root [data-label-ready="true"]')).toHaveCount(2)
  await expect(page.locator('.et-confirm-summary')).toContainText('2 etiquetas')
  await expect(page.locator('.et-confirm-summary')).toContainText('Abastecimiento')
  await page.evaluate(() => { window.__printCalls = 0; window.print = () => { window.__printCalls++ } })
  await page.getByRole('button', { name: 'Confirmar e Imprimir', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__printCalls)).toBe(1)
  const qr = await page.locator('.et-preview .et-label-qr img').first().getAttribute('src')
  const barcode = await page.locator('.et-preview .et-label-barcode').first().screenshot()
  await page.screenshot({ path: testInfo.outputPath('etiquetas-preview.png'), fullPage: true })
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.et-global')).toBeHidden()
  await expect(page.locator('.et-print-root')).toBeVisible()
  let dimensions = await page.locator('.et-print-root .et-label').first().boundingBox()
  expect(dimensions.width).toBeCloseTo(63.5 * 96 / 25.4, 0)
  expect(dimensions.height).toBeCloseTo(38.1 * 96 / 25.4, 0)
  await page.pdf({ path: testInfo.outputPath('etiquetas-a4.pdf'), preferCSSPageSize: true })
  await page.emulateMedia({ media: 'screen' })
  await page.getByLabel('Formato de papel').selectOption('thermal')
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.et-print-sheet')).toHaveCount(2)
  dimensions = await page.locator('.et-print-root .et-label').first().boundingBox()
  expect(dimensions.width).toBeCloseTo(80 * 96 / 25.4, 0)
  expect(dimensions.height).toBeCloseTo(50 * 96 / 25.4, 0)
  await page.pdf({ path: testInfo.outputPath('etiquetas-termicas.pdf'), preferCSSPageSize: true })
  await page.emulateMedia({ media: 'screen' })
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
  await page.getByRole('button', { name: 'Probar vista móvil', exact: false }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: testInfo.outputPath('escaner-movil.png'), fullPage: true })
  await expect(page.getByRole('button', { name: /Escanear Expediente/ })).toBeVisible()
  await page.locator('.et-phone input[type=file]').setInputFiles({ name: 'etiqueta-qr.png', mimeType: 'image/png', buffer: Buffer.from(qr.split(',')[1], 'base64') })
  await expect(page.getByRole('dialog', { name: records[0].codigo, exact: true })).toBeVisible()
  await expect(page.locator('.et-detail-modal').getByRole('heading', { name: records[0].codigo, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
  await page.getByRole('button', { name: 'Probar vista móvil', exact: false }).click()
  await page.locator('.et-phone input[type=file]').setInputFiles({ name: 'etiqueta-barras.png', mimeType: 'image/png', buffer: barcode })
  await expect(page.getByRole('dialog', { name: records[0].codigo, exact: true })).toBeVisible()
  await expect(page.locator('.et-detail-modal').getByRole('heading', { name: records[0].codigo, exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('lector USB abre el detalle y los códigos repetidos requieren selección', async ({ page }) => {
  await seed(page)
  const search = page.getByRole('textbox', { name: 'Buscar o escanear expediente' })
  await search.fill(records[0].codigo)
  await search.press('Enter')
  await expect(page.locator('.et-detail-modal').getByRole('heading', { name: records[0].codigo, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
  await search.fill('DUP-2026')
  await search.press('Enter')
  await expect(page.getByText('Hay códigos repetidos.', { exact: false })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.et-results>button')).toHaveCount(2)
  await search.fill('ALMACEN:EXP:exp_test_8')
  await search.press('Enter')
  await expect(page.locator('.et-detail-grid')).toContainText('Contabilidad')
})

test('un celular vinculado selecciona el expediente en la PC y envía una página', async ({ page, browser }, testInfo) => {
  const directory = await mkdtemp(join(process.env.ALMACEN_TEST_TMP || tmpdir(), 'almacen-scan-test-'))
  const php = process.env.PHP_BINARY || (process.platform === 'win32' ? 'C:\\xampp\\php\\php.exe' : 'php')
  const server = spawn(php, ['-S', '127.0.0.1:18764', '-t', resolve('api')], { env: { ...process.env, ALMACEN_DEMO_DIR: directory }, stdio: 'ignore' })
  let serverError
  server.on('error', error => { serverError = error })
  const endpoint = 'http://127.0.0.1:18764/demo.php'
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } })
  try {
    for (let i = 0; i < 40; i++) {
      if (serverError) throw serverError
      try { await fetch(endpoint); break } catch { await delay(100) }
    }
    const created = await (await fetch(`${endpoint}?action=create`, { method: 'POST' })).json()
    const proxy = async route => {
      const response = await route.fetch({ url: `${endpoint}${new URL(route.request().url()).search}` })
      await route.fulfill({ response })
    }
    await page.route('**/demo-api?*', proxy)
    await mobile.route('**/demo-api?*', proxy)
    await seed(page, { id: created.id, key: created.key })
    const phone = await mobile.newPage()
    await phone.goto(`http://127.0.0.1:5179/archivo?captura=${created.id}`)
    await expect(phone.getByLabel('Código del expediente', { exact: true })).toBeEnabled()
    await phone.getByLabel('Código del expediente', { exact: true }).fill(records[1].codigo)
    await phone.getByRole('button', { name: 'Localizar expediente', exact: true }).click()
    await expect(page.locator('.et-detail-modal').getByRole('heading', { name: records[1].codigo, exact: true })).toBeVisible({ timeout: 15000 })
    await expect(phone.getByText('Expediente abierto en la computadora.', { exact: true })).toBeVisible()
    await phone.getByRole('button', { name: 'Comenzar este expediente' }).click()
    const chooser = phone.waitForEvent('filechooser')
    await phone.getByRole('button', { name: '📷 Tomar foto', exact: true }).click()
    await (await chooser).setFiles({ name: 'pagina.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') })
    await expect(phone.getByRole('button', { name: 'Enviar / reintentar' })).toBeEnabled()
    await phone.getByRole('button', { name: 'Enviar / reintentar' }).click()
    await expect(phone.getByText('Página recibida correctamente en la computadora.', { exact: true })).toBeVisible()
    await expect(page.getByText('1 páginas asociadas', { exact: true })).toBeVisible({ timeout: 15000 })
    await phone.screenshot({ path: testInfo.outputPath('celular-vinculado.png'), fullPage: true })
  } finally {
    await mobile.close()
    server.kill()
    if (server.exitCode === null) await new Promise(resolveExit => server.once('exit', resolveExit))
    await rm(directory, { recursive: true, force: true })
  }
})
