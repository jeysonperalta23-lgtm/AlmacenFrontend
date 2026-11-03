<?php
// Receptor de demostración: archivos y JSON, sin base de datos.
declare(strict_types=1);
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
$root = getenv('ALMACEN_DEMO_DIR') ?: sys_get_temp_dir() . '/almacen-digitalizacion-demo';
if (!is_dir($root) && !mkdir($root, 0700, true)) { http_response_code(500); exit; }
function fail(string $message, int $status = 400): void {
    http_response_code($status); header('Content-Type: application/json');
    echo json_encode(['error' => $message]); exit;
}
function output(array $value): void { header('Content-Type: application/json'); echo json_encode($value); exit; }
function setDocumentStatus(array &$state, string $id, string $status): void {
    $state['expedientes'][$id] = ['estado' => $status, 'id_sesion' => $state['id'], 'paginas_capturadas' => count(array_filter($state['pages'], fn($page) => $page['expedienteId'] === $id)), 'updatedAt' => microtime(true)];
}
function pausePrevious(array &$state, string $next): void {
    $previous = $state['active']['id'] ?? null;
    if ($previous && $previous !== $next) setDocumentStatus($state, $previous, 'PENDIENTE');
}
$action = $_GET['action'] ?? 'state';
$body = $_SERVER['REQUEST_METHOD'] === 'POST' ? (json_decode(file_get_contents('php://input'), true) ?: $_POST) : $_GET;
if ($action !== 'state' && $action !== 'image' && $_SERVER['REQUEST_METHOD'] !== 'POST') fail('Método no permitido.', 405);
if ($action === 'create') {
    $id = bin2hex(random_bytes(16)); $key = bin2hex(random_bytes(24));
    $state = ['id' => $id, 'key' => $key, 'closed' => false, 'active' => null, 'revision' => 0, 'pending' => null, 'lastSeen' => 0, 'pages' => []];
    if (file_put_contents("$root/$id.json", json_encode($state), LOCK_EX) === false) fail('No se pudo crear la sesión.', 500);
    output($state);
}
$id = $body['session'] ?? $_GET['session'] ?? '';
if (!is_string($id) || !preg_match('/^[a-f0-9]{32}$/D', $id)) fail('Sesión inválida.', 404);
$file = "$root/$id.json";
if (!is_file($file)) fail('La sesión ya no está disponible.', 404);
$handle = fopen($file, 'r+');
if (!$handle || !flock($handle, LOCK_EX)) fail('No se pudo acceder a la sesión.', 500);
$state = json_decode(stream_get_contents($handle), true);
if (!$state) fail('Estado de sesión inválido.', 500);
$owner = isset($body['key']) && is_string($body['key']) && hash_equals($state['key'], $body['key']);
if (in_array($action, ['activate', 'pause', 'finish', 'close', 'remove', 'cleanup', 'resolveScan'], true) && !$owner) fail('Acceso no autorizado.', 403);
if ($action === 'image') {
    $pageId = $_GET['page'] ?? '';
    foreach ($state['pages'] as $page) {
        if ($page['id'] === $pageId) {
            $image = "$root/{$page['file']}";
            if (!is_file($image)) fail('Imagen no disponible.', 404);
            header('Content-Type: ' . $page['mime']);
            header('Content-Length: ' . filesize($image));
            flock($handle, LOCK_UN); fclose($handle); readfile($image); exit;
        }
    }
    fail('Imagen no encontrada.', 404);
}
if ($state['pending'] && $state['pending']['expires'] < time()) $state['pending'] = null;
if (($state['scan']['status'] ?? '') === 'pending' && $state['scan']['created'] < time() - 60) {
    $state['scan']['status'] = 'rejected';
    $state['scan']['message'] = 'La computadora no respondió. Abre Archivo Central y vuelve a escanear.';
}
if ($state['closed'] && !in_array($action, ['state', 'cleanup', 'remove', 'cancel'], true)) fail('Sesión cerrada.', 409);
switch ($action) {
    case 'state': break;
    case 'join': $state['lastSeen'] = time(); break;
    case 'scan':
        if ($state['pending']) fail('Envía o descarta la foto pendiente antes de escanear otro expediente.', 409);
        $scanId = $body['scan'] ?? '';
        $value = $body['value'] ?? '';
        if (!is_string($scanId) || !preg_match('/^[a-f0-9]{32}$/D', $scanId) || !is_string($value) || trim($value) === '' || strlen($value) > 1024) fail('Código de etiqueta inválido.');
        if (($state['scan']['id'] ?? '') === $scanId) break;
        if (($state['scan']['status'] ?? '') === 'pending') fail('Hay una lectura esperando respuesta de la computadora.', 409);
        $state['scan'] = ['id' => $scanId, 'value' => trim($value), 'status' => 'pending', 'message' => '', 'created' => time()];
        $state['lastSeen'] = time(); break;
    case 'resolveScan':
        if (($body['scan'] ?? '') !== ($state['scan']['id'] ?? null)) fail('La lectura ya cambió.', 409);
        if (($state['scan']['status'] ?? '') !== 'pending') break;
        if ($state['pending']) fail('Hay una captura pendiente. Resuélvela antes de cambiar de expediente.', 409);
        $expediente = $body['expediente'] ?? null;
        if ($expediente === null) {
            $state['scan']['status'] = 'rejected';
            $state['scan']['message'] = is_string($body['message'] ?? null) ? substr($body['message'], 0, 250) : 'Expediente no encontrado.';
        } else {
            if (!is_array($expediente) || !is_string($expediente['id'] ?? null) || $expediente['id'] === '' || !is_string($expediente['codigo'] ?? null)) fail('Expediente inválido.');
            pausePrevious($state, $expediente['id']);
            $state['active'] = ['id' => $expediente['id'], 'codigo' => $expediente['codigo']];
            setDocumentStatus($state, $expediente['id'], 'EN_PROCESO');
            $state['revision']++;
            $state['scan']['status'] = 'accepted';
            $state['scan']['message'] = 'Expediente abierto en la computadora.';
        }
        break;
    case 'activate':
        if (($state['active']['id'] ?? null) === ($body['expediente']['id'] ?? '') && ($state['expedientes'][$state['active']['id']]['estado'] ?? '') === 'EN_PROCESO') break;
        if ($state['pending']) fail('Hay una foto pendiente en el celular. Envíala o descártala.', 409);
        if (!is_array($body['expediente'] ?? null) || empty($body['expediente']['id']) || empty($body['expediente']['codigo'])) fail('Expediente inválido.');
        if (($state['scan']['status'] ?? '') === 'pending') {
            $state['scan']['status'] = 'rejected'; $state['scan']['message'] = 'La selección cambió desde la computadora. Vuelve a escanear.';
        }
        pausePrevious($state, (string)$body['expediente']['id']);
        $state['active'] = ['id' => (string)$body['expediente']['id'], 'codigo' => (string)$body['expediente']['codigo']];
        setDocumentStatus($state, $state['active']['id'], 'EN_PROCESO');
        $state['revision']++; break;
    case 'pause':
        if (!$state['active'] || ($body['expedienteId'] ?? '') !== $state['active']['id']) fail('El expediente activo cambió. Vuelve a abrirlo.', 409);
        if ($state['pending']) fail('Envía o descarta la foto pendiente antes de pausar.', 409);
        setDocumentStatus($state, $state['active']['id'], 'PENDIENTE');
        break;
    case 'reserve':
        if (($state['expedientes'][$state['active']['id'] ?? '']['estado'] ?? '') === 'PENDIENTE') fail('Digitalización pausada. Reanuda el expediente desde la computadora.', 409);
        if (($state['scan']['status'] ?? '') === 'pending') fail('Espera a que la computadora resuelva el escaneo.', 409);
        if (!$state['active'] || (int)($body['revision'] ?? -1) !== $state['revision']) fail('El expediente cambió. Descarta la foto y confirma el nuevo expediente.', 409);
        $capture = $body['capture'] ?? '';
        if (!is_string($capture) || !preg_match('/^[a-f0-9]{32}$/D', $capture)) fail('Captura inválida.');
        foreach ($state['pages'] as $page) if ($page['id'] === $capture) break 2;
        if ($state['pending'] && $state['pending']['id'] !== $capture) fail('Hay otra captura pendiente.', 409);
        $state['pending'] = ['id' => $capture, 'expires' => time() + 900]; break;
    case 'cancel':
        if ($state['pending'] && $state['pending']['id'] === ($body['capture'] ?? '')) $state['pending'] = null;
        break;
    case 'upload':
        $capture = $body['capture'] ?? '';
        foreach ($state['pages'] as $page) if ($page['id'] === $capture) {
            if ($state['pending'] && $state['pending']['id'] === $capture) $state['pending'] = null;
            break 2;
        }
        if (!$state['active'] || (int)($body['revision'] ?? -1) !== $state['revision'] || !$state['pending'] || $state['pending']['id'] !== $capture) fail('Captura vencida o expediente cambiado. Vuelve a seleccionar la foto.', 409);
        if (($state['expedientes'][$state['active']['id']]['estado'] ?? '') === 'PENDIENTE') fail('Digitalización pausada.', 409);
        $upload = $_FILES['photo'] ?? null;
        if (!$upload || $upload['error'] !== UPLOAD_ERR_OK) fail('No se recibió la imagen. Revisa los límites de carga de PHP.');
        if ($upload['size'] > 12 * 1024 * 1024) fail('La imagen supera los 12 MB.');
        $info = @getimagesize($upload['tmp_name']);
        $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (!$info || !isset($types[$info['mime']])) fail('Usa una imagen JPEG, PNG o WebP válida.');
        $name = "$id-$capture." . $types[$info['mime']];
        if (!move_uploaded_file($upload['tmp_name'], "$root/$name")) fail('No se pudo recibir el archivo.', 500);
        $state['pages'][] = ['id' => $capture, 'expedienteId' => $state['active']['id'], 'session' => $id, 'file' => $name, 'mime' => $info['mime'], 'fecha' => gmdate('c')];
        setDocumentStatus($state, $state['active']['id'], 'EN_PROCESO');
        $state['pending'] = null; break;
    case 'finish':
    case 'close':
        if ($state['pending']) fail('Hay una captura pendiente. Envíala o descártala desde el celular.', 409);
        if (isset($body['expedienteId']) && ($state['active']['id'] ?? null) !== $body['expedienteId']) {
            if ($action === 'finish' && ($state['expedientes'][$body['expedienteId']]['estado'] ?? '') === 'FINALIZADO') break;
            fail('El expediente activo cambió. Vuelve a abrirlo.', 409);
        }
        if ($state['active']) setDocumentStatus($state, $state['active']['id'], $action === 'finish' ? 'FINALIZADO' : 'PENDIENTE');
        $state['active'] = null; $state['revision']++;
        if (($state['scan']['status'] ?? '') === 'pending') {
            $state['scan']['status'] = 'rejected'; $state['scan']['message'] = 'La computadora finalizó el expediente o cerró la sesión.';
        }
        if ($action === 'close') $state['closed'] = true;
        break;
    case 'remove':
        $removedFrom = null;
        foreach ($state['pages'] as $page) if ($page['id'] === ($body['page'] ?? '')) $removedFrom = $page['expedienteId'];
        $state['pages'] = array_values(array_filter($state['pages'], function ($page) use ($body, $root) {
            if ($page['id'] !== ($body['page'] ?? '')) return true;
            if (is_file("$root/{$page['file']}")) unlink("$root/{$page['file']}");
            return false;
        }));
        if ($removedFrom) setDocumentStatus($state, $removedFrom, $state['expedientes'][$removedFrom]['estado'] ?? 'EN_PROCESO');
        break;
    case 'cleanup':
        if ($state['pending']) fail('Resuelve la captura pendiente antes de limpiar.', 409);
        foreach ($state['pages'] as $page) if (is_file("$root/{$page['file']}")) unlink("$root/{$page['file']}");
        flock($handle, LOCK_UN); fclose($handle); unlink($file); output(['ok' => true]);
    default: fail('Acción desconocida.', 404);
}
$state['sequence'] = ($state['sequence'] ?? 0) + 1;
$encoded = json_encode($state);
rewind($handle);
if (!ftruncate($handle, 0) || fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) fail('No se pudo actualizar la sesión.', 500);
flock($handle, LOCK_UN); fclose($handle);
unset($state['key']); output($state);
