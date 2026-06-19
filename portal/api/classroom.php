<?php

declare(strict_types=1);

require __DIR__ . '/../../srv/capsuleos/portal/bootstrap.php';

use CapsuleOS\Portal\Catalog\OsRegistryReader;
use CapsuleOS\Portal\Classroom\ClassroomRepository;
use CapsuleOS\Portal\Http\ApiJson;
use CapsuleOS\Portal\Subscription\GradeResolver;
use CapsuleOS\Portal\User\RoleRepository;

header('Content-Type: application/json; charset=utf-8');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$userId = ApiJson::requireAuth();

if (!RoleRepository::hasRole($userId, 'professeur')) {
    ApiJson::error('Grade Professeur requis', 403);
}

$classroom = ClassroomRepository::findByTeacher($userId);

if ($method === 'GET') {
    $members = [];
    if ($classroom !== null) {
        foreach (ClassroomRepository::members((int) $classroom['id']) as $m) {
            if (!is_array($m)) {
                continue;
            }
            $members[] = [
                'userId' => (int) ($m['user_id'] ?? 0),
                'email' => (string) ($m['email'] ?? ''),
                'displayName' => (string) ($m['display_name'] ?? ''),
                'joinedAt' => (string) ($m['joined_at'] ?? ''),
            ];
        }
    }
    $contract = GradeResolver::gradesContract();
    ApiJson::ok([
        'classroom' => $classroom === null ? null : [
            'id' => (int) ($classroom['id'] ?? 0),
            'name' => (string) ($classroom['name'] ?? ''),
            'maxSlots' => (int) ($classroom['max_slots'] ?? 0),
            'memberCount' => ClassroomRepository::memberCount((int) $classroom['id']),
            'inviteToken' => (string) ($classroom['invite_token'] ?? ''),
            'inviteExpiresAt' => (string) ($classroom['invite_expires_at'] ?? ''),
            'allowedOs' => ClassroomRepository::decodeJsonList((string) ($classroom['allowed_os_json'] ?? '[]')),
            'allowedModules' => ClassroomRepository::decodeJsonList((string) ($classroom['allowed_modules_json'] ?? '[]')),
        ],
        'members' => $members,
        'osCatalog' => OsRegistryReader::listForPortal(),
        'limits' => [
            'maxSlots' => (int) ($contract['classMaxSlots'] ?? 32),
            'minSlots' => (int) ($contract['classMinSlots'] ?? 2),
        ],
    ]);
}

$payload = ApiJson::readJsonBody();
ApiJson::requireCsrf($payload);
$action = (string) ($payload['action'] ?? '');

$contract = GradeResolver::gradesContract();
$minSlots = (int) ($contract['classMinSlots'] ?? 2);
$maxSlots = (int) ($contract['classMaxSlots'] ?? 32);

if ($action === 'create') {
    if ($classroom !== null) {
        ApiJson::error('Une classe existe déjà pour ce compte');
    }
    $name = trim((string) ($payload['name'] ?? ''));
    $slots = (int) ($payload['maxSlots'] ?? 0);
    if ($name === '') {
        ApiJson::error('Nom de classe requis');
    }
    if ($slots < $minSlots || $slots > $maxSlots) {
        ApiJson::error('Places invalides (' . $minSlots . ' à ' . $maxSlots . ')');
    }
    $allowedOs = is_array($payload['allowedOs'] ?? null) ? $payload['allowedOs'] : [];
    $allowedModules = is_array($payload['allowedModules'] ?? null) ? $payload['allowedModules'] : [];
    $id = ClassroomRepository::create($userId, $name, $slots, $allowedOs, $allowedModules);
    $created = ClassroomRepository::findById($id);
    ApiJson::ok(['ok' => true, 'id' => $id, 'inviteToken' => (string) ($created['invite_token'] ?? '')], 201);
}

if ($action === 'update' && $classroom !== null) {
    $classroomId = (int) ($classroom['id'] ?? 0);
    $name = trim((string) ($payload['name'] ?? $classroom['name'] ?? ''));
    $slots = (int) ($payload['maxSlots'] ?? $classroom['max_slots'] ?? 0);
    if ($slots < $minSlots || $slots > $maxSlots) {
        ApiJson::error('Places invalides');
    }
    $allowedOs = is_array($payload['allowedOs'] ?? null)
        ? $payload['allowedOs']
        : ClassroomRepository::decodeJsonList((string) ($classroom['allowed_os_json'] ?? '[]'));
    $allowedModules = is_array($payload['allowedModules'] ?? null)
        ? $payload['allowedModules']
        : ClassroomRepository::decodeJsonList((string) ($classroom['allowed_modules_json'] ?? '[]'));
    ClassroomRepository::update($classroomId, $userId, $name, $slots, $allowedOs, $allowedModules);
    ApiJson::ok(['ok' => true]);
}

if ($action === 'regenerate_invite' && $classroom !== null) {
    $token = ClassroomRepository::regenerateInvite((int) $classroom['id'], $userId);
    if ($token === null) {
        ApiJson::error('Impossible de régénérer le lien');
    }
    ApiJson::ok(['ok' => true, 'inviteToken' => $token]);
}

if ($action === 'remove_member' && $classroom !== null) {
    $memberId = (int) ($payload['userId'] ?? 0);
    if ($memberId <= 0) {
        ApiJson::error('userId requis');
    }
    ClassroomRepository::removeMember((int) $classroom['id'], $memberId, $userId);
    ApiJson::ok(['ok' => true]);
}

if ($action === 'delete' && $classroom !== null) {
    ClassroomRepository::delete((int) $classroom['id'], $userId);
    ApiJson::ok(['ok' => true]);
}

ApiJson::error('Action inconnue', 400);
