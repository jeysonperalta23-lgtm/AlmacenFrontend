import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const directory = await mkdtemp(join(tmpdir(), 'almacen-demo-test-'))
const port = 18763
const php = process.env.PHP_BINARY || (process.platform === 'win32' ? 'C:\\xampp\\php\\php.exe' : 'php')
const server = spawn(php, ['-d', 'upload_max_filesize=16M', '-d', 'post_max_size=20M', '-S', `127.0.0.1:${port}`, '-t', resolve('api')], {
  env: { ...process.env, ALMACEN_DEMO_DIR: directory }, stdio: ['ignore', 'pipe', 'pipe'],
})
let serverError
server.on('error', error => { serverError = error })
let logs = ''
server.stderr.on('data', chunk => { logs += chunk })
const base = `http://127.0.0.1:${port}/demo.php`
async function request(action, body = {}, expectedStatus = 200) {
  const response = await fetch(`${base}?action=${action}`, {
    method: 'POST', headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : JSON.stringify(body),
  })
  const result = await response.json()
  assert.equal(response.status, expectedStatus, JSON.stringify(result))
  return result
}
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
function upload(session, revision, capture, content = pixel, type = 'image/png') {
  const form = new FormData()
  Object.entries({ session, revision, capture }).forEach(([key, value]) => form.append(key, String(value)))
  form.append('photo', new Blob([content], { type }), 'pagina.png')
  return form
}
try {
  let ready = false
  for (let attempt = 0; attempt < 40; attempt++) {
    if (serverError) throw serverError
    try { await fetch(`${base}?action=state`); ready = true; break } catch { await delay(100) }
  }
  assert.ok(ready, `El receptor no inició: ${logs}`)
  const created = await request('create')
  const owner = { session: created.id, key: created.key }
  assert.ok(created.key)
  await request('activate', { session: created.id, expediente: { id: 'exp-1', codigo: 'DEMO-1' } }, 403)
  let state = await request('activate', { ...owner, expediente: { id: 'exp-1', codigo: 'DEMO-1' } })
  assert.equal(state.active.id, 'exp-1')
  assert.equal(state.key, undefined)
  const revision = state.revision
  state = await request('join', { session: created.id })
  assert.ok(state.lastSeen > 0)
  const capture = 'a'.repeat(32)
  await request('reserve', { session: created.id, revision, capture })
  await request('finish', owner, 409)
  await request('activate', { ...owner, expediente: { id: 'exp-2', codigo: 'DEMO-2' } }, 409)
  await request('cleanup', owner, 409)
  await request('upload', upload(created.id, revision, capture, 'not an image'), 400)
  state = await request('upload', upload(created.id, revision, capture))
  assert.equal(state.pages.length, 1)
  assert.equal(state.pending, null)
  assert.equal(state.pages[0].expedienteId, 'exp-1')
  state = await request('upload', upload(created.id, revision, capture))
  assert.equal(state.pages.length, 1, 'Reintentar no debe duplicar imágenes')
  state = await request('reserve', { session: created.id, revision, capture })
  assert.equal(state.pending, null, 'Reintentar una captura recibida no debe bloquear la sesión')
  const image = await fetch(`${base}?action=image&session=${created.id}&page=${capture}`)
  assert.equal(image.headers.get('content-type'), 'image/png')
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), pixel)
  await request('finish', owner)
  state = await request('activate', { ...owner, expediente: { id: 'exp-2', codigo: 'DEMO-2' } })
  await request('reserve', { session: created.id, revision, capture: 'b'.repeat(32) }, 409)
  await request('reserve', { session: created.id, revision: state.revision, capture: 'b'.repeat(32) })
  await request('cancel', { session: created.id, capture: 'b'.repeat(32) })
  const scan = 'c'.repeat(32)
  state = await request('scan', { session: created.id, scan, value: 'ALMACEN:EXP:exp-3' })
  assert.equal(state.scan.status, 'pending')
  await request('scan', { session: created.id, scan: 'invalid', value: 'CODE' }, 400)
  await request('reserve', { session: created.id, revision: state.revision, capture: 'd'.repeat(32) }, 409)
  await request('resolveScan', { session: created.id, scan, expediente: { id: 'exp-3', codigo: 'DEMO-3' } }, 403)
  state = await request('resolveScan', { ...owner, scan, expediente: { id: 'exp-3', codigo: 'DEMO-3' } })
  assert.equal(state.active.id, 'exp-3')
  assert.equal(state.scan.status, 'accepted')
  const scanRevision = state.revision
  state = await request('resolveScan', { ...owner, scan, expediente: { id: 'exp-3', codigo: 'DEMO-3' } })
  assert.equal(state.revision, scanRevision, 'Confirmar dos veces la lectura es idempotente')
  await request('reserve', { session: created.id, revision: scanRevision, capture: 'd'.repeat(32) })
  await request('scan', { session: created.id, scan: 'e'.repeat(32), value: 'DEMO-4' }, 409)
  await request('cancel', { session: created.id, capture: 'd'.repeat(32) })
  await request('scan', { session: created.id, scan: 'e'.repeat(32), value: 'NO-EXISTE' })
  state = await request('resolveScan', { ...owner, scan: 'e'.repeat(32), expediente: null, message: 'No encontrado' })
  assert.equal(state.scan.status, 'rejected')
  assert.equal(state.active.id, 'exp-3', 'Un código desconocido no cambia el expediente activo')
  await request('scan', { session: created.id, scan: 'f'.repeat(32), value: 'DEMO-4' })
  state = await request('activate', { ...owner, expediente: { id: 'exp-5', codigo: 'DEMO-5' } })
  assert.equal(state.scan.status, 'rejected', 'La selección manual invalida un escaneo pendiente')
  state = await request('resolveScan', { ...owner, scan: 'f'.repeat(32), expediente: { id: 'exp-4', codigo: 'DEMO-4' } })
  assert.equal(state.active.id, 'exp-5', 'Una respuesta tardía no cambia la selección manual')
  state = await request('close', owner)
  assert.equal(state.closed, true)
  await request('join', { session: created.id }, 409)
  await request('scan', { session: created.id, scan: 'a'.repeat(32), value: 'DEMO-1' }, 409)
  state = await request('remove', { ...owner, page: capture })
  assert.equal(state.pages.length, 0)
  assert.equal((await fetch(`${base}?action=image&session=${created.id}&page=${capture}`)).status, 404)
  await request('cleanup', owner)
  await request('state', { session: created.id }, 404)
  console.log('OK: vinculación, permisos, validación real de imágenes, recepción, reintento idempotente, consulta, bloqueo pendiente, cambio de expediente, cierre y limpieza sin base de datos.')
} finally {
  server.kill()
  await new Promise(resolveExit => { if (server.exitCode !== null) resolveExit(); else server.once('exit', resolveExit) })
  await rm(directory, { recursive: true, force: true })
}
