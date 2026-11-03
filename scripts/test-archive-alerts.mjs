import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/archiveAlerts.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } })
const { selectPending, missingFields, noticeState, digitalStatus } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const base = { id: 'a', codigo: 'ABC', estante: '1', modulo: 'Contabilidad', nivel: '1', tipo: 'Actas', anio: '2026', tomo: '', obs: '' }
const records = [base, { ...base, id: 'b', codigo: ' abc ', modulo: 'Retirado' }, { ...base, id: 'c', codigo: '', nivel: '  ', estante: '9' }]
const structure = { '1': ['Contabilidad'] }
const counts = { a: 2 }
const ids = (filter, data = records, photos = counts) => selectPending(data, structure, photos, filter).map(a => a.id)
assert.deepEqual(ids('imagenes'), ['b', 'c'])
assert.deepEqual(ids('imagenes', records, { a: 2, b: 1, c: 1 }), [])
assert.deepEqual(ids('datos'), ['c'])
assert.deepEqual(missingFields(base), [], 'Tomo y observaciones son opcionales')
assert.deepEqual(ids('ubicacion'), ['b', 'c'])
assert.deepEqual(ids('duplicados'), ['a', 'b'])
assert.deepEqual(ids('duplicados', [base, { ...base, id: 'b', codigo: 'DEF' }]), [])
assert.deepEqual(ids('estante:1'), ['a', 'b'])
assert.deepEqual(ids('datos', []), [])
const notice = { inicio: '2026-09-10', fin: '2026-09-15', archivado: false }
assert.equal(noticeState(notice, '2026-09-09'), 'Programados')
assert.equal(noticeState(notice, '2026-09-10'), 'Vigentes')
assert.equal(noticeState(notice, '2026-09-15'), 'Vigentes', 'El último día es inclusivo')
assert.equal(noticeState(notice, '2026-09-16'), 'Historial')
assert.equal(noticeState({ ...notice, archivado: true }, '2026-09-10'), 'Historial')
const operations = { notices: [], capacities: {}, statuses: { a: 'Completado' } }
assert.equal(digitalStatus('a', counts, operations), 'Completado')
assert.equal(digitalStatus('a', {}, operations), 'Pendiente', 'Sin páginas nunca está completado')
assert.equal(digitalStatus('b', { b: 1 }, operations), 'En proceso', 'Las imágenes no completan automáticamente el expediente')
console.log('OK: alertas, resolución de pendientes, duplicados, vigencia inclusiva y estados digitales.')
